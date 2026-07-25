"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GSTIN_REGEX = void 0;
exports.validateGstin = validateGstin;
exports.GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
function validateGstin(gstin) {
    if (!gstin)
        return false;
    return exports.GSTIN_REGEX.test(gstin.trim());
}
//# sourceMappingURL=input-validators.js.map