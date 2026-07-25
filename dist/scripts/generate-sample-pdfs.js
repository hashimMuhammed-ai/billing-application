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
Object.defineProperty(exports, "__esModule", { value: true });
const pdf_generator_service_1 = require("../src/modules/pdf/pdf-generator.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function generateSamplePdfs() {
    const service = new pdf_generator_service_1.PdfGeneratorService();
    const outputDir = path.resolve(process.cwd(), 'test/output-pdfs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const sampleBill1 = {
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
    const sampleBill2 = {
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
            name: 'Royal Agencies',
            address: 'MG Road, Ernakulam, Kerala',
            gstin: '32BBBBA1111B1Z2',
            state: 'Kerala',
            phone: '9847333444',
        },
        bill: {
            invoiceNo: 'AMT/2026-27/002',
            vehicleNo: 'KL07CC4567',
            eWayBillNo: '56CD9876E5432F1G0',
            dimension: '7*4',
            rate: 12.00,
            quantity: 5000.00,
            amount: 60000.00,
            cgst: 5400.00,
            sgst: 5400.00,
            roundOff: 0.00,
            grandTotal: 70800.00,
            createdAt: new Date('2026-07-24T09:00:00Z'),
        },
    };
    console.log('Generating Sample PDF 1...');
    const pdf1 = await service.generatePdf(sampleBill1);
    const file1 = path.join(outputDir, 'sample_invoice_001.pdf');
    fs.writeFileSync(file1, pdf1);
    console.log(`Saved sample PDF 1: ${file1} (${pdf1.length} bytes)`);
    console.log('Generating Sample PDF 2...');
    const pdf2 = await service.generatePdf(sampleBill2);
    const file2 = path.join(outputDir, 'sample_invoice_002.pdf');
    fs.writeFileSync(file2, pdf2);
    console.log(`Saved sample PDF 2: ${file2} (${pdf2.length} bytes)`);
}
generateSamplePdfs().catch(err => {
    console.error('Failed to generate sample PDFs:', err);
    process.exit(1);
});
//# sourceMappingURL=generate-sample-pdfs.js.map