"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillParser = void 0;
const common_1 = require("@nestjs/common");
const text_utils_1 = require("../../../shared/utils/text.utils");
const DIMENSION_REGEX = /^\d+(\.\d+)?\s*\*\s*\d+(\.\d+)?$/;
let BillParser = class BillParser {
    parse(rawText) {
        const errors = [];
        const warnings = [];
        const lines = (0, text_utils_1.extractDataLines)(rawText);
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
        }
        else if (!DIMENSION_REGEX.test(dimension.trim())) {
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
        const dto = {
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
};
exports.BillParser = BillParser;
exports.BillParser = BillParser = __decorate([
    (0, common_1.Injectable)()
], BillParser);
//# sourceMappingURL=bill.parser.js.map