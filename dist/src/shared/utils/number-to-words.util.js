"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberToWordsIndian = numberToWordsIndian;
function convertLessThanThousand(n) {
    if (n === 0)
        return '';
    const units = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];
    let str = '';
    if (n >= 100) {
        str += units[Math.floor(n / 100)] + ' Hundred';
        n %= 100;
        if (n > 0)
            str += ' ';
    }
    if (n >= 20) {
        str += tens[Math.floor(n / 10)];
        if (n % 10 > 0) {
            str += ' ' + units[n % 10];
        }
    }
    else if (n > 0) {
        str += units[n];
    }
    return str;
}
function numberToWordsIndian(num) {
    const amount = typeof num === 'number' ? num : parseFloat(num);
    if (isNaN(amount) || amount === 0)
        return 'Zero';
    const absoluteAmount = Math.abs(amount);
    const rupees = Math.floor(absoluteAmount);
    const paise = Math.round((absoluteAmount - rupees) * 100);
    let rem = rupees;
    const crore = Math.floor(rem / 10000000);
    rem %= 10000000;
    const lakh = Math.floor(rem / 100000);
    rem %= 100000;
    const thousand = Math.floor(rem / 1000);
    const remainder = rem % 1000;
    const parts = [];
    if (crore > 0) {
        parts.push(`${convertLessThanThousand(crore)} Crore`);
    }
    if (lakh > 0) {
        parts.push(`${convertLessThanThousand(lakh)} Lakh`);
    }
    if (thousand > 0) {
        parts.push(`${convertLessThanThousand(thousand)} Thousand`);
    }
    if (remainder > 0) {
        parts.push(convertLessThanThousand(remainder));
    }
    const rupeesInWords = parts.length > 0 ? parts.join(' ') : 'Zero';
    let result = rupeesInWords;
    if (paise > 0) {
        const paiseInWords = convertLessThanThousand(paise);
        if (rupees > 0) {
            result += ` and ${paiseInWords} Paise`;
        }
        else {
            result = `${paiseInWords} Paise`;
        }
    }
    return result.trim();
}
//# sourceMappingURL=number-to-words.util.js.map