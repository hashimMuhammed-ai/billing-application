"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramModule = void 0;
const common_1 = require("@nestjs/common");
const telegram_controller_1 = require("./telegram.controller");
const message_router_service_1 = require("./message-router.service");
const telegram_service_1 = require("./telegram.service");
const telegram_handler_service_1 = require("./telegram-handler.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const company_module_1 = require("../company/company.module");
const customer_module_1 = require("../customer/customer.module");
const billing_module_1 = require("../billing/billing.module");
const pdf_module_1 = require("../pdf/pdf.module");
const storage_module_1 = require("../storage/storage.module");
let TelegramModule = class TelegramModule {
};
exports.TelegramModule = TelegramModule;
exports.TelegramModule = TelegramModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            company_module_1.CompanyModule,
            customer_module_1.CustomerModule,
            billing_module_1.BillingModule,
            pdf_module_1.PdfModule,
            storage_module_1.StorageModule,
        ],
        controllers: [telegram_controller_1.TelegramController],
        providers: [message_router_service_1.MessageRouterService, telegram_service_1.TelegramService, telegram_handler_service_1.TelegramHandlerService],
        exports: [message_router_service_1.MessageRouterService, telegram_service_1.TelegramService, telegram_handler_service_1.TelegramHandlerService],
    })
], TelegramModule);
//# sourceMappingURL=telegram.module.js.map