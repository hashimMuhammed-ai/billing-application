import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface NextInvoiceNumberResult {
  invoiceNo: string;
  seq: number;
  fy: string;
}

@Injectable()
export class InvoiceNumberingService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Returns the Indian Financial Year string (e.g. "2026-27") for a given date.
   * FY runs April 1st to March 31st.
   */
  getCurrentFY(date: Date = new Date()): string {
    const month = date.getMonth(); // 0 = Jan, 3 = Apr, 11 = Dec
    const fullYear = date.getFullYear();

    const startYear = month >= 3 ? fullYear : fullYear - 1;
    const endYear = startYear + 1;
    const endYearStr = endYear.toString().slice(-2);

    return `${startYear}-${endYearStr}`;
  }

  /**
   * Generates the next sequential invoice number within a database transaction.
   * Format: AMT/2026-27/001
   */
  async generateNextInvoiceNo(
    tx?: Prisma.TransactionClient,
    companyCode: string = 'AMT',
    date: Date = new Date(),
  ): Promise<NextInvoiceNumberResult> {
    const client = tx || this.prisma;
    const detectedFY = this.getCurrentFY(date);

    const company = await client.company.findFirst();
    if (!company) {
      throw new Error('Company configuration row not found. Please seed Company table.');
    }

    let newSeq: number;
    if (company.currentFY !== detectedFY) {
      // FY Rollover: Reset sequence to 1
      newSeq = 1;
    } else {
      newSeq = company.lastInvoiceSeq + 1;
    }

    await client.company.update({
      where: { id: company.id },
      data: {
        lastInvoiceSeq: newSeq,
        currentFY: detectedFY,
      },
    });

    const seqPadded = newSeq.toString().padStart(3, '0');
    const invoiceNo = `${companyCode}/${detectedFY}/${seqPadded}`;

    return {
      invoiceNo,
      seq: newSeq,
      fy: detectedFY,
    };
  }
}
