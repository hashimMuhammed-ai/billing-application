import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const puppeteer = require('puppeteer');
import { numberToWordsIndian } from '../../shared/utils/number-to-words.util';

export interface PdfBillData {
  company: {
    name: string;
    address: string;
    phone: string;
    gstin: string;
    hsnCode: string;
    gstRate: number | { toNumber(): number } | string;
    bankName: string;
    branch: string;
    ifsc: string;
    accountNo: string;
  };
  customer: {
    name: string;
    address: string;
    gstin?: string | null;
    state: string;
    phone?: string | null;
  };
  bill: {
    invoiceNo: string;
    vehicleNo: string;
    eWayBillNo: string;
    dimension: string;
    rate: number | { toNumber(): number } | string;
    quantity: number | { toNumber(): number } | string;
    amount: number | { toNumber(): number } | string;
    cgst: number | { toNumber(): number } | string;
    sgst: number | { toNumber(): number } | string;
    roundOff: number | { toNumber(): number } | string;
    grandTotal: number | { toNumber(): number } | string;
    createdAt?: Date;
  };
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private templateCache: string | null = null;

  private loadTemplate(): string {
    if (this.templateCache) {
      return this.templateCache;
    }

    const possiblePaths = [
      path.join(__dirname, 'pdf-template.html'),
      path.resolve(process.cwd(), 'src/modules/pdf/pdf-template.html'),
      path.resolve(process.cwd(), 'dist/src/modules/pdf/pdf-template.html'),
      path.resolve(process.cwd(), 'dist/modules/pdf/pdf-template.html'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.templateCache = fs.readFileSync(p, 'utf8');
        return this.templateCache;
      }
    }

    throw new Error('PDF template file (pdf-template.html) not found in any resolved path.');
  }

  private toNumber(val: number | { toNumber(): number } | string | undefined | null): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && typeof val.toNumber === 'function') {
      return val.toNumber();
    }
    const parsed = parseFloat(String(val));
    return isNaN(parsed) ? 0 : parsed;
  }

  private formatDate(date?: Date): string {
    const d = date ? new Date(date) : new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatCurrency(num: number): string {
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  public renderHtml(data: PdfBillData): string {
    const template = this.loadTemplate();

    const companyGstRate = this.toNumber(data.company.gstRate);
    const halfRate = (companyGstRate / 2).toFixed(2).replace(/\.00$/, '');

    const amountNum = this.toNumber(data.bill.amount);
    const cgstNum = this.toNumber(data.bill.cgst);
    const sgstNum = this.toNumber(data.bill.sgst);
    const totalGstNum = cgstNum + sgstNum;
    const roundOffNum = this.toNumber(data.bill.roundOff);
    const grandTotalNum = this.toNumber(data.bill.grandTotal);
    const rateNum = this.toNumber(data.bill.rate);
    const qtyNum = this.toNumber(data.bill.quantity);

    const grandTotalWords = numberToWordsIndian(grandTotalNum);

    const customerGstinStr = data.customer.gstin ? data.customer.gstin.trim() : '';
    const customerPanStr = customerGstinStr.length >= 12 ? customerGstinStr.substring(2, 12) : '';

    let customerStateStr = (data.customer.state || 'KERALA').toUpperCase();
    if (!customerStateStr.includes(',')) {
      customerStateStr = `${customerStateStr},32`;
    }

    const customerPhoneStr = data.customer.phone || '';

    const replacements: Record<string, string> = {
      invoiceNo: data.bill.invoiceNo,
      date: this.formatDate(data.bill.createdAt),
      vehicleNo: data.bill.vehicleNo,
      eWayBillNo: data.bill.eWayBillNo,

      sellerName: data.company.name,
      sellerAddress: data.company.address,
      sellerGstin: data.company.gstin,
      sellerPhone: data.company.phone,

      customerName: data.customer.name,
      customerAddress: data.customer.address,
      customerGstin: customerGstinStr,
      customerPan: customerPanStr,
      customerState: customerStateStr,
      customerPhone: customerPhoneStr,

      hsnCode: data.company.hsnCode,
      dimension: data.bill.dimension,
      quantity: qtyNum.toFixed(2),
      rate: rateNum.toFixed(2),
      amount: amountNum.toFixed(2),
      amountFormatted: this.formatCurrency(amountNum),

      gstRate: companyGstRate.toString(),
      cgstRate: halfRate,
      cgst: cgstNum.toFixed(2),
      cgstFormatted: this.formatCurrency(cgstNum),
      sgstRate: halfRate,
      sgst: sgstNum.toFixed(2),
      sgstFormatted: this.formatCurrency(sgstNum),
      totalGst: totalGstNum.toFixed(2),
      totalGstFormatted: this.formatCurrency(totalGstNum),

      roundOff: roundOffNum.toFixed(2),
      roundOffFormatted: roundOffNum.toFixed(2),
      grandTotal: grandTotalNum.toFixed(2),
      grandTotalFormatted: this.formatCurrency(grandTotalNum),
      grandTotalInWords: grandTotalWords,

      bankName: data.company.bankName,
      bankBranch: data.company.branch,
      bankAccountNo: data.company.accountNo,
      bankIfsc: data.company.ifsc,
    };

    let html = template;
    for (const [key, val] of Object.entries(replacements)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, val);
    }

    return html;
  }

  async generatePdf(data: PdfBillData): Promise<Buffer> {
    const html = this.renderHtml(data);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const uint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });

      return Buffer.from(uint8Array);
    } catch (err) {
      this.logger.error(`Failed to generate PDF: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
