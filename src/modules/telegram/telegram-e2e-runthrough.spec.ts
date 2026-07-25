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
import { InvoiceNumberingService } from '../billing/services/invoice-numbering.service';
import { BillRepository } from '../billing/infrastructure/bill.repository';
import { CreateBillUseCase } from '../billing/application/create-bill.usecase';
import { EditLastBillUseCase } from '../billing/application/edit-last-bill.usecase';
import { CancelBillUseCase } from '../billing/application/cancel-bill.usecase';
import { MonthlySummaryUseCase } from '../billing/application/monthly-summary.usecase';
import { PdfGeneratorService } from '../pdf/pdf-generator.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Customer, Bill } from '@prisma/client';
import { TelegramUpdate } from './telegram.dto';

describe('Telegram Full Run-Through & Integration Suite', () => {
  let handlerService: TelegramHandlerService;
  let sentMessages: Array<{ chatId: number | string; text: string }> = [];
  let sentDocuments: Array<{ chatId: number | string; filename: string; caption?: string }> = [];

  // In-memory data store for full integration simulation
  let dbCustomers: Customer[] = [];
  let dbBills: Bill[] = [];
  let seqCounter = 0;

  const mockCompany = {
    id: 1,
    name: 'A M TRADING',
    address: 'Main Road, Muvattupuzha',
    phone: '9847000000',
    email: 'amtrading@example.com',
    gstin: '32ABCDE1234F1Z5',
    state: 'Kerala',
    bankName: 'Federal Bank',
    accNo: '12340500001234',
    ifsc: 'FDRL0001234',
    branch: 'Muvattupuzha',
    hsnCode: '4412',
    gstRate: new Prisma.Decimal(18),
    currentFY: '2026-27',
    lastInvoiceSeq: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const makeUpdate = (text: string, chatId = 8888): TelegramUpdate => ({
    update_id: Math.floor(Math.random() * 100000),
    message: {
      message_id: Math.floor(Math.random() * 100000),
      chat: { id: chatId, type: 'private' },
      date: Date.now(),
      text,
    },
  });

  beforeEach(async () => {
    sentMessages = [];
    sentDocuments = [];
    dbCustomers = [];
    dbBills = [];
    seqCounter = 0;

    const mockTelegramService = {
      sendMessage: jest.fn().mockImplementation((chatId, text) => {
        sentMessages.push({ chatId, text });
        return Promise.resolve({ ok: true });
      }),
      sendDocument: jest.fn().mockImplementation((chatId, buffer, filename, caption) => {
        sentDocuments.push({ chatId, filename, caption });
        return Promise.resolve({ ok: true });
      }),
    };

    const mockCustomerRepository = {
      create: jest.fn().mockImplementation((data) => {
        const newCustomer: Customer = {
          id: dbCustomers.length + 1,
          name: data.name,
          address: data.address,
          gstin: data.gstin || null,
          state: data.state || 'Kerala',
          phone: data.phone || null,
          createdAt: new Date(),
        };
        dbCustomers.push(newCustomer);
        return Promise.resolve(newCustomer);
      }),
      findAll: jest.fn().mockImplementation(() => Promise.resolve(dbCustomers)),
      findByName: jest.fn().mockImplementation((name: string) => {
        return Promise.resolve(
          dbCustomers.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null,
        );
      }),
      findByNamePartial: jest.fn().mockImplementation((query: string) => {
        const q = query.toLowerCase();
        return Promise.resolve(dbCustomers.filter((c) => c.name.toLowerCase().includes(q)));
      }),
      findById: jest.fn().mockImplementation((id: number) => {
        return Promise.resolve(dbCustomers.find((c) => c.id === id) || null);
      }),
    };

    const mockCompanyService = {
      getCompany: jest.fn().mockResolvedValue(mockCompany),
    };

    const mockBillRepository = {
      create: jest.fn().mockImplementation((tx, data) => {
        const bill: any = {
          id: dbBills.length + 1,
          ...data,
          rate: new Prisma.Decimal(data.rate),
          quantity: new Prisma.Decimal(data.quantity),
          amount: new Prisma.Decimal(data.amount),
          cgst: new Prisma.Decimal(data.cgst),
          sgst: new Prisma.Decimal(data.sgst),
          roundOff: new Prisma.Decimal(data.roundOff),
          grandTotal: new Prisma.Decimal(data.grandTotal),
          pdfUrl: data.pdfUrl || null,
          createdAt: new Date(),
        };
        dbBills.push(bill);
        return Promise.resolve(bill);
      }),
      findMostRecent: jest.fn().mockImplementation(() => {
        return Promise.resolve(dbBills[dbBills.length - 1] || null);
      }),
      findByInvoiceNo: jest.fn().mockImplementation((invoiceNo: string) => {
        return Promise.resolve(dbBills.find((b) => b.invoiceNo === invoiceNo) || null);
      }),
      update: jest.fn().mockImplementation((id: number, data: any) => {
        const index = dbBills.findIndex((b) => b.id === id);
        if (index !== -1) {
          dbBills[index] = {
            ...dbBills[index],
            ...data,
            ...(data.rate !== undefined ? { rate: new Prisma.Decimal(data.rate) } : {}),
            ...(data.quantity !== undefined ? { quantity: new Prisma.Decimal(data.quantity) } : {}),
            ...(data.amount !== undefined ? { amount: new Prisma.Decimal(data.amount) } : {}),
            ...(data.cgst !== undefined ? { cgst: new Prisma.Decimal(data.cgst) } : {}),
            ...(data.sgst !== undefined ? { sgst: new Prisma.Decimal(data.sgst) } : {}),
            ...(data.roundOff !== undefined ? { roundOff: new Prisma.Decimal(data.roundOff) } : {}),
            ...(data.grandTotal !== undefined ? { grandTotal: new Prisma.Decimal(data.grandTotal) } : {}),
          };
          return Promise.resolve(dbBills[index]);
        }
        return Promise.resolve(null);
      }),
      findBillsByDateRange: jest.fn().mockImplementation(() => Promise.resolve(dbBills)),
    };

    const mockInvoiceNumberingService = {
      generateNextInvoiceNo: jest.fn().mockImplementation(() => {
        seqCounter++;
        const padded = seqCounter.toString().padStart(3, '0');
        return Promise.resolve({
          invoiceNo: `AMT/2026-27/${padded}`,
          seq: seqCounter,
          fy: '2026-27',
        });
      }),
    };

    const mockPdfGeneratorService = {
      generatePdf: jest.fn().mockResolvedValue(Buffer.from('MOCK_PDF_CONTENT')),
    };

    const mockR2StorageService = {
      uploadBillPdf: jest.fn().mockImplementation((invoiceNo) => {
        return Promise.resolve(`https://r2.dev/bills/${invoiceNo.replace(/\//g, '_')}.pdf`);
      }),
    };

    const mockPrismaService = {
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramHandlerService,
        MessageRouterService,
        BillParser,
        AddCustomerParser,
        GstCalculatorService,
        { provide: TelegramService, useValue: mockTelegramService },
        {
          provide: FindCustomerUseCase,
          useFactory: (repo) => new FindCustomerUseCase(repo),
          inject: [CustomerRepository],
        },
        {
          provide: CreateCustomerUseCase,
          useFactory: (repo) => new CreateCustomerUseCase(repo),
          inject: [CustomerRepository],
        },
        { provide: CustomerRepository, useValue: mockCustomerRepository },
        { provide: CompanyService, useValue: mockCompanyService },
        { provide: InvoiceNumberingService, useValue: mockInvoiceNumberingService },
        { provide: BillRepository, useValue: mockBillRepository },
        {
          provide: CreateBillUseCase,
          useFactory: (prisma, findCust, comp, gst, invNo, repo, pdf, r2) =>
            new CreateBillUseCase(prisma, findCust, comp, gst, invNo, repo, pdf, r2),
          inject: [
            PrismaService,
            FindCustomerUseCase,
            CompanyService,
            GstCalculatorService,
            InvoiceNumberingService,
            BillRepository,
            PdfGeneratorService,
            R2StorageService,
          ],
        },
        {
          provide: EditLastBillUseCase,
          useFactory: (repo, comp, gst, pdf, r2) => new EditLastBillUseCase(repo, comp, gst, pdf, r2),
          inject: [
            BillRepository,
            CompanyService,
            GstCalculatorService,
            PdfGeneratorService,
            R2StorageService,
          ],
        },
        {
          provide: CancelBillUseCase,
          useFactory: (repo) => new CancelBillUseCase(repo),
          inject: [BillRepository],
        },
        {
          provide: MonthlySummaryUseCase,
          useFactory: (repo) => new MonthlySummaryUseCase(repo),
          inject: [BillRepository],
        },
        { provide: PdfGeneratorService, useValue: mockPdfGeneratorService },
        { provide: R2StorageService, useValue: mockR2StorageService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    handlerService = module.get<TelegramHandlerService>(TelegramHandlerService);
  });

  describe('End-to-End Command Tests (/summary, /customers, /find)', () => {
    it('should return empty state message when /customers is called with no customers registered', async () => {
      await handlerService.handleUpdate(makeUpdate('/customers'));

      const lastMsg = sentMessages[sentMessages.length - 1];
      expect(lastMsg.text).toContain('No customers registered yet');
    });

    it('should return empty state summary when /summary is called with no bills created', async () => {
      await handlerService.handleUpdate(makeUpdate('/summary'));

      const lastMsg = sentMessages[sentMessages.length - 1];
      expect(lastMsg.text).toContain('Monthly Billing Summary');
      expect(lastMsg.text).toContain('Active Bills:</b> 0');
      expect(lastMsg.text).toContain('Total Sales:</b> ₹0.00');
    });

    it('should handle /find usage error when query is missing', async () => {
      await handlerService.handleUpdate(makeUpdate('/find'));

      const lastMsg = sentMessages[sentMessages.length - 1];
      expect(lastMsg.text).toContain('Usage:</b> /find <name>');
    });

    it('should handle /find no match when customer is not found', async () => {
      await handlerService.handleUpdate(makeUpdate('/find NonExistent'));

      const lastMsg = sentMessages[sentMessages.length - 1];
      expect(lastMsg.text).toContain('No customers found matching "<b>NonExistent</b>"');
    });
  });

  describe('Full Telegram Run-Through (Customer Registration -> Bill Creation -> PDF -> Edit -> Cancel -> Summary)', () => {
    it('should execute the complete Telegram user workflow end-to-end seamlessly', async () => {
      const chatId = 9999;

      // 1. Register Customer A ("Moreland Builders")
      const addCustomerA = `/addcustomer
Moreland Builders
Muvattupuzha, Kerala
32ACCFM3093K1Z7
Kerala
9847000000`;
      await handlerService.handleUpdate(makeUpdate(addCustomerA, chatId));
      expect(sentMessages[sentMessages.length - 1].text).toContain('Customer <b>Moreland Builders</b> registered successfully!');

      // 2. Register Customer B ("Ace Traders")
      const addCustomerB = `/addcustomer
Ace Traders
Kochi, Kerala
32AAACE1111A1Z1
Kerala
9876543210`;
      await handlerService.handleUpdate(makeUpdate(addCustomerB, chatId));
      expect(sentMessages[sentMessages.length - 1].text).toContain('Customer <b>Ace Traders</b> registered successfully!');

      // 3. Test /customers command (should list 2 customers)
      await handlerService.handleUpdate(makeUpdate('/customers', chatId));
      const customersMsg = sentMessages[sentMessages.length - 1].text;
      expect(customersMsg).toContain('Registered Customers (2)');
      expect(customersMsg).toContain('Moreland Builders');
      expect(customersMsg).toContain('Ace Traders');

      // 4. Test /find command
      await handlerService.handleUpdate(makeUpdate('/find Moreland', chatId));
      const findMsg = sentMessages[sentMessages.length - 1].text;
      expect(findMsg).toContain('Search Results for "Moreland" (1)');
      expect(findMsg).toContain('Moreland Builders');

      // 5. Create Bill #1 for Moreland Builders (6 lines)
      const billMsg1 = `KL01BJ3019
34AB1234C5678D1E2
Moreland Builders
8*4
100.00
10`;
      await handlerService.handleUpdate(makeUpdate(billMsg1, chatId));
      expect(sentMessages[sentMessages.length - 1].text).toContain('Bill Summary (Pending Confirmation)');
      expect(sentMessages[sentMessages.length - 1].text).toContain('Grand Total:</b> ₹1180.00');

      // Staff confirms Bill #1 with "yes"
      await handlerService.handleUpdate(makeUpdate('yes', chatId));
      expect(sentMessages[sentMessages.length - 1].text).toContain('Invoice <b>AMT/2026-27/001</b> created successfully!');
      expect(sentDocuments.length).toBe(1);
      expect(sentDocuments[0].filename).toBe('AMT_2026-27_001.pdf');

      // 6. Create Bill #2 for Ace Traders (6 lines)
      const billMsg2 = `KL07AB9999
34AB1234C5678D1E3
Ace Traders
8*4
200.00
10`;
      await handlerService.handleUpdate(makeUpdate(billMsg2, chatId));
      expect(sentMessages[sentMessages.length - 1].text).toContain('Bill Summary (Pending Confirmation)');
      expect(sentMessages[sentMessages.length - 1].text).toContain('Grand Total:</b> ₹2360.00');

      // Staff confirms Bill #2 with "yes"
      await handlerService.handleUpdate(makeUpdate('yes', chatId));
      expect(sentMessages[sentMessages.length - 1].text).toContain('Invoice <b>AMT/2026-27/002</b> created successfully!');
      expect(sentDocuments.length).toBe(2);
      expect(sentDocuments[1].filename).toBe('AMT_2026-27_002.pdf');

      // 7. Edit Bill #2 via /editlast 250.00 10
      await handlerService.handleUpdate(makeUpdate('/editlast 250.00 10', chatId));
      const editMsg = sentMessages[sentMessages.length - 1].text;
      expect(editMsg).toContain('Invoice <b>AMT/2026-27/002</b> revised successfully!');
      expect(editMsg).toContain('New Grand Total:</b> ₹2950.00'); // 2500 + 18% GST (225 CGST + 225 SGST) = 2950
      expect(sentDocuments.length).toBe(3);
      expect(sentDocuments[2].filename).toBe('AMT_2026-27_002_REVISED.pdf');

      // 8. Cancel Bill #1 via /cancel AMT/2026-27/001
      await handlerService.handleUpdate(makeUpdate('/cancel AMT/2026-27/001', chatId));
      expect(sentMessages[sentMessages.length - 1].text).toContain('Invoice <b>AMT/2026-27/001</b> has been marked as <b>CANCELLED</b>');

      // 9. Pull monthly summary via /summary
      await handlerService.handleUpdate(makeUpdate('/summary', chatId));
      const summaryMsg = sentMessages[sentMessages.length - 1].text;

      expect(summaryMsg).toContain('Monthly Billing Summary');
      expect(summaryMsg).toContain('Active Bills:</b> 1');
      expect(summaryMsg).toContain('Cancelled Bills:</b> 1');
      expect(summaryMsg).toContain('Total Sales:</b> ₹2950.00');
      expect(summaryMsg).toContain('CGST Collected:</b> ₹225.00');
      expect(summaryMsg).toContain('SGST Collected:</b> ₹225.00');
      expect(summaryMsg).toContain('Total GST:</b> ₹450.00');
    });
  });
});
