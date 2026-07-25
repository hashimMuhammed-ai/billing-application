import { Injectable } from '@nestjs/common';
import { ParsedBillDto, ParseBillResult } from '../domain/bill.entity';
import { extractDataLines } from '../../../shared/utils/text.utils';

// Loose regex pattern for dimensions like 8*4, 8.5*4, 8 * 4
const DIMENSION_REGEX = /^\d+(\.\d+)?\s*\*\s*\d+(\.\d+)?$/;

@Injectable()
export class BillParser {
  /**
   * Parses raw string message into ParsedBillDto.
   * Line order (exactly 6 lines):
   * 1: vehicleNo
   * 2: eWayBillNo
   * 3: customerName
   * 4: dimension
   * 5: rate
   * 6: quantity
   */
  parse(rawText: string): ParseBillResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const lines = extractDataLines(rawText);

    if (lines.length !== 6) {
      errors.push(`Invalid bill data format. Expected 6 lines, got ${lines.length}.`);
      return {
        success: false,
        errors,
        warnings,
      };
    }

    const [vehicleNo, eWayBillNo, customerName, dimension, rateLine, quantityLine] = lines;

    if (!vehicleNo || vehicleNo.trim().length === 0) {
      errors.push('Vehicle number cannot be empty.');
    }

    if (!eWayBillNo || eWayBillNo.trim().length === 0) {
      errors.push('e-Way Bill number cannot be empty.');
    }

    if (!customerName || customerName.trim().length === 0) {
      errors.push('Customer name cannot be empty.');
    }

    if (!dimension || dimension.trim().length === 0) {
      errors.push('Dimension cannot be empty.');
    } else if (!DIMENSION_REGEX.test(dimension.trim())) {
      warnings.push(`Warning: Dimension "${dimension.trim()}" does not match standard pattern (e.g. 8*4).`);
    }

    const rate = parseFloat(rateLine.trim());
    if (isNaN(rate) || rate <= 0) {
      errors.push(`Rate must be a positive number. Got "${rateLine}".`);
    }

    const quantity = parseFloat(quantityLine.trim());
    if (isNaN(quantity) || quantity <= 0) {
      errors.push(`Quantity must be a positive number. Got "${quantityLine}".`);
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        warnings,
      };
    }

    const dto: ParsedBillDto = {
      vehicleNo: vehicleNo.trim(),
      eWayBillNo: eWayBillNo.trim(),
      customerName: customerName.trim(),
      dimension: dimension.trim(),
      rate,
      quantity,
    };

    return {
      success: true,
      dto,
      errors: [],
      warnings,
    };
  }
}
