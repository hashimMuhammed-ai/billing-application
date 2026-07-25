import { InvoiceNumberingService } from './invoice-numbering.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('InvoiceNumberingService', () => {
  let service: InvoiceNumberingService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      company: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new InvoiceNumberingService(mockPrismaService as PrismaService);
  });

  describe('getCurrentFY', () => {
    it('should return 2026-27 for July 2026', () => {
      const date = new Date(2026, 6, 23); // July 23, 2026
      expect(service.getCurrentFY(date)).toBe('2026-27');
    });

    it('should return 2026-27 for March 31, 2027', () => {
      const date = new Date(2027, 2, 31); // March 31, 2027
      expect(service.getCurrentFY(date)).toBe('2026-27');
    });

    it('should return 2027-28 for April 1, 2027', () => {
      const date = new Date(2027, 3, 1); // April 1, 2027
      expect(service.getCurrentFY(date)).toBe('2027-28');
    });

    it('should return 2025-26 for January 15, 2026', () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      expect(service.getCurrentFY(date)).toBe('2025-26');
    });
  });

  describe('generateNextInvoiceNo', () => {
    it('should increment sequence when in the same FY', async () => {
      const testDate = new Date(2026, 6, 23); // 2026-27
      mockPrismaService.company.findFirst.mockResolvedValue({
        id: 1,
        lastInvoiceSeq: 0,
        currentFY: '2026-27',
      });

      const result = await service.generateNextInvoiceNo(undefined, 'AMT', testDate);

      expect(result.invoiceNo).toBe('AMT/2026-27/001');
      expect(result.seq).toBe(1);
      expect(result.fy).toBe('2026-27');
      expect(mockPrismaService.company.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          lastInvoiceSeq: 1,
          currentFY: '2026-27',
        },
      });
    });

    it('should reset sequence to 1 on FY rollover', async () => {
      const testDate = new Date(2027, 3, 1); // 2027-28
      mockPrismaService.company.findFirst.mockResolvedValue({
        id: 1,
        lastInvoiceSeq: 42,
        currentFY: '2026-27',
      });

      const result = await service.generateNextInvoiceNo(undefined, 'AMT', testDate);

      expect(result.invoiceNo).toBe('AMT/2027-28/001');
      expect(result.seq).toBe(1);
      expect(result.fy).toBe('2027-28');
      expect(mockPrismaService.company.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          lastInvoiceSeq: 1,
          currentFY: '2027-28',
        },
      });
    });
  });
});
