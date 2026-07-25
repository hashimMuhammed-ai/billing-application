"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var PdfGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const puppeteer = require('puppeteer');
const number_to_words_util_1 = require("../../shared/utils/number-to-words.util");
let PdfGeneratorService = PdfGeneratorService_1 = class PdfGeneratorService {
    logger = new common_1.Logger(PdfGeneratorService_1.name);
    templateCache = null;
    loadTemplate() {
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
    toNumber(val) {
        if (val === null || val === undefined)
            return 0;
        if (typeof val === 'number')
            return val;
        if (typeof val === 'object' && typeof val.toNumber === 'function') {
            return val.toNumber();
        }
        const parsed = parseFloat(String(val));
        return isNaN(parsed) ? 0 : parsed;
    }
    formatDate(date) {
        const d = date ? new Date(date) : new Date();
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
    renderHtml(data) {
        const template = this.loadTemplate();
        const companyGstRate = this.toNumber(data.company.gstRate);
        const halfRate = (companyGstRate / 2).toFixed(2).replace(/\.00$/, '');
        const amountNum = this.toNumber(data.bill.amount);
        const cgstNum = this.toNumber(data.bill.cgst);
        const sgstNum = this.toNumber(data.bill.sgst);
        const roundOffNum = this.toNumber(data.bill.roundOff);
        const grandTotalNum = this.toNumber(data.bill.grandTotal);
        const rateNum = this.toNumber(data.bill.rate);
        const qtyNum = this.toNumber(data.bill.quantity);
        const roundOffSign = roundOffNum > 0 ? '+' : '';
        const grandTotalWords = (0, number_to_words_util_1.numberToWordsIndian)(grandTotalNum);
        const customerPhoneSection = data.customer.phone
            ? `| <strong>Phone:</strong> ${data.customer.phone}`
            : '';
        const replacements = {
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
            customerGstin: data.customer.gstin || 'N/A',
            customerState: data.customer.state,
            customerPhoneSection: customerPhoneSection,
            hsnCode: data.company.hsnCode,
            dimension: data.bill.dimension,
            quantity: qtyNum.toFixed(2),
            rate: rateNum.toFixed(2),
            amount: amountNum.toFixed(2),
            cgstRate: halfRate,
            cgst: cgstNum.toFixed(2),
            sgstRate: halfRate,
            sgst: sgstNum.toFixed(2),
            roundOffSign: roundOffSign,
            roundOff: roundOffNum.toFixed(2),
            grandTotal: grandTotalNum.toFixed(2),
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
    async generatePdf(data) {
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
        }
        catch (err) {
            this.logger.error(`Failed to generate PDF: ${err.message}`, err.stack);
            throw err;
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
};
exports.PdfGeneratorService = PdfGeneratorService;
exports.PdfGeneratorService = PdfGeneratorService = PdfGeneratorService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfGeneratorService);
//# sourceMappingURL=pdf-generator.service.js.map