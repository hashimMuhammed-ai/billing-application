import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FindCustomerUseCase } from '../../customer/application/find-customer.usecase';
import { CompanyService } from '../../company/company.service';
import { GstCalculatorService } from '../services/gst-calculator.service';
import { InvoiceNumberingService } from '../services/invoice-numbering.service';
import { BillRepository } from '../infrastructure/bill.repository';
import { ParsedBillDto } from '../domain/bill.entity';
import { Bill } from '@prisma/client';
import { PdfGeneratorService } from '../../pdf/pdf-generator.service';
import { R2StorageService } from '../../storage/r2-storage.service';

@Injectable()
export class CreateBillUseCase {
  private readonly logger = new Logger(CreateBillUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly findCustomerUseCase: FindCustomerUseCase,
    private readonly companyService: CompanyService,
    private readonly gstCalculatorService: GstCalculatorService,
    private readonly invoiceNumberingService: InvoiceNumberingService,
    private readonly billRepository: BillRepository,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  async execute(dto: ParsedBillDto): Promise<Bill> {
    const findResult = await this.findCustomerUseCase.execute(dto.customerName);

    if (findResult.status === 'NO_MATCH') {
      throw new NotFoundException(
        `Customer "${dto.customerName}" not found. Please register customer using /addcustomer first.`,
      );
    }

    if (findResult.status === 'MULTIPLE_MATCHES') {
      const customerList = findResult.customers
        .map((c) => `- ${c.name} (${c.address})`)
        .join('\n');
      throw new BadRequestException(
        `Multiple customers match "${dto.customerName}". Please specify:\n${customerList}`,
      );
    }

    const customer = findResult.customers[0];
    const company = await this.companyService.getCompany();
    const gstResult = this.gstCalculatorService.calculate(dto.rate, dto.quantity, company.gstRate);

    let createdBill = await this.prisma.$transaction(async (tx) => {
      const { invoiceNo } = await this.invoiceNumberingService.generateNextInvoiceNo(tx, 'AMT');

      return this.billRepository.create(tx, {
        invoiceNo,
        customerId: customer.id,
        vehicleNo: dto.vehicleNo,
        eWayBillNo: dto.eWayBillNo,
        dimension: dto.dimension,
        rate: dto.rate,
        quantity: dto.quantity,
        amount: gstResult.amount,
        cgst: gstResult.cgst,
        sgst: gstResult.sgst,
        roundOff: gstResult.roundOff,
        grandTotal: gstResult.grandTotal,
        status: 'ACTIVE',
      });
    });

    try {
      const pdfBuffer = await this.pdfGeneratorService.generatePdf({
        company,
        customer,
        bill: createdBill,
      });

      const pdfUrl = await this.r2StorageService.uploadBillPdf(createdBill.invoiceNo, pdfBuffer);
      if (pdfUrl) {
        createdBill = await this.billRepository.update(createdBill.id, { pdfUrl });
      }
    } catch (err) {
      this.logger.error(
        `PDF generation or R2 upload failed for invoice ${createdBill.invoiceNo}: ${(err as Error).message}`,
      );
    }

    return createdBill;
  }
}
