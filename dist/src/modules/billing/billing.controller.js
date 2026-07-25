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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const bill_parser_1 = require("./parsers/bill.parser");
const create_bill_usecase_1 = require("./application/create-bill.usecase");
const edit_last_bill_usecase_1 = require("./application/edit-last-bill.usecase");
const cancel_bill_usecase_1 = require("./application/cancel-bill.usecase");
const monthly_summary_usecase_1 = require("./application/monthly-summary.usecase");
let BillingController = class BillingController {
    billParser;
    createBillUseCase;
    editLastBillUseCase;
    cancelBillUseCase;
    monthlySummaryUseCase;
    constructor(billParser, createBillUseCase, editLastBillUseCase, cancelBillUseCase, monthlySummaryUseCase) {
        this.billParser = billParser;
        this.createBillUseCase = createBillUseCase;
        this.editLastBillUseCase = editLastBillUseCase;
        this.cancelBillUseCase = cancelBillUseCase;
        this.monthlySummaryUseCase = monthlySummaryUseCase;
    }
    async parseAndCreate(rawText) {
        if (!rawText) {
            throw new common_1.BadRequestException('Field "rawText" is required.');
        }
        const parseResult = this.billParser.parse(rawText);
        if (!parseResult.success || !parseResult.dto) {
            throw new common_1.BadRequestException({
                message: 'Bill parsing failed',
                errors: parseResult.errors,
            });
        }
        const bill = await this.createBillUseCase.execute(parseResult.dto);
        return {
            bill,
            warnings: parseResult.warnings,
        };
    }
    async create(dto) {
        return this.createBillUseCase.execute(dto);
    }
    async editLast(dto) {
        return this.editLastBillUseCase.execute(dto);
    }
    async cancel(invoiceNo) {
        return this.cancelBillUseCase.execute(invoiceNo);
    }
    async getSummary(yearStr, monthStr) {
        let targetDate = new Date();
        if (yearStr && monthStr) {
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10) - 1;
            if (!isNaN(year) && !isNaN(month)) {
                targetDate = new Date(year, month, 15);
            }
        }
        return this.monthlySummaryUseCase.execute(targetDate);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Post)('parse-and-create'),
    __param(0, (0, common_1.Body)('rawText')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "parseAndCreate", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('edit-last'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "editLast", null);
__decorate([
    (0, common_1.Post)('cancel'),
    __param(0, (0, common_1.Body)('invoiceNo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getSummary", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('bills'),
    __metadata("design:paramtypes", [bill_parser_1.BillParser,
        create_bill_usecase_1.CreateBillUseCase,
        edit_last_bill_usecase_1.EditLastBillUseCase,
        cancel_bill_usecase_1.CancelBillUseCase,
        monthly_summary_usecase_1.MonthlySummaryUseCase])
], BillingController);
//# sourceMappingURL=billing.controller.js.map