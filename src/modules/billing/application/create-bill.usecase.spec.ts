import { CreateBillUseCase } from './create-bill.usecase';
import { FindCustomerUseCase } from '../../customer/application/find-customer.usecase';
import { CompanyService } from '../../company/company.service';
import { GstCalculatorService } from '../services/gst-calculator.service';
import { InvoiceNumberingService } from '../services/invoice-numbering.service';
import { BillRepository } from '../infrastructure/bill.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { ParsedBillDto } from '../domain/bill.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('CreateBillUseCase', () => {
  let useCase: CreateBillUseCase;
  let mockPrismaService: any;
  let mockFindCustomerUseCase: any;
  let mockCompanyService: any;
  let gstCalculatorService: GstCalculatorService;
  let mockInvoiceNumberingService: any;
  let mockBillRepository: any;

  const mockCustomer = {
    id: 10,
    name: 'Moreland',
    address: 'Muvattupuzha',
    gstin: '32ACCFM3093K1Z7',
    state: 'Kerala',
    phone: '9847000000',
    createdAt: new Date(),
  };

  const mockCompany = {
    id: 1,
    name: 'A M TRADING',
    gstRate: new Prisma.Decimal(18),
    currentFY: '2026-27',
    lastInvoiceSeq: 0,
  };

  const validParsedDto: ParsedBillDto = {
    vehicleNo: 'KL01BJ3019',
    eWayBillNo: '34AB1234C5678D1E2',
    customerName: 'Moreland',
    dimension: '8*4',
    rate: 14.50,
    quantity: 11609.52,
  };

  beforeEach(() => {
    mockPrismaService = {
      $transaction: jest.fn((cb) => cb(mockPrismaService)),
    };

    mockFindCustomerUseCase = {
      execute: jest.fn(),
    };

    mockCompanyService = {
      getCompany: jest.fn().mockResolvedValue(mockCompany),
    };

    gstCalculatorService = new GstCalculatorService();

    mockInvoiceNumberingService = {
      generateNextInvoiceNo: jest.fn().mockResolvedValue({
        invoiceNo: 'AMT/2026-27/001',
        seq: 1,
        fy: '2026-27',
      }),
    };

    mockBillRepository = {
      create: jest.fn(),
      update: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
    };

    const mockPdfGeneratorService = {
      generatePdf: jest.fn().mockResolvedValue(Buffer.from('pdf data')),
    };

    const mockR2StorageService = {
      uploadBillPdf: jest.fn().mockResolvedValue('https://r2.dev/bills/test.pdf'),
    };

    useCase = new CreateBillUseCase(
      mockPrismaService as PrismaService,
      mockFindCustomerUseCase as FindCustomerUseCase,
      mockCompanyService as CompanyService,
      gstCalculatorService,
      mockInvoiceNumberingService as InvoiceNumberingService,
      mockBillRepository as BillRepository,
      mockPdfGeneratorService as any,
      mockR2StorageService as any,
    );
  });

  it('should create bill successfully when single customer is found', async () => {
    mockFindCustomerUseCase.execute.mockResolvedValue({
      status: 'EXACT_ONE',
      customers: [mockCustomer],
      matchCount: 1,
    });

    const expectedCreatedBill = {
      id: 1,
      invoiceNo: 'AMT/2026-27/001',
      customerId: 10,
      vehicleNo: 'KL01BJ3019',
      eWayBillNo: '34AB1234C5678D1E2',
      dimension: '8*4',
      rate: 14.50,
      quantity: 11609.52,
      amount: new Prisma.Decimal(168338.04),
      cgst: new Prisma.Decimal(15150.42),
      sgst: new Prisma.Decimal(15150.42),
      roundOff: new Prisma.Decimal(0.12),
      grandTotal: new Prisma.Decimal(198639),
      status: 'ACTIVE',
      pdfUrl: 'https://r2.dev/bills/test.pdf',
    };

    mockBillRepository.create.mockResolvedValue(expectedCreatedBill);
    mockBillRepository.update.mockImplementation((id, data) => Promise.resolve({ ...expectedCreatedBill, ...data }));

    const result = await useCase.execute(validParsedDto);

    expect(mockFindCustomerUseCase.execute).toHaveBeenCalledWith('Moreland');
    expect(mockInvoiceNumberingService.generateNextInvoiceNo).toHaveBeenCalled();
    expect(mockBillRepository.create).toHaveBeenCalled();
    expect(result).toEqual(expectedCreatedBill);
  });

  it('should throw NotFoundException when customer is not found', async () => {
    mockFindCustomerUseCase.execute.mockResolvedValue({
      status: 'NO_MATCH',
      customers: [],
      matchCount: 0,
    });

    await expect(useCase.execute(validParsedDto)).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when multiple customers match', async () => {
    mockFindCustomerUseCase.execute.mockResolvedValue({
      status: 'MULTIPLE_MATCHES',
      customers: [mockCustomer, { ...mockCustomer, id: 11, name: 'Moreland Boards' }],
      matchCount: 2,
    });

    await expect(useCase.execute(validParsedDto)).rejects.toThrow(BadRequestException);
  });
});
