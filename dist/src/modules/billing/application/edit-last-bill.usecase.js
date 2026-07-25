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
var EditLastBillUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditLastBillUseCase = void 0;
const common_1 = require("@nestjs/common");
const bill_repository_1 = require("../infrastructure/bill.repository");
const company_service_1 = require("../../company/company.service");
const gst_calculator_service_1 = require("../services/gst-calculator.service");
const pdf_generator_service_1 = require("../../pdf/pdf-generator.service");
const r2_storage_service_1 = require("../../storage/r2-storage.service");
let EditLastBillUseCase = EditLastBillUseCase_1 = class EditLastBillUseCase {
    billRepository;
    companyService;
    gstCalculatorService;
    pdfGeneratorService;
    r2StorageService;
    logger = new common_1.Logger(EditLastBillUseCase_1.name);
    constructor(billRepository, companyService, gstCalculatorService, pdfGeneratorService, r2StorageService) {
        this.billRepository = billRepository;
        this.companyService = companyService;
        this.gstCalculatorService = gstCalculatorService;
        this.pdfGeneratorService = pdfGeneratorService;
        this.r2StorageService = r2StorageService;
    }
    async execute(dto) {
        if (dto.rate === undefined && dto.quantity === undefined) {
            throw new common_1.BadRequestException('Provide at least one field to update.');
        }
        const lastBill = await this.billRepository.findMostRecent();
        if (!lastBill) {
            throw new common_1.NotFoundException('No recent bill found to edit.');
        }
        if (lastBill.status === 'CANCELLED') {
            throw new common_1.BadRequestException('The most recent bill is cancelled and cannot be edited.');
        }
        const currentRate = typeof lastBill.rate === 'number' ? lastBill.rate : Number(lastBill.rate);
        const currentQuantity = typeof lastBill.quantity === 'number' ? lastBill.quantity : Number(lastBill.quantity);
        const newRate = dto.rate !== undefined ? dto.rate : currentRate;
        const newQuantity = dto.quantity !== undefined ? dto.quantity : currentQuantity;
        if (newRate <= 0) {
            throw new common_1.BadRequestException('Rate must be a positive number.');
        }
        if (newQuantity <= 0) {
            throw new common_1.BadRequestException('Quantity must be a positive number.');
        }
        const company = await this.companyService.getCompany();
        const gstResult = this.gstCalculatorService.calculate(newRate, newQuantity, company.gstRate);
        let updatedBill = await this.billRepository.update(lastBill.id, {
            rate: newRate,
            quantity: newQuantity,
            amount: gstResult.amount,
            cgst: gstResult.cgst,
            sgst: gstResult.sgst,
            roundOff: gstResult.roundOff,
            grandTotal: gstResult.grandTotal,
            status: 'REVISED',
        });
        if (lastBill.customer) {
            try {
                const pdfBuffer = await this.pdfGeneratorService.generatePdf({
                    company,
                    customer: lastBill.customer,
                    bill: updatedBill,
                });
                const pdfUrl = await this.r2StorageService.uploadBillPdf(updatedBill.invoiceNo, pdfBuffer);
                if (pdfUrl) {
                    updatedBill = await this.billRepository.update(updatedBill.id, { pdfUrl });
                }
            }
            catch (err) {
                this.logger.error(`PDF regeneration or R2 re-upload failed for edited bill ${updatedBill.invoiceNo}: ${err.message}`);
            }
        }
        return updatedBill;
    }
};
exports.EditLastBillUseCase = EditLastBillUseCase;
exports.EditLastBillUseCase = EditLastBillUseCase = EditLastBillUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bill_repository_1.BillRepository,
        company_service_1.CompanyService,
        gst_calculator_service_1.GstCalculatorService,
        pdf_generator_service_1.PdfGeneratorService,
        r2_storage_service_1.R2StorageService])
], EditLastBillUseCase);
//# sourceMappingURL=edit-last-bill.usecase.js.map