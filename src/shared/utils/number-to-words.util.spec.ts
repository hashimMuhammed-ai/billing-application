import { numberToWordsIndian } from './number-to-words.util';

describe('numberToWordsIndian', () => {
  it('should return "Zero" for 0 or invalid inputs', () => {
    expect(numberToWordsIndian(0)).toBe('Zero');
    expect(numberToWordsIndian('invalid')).toBe('Zero');
  });

  it('should convert single and double digits correctly', () => {
    expect(numberToWordsIndian(5)).toBe('Five');
    expect(numberToWordsIndian(15)).toBe('Fifteen');
    expect(numberToWordsIndian(45)).toBe('Forty Five');
  });

  it('should convert hundreds and thousands correctly', () => {
    expect(numberToWordsIndian(500)).toBe('Five Hundred');
    expect(numberToWordsIndian(1234)).toBe('One Thousand Two Hundred Thirty Four');
    expect(numberToWordsIndian(10000)).toBe('Ten Thousand');
  });

  it('should convert Lakhs correctly', () => {
    expect(numberToWordsIndian(100000)).toBe('One Lakh');
    expect(numberToWordsIndian(198639)).toBe('One Lakh Ninety Eight Thousand Six Hundred Thirty Nine');
  });

  it('should convert Crores correctly', () => {
    expect(numberToWordsIndian(10000000)).toBe('One Crore');
    expect(numberToWordsIndian(12345678)).toBe('One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight');
  });

  it('should handle paise correctly', () => {
    expect(numberToWordsIndian(0.50)).toBe('Fifty Paise');
    expect(numberToWordsIndian(168338.04)).toBe('One Lakh Sixty Eight Thousand Three Hundred Thirty Eight and Four Paise');
  });
});
