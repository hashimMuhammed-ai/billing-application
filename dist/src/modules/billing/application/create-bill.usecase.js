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
var CreateBillUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBillUseCase = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const find_customer_usecase_1 = require("../../customer/application/find-customer.usecase");
const company_service_1 = require("../../company/company.service");
const gst_calculator_service_1 = require("../services/gst-calculator.service");
const invoice_numbering_service_1 = require("../services/invoice-numbering.service");
const bill_repository_1 = require("../infrastructure/bill.repository");
const pdf_generator_service_1 = require("../../pdf/pdf-generator.service");
const r2_storage_service_1 = require("../../storage/r2-storage.service");
let CreateBillUseCase = CreateBillUseCase_1 = class CreateBillUseCase {
    prisma;
    findCustomerUseCase;
    companyService;
    gstCalculatorService;
    invoiceNumberingService;
    billRepository;
    pdfGeneratorService;
    r2StorageService;
    logger = new common_1.Logger(CreateBillUseCase_1.name);
    constructor(prisma, findCustomerUseCase, companyService, gstCalculatorService, invoiceNumberingService, billRepository, pdfGeneratorService, r2StorageService) {
        this.prisma = prisma;
        this.findCustomerUseCase = findCustomerUseCase;
        this.companyService = companyService;
        this.gstCalculatorService = gstCalculatorService;
        this.invoiceNumberingService = invoiceNumberingService;
        this.billRepository = billRepository;
        this.pdfGeneratorService = pdfGeneratorService;
        this.r2StorageService = r2StorageService;
    }
    async execute(dto) {
        const findResult = await this.findCustomerUseCase.execute(dto.customerName);
        if (findResult.status === 'NO_MATCH') {
            throw new common_1.NotFoundException(`Customer "${dto.customerName}" not found. Please register customer using /addcustomer first.`);
        }
        if (findResult.status === 'MULTIPLE_MATCHES') {
            const customerList = findResult.customers
                .map((c) => `- ${c.name} (${c.address})`)
                .join('\n');
            throw new common_1.BadRequestException(`Multiple customers match "${dto.customerName}". Please specify:\n${customerList}`);
        }
        const customer = findResult.customers[0];
        const company = await this.companyService.getCompany();
        const gstResult = this.gstCalculatorService.calculate(dto.rate, dto.quantity, company.gstRate);
        let createdBill = await this.prisma.$transaction(async (tx) => {
            const { invoiceNo } = await this.invoiceNumberingService.generateNextInvoiceNo(tx, 'AMT');
            return this.billRepository.create(tx, {
                invoiceNo,
                customerId: customer.id,
                vehicleNo: dto.vehicleNo,
                eWayBillNo: dto.eWayBillNo,
                dimension: dto.dimension,
                rate: dto.rate,
                quantity: dto.quantity,
                amount: gstResult.amount,
                cgst: gstResult.cgst,
                sgst: gstResult.sgst,
                roundOff: gstResult.roundOff,
                grandTotal: gstResult.grandTotal,
                status: 'ACTIVE',
            });
        });
        try {
            const pdfBuffer = await this.pdfGeneratorService.generatePdf({
                company,
                customer,
                bill: createdBill,
            });
            const pdfUrl = await this.r2StorageService.uploadBillPdf(createdBill.invoiceNo, pdfBuffer);
            if (pdfUrl) {
                createdBill = await this.billRepository.update(createdBill.id, { pdfUrl });
            }
        }
        catch (err) {
            this.logger.error(`PDF generation or R2 upload failed for invoice ${createdBill.invoiceNo}: ${err.message}`);
        }
        return createdBill;
    }
};
exports.CreateBillUseCase = CreateBillUseCase;
exports.CreateBillUseCase = CreateBillUseCase = CreateBillUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        find_customer_usecase_1.FindCustomerUseCase,
        company_service_1.CompanyService,
        gst_calculator_service_1.GstCalculatorService,
        invoice_numbering_service_1.InvoiceNumberingService,
        bill_repository_1.BillRepository,
        pdf_generator_service_1.PdfGeneratorService,
        r2_storage_service_1.R2StorageService])
], CreateBillUseCase);
//# sourceMappingURL=create-bill.usecase.js.map