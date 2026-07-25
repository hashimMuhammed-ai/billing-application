import { MonthlySummaryUseCase } from './monthly-summary.usecase';
import { BillRepository } from '../infrastructure/bill.repository';
import { Prisma } from '@prisma/client';

describe('MonthlySummaryUseCase', () => {
  let useCase: MonthlySummaryUseCase;
  let mockBillRepository: any;

  const mockBills = [
    {
      id: 1,
      invoiceNo: 'AMT/2026-27/001',
      grandTotal: new Prisma.Decimal(198639),
      cgst: new Prisma.Decimal(15150.42),
      sgst: new Prisma.Decimal(15150.42),
      status: 'ACTIVE',
      createdAt: new Date(2026, 6, 15),
    },
    {
      id: 2,
      invoiceNo: 'AMT/2026-27/002',
      grandTotal: new Prisma.Decimal(100000),
      cgst: new Prisma.Decimal(7627.12),
      sgst: new Prisma.Decimal(7627.12),
      status: 'REVISED',
      createdAt: new Date(2026, 6, 20),
    },
    {
      id: 3,
      invoiceNo: 'AMT/2026-27/003',
      grandTotal: new Prisma.Decimal(50000),
      cgst: new Prisma.Decimal(3813.56),
      sgst: new Prisma.Decimal(3813.56),
      status: 'CANCELLED',
      createdAt: new Date(2026, 6, 22),
    },
  ];

  beforeEach(() => {
    mockBillRepository = {
      findBillsByDateRange: jest.fn().mockResolvedValue(mockBills),
    };
    useCase = new MonthlySummaryUseCase(mockBillRepository as BillRepository);
  });

  it('should calculate monthly totals excluding cancelled bills', async () => {
    const targetDate = new Date(2026, 6, 23); // July 2026
    const summary = await useCase.execute(targetDate);

    expect(summary.month).toContain('July 2026');
    expect(summary.billCount).toBe(2);
    expect(summary.cancelledCount).toBe(1);
    expect(summary.totalSales).toBe(298639);
    expect(summary.totalCgst).toBe(22777.54);
    expect(summary.totalSgst).toBe(22777.54);
    expect(summary.totalGst).toBe(45555.08);
  });
});
