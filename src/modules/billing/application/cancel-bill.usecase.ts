import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BillRepository } from '../infrastructure/bill.repository';
import { Bill } from '@prisma/client';

@Injectable()
export class CancelBillUseCase {
  constructor(private readonly billRepository: BillRepository) {}

  async execute(invoiceNo: string): Promise<Bill> {
    const trimmedInvoiceNo = invoiceNo ? invoiceNo.trim() : '';

    if (!trimmedInvoiceNo) {
      throw new BadRequestException('Invoice number is required.');
    }

    const bill = await this.billRepository.findByInvoiceNo(trimmedInvoiceNo);

    if (!bill) {
      throw new NotFoundException(`Bill with invoice number "${trimmedInvoiceNo}" not found.`);
    }

    if (bill.status === 'CANCELLED') {
      throw new BadRequestException(`Bill "${trimmedInvoiceNo}" is already cancelled.`);
    }

    return this.billRepository.update(bill.id, {
      status: 'CANCELLED',
    });
  }
}
