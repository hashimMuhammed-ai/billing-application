import { CancelBillUseCase } from './cancel-bill.usecase';
import { BillRepository } from '../infrastructure/bill.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CancelBillUseCase', () => {
  let useCase: CancelBillUseCase;
  let mockBillRepository: any;

  const mockActiveBill = {
    id: 1,
    invoiceNo: 'AMT/2026-27/001',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    mockBillRepository = {
      findByInvoiceNo: jest.fn(),
      update: jest.fn(),
    };
    useCase = new CancelBillUseCase(mockBillRepository as BillRepository);
  });

  it('should mark bill status as CANCELLED', async () => {
    mockBillRepository.findByInvoiceNo.mockResolvedValue(mockActiveBill);
    mockBillRepository.update.mockResolvedValue({ ...mockActiveBill, status: 'CANCELLED' });

    const result = await useCase.execute('AMT/2026-27/001');

    expect(mockBillRepository.findByInvoiceNo).toHaveBeenCalledWith('AMT/2026-27/001');
    expect(mockBillRepository.update).toHaveBeenCalledWith(1, { status: 'CANCELLED' });
    expect(result.status).toBe('CANCELLED');
  });

  it('should throw NotFoundException if bill is not found', async () => {
    mockBillRepository.findByInvoiceNo.mockResolvedValue(null);

    await expect(useCase.execute('AMT/2026-27/999')).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if bill is already CANCELLED', async () => {
    mockBillRepository.findByInvoiceNo.mockResolvedValue({
      ...mockActiveBill,
      status: 'CANCELLED',
    });

    await expect(useCase.execute('AMT/2026-27/001')).rejects.toThrow(BadRequestException);
  });
});
