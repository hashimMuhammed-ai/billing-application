import { Injectable } from '@nestjs/common';
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

@Injectable()
export class GstCalculatorService {
  /**
   * Calculates GST values based on rate, quantity, and company GST percentage rate (e.g. 18).
   * Formulas:
   * amount = rate * quantity
   * halfRate = gstRate / 2 / 100 (e.g. 0.09)
   * cgst = amount * halfRate (rounded to 2 decimal places)
   * sgst = amount * halfRate (rounded to 2 decimal places)
   * totalBeforeRound = amount + cgst + sgst
   * grandTotal = round(totalBeforeRound)
   * roundOff = grandTotal - totalBeforeRound
   */
  calculate(rate: number | Prisma.Decimal, quantity: number | Prisma.Decimal, gstRatePercentage: number | Prisma.Decimal = 18): GstCalculationResult {
    const rateDec = new Prisma.Decimal(rate);
    const qtyDec = new Prisma.Decimal(quantity);
    const gstRateDec = new Prisma.Decimal(gstRatePercentage);

    const amount = rateDec.mul(qtyDec).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const halfRate = gstRateDec.div(2).div(100);

    const cgst = amount.mul(halfRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const sgst = amount.mul(halfRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const totalBeforeRound = amount.add(cgst).add(sgst).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const grandTotal = totalBeforeRound.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
    const roundOff = grandTotal.sub(totalBeforeRound).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      amount,
      cgst,
      sgst,
      totalBeforeRound,
      roundOff,
      grandTotal,
    };
  }
}
