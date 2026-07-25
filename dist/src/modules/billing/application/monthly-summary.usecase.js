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
exports.MonthlySummaryUseCase = void 0;
const common_1 = require("@nestjs/common");
const bill_repository_1 = require("../infrastructure/bill.repository");
const client_1 = require("@prisma/client");
let MonthlySummaryUseCase = class MonthlySummaryUseCase {
    billRepository;
    constructor(billRepository) {
        this.billRepository = billRepository;
    }
    async execute(targetDate = new Date()) {
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const startDate = new Date(year, month, 1, 0, 0, 0, 0);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
        const bills = await this.billRepository.findBillsByDateRange(startDate, endDate);
        const activeBills = bills.filter((b) => b.status !== 'CANCELLED');
        const cancelledBills = bills.filter((b) => b.status === 'CANCELLED');
        const totalSales = activeBills.reduce((sum, b) => {
            const val = typeof b.grandTotal === 'number' ? b.grandTotal : new client_1.Prisma.Decimal(b.grandTotal).toNumber();
            return sum + val;
        }, 0);
        const totalCgst = activeBills.reduce((sum, b) => {
            const val = typeof b.cgst === 'number' ? b.cgst : new client_1.Prisma.Decimal(b.cgst).toNumber();
            return sum + val;
        }, 0);
        const totalSgst = activeBills.reduce((sum, b) => {
            const val = typeof b.sgst === 'number' ? b.sgst : new client_1.Prisma.Decimal(b.sgst).toNumber();
            return sum + val;
        }, 0);
        const monthName = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        return {
            month: monthName,
            year,
            startDate,
            endDate,
            totalSales: Number(totalSales.toFixed(2)),
            totalCgst: Number(totalCgst.toFixed(2)),
            totalSgst: Number(totalSgst.toFixed(2)),
            totalGst: Number((totalCgst + totalSgst).toFixed(2)),
            billCount: activeBills.length,
            cancelledCount: cancelledBills.length,
        };
    }
};
exports.MonthlySummaryUseCase = MonthlySummaryUseCase;
exports.MonthlySummaryUseCase = MonthlySummaryUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bill_repository_1.BillRepository])
], MonthlySummaryUseCase);
//# sourceMappingURL=monthly-summary.usecase.js.map