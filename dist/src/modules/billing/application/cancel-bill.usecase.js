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
exports.CancelBillUseCase = void 0;
const common_1 = require("@nestjs/common");
const bill_repository_1 = require("../infrastructure/bill.repository");
let CancelBillUseCase = class CancelBillUseCase {
    billRepository;
    constructor(billRepository) {
        this.billRepository = billRepository;
    }
    async execute(invoiceNo) {
        const trimmedInvoiceNo = invoiceNo ? invoiceNo.trim() : '';
        if (!trimmedInvoiceNo) {
            throw new common_1.BadRequestException('Invoice number is required.');
        }
        const bill = await this.billRepository.findByInvoiceNo(trimmedInvoiceNo);
        if (!bill) {
            throw new common_1.NotFoundException(`Bill with invoice number "${trimmedInvoiceNo}" not found.`);
        }
        if (bill.status === 'CANCELLED') {
            throw new common_1.BadRequestException(`Bill "${trimmedInvoiceNo}" is already cancelled.`);
        }
        return this.billRepository.update(bill.id, {
            status: 'CANCELLED',
        });
    }
};
exports.CancelBillUseCase = CancelBillUseCase;
exports.CancelBillUseCase = CancelBillUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bill_repository_1.BillRepository])
], CancelBillUseCase);
//# sourceMappingURL=cancel-bill.usecase.js.map