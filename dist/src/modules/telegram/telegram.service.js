"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
let TelegramService = TelegramService_1 = class TelegramService {
    logger = new common_1.Logger(TelegramService_1.name);
    get botToken() {
        return process.env.TELEGRAM_BOT_TOKEN;
    }
    async sendMessage(chatId, text) {
        const token = this.botToken;
        if (!token) {
            this.logger.warn(`[TelegramService] TELEGRAM_BOT_TOKEN not configured. Message to chat ${chatId} suppressed:\n${text}`);
            return;
        }
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text,
                    parse_mode: 'HTML',
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[TelegramService] sendMessage failed (${response.status}): ${errorText}`);
            }
        }
        catch (err) {
            this.logger.error(`[TelegramService] sendMessage error: ${err.message}`);
        }
    }
    async sendDocument(chatId, documentBuffer, filename, caption) {
        const token = this.botToken;
        if (!token) {
            this.logger.warn(`[TelegramService] TELEGRAM_BOT_TOKEN not configured. Document send to chat ${chatId} suppressed.`);
            return;
        }
        const url = `https://api.telegram.org/bot${token}/sendDocument`;
        try {
            const formData = new FormData();
            formData.append('chat_id', String(chatId));
            if (caption) {
                formData.append('caption', caption);
            }
            const blob = new Blob([new Uint8Array(documentBuffer)], { type: 'application/pdf' });
            formData.append('document', blob, filename);
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[TelegramService] sendDocument failed (${response.status}): ${errorText}`);
            }
        }
        catch (err) {
            this.logger.error(`[TelegramService] sendDocument error: ${err.message}`);
        }
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)()
], TelegramService);
//# sourceMappingURL=telegram.service.js.map