"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouterService = exports.RouteType = void 0;
const common_1 = require("@nestjs/common");
var RouteType;
(function (RouteType) {
    RouteType["BILL_CREATE"] = "BILL_CREATE";
    RouteType["ADD_CUSTOMER"] = "ADD_CUSTOMER";
    RouteType["EDIT_LAST"] = "EDIT_LAST";
    RouteType["CANCEL_BILL"] = "CANCEL_BILL";
    RouteType["SUMMARY"] = "SUMMARY";
    RouteType["CUSTOMERS"] = "CUSTOMERS";
    RouteType["FIND_CUSTOMER"] = "FIND_CUSTOMER";
    RouteType["CONFIRM"] = "CONFIRM";
    RouteType["REJECT"] = "REJECT";
    RouteType["UNKNOWN"] = "UNKNOWN";
})(RouteType || (exports.RouteType = RouteType = {}));
let MessageRouterService = class MessageRouterService {
    route(text) {
        if (!text || typeof text !== 'string') {
            return {
                type: RouteType.UNKNOWN,
                rawText: text || '',
                errorMessage: this.getHelpMessage('Empty or invalid message received.'),
            };
        }
        const trimmedText = text.trim();
        const lowerText = trimmedText.toLowerCase();
        if (['yes', 'y', 'confirm', '/confirm'].includes(lowerText)) {
            return { type: RouteType.CONFIRM, rawText: trimmedText };
        }
        if (['no', 'n', 'reject', '/reject'].includes(lowerText)) {
            return { type: RouteType.REJECT, rawText: trimmedText };
        }
        if (trimmedText.startsWith('/')) {
            const firstLine = trimmedText.split('\n')[0].trim();
            const commandParts = firstLine.split(/\s+/);
            const command = commandParts[0].toLowerCase();
            const firstLineArgs = commandParts.slice(1).join(' ').trim();
            if (command.startsWith('/addcustomer')) {
                const customerPayload = trimmedText.replace(/^\/addcustomer\s*/i, '').trim();
                return {
                    type: RouteType.ADD_CUSTOMER,
                    rawText: trimmedText,
                    params: { customerPayload: customerPayload || undefined },
                };
            }
            if (command === '/editlast') {
                return { type: RouteType.EDIT_LAST, rawText: trimmedText };
            }
            if (command === '/cancel') {
                const invoiceNo = firstLineArgs || trimmedText.split('\n').slice(1).join(' ').trim() || undefined;
                return {
                    type: RouteType.CANCEL_BILL,
                    rawText: trimmedText,
                    params: { invoiceNo },
                };
            }
            if (command === '/summary') {
                return { type: RouteType.SUMMARY, rawText: trimmedText };
            }
            if (command === '/customers') {
                return { type: RouteType.CUSTOMERS, rawText: trimmedText };
            }
            if (command === '/find') {
                const query = firstLineArgs || trimmedText.split('\n').slice(1).join(' ').trim() || undefined;
                return {
                    type: RouteType.FIND_CUSTOMER,
                    rawText: trimmedText,
                    params: { query },
                };
            }
            return {
                type: RouteType.UNKNOWN,
                rawText: trimmedText,
                errorMessage: this.getHelpMessage(`Unknown command '${command}'.`),
            };
        }
        const lines = trimmedText
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        if (lines.length === 6) {
            return {
                type: RouteType.BILL_CREATE,
                rawText: trimmedText,
            };
        }
        return {
            type: RouteType.UNKNOWN,
            rawText: trimmedText,
            errorMessage: this.getHelpMessage(`Expected 6 lines for bill creation, got ${lines.length}.`),
        };
    }
    getHelpMessage(prefix) {
        return (`${prefix}\n\n` +
            `Message format not recognized.\n\n` +
            `To create a bill, send exactly 6 lines:\n` +
            `1. Vehicle No\n` +
            `2. E-Way Bill No\n` +
            `3. Customer Name\n` +
            `4. Dimension (e.g. 8*4)\n` +
            `5. Rate\n` +
            `6. Quantity\n\n` +
            `Or use available commands:\n` +
            `• /addcustomer (followed by 5 customer details lines)\n` +
            `• /editlast\n` +
            `• /cancel <invoiceNo>\n` +
            `• /summary\n` +
            `• /customers\n` +
            `• /find <name>`);
    }
};
exports.MessageRouterService = MessageRouterService;
exports.MessageRouterService = MessageRouterService = __decorate([
    (0, common_1.Injectable)()
], MessageRouterService);
//# sourceMappingURL=message-router.service.js.map