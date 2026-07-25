import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { BillRepository } from '../infrastructure/bill.repository';
import { CompanyService } from '../../company/company.service';
import { GstCalculatorService } from '../services/gst-calculator.service';
import { Bill } from '@prisma/client';
import { PdfGeneratorService } from '../../pdf/pdf-generator.service';
import { R2StorageService } from '../../storage/r2-storage.service';

export interface EditLastBillDto {
  rate?: number;
  quantity?: number;
}

@Injectable()
export class EditLastBillUseCase {
  private readonly logger = new Logger(EditLastBillUseCase.name);

  constructor(
    private readonly billRepository: BillRepository,
    private readonly companyService: CompanyService,
    private readonly gstCalculatorService: GstCalculatorService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  async execute(dto: EditLastBillDto): Promise<Bill> {
    if (dto.rate === undefined && dto.quantity === undefined) {
      throw new BadRequestException('Provide at least one field to update.');
    }

    const lastBill = await this.billRepository.findMostRecent();

    if (!lastBill) {
      throw new NotFoundException('No recent bill found to edit.');
    }

    if (lastBill.status === 'CANCELLED') {
      throw new BadRequestException('The most recent bill is cancelled and cannot be edited.');
    }

    const currentRate = typeof lastBill.rate === 'number' ? lastBill.rate : Number(lastBill.rate);
    const currentQuantity = typeof lastBill.quantity === 'number' ? lastBill.quantity : Number(lastBill.quantity);

    const newRate = dto.rate !== undefined ? dto.rate : currentRate;
    const newQuantity = dto.quantity !== undefined ? dto.quantity : currentQuantity;

    if (newRate <= 0) {
      throw new BadRequestException('Rate must be a positive number.');
    }
    if (newQuantity <= 0) {
      throw new BadRequestException('Quantity must be a positive number.');
    }

    const company = await this.companyService.getCompany();
    const gstResult = this.gstCalculatorService.calculate(newRate, newQuantity, company.gstRate);

    let updatedBill = await this.billRepository.update(lastBill.id, {
      rate: newRate,
      quantity: newQuantity,
      amount: gstResult.amount,
      cgst: gstResult.cgst,
      sgst: gstResult.sgst,
      roundOff: gstResult.roundOff,
      grandTotal: gstResult.grandTotal,
      status: 'REVISED',
    });

    if (lastBill.customer) {
      try {
        const pdfBuffer = await this.pdfGeneratorService.generatePdf({
          company,
          customer: lastBill.customer,
          bill: updatedBill,
        });

        const pdfUrl = await this.r2StorageService.uploadBillPdf(updatedBill.invoiceNo, pdfBuffer);
        if (pdfUrl) {
          updatedBill = await this.billRepository.update(updatedBill.id, { pdfUrl });
        }
      } catch (err) {
        this.logger.error(
          `PDF regeneration or R2 re-upload failed for edited bill ${updatedBill.invoiceNo}: ${(err as Error).message}`,
        );
      }
    }

    return updatedBill;
  }
}
