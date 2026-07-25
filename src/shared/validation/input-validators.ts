/**
 * GSTIN Validation Regex
 * Standard 15-character GSTIN format:
 * - 2 digits state code
 * - 5 alphabets (PAN)
 * - 4 digits (PAN)
 * - 1 alphabet (PAN)
 * - 1 digit/alphabet (entity number)
 * - 'Z' (default 14th character)
 * - 1 digit/alphabet (check digit)
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export function validateGstin(gstin: string): boolean {
  if (!gstin) return false;
  return GSTIN_REGEX.test(gstin.trim());
}


