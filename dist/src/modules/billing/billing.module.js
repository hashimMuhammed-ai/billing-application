"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const customer_module_1 = require("../customer/customer.module");
const company_module_1 = require("../company/company.module");
const bill_repository_1 = require("./infrastructure/bill.repository");
const bill_parser_1 = require("./parsers/bill.parser");
const gst_calculator_service_1 = require("./services/gst-calculator.service");
const invoice_numbering_service_1 = require("./services/invoice-numbering.service");
const create_bill_usecase_1 = require("./application/create-bill.usecase");
const edit_last_bill_usecase_1 = require("./application/edit-last-bill.usecase");
const cancel_bill_usecase_1 = require("./application/cancel-bill.usecase");
const monthly_summary_usecase_1 = require("./application/monthly-summary.usecase");
const billing_controller_1 = require("./billing.controller");
const pdf_module_1 = require("../pdf/pdf.module");
const storage_module_1 = require("../storage/storage.module");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, customer_module_1.CustomerModule, company_module_1.CompanyModule, pdf_module_1.PdfModule, storage_module_1.StorageModule],
        controllers: [billing_controller_1.BillingController],
        providers: [
            bill_repository_1.BillRepository,
            bill_parser_1.BillParser,
            gst_calculator_service_1.GstCalculatorService,
            invoice_numbering_service_1.InvoiceNumberingService,
            create_bill_usecase_1.CreateBillUseCase,
            edit_last_bill_usecase_1.EditLastBillUseCase,
            cancel_bill_usecase_1.CancelBillUseCase,
            monthly_summary_usecase_1.MonthlySummaryUseCase,
        ],
        exports: [
            bill_repository_1.BillRepository,
            bill_parser_1.BillParser,
            gst_calculator_service_1.GstCalculatorService,
            invoice_numbering_service_1.InvoiceNumberingService,
            create_bill_usecase_1.CreateBillUseCase,
            edit_last_bill_usecase_1.EditLastBillUseCase,
            cancel_bill_usecase_1.CancelBillUseCase,
            monthly_summary_usecase_1.MonthlySummaryUseCase,
        ],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map