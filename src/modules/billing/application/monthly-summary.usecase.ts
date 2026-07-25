import { Injectable } from '@nestjs/common';
import { BillRepository } from '../infrastructure/bill.repository';
import { Prisma } from '@prisma/client';

export interface MonthlySummaryResult {
  month: string;
  year: number;
  startDate: Date;
  endDate: Date;
  totalSales: number;
  totalCgst: number;
  totalSgst: number;
  totalGst: number;
  billCount: number;
  cancelledCount: number;
}

@Injectable()
export class MonthlySummaryUseCase {
  constructor(private readonly billRepository: BillRepository) {}

  async execute(targetDate: Date = new Date()): Promise<MonthlySummaryResult> {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const bills = await this.billRepository.findBillsByDateRange(startDate, endDate);

    const activeBills = bills.filter((b) => b.status !== 'CANCELLED');
    const cancelledBills = bills.filter((b) => b.status === 'CANCELLED');

    const totalSales = activeBills.reduce((sum, b) => {
      const val = typeof b.grandTotal === 'number' ? b.grandTotal : new Prisma.Decimal(b.grandTotal).toNumber();
      return sum + val;
    }, 0);

    const totalCgst = activeBills.reduce((sum, b) => {
      const val = typeof b.cgst === 'number' ? b.cgst : new Prisma.Decimal(b.cgst).toNumber();
      return sum + val;
    }, 0);

    const totalSgst = activeBills.reduce((sum, b) => {
      const val = typeof b.sgst === 'number' ? b.sgst : new Prisma.Decimal(b.sgst).toNumber();
      return sum + val;
    }, 0);

    const monthName = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return {
      month: monthName,
      year,
      startDate,
      endDate,
      totalSales: Number(totalSales.toFixed(2)),
      totalCgst: Number(totalCgst.toFixed(2)),
      totalSgst: Number(totalSgst.toFixed(2)),
      totalGst: Number((totalCgst + totalSgst).toFixed(2)),
      billCount: activeBills.length,
      cancelledCount: cancelledBills.length,
    };
  }
}
