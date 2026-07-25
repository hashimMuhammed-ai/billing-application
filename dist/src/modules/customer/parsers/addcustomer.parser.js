"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCustomerParser = void 0;
const common_1 = require("@nestjs/common");
const input_validators_1 = require("../../../shared/validation/input-validators");
const text_utils_1 = require("../../../shared/utils/text.utils");
let AddCustomerParser = class AddCustomerParser {
    parse(rawText) {
        const errors = [];
        const warnings = [];
        const lines = (0, text_utils_1.extractDataLines)(rawText, '/addcustomer');
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
        if (gstin && !(0, input_validators_1.validateGstin)(gstin)) {
            warnings.push(`Warning: GSTIN "${gstin}" does not match standard 15-character GSTIN format.`);
        }
        const dto = {
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
};
exports.AddCustomerParser = AddCustomerParser;
exports.AddCustomerParser = AddCustomerParser = __decorate([
    (0, common_1.Injectable)()
], AddCustomerParser);
//# sourceMappingURL=addcustomer.parser.js.map