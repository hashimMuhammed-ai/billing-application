import { Test, TestingModule } from '@nestjs/testing';
import { PdfGeneratorService, PdfBillData } from './pdf-generator.service';

const mockPdfBuffer = Buffer.from('%PDF-1.4 Mock PDF Content');

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockImplementation(() =>
    Promise.resolve({
      newPage: jest.fn().mockImplementation(() =>
        Promise.resolve({
          setContent: jest.fn().mockResolvedValue(undefined),
          pdf: jest.fn().mockResolvedValue(mockPdfBuffer),
        }),
      ),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  ),
}));

describe('PdfGeneratorService', () => {
  let service: PdfGeneratorService;

  const mockData: PdfBillData = {
    company: {
      name: 'A M TRADING',
      address: 'Main Road, Muvattupuzha, Kerala',
      phone: '9847000000',
      gstin: '32AAAAA0000A1Z5',
      hsnCode: '4408',
      gstRate: 18,
      bankName: 'Federal Bank',
      branch: 'Muvattupuzha',
      ifsc: 'FDRL0001234',
      accountNo: '12340100012345',
    },
    customer: {
      name: 'Moreland Ply&Boards',
      address: 'Manari P.O, Triveni, Muvattupuzha',
      gstin: '32ACCFM3093K1Z7',
      state: 'Kerala',
      phone: '9847111222',
    },
    bill: {
      invoiceNo: 'AMT/2026-27/001',
      vehicleNo: 'KL01BJ3019',
      eWayBillNo: '34AB1234C5678D1E2',
      dimension: '8*4',
      rate: 14.50,
      quantity: 11609.52,
      amount: 168338.04,
      cgst: 15150.42,
      sgst: 15150.42,
      roundOff: 0.12,
      grandTotal: 198639.00,
      createdAt: new Date('2026-07-23T10:00:00Z'),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfGeneratorService],
    }).compile();

    service = module.get<PdfGeneratorService>(PdfGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should render HTML with correctly populated fields and number-to-words', () => {
    const html = service.renderHtml(mockData);

    expect(html).toContain('AMT/2026-27/001');
    expect(html).toContain('A M TRADING');
    expect(html).toContain('Moreland Ply&Boards');
    expect(html).toContain('KL01BJ3019');
    expect(html).toContain('34AB1234C5678D1E2');
    expect(html).toContain('1,68,338.04');
    expect(html).toContain('15,150.42');
    expect(html).toContain('1,98,639.00');
    expect(html).toContain('One Lakh Ninety Eight Thousand Six Hundred Thirty Nine');
    expect(html).toContain('Federal Bank');
  });

  it('should generate a valid PDF Buffer via Puppeteer', async () => {
    const pdfBuffer = await service.generatePdf(mockData);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
  });
});
