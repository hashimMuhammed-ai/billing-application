import { Test, TestingModule } from '@nestjs/testing';
import { TelegramHandlerService } from './telegram-handler.service';
import { MessageRouterService } from './message-router.service';
import { TelegramService } from './telegram.service';
import { BillParser } from '../billing/parsers/bill.parser';
import { AddCustomerParser } from '../customer/parsers/addcustomer.parser';
import { FindCustomerUseCase } from '../customer/application/find-customer.usecase';
import { CreateCustomerUseCase } from '../customer/application/create-customer.usecase';
import { CustomerRepository } from '../customer/infrastructure/customer.repository';
import { CompanyService } from '../company/company.service';
import { GstCalculatorService } from '../billing/services/gst-calculator.service';
import { CreateBillUseCase } from '../billing/application/create-bill.usecase';
import { EditLastBillUseCase } from '../billing/application/edit-last-bill.usecase';
import { CancelBillUseCase } from '../billing/application/cancel-bill.usecase';
import { MonthlySummaryUseCase } from '../billing/application/monthly-summary.usecase';
import { PdfGeneratorService } from '../pdf/pdf-generator.service';
import { TelegramUpdate } from './telegram.dto';

describe('TelegramHandlerService Integration Tests', () => {
  let handlerService: TelegramHandlerService;
  let mockTelegramService: { sendMessage: jest.Mock; sendDocument: jest.Mock };
  let mockFindCustomerUseCase: { execute: jest.Mock };
  let mockCreateCustomerUseCase: { execute: jest.Mock };
  let mockCustomerRepository: { findAll: jest.Mock; findById: jest.Mock };
  let mockCompanyService: { getCompany: jest.Mock };
  let mockCreateBillUseCase: { execute: jest.Mock };
  let mockEditLastBillUseCase: { execute: jest.Mock };
  let mockCancelBillUseCase: { execute: jest.Mock };
  let mockMonthlySummaryUseCase: { execute: jest.Mock };
  let mockPdfGeneratorService: { generatePdf: jest.Mock };

  beforeEach(async () => {
    mockTelegramService = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      sendDocument: jest.fn().mockResolvedValue(undefined),
    };

    mockFindCustomerUseCase = {
      execute: jest.fn(),
    };

    mockCreateCustomerUseCase = {
      execute: jest.fn(),
    };

    mockCustomerRepository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
    };

    mockCompanyService = {
      getCompany: jest.fn().mockResolvedValue({
        id: 1,
        name: 'A M Trading',
        address: 'Main Road',
        gstin: '32ABCDE1234F1Z5',
        gstRate: 18,
      }),
    };

    mockCreateBillUseCase = {
      execute: jest.fn().mockResolvedValue({
        id: 10,
        invoiceNo: 'AMT/2026-27/001',
        grandTotal: 17110,
      }),
    };

    mockEditLastBillUseCase = {
      execute: jest.fn(),
    };

    mockCancelBillUseCase = {
      execute: jest.fn(),
    };

    mockMonthlySummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        month: 'July 2026',
        billCount: 5,
        cancelledCount: 1,
        totalSales: 150000,
        totalCgst: 13500,
        totalSgst: 13500,
        totalGst: 27000,
      }),
    };

    mockPdfGeneratorService = {
      generatePdf: jest.fn().mockResolvedValue(Buffer.from('PDF_DUMMY_BUFFER')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramHandlerService,
        MessageRouterService,
        BillParser,
        AddCustomerParser,
        GstCalculatorService,
        { provide: TelegramService, useValue: mockTelegramService },
        { provide: FindCustomerUseCase, useValue: mockFindCustomerUseCase },
        { provide: CreateCustomerUseCase, useValue: mockCreateCustomerUseCase },
        { provide: CustomerRepository, useValue: mockCustomerRepository },
        { provide: CompanyService, useValue: mockCompanyService },
        { provide: CreateBillUseCase, useValue: mockCreateBillUseCase },
        { provide: EditLastBillUseCase, useValue: mockEditLastBillUseCase },
        { provide: CancelBillUseCase, useValue: mockCancelBillUseCase },
        { provide: MonthlySummaryUseCase, useValue: mockMonthlySummaryUseCase },
        { provide: PdfGeneratorService, useValue: mockPdfGeneratorService },
      ],
    }).compile();

    handlerService = module.get<TelegramHandlerService>(TelegramHandlerService);
  });

  const makeUpdate = (text: string, chatId = 1001): TelegramUpdate => ({
    update_id: 1,
    message: {
      message_id: 1,
      chat: { id: chatId, type: 'private' },
      date: Date.now(),
      text,
    },
  });

  describe('Pre-send Confirmation & Bill Creation Flow', () => {
    it('should show pending summary on valid 6-line bill message when customer matches', async () => {
      mockFindCustomerUseCase.execute.mockResolvedValue({
        status: 'EXACT_ONE',
        matchCount: 1,
        customers: [{ id: 5, name: 'Moreland', address: 'Muvattupuzha' }],
      });

      const billText = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
14.50
1000`;

      await handlerService.handleUpdate(makeUpdate(billText));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(1);
      const sentText = mockTelegramService.sendMessage.mock.calls[0][1];
      expect(sentText).toContain('Bill Summary (Pending Confirmation)');
      expect(sentText).toContain('Moreland');
      expect(sentText).toContain('Grand Total');

      const pending = handlerService.getPendingBill(1001);
      expect(pending).toBeDefined();
      expect(pending?.customer.id).toBe(5);
    });

    it('should create bill, generate PDF, upload to R2, and send PDF when staff replies "yes"', async () => {
      mockFindCustomerUseCase.execute.mockResolvedValue({
        status: 'EXACT_ONE',
        matchCount: 1,
        customers: [{ id: 5, name: 'Moreland', address: 'Muvattupuzha' }],
      });

      const billText = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
14.50
1000`;

      await handlerService.handleUpdate(makeUpdate(billText, 1002));
      expect(handlerService.getPendingBill(1002)).toBeDefined();

      // Reply YES
      await handlerService.handleUpdate(makeUpdate('yes', 1002));

      expect(mockCreateBillUseCase.execute).toHaveBeenCalled();
      expect(mockPdfGeneratorService.generatePdf).toHaveBeenCalled();
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(1002, expect.stringContaining('created successfully'));
      expect(mockTelegramService.sendDocument).toHaveBeenCalledWith(1002, expect.any(Buffer), 'AMT_2026-27_001.pdf', 'Invoice AMT/2026-27/001');

      // Pending bill cleared
      expect(handlerService.getPendingBill(1002)).toBeUndefined();
    });

    it('should discard pending bill when staff replies "no"', async () => {
      mockFindCustomerUseCase.execute.mockResolvedValue({
        status: 'EXACT_ONE',
        matchCount: 1,
        customers: [{ id: 5, name: 'Moreland', address: 'Muvattupuzha' }],
      });

      const billText = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
14.50
1000`;

      await handlerService.handleUpdate(makeUpdate(billText, 1003));
      expect(handlerService.getPendingBill(1003)).toBeDefined();

      // Reply NO
      await handlerService.handleUpdate(makeUpdate('no', 1003));

      expect(mockTelegramService.sendMessage).toHaveBeenLastCalledWith(1003, expect.stringContaining('discarded'));
      expect(handlerService.getPendingBill(1003)).toBeUndefined();
    });

    it('should notify customer not found when no match is returned', async () => {
      mockFindCustomerUseCase.execute.mockResolvedValue({
        status: 'NO_MATCH',
        matchCount: 0,
        customers: [],
      });

      const billText = `KL01BJ3019
34AB1234C5678D1E2
UnknownCorp
8*4
14.50
1000`;

      await handlerService.handleUpdate(makeUpdate(billText));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(1001, expect.stringContaining('UnknownCorp'));
      expect(handlerService.getPendingBill(1001)).toBeUndefined();
    });

    it('should notify friendly error on wrong line count (e.g. 5 lines)', async () => {
      const wrongLineText = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
14.50`;

      await handlerService.handleUpdate(makeUpdate(wrongLineText));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('Expected 6 lines for bill creation, got 5'),
      );
      expect(handlerService.getPendingBill(1001)).toBeUndefined();
    });

    it('should notify friendly error on bad numbers (e.g. invalid rate)', async () => {
      const badNumberText = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
invalid_rate
1000`;

      await handlerService.handleUpdate(makeUpdate(badNumberText));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('Bill Format Error'),
      );
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('Rate must be a positive number'),
      );
      expect(handlerService.getPendingBill(1001)).toBeUndefined();
    });

    it('should notify friendly error on ambiguous (multiple) customer matches', async () => {
      mockFindCustomerUseCase.execute.mockResolvedValue({
        status: 'MULTIPLE_MATCHES',
        matchCount: 2,
        customers: [
          { id: 5, name: 'Moreland Builders', address: 'Muvattupuzha' },
          { id: 6, name: 'Moreland Traders', address: 'Kochi' },
        ],
      });

      const billText = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
14.50
1000`;

      await handlerService.handleUpdate(makeUpdate(billText));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('Multiple customers match'),
      );
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('Moreland Builders'),
      );
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('Moreland Traders'),
      );
      expect(handlerService.getPendingBill(1001)).toBeUndefined();
    });
  });

  describe('Customer Commands', () => {
    it('should handle /addcustomer flow', async () => {
      const payload = `/addcustomer
New Client
Kochi, Kerala
32ACCFM3093K1Z7
Kerala
9876543210`;

      mockCreateCustomerUseCase.execute.mockResolvedValue({
        id: 20,
        name: 'New Client',
        address: 'Kochi, Kerala',
        gstin: '32ACCFM3093K1Z7',
        state: 'Kerala',
        phone: '9876543210',
      });

      await handlerService.handleUpdate(makeUpdate(payload));

      expect(mockCreateCustomerUseCase.execute).toHaveBeenCalled();
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(1001, expect.stringContaining('Customer <b>New Client</b> registered successfully!'));
    });

    it('should handle /customers flow', async () => {
      mockCustomerRepository.findAll.mockResolvedValue([
        { id: 1, name: 'Client A', address: 'Address A', state: 'Kerala', gstin: '32AAAAA1111A1Z1' },
      ]);

      await handlerService.handleUpdate(makeUpdate('/customers'));

      expect(mockCustomerRepository.findAll).toHaveBeenCalled();
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(1001, expect.stringContaining('Registered Customers (1)'));
    });

    it('should handle /find flow', async () => {
      mockFindCustomerUseCase.execute.mockResolvedValue({
        status: 'EXACT_ONE',
        matchCount: 1,
        customers: [{ id: 1, name: 'Moreland', address: 'Muvattupuzha', state: 'Kerala', phone: '9847000000' }],
      });

      await handlerService.handleUpdate(makeUpdate('/find Moreland'));

      expect(mockFindCustomerUseCase.execute).toHaveBeenCalledWith('Moreland');
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(1001, expect.stringContaining('Search Results for "Moreland"'));
    });
  });

  describe('Billing Operations Commands', () => {
    it('should handle /editlast flow', async () => {
      mockEditLastBillUseCase.execute.mockResolvedValue({
        id: 10,
        invoiceNo: 'AMT/2026-27/001',
        customerId: 5,
        rate: 15.0,
        quantity: 1200,
        grandTotal: 18000,
      });

      await handlerService.handleUpdate(makeUpdate('/editlast 15.00 1200'));

      expect(mockEditLastBillUseCase.execute).toHaveBeenCalledWith({ rate: 15.0, quantity: 1200 });
      expect(mockPdfGeneratorService.generatePdf).toHaveBeenCalled();
      expect(mockTelegramService.sendDocument).toHaveBeenCalledWith(1001, expect.any(Buffer), 'AMT_2026-27_001_REVISED.pdf', expect.any(String));
    });

    it('should surface error when /editlast is called without update parameters', async () => {
      const { BadRequestException } = jest.requireActual('@nestjs/common');
      mockEditLastBillUseCase.execute.mockRejectedValue(
        new BadRequestException('Provide at least one field to update.'),
      );

      await handlerService.handleUpdate(makeUpdate('/editlast'));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('Provide at least one field to update'),
      );
    });

    it('should surface error when /editlast is called but no recent bill exists', async () => {
      const { NotFoundException } = jest.requireActual('@nestjs/common');
      mockEditLastBillUseCase.execute.mockRejectedValue(
        new NotFoundException('No recent bill found to edit.'),
      );

      await handlerService.handleUpdate(makeUpdate('/editlast 15.00 1200'));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('No recent bill found to edit.'),
      );
    });

    it('should surface error when /editlast is called on a cancelled bill', async () => {
      const { BadRequestException } = jest.requireActual('@nestjs/common');
      mockEditLastBillUseCase.execute.mockRejectedValue(
        new BadRequestException('The most recent bill is cancelled and cannot be edited.'),
      );

      await handlerService.handleUpdate(makeUpdate('/editlast 15.00 1200'));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('cancelled and cannot be edited'),
      );
    });

    it('should handle /cancel flow', async () => {
      mockCancelBillUseCase.execute.mockResolvedValue({
        id: 10,
        invoiceNo: 'AMT/2026-27/001',
        status: 'CANCELLED',
      });

      await handlerService.handleUpdate(makeUpdate('/cancel AMT/2026-27/001'));

      expect(mockCancelBillUseCase.execute).toHaveBeenCalledWith('AMT/2026-27/001');
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(1001, expect.stringContaining('marked as <b>CANCELLED</b>'));
    });

    it('should show usage guidance when /cancel is called without invoice number', async () => {
      await handlerService.handleUpdate(makeUpdate('/cancel'));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('Usage:</b> /cancel <invoiceNo>'),
      );
    });

    it('should surface error when /cancel is called with non-existent invoice number', async () => {
      const { NotFoundException } = jest.requireActual('@nestjs/common');
      mockCancelBillUseCase.execute.mockRejectedValue(
        new NotFoundException('Bill with invoice number "AMT/2026-27/999" not found.'),
      );

      await handlerService.handleUpdate(makeUpdate('/cancel AMT/2026-27/999'));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('Bill with invoice number "AMT/2026-27/999" not found.'),
      );
    });

    it('should surface error when /cancel is called on an already cancelled bill', async () => {
      const { BadRequestException } = jest.requireActual('@nestjs/common');
      mockCancelBillUseCase.execute.mockRejectedValue(
        new BadRequestException('Bill "AMT/2026-27/001" is already cancelled.'),
      );

      await handlerService.handleUpdate(makeUpdate('/cancel AMT/2026-27/001'));

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        1001,
        expect.stringContaining('already cancelled'),
      );
    });

    it('should handle /summary flow', async () => {
      await handlerService.handleUpdate(makeUpdate('/summary'));

      expect(mockMonthlySummaryUseCase.execute).toHaveBeenCalled();
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(1001, expect.stringContaining('Monthly Billing Summary'));
    });
  });
});
