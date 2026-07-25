"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GstCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let GstCalculatorService = class GstCalculatorService {
    calculate(rate, quantity, gstRatePercentage = 18) {
        const rateDec = new client_1.Prisma.Decimal(rate);
        const qtyDec = new client_1.Prisma.Decimal(quantity);
        const gstRateDec = new client_1.Prisma.Decimal(gstRatePercentage);
        const amount = rateDec.mul(qtyDec).toDecimalPlaces(2, client_1.Prisma.Decimal.ROUND_HALF_UP);
        const halfRate = gstRateDec.div(2).div(100);
        const cgst = amount.mul(halfRate).toDecimalPlaces(2, client_1.Prisma.Decimal.ROUND_HALF_UP);
        const sgst = amount.mul(halfRate).toDecimalPlaces(2, client_1.Prisma.Decimal.ROUND_HALF_UP);
        const totalBeforeRound = amount.add(cgst).add(sgst).toDecimalPlaces(2, client_1.Prisma.Decimal.ROUND_HALF_UP);
        const grandTotal = totalBeforeRound.toDecimalPlaces(0, client_1.Prisma.Decimal.ROUND_HALF_UP);
        const roundOff = grandTotal.sub(totalBeforeRound).toDecimalPlaces(2, client_1.Prisma.Decimal.ROUND_HALF_UP);
        return {
            amount,
            cgst,
            sgst,
            totalBeforeRound,
            roundOff,
            grandTotal,
        };
    }
};
exports.GstCalculatorService = GstCalculatorService;
exports.GstCalculatorService = GstCalculatorService = __decorate([
    (0, common_1.Injectable)()
], GstCalculatorService);
//# sourceMappingURL=gst-calculator.service.js.map