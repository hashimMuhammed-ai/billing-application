import { Prisma } from '@prisma/client';
export type Decimal = Prisma.Decimal;
export interface GstCalculationResult {
    amount: Prisma.Decimal;
    cgst: Prisma.Decimal;
    sgst: Prisma.Decimal;
    totalBeforeRound: Prisma.Decimal;
    roundOff: Prisma.Decimal;
    grandTotal: Prisma.Decimal;
}
export declare class GstCalculatorService {
    calculate(rate: number | Prisma.Decimal, quantity: number | Prisma.Decimal, gstRatePercentage?: number | Prisma.Decimal): GstCalculationResult;
}
