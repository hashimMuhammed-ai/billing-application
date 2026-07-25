import { BillParser } from './parsers/bill.parser';
import { GstCalculatorService } from './services/gst-calculator.service';
import { CreateBillUseCase } from './application/create-bill.usecase';
import { EditLastBillUseCase } from './application/edit-last-bill.usecase';
import { CancelBillUseCase } from './application/cancel-bill.usecase';
import { MonthlySummaryUseCase } from './application/monthly-summary.usecase';
import { Prisma } from '@prisma/client';

describe('Billing Flow End-to-End Integration Test', () => {
  let parser: BillParser;
  let gstCalculatorService: GstCalculatorService;
  let createBillUseCase: CreateBillUseCase;
  let editLastBillUseCase: EditLastBillUseCase;
  let cancelBillUseCase: CancelBillUseCase;
  let monthlySummaryUseCase: MonthlySummaryUseCase;

  const mockCustomer = {
    id: 1,
    name: 'Moreland Ply&Boards',
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

  // In-memory bills store simulating database persistence
  let dbBills: any[] = [];
  let seqCounter = 0;

  beforeEach(() => {
    dbBills = [];
    seqCounter = 0;

    const mockPrismaService: any = {
      $transaction: jest.fn((cb) => cb(mockPrismaService)),
      company: {
        findFirst: jest.fn().mockResolvedValue(mockCompany),
        update: jest.fn(),
      },
    };

    const mockFindCustomerUseCase: any = {
      execute: jest.fn().mockResolvedValue({
        status: 'EXACT_ONE',
        customers: [mockCustomer],
        matchCount: 1,
      }),
    };

    const mockCompanyService: any = {
      getCompany: jest.fn().mockResolvedValue(mockCompany),
    };

    const mockBillRepository: any = {
      create: jest.fn().mockImplementation((tx, data) => {
        const bill = {
          id: dbBills.length + 1,
          ...data,
          rate: new Prisma.Decimal(data.rate),
          quantity: new Prisma.Decimal(data.quantity),
          amount: new Prisma.Decimal(data.amount),
          cgst: new Prisma.Decimal(data.cgst),
          sgst: new Prisma.Decimal(data.sgst),
          roundOff: new Prisma.Decimal(data.roundOff),
          grandTotal: new Prisma.Decimal(data.grandTotal),
          createdAt: new Date(),
          customer: mockCustomer,
        };
        dbBills.push(bill);
        return Promise.resolve(bill);
      }),
      findMostRecent: jest.fn().mockImplementation(() => {
        return Promise.resolve(dbBills[dbBills.length - 1] || null);
      }),
      findByInvoiceNo: jest.fn().mockImplementation((invoiceNo) => {
        return Promise.resolve(dbBills.find((b) => b.invoiceNo === invoiceNo) || null);
      }),
      update: jest.fn().mockImplementation((id, data) => {
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

    const mockInvoiceNumberingService: any = {
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

    const mockPdfGeneratorService: any = {
      generatePdf: jest.fn().mockResolvedValue(Buffer.from('pdf data')),
    };

    const mockR2StorageService: any = {
      uploadBillPdf: jest.fn().mockResolvedValue('https://pub-test.r2.dev/bills/test.pdf'),
    };

    parser = new BillParser();
    gstCalculatorService = new GstCalculatorService();

    createBillUseCase = new CreateBillUseCase(
      mockPrismaService,
      mockFindCustomerUseCase,
      mockCompanyService,
      gstCalculatorService,
      mockInvoiceNumberingService,
      mockBillRepository,
      mockPdfGeneratorService,
      mockR2StorageService,
    );

    editLastBillUseCase = new EditLastBillUseCase(
      mockBillRepository,
      mockCompanyService,
      gstCalculatorService,
      mockPdfGeneratorService,
      mockR2StorageService,
    );

    cancelBillUseCase = new CancelBillUseCase(mockBillRepository);

    monthlySummaryUseCase = new MonthlySummaryUseCase(mockBillRepository);
  });

  it('should complete full billing flow: create -> edit -> cancel -> summary', async () => {
    // Step 1: Create Bill 1 from raw 6-line text
    const rawBill1 = `KL01BJ3019
34AB1234C5678D1E2
Moreland Ply&Boards
8*4
100
10`;
    const parseResult1 = parser.parse(rawBill1);
    expect(parseResult1.success).toBe(true);

    const bill1 = await createBillUseCase.execute(parseResult1.dto!);
    expect(bill1.invoiceNo).toBe('AMT/2026-27/001');
    expect(bill1.grandTotal.toNumber()).toBe(1180);
    expect(bill1.status).toBe('ACTIVE');

    // Step 2: Create Bill 2 from raw 6-line text
    const rawBill2 = `KL01BJ3020
34AB1234C5678D1E3
Moreland Ply&Boards
8*4
200
10`;
    const parseResult2 = parser.parse(rawBill2);
    expect(parseResult2.success).toBe(true);

    const bill2 = await createBillUseCase.execute(parseResult2.dto!);
    expect(bill2.invoiceNo).toBe('AMT/2026-27/002');
    expect(bill2.grandTotal.toNumber()).toBe(2360);
    expect(bill2.status).toBe('ACTIVE');

    // Step 3: Edit Bill 2 (the last bill created) — change rate from 200 to 250
    const editedBill2 = await editLastBillUseCase.execute({ rate: 250 });
    expect(editedBill2.invoiceNo).toBe('AMT/2026-27/002');
    expect(editedBill2.rate.toNumber()).toBe(250);
    expect(editedBill2.grandTotal.toNumber()).toBe(2950); // 2500 + 225 + 225 = 2950
    expect(editedBill2.status).toBe('REVISED');

    // Step 4: Cancel Bill 1 by invoice number
    const cancelledBill1 = await cancelBillUseCase.execute('AMT/2026-27/001');
    expect(cancelledBill1.invoiceNo).toBe('AMT/2026-27/001');
    expect(cancelledBill1.status).toBe('CANCELLED');

    // Step 5: Pull Monthly Summary
    // Active bill (Bill 2 revised): grandTotal = 2950, CGST = 225, SGST = 225.
    // Cancelled bill (Bill 1): excluded from total sales & GST.
    const summary = await monthlySummaryUseCase.execute();
    expect(summary.billCount).toBe(1);
    expect(summary.cancelledCount).toBe(1);
    expect(summary.totalSales).toBe(2950);
    expect(summary.totalCgst).toBe(225);
    expect(summary.totalSgst).toBe(225);
    expect(summary.totalGst).toBe(450);
  });
});
