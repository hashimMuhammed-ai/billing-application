import { BillParser } from './bill.parser';

describe('BillParser', () => {
  let parser: BillParser;

  beforeEach(() => {
    parser = new BillParser();
  });

  it('should parse valid 6-line bill message', () => {
    const rawInput = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
14.50
11609.52`;

    const result = parser.parse(rawInput);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.dto).toEqual({
      vehicleNo: 'KL01BJ3019',
      eWayBillNo: '34AB1234C5678D1E2',
      customerName: 'Moreland',
      dimension: '8*4',
      rate: 14.50,
      quantity: 11609.52,
    });
  });

  it('should return error if line count is not 6', () => {
    const rawInput = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
14.50`;

    const result = parser.parse(rawInput);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Expected 6 lines, got 5');
  });

  it('should return error if rate or quantity is invalid or <= 0', () => {
    const rawInput = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
abc
-10`;

    const result = parser.parse(rawInput);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Rate must be a positive number. Got "abc".');
    expect(result.errors).toContain('Quantity must be a positive number. Got "-10".');
  });

  it('should generate warning for non-standard dimension pattern but still succeed', () => {
    const rawInput = `KL01BJ3019
34AB1234C5678D1E2
Moreland
8x4_custom
14.50
100`;

    const result = parser.parse(rawInput);

    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Warning: Dimension "8x4_custom" does not match standard pattern');
  });
});
