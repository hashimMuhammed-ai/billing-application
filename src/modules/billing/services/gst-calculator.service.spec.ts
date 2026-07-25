import { GstCalculatorService } from './gst-calculator.service';

describe('GstCalculatorService', () => {
  let service: GstCalculatorService;

  beforeEach(() => {
    service = new GstCalculatorService();
  });

  it('should calculate GST matching reference invoice formula exactly', () => {
    // Reference invoice values: rate 14.50, quantity 11609.52
    const rate = 14.50;
    const quantity = 11609.52;
    const gstRate = 18;

    const result = service.calculate(rate, quantity, gstRate);

    expect(result.amount.toNumber()).toBe(168338.04);
    expect(result.cgst.toNumber()).toBe(15150.42);
    expect(result.sgst.toNumber()).toBe(15150.42);
    expect(result.totalBeforeRound.toNumber()).toBe(198638.88);
    expect(result.grandTotal.toNumber()).toBe(198639);
    expect(result.roundOff.toNumber()).toBe(0.12);
  });

  it('should handle zero round-off when total is exact integer', () => {
    // 100 * 10 = 1000. CGST 90, SGST 90. Total = 1180. GrandTotal = 1180. RoundOff = 0.
    const result = service.calculate(100, 10, 18);

    expect(result.amount.toNumber()).toBe(1000);
    expect(result.cgst.toNumber()).toBe(90);
    expect(result.sgst.toNumber()).toBe(90);
    expect(result.grandTotal.toNumber()).toBe(1180);
    expect(result.roundOff.toNumber()).toBe(0);
  });
});
