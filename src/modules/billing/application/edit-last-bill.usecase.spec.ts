import { EditLastBillUseCase } from './edit-last-bill.usecase';
import { BillRepository } from '../infrastructure/bill.repository';
import { CompanyService } from '../../company/company.service';
import { GstCalculatorService } from '../services/gst-calculator.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('EditLastBillUseCase', () => {
  let useCase: EditLastBillUseCase;
  let mockBillRepository: any;
  let mockCompanyService: any;
  let gstCalculatorService: GstCalculatorService;

  const mockExistingBill = {
    id: 1,
    invoiceNo: 'AMT/2026-27/001',
    customerId: 10,
    vehicleNo: 'KL01BJ3019',
    eWayBillNo: '34AB1234C5678D1E2',
    dimension: '8*4',
    rate: new Prisma.Decimal(10),
    quantity: new Prisma.Decimal(100),
    amount: new Prisma.Decimal(1000),
    cgst: new Prisma.Decimal(90),
    sgst: new Prisma.Decimal(90),
    roundOff: new Prisma.Decimal(0),
    grandTotal: new Prisma.Decimal(1180),
    status: 'ACTIVE',
    createdAt: new Date(),
  };

  const mockCompany = {
    id: 1,
    gstRate: new Prisma.Decimal(18),
  };

  beforeEach(() => {
    mockBillRepository = {
      findMostRecent: jest.fn(),
      update: jest.fn(),
    };

    mockCompanyService = {
      getCompany: jest.fn().mockResolvedValue(mockCompany),
    };

    gstCalculatorService = new GstCalculatorService();

    const mockPdfGeneratorService = {
      generatePdf: jest.fn().mockResolvedValue(Buffer.from('pdf data')),
    };

    const mockR2StorageService = {
      uploadBillPdf: jest.fn().mockResolvedValue('https://r2.dev/bills/test.pdf'),
    };

    useCase = new EditLastBillUseCase(
      mockBillRepository as BillRepository,
      mockCompanyService as CompanyService,
      gstCalculatorService,
      mockPdfGeneratorService as any,
      mockR2StorageService as any,
    );
  });

  it('should update rate and quantity, recalculate GST, and mark status REVISED', async () => {
    mockBillRepository.findMostRecent.mockResolvedValue(mockExistingBill);
    mockBillRepository.update.mockImplementation((id, data) => Promise.resolve({ ...mockExistingBill, ...data }));

    const result = await useCase.execute({ rate: 14.50, quantity: 11609.52 });

    expect(mockBillRepository.findMostRecent).toHaveBeenCalled();
    expect(mockBillRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
      rate: 14.50,
      quantity: 11609.52,
      status: 'REVISED',
    }));
    expect(result.status).toBe('REVISED');
  });

  it('should throw NotFoundException when no recent bill exists', async () => {
    mockBillRepository.findMostRecent.mockResolvedValue(null);

    await expect(useCase.execute({ rate: 15 })).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if most recent bill is CANCELLED', async () => {
    mockBillRepository.findMostRecent.mockResolvedValue({
      ...mockExistingBill,
      status: 'CANCELLED',
    });

    await expect(useCase.execute({ rate: 15 })).rejects.toThrow(BadRequestException);
  });
});
