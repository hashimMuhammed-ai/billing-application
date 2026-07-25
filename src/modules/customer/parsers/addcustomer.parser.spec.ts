import { AddCustomerParser } from './addcustomer.parser';

describe('AddCustomerParser', () => {
  let parser: AddCustomerParser;

  beforeEach(() => {
    parser = new AddCustomerParser();
  });

  it('should parse 5 valid lines with /addcustomer command header', () => {
    const rawInput = `/addcustomer
Moreland Ply&Boards
Manari P.O, Triveni, Muvattupuzha
32ACCFM3093K1Z7
Kerala
9847000000`;

    const result = parser.parse(rawInput);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.dto).toEqual({
      name: 'Moreland Ply&Boards',
      address: 'Manari P.O, Triveni, Muvattupuzha',
      gstin: '32ACCFM3093K1Z7',
      state: 'Kerala',
      phone: '9847000000',
    });
  });

  it('should parse 5 valid lines without command header', () => {
    const rawInput = `Moreland Ply&Boards
Manari P.O, Triveni, Muvattupuzha
32ACCFM3093K1Z7
Kerala
9847000000`;

    const result = parser.parse(rawInput);

    expect(result.success).toBe(true);
    expect(result.dto?.name).toBe('Moreland Ply&Boards');
  });

  it('should return error if line count is not 5', () => {
    const rawInput = `Line 1
Line 2
Line 3`;

    const result = parser.parse(rawInput);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Expected 5 lines, got 3');
  });

  it('should add warning if GSTIN format is invalid but still succeed', () => {
    const rawInput = `/addcustomer
Test Customer
Address Line
INVALID_GSTIN_123
Kerala
9847000000`;

    const result = parser.parse(rawInput);

    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Warning: GSTIN "INVALID_GSTIN_123" does not match');
    expect(result.dto?.gstin).toBe('INVALID_GSTIN_123');
  });

  it('should handle "-" for GSTIN and Phone as null', () => {
    const rawInput = `/addcustomer
No GST Customer
Address Line
-
Kerala
-`;

    const result = parser.parse(rawInput);

    expect(result.success).toBe(true);
    expect(result.dto?.gstin).toBeNull();
    expect(result.dto?.phone).toBeNull();
  });
});
