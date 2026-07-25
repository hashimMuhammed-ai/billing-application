import { Injectable } from '@nestjs/common';
import { CreateCustomerDto, ParseCustomerResult } from '../domain/customer.entity';
import { validateGstin } from '../../../shared/validation/input-validators';
import { extractDataLines } from '../../../shared/utils/text.utils';

@Injectable()
export class AddCustomerParser {
  /**
   * Parses raw string message (with or without leading /addcustomer header) into CreateCustomerDto.
   * Expects exactly 5 lines:
   * Line 1: Name
   * Line 2: Address
   * Line 3: GSTIN
   * Line 4: State
   * Line 5: Phone
   */
  parse(rawText: string): ParseCustomerResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const lines = extractDataLines(rawText, '/addcustomer');

    if (lines.length !== 5) {
      errors.push(`Invalid customer data format. Expected 5 lines, got ${lines.length}.`);
      return {
        success: false,
        errors,
        warnings,
      };
    }

    const [name, address, gstinRaw, state, phoneRaw] = lines;

    if (!name || name.trim().length === 0) {
      errors.push('Customer name cannot be empty.');
    }

    if (!address || address.trim().length === 0) {
      errors.push('Customer address cannot be empty.');
    }

    if (!state || state.trim().length === 0) {
      errors.push('Customer state cannot be empty.');
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        warnings,
      };
    }

    const gstin = gstinRaw && gstinRaw.trim() !== '-' && gstinRaw.trim().toUpperCase() !== 'N/A'
      ? gstinRaw.trim().toUpperCase()
      : null;

    const phone = phoneRaw && phoneRaw.trim() !== '-' && phoneRaw.trim().toUpperCase() !== 'N/A'
      ? phoneRaw.trim()
      : null;

    if (gstin && !validateGstin(gstin)) {
      warnings.push(`Warning: GSTIN "${gstin}" does not match standard 15-character GSTIN format.`);
    }

    const dto: CreateCustomerDto = {
      name: name.trim(),
      address: address.trim(),
      gstin,
      state: state.trim(),
      phone,
    };

    return {
      success: true,
      dto,
      errors: [],
      warnings,
    };
  }
}
