"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceNumberingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let InvoiceNumberingService = class InvoiceNumberingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getCurrentFY(date = new Date()) {
        const month = date.getMonth();
        const fullYear = date.getFullYear();
        const startYear = month >= 3 ? fullYear : fullYear - 1;
        const endYear = startYear + 1;
        const endYearStr = endYear.toString().slice(-2);
        return `${startYear}-${endYearStr}`;
    }
    async generateNextInvoiceNo(tx, companyCode = 'AMT', date = new Date()) {
        const client = tx || this.prisma;
        const detectedFY = this.getCurrentFY(date);
        const company = await client.company.findFirst();
        if (!company) {
            throw new Error('Company configuration row not found. Please seed Company table.');
        }
        let newSeq;
        if (company.currentFY !== detectedFY) {
            newSeq = 1;
        }
        else {
            newSeq = company.lastInvoiceSeq + 1;
        }
        await client.company.update({
            where: { id: company.id },
            data: {
                lastInvoiceSeq: newSeq,
                currentFY: detectedFY,
            },
        });
        const seqPadded = newSeq.toString().padStart(3, '0');
        const invoiceNo = `${companyCode}/${detectedFY}/${seqPadded}`;
        return {
            invoiceNo,
            seq: newSeq,
            fy: detectedFY,
        };
    }
};
exports.InvoiceNumberingService = InvoiceNumberingService;
exports.InvoiceNumberingService = InvoiceNumberingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoiceNumberingService);
//# sourceMappingURL=invoice-numbering.service.js.map