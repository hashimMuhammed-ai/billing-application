"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramHandlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramHandlerService = void 0;
const common_1 = require("@nestjs/common");
const message_router_service_1 = require("./message-router.service");
const telegram_service_1 = require("./telegram.service");
const bill_parser_1 = require("../billing/parsers/bill.parser");
const addcustomer_parser_1 = require("../customer/parsers/addcustomer.parser");
const find_customer_usecase_1 = require("../customer/application/find-customer.usecase");
const create_customer_usecase_1 = require("../customer/application/create-customer.usecase");
const customer_repository_1 = require("../customer/infrastructure/customer.repository");
const company_service_1 = require("../company/company.service");
const gst_calculator_service_1 = require("../billing/services/gst-calculator.service");
const create_bill_usecase_1 = require("../billing/application/create-bill.usecase");
const edit_last_bill_usecase_1 = require("../billing/application/edit-last-bill.usecase");
const cancel_bill_usecase_1 = require("../billing/application/cancel-bill.usecase");
const monthly_summary_usecase_1 = require("../billing/application/monthly-summary.usecase");
const pdf_generator_service_1 = require("../pdf/pdf-generator.service");
let TelegramHandlerService = TelegramHandlerService_1 = class TelegramHandlerService {
    messageRouterService;
    telegramService;
    billParser;
    addCustomerParser;
    findCustomerUseCase;
    createCustomerUseCase;
    customerRepository;
    companyService;
    gstCalculatorService;
    createBillUseCase;
    editLastBillUseCase;
    cancelBillUseCase;
    monthlySummaryUseCase;
    pdfGeneratorService;
    logger = new common_1.Logger(TelegramHandlerService_1.name);
    pendingBills = new Map();
    constructor(messageRouterService, telegramService, billParser, addCustomerParser, findCustomerUseCase, createCustomerUseCase, customerRepository, companyService, gstCalculatorService, createBillUseCase, editLastBillUseCase, cancelBillUseCase, monthlySummaryUseCase, pdfGeneratorService) {
        this.messageRouterService = messageRouterService;
        this.telegramService = telegramService;
        this.billParser = billParser;
        this.addCustomerParser = addCustomerParser;
        this.findCustomerUseCase = findCustomerUseCase;
        this.createCustomerUseCase = createCustomerUseCase;
        this.customerRepository = customerRepository;
        this.companyService = companyService;
        this.gstCalculatorService = gstCalculatorService;
        this.createBillUseCase = createBillUseCase;
        this.editLastBillUseCase = editLastBillUseCase;
        this.cancelBillUseCase = cancelBillUseCase;
        this.monthlySummaryUseCase = monthlySummaryUseCase;
        this.pdfGeneratorService = pdfGeneratorService;
    }
    getPendingBill(chatId) {
        return this.pendingBills.get(chatId);
    }
    async handleUpdate(update) {
        const message = update?.message || update?.edited_message;
        if (!message || !message.text) {
            return { status: 'ok' };
        }
        const chatId = message.chat.id;
        const text = message.text;
        const routeResult = this.messageRouterService.route(text);
        try {
            switch (routeResult.type) {
                case message_router_service_1.RouteType.BILL_CREATE:
                    await this.handleBillCreate(chatId, text);
                    break;
                case message_router_service_1.RouteType.CONFIRM:
                    await this.handleConfirm(chatId);
                    break;
                case message_router_service_1.RouteType.REJECT:
                    await this.handleReject(chatId);
                    break;
                case message_router_service_1.RouteType.ADD_CUSTOMER:
                    await this.handleAddCustomer(chatId, routeResult.params?.customerPayload || text);
                    break;
                case message_router_service_1.RouteType.EDIT_LAST:
                    await this.handleEditLast(chatId, text);
                    break;
                case message_router_service_1.RouteType.CANCEL_BILL:
                    await this.handleCancelBill(chatId, routeResult.params?.invoiceNo);
                    break;
                case message_router_service_1.RouteType.SUMMARY:
                    await this.handleSummary(chatId);
                    break;
                case message_router_service_1.RouteType.CUSTOMERS:
                    await this.handleCustomers(chatId);
                    break;
                case message_router_service_1.RouteType.FIND_CUSTOMER:
                    await this.handleFindCustomer(chatId, routeResult.params?.query);
                    break;
                case message_router_service_1.RouteType.UNKNOWN:
                default:
                    await this.telegramService.sendMessage(chatId, routeResult.errorMessage || 'Message format not recognized.');
                    break;
            }
        }
        catch (err) {
            this.logger.error(`Error handling update for chat ${chatId}: ${err.message}`, err.stack);
            await this.telegramService.sendMessage(chatId, `⚠️ <b>Error:</b> ${err.message || 'An unexpected error occurred.'}`);
        }
        return { status: 'ok', route: routeResult };
    }
    async handleBillCreate(chatId, text) {
        const parseResult = this.billParser.parse(text);
        if (!parseResult.success || !parseResult.dto) {
            const errorMsg = parseResult.errors.join('\n');
            await this.telegramService.sendMessage(chatId, `⚠️ <b>Bill Format Error:</b>\n\n${errorMsg}`);
            return;
        }
        const parsedDto = parseResult.dto;
        const findResult = await this.findCustomerUseCase.execute(parsedDto.customerName);
        if (findResult.status === 'NO_MATCH') {
            await this.telegramService.sendMessage(chatId, `⚠️ Customer "<b>${parsedDto.customerName}</b>" not found.\n\nPlease register the customer first using <b>/addcustomer</b>.`);
            return;
        }
        if (findResult.status === 'MULTIPLE_MATCHES') {
            const customerList = findResult.customers
                .map((c) => `• <b>${c.name}</b> (${c.address})`)
                .join('\n');
            await this.telegramService.sendMessage(chatId, `⚠️ Multiple customers match "<b>${parsedDto.customerName}</b>". Please specify the exact name:\n\n${customerList}`);
            return;
        }
        const customer = findResult.customers[0];
        const company = await this.companyService.getCompany();
        const gstResult = this.gstCalculatorService.calculate(parsedDto.rate, parsedDto.quantity, company.gstRate);
        const pendingBill = {
            chatId,
            dto: parsedDto,
            customer,
            gstResult,
            company,
            createdAt: new Date(),
        };
        this.pendingBills.set(chatId, pendingBill);
        const halfRate = (Number(company.gstRate) / 2).toFixed(1);
        let summaryText = `<b>📋 Bill Summary (Pending Confirmation)</b>\n\n` +
            `<b>Customer:</b> ${customer.name}\n` +
            `<b>Vehicle No:</b> ${parsedDto.vehicleNo}\n` +
            `<b>E-Way Bill No:</b> ${parsedDto.eWayBillNo}\n` +
            `<b>Dimension:</b> ${parsedDto.dimension}\n` +
            `<b>Rate:</b> ₹${parsedDto.rate.toFixed(2)}\n` +
            `<b>Quantity:</b> ${parsedDto.quantity}\n\n` +
            `<b>Amount:</b> ₹${gstResult.amount.toFixed(2)}\n` +
            `<b>CGST (${halfRate}%):</b> ₹${gstResult.cgst.toFixed(2)}\n` +
            `<b>SGST (${halfRate}%):</b> ₹${gstResult.sgst.toFixed(2)}\n` +
            `<b>Round Off:</b> ₹${gstResult.roundOff.toFixed(2)}\n` +
            `<b>Grand Total:</b> ₹${gstResult.grandTotal.toFixed(2)}\n\n`;
        if (parseResult.warnings && parseResult.warnings.length > 0) {
            summaryText += `⚠️ <i>${parseResult.warnings.join('\n')}</i>\n\n`;
        }
        summaryText += `Reply <b>yes</b> or <b>confirm</b> to generate invoice & send PDF, or <b>no</b> / <b>cancel</b> to discard.`;
        await this.telegramService.sendMessage(chatId, summaryText);
    }
    async handleConfirm(chatId) {
        const pending = this.pendingBills.get(chatId);
        if (!pending) {
            await this.telegramService.sendMessage(chatId, '⚠️ No pending bill found to confirm.');
            return;
        }
        this.pendingBills.delete(chatId);
        const { dto, customer, company } = pending;
        const createdBill = await this.createBillUseCase.execute(dto);
        const confirmMsg = `✅ Invoice <b>${createdBill.invoiceNo}</b> created successfully!\n\n` +
            `<b>Grand Total:</b> ₹${Number(createdBill.grandTotal).toFixed(2)}`;
        await this.telegramService.sendMessage(chatId, confirmMsg);
        try {
            const pdfBuffer = await this.pdfGeneratorService.generatePdf({
                company,
                customer,
                bill: createdBill,
            });
            const safeFilename = `${createdBill.invoiceNo.replace(/\//g, '_')}.pdf`;
            await this.telegramService.sendDocument(chatId, pdfBuffer, safeFilename, `Invoice ${createdBill.invoiceNo}`);
        }
        catch (err) {
            this.logger.error(`Failed to send PDF attachment for bill ${createdBill.invoiceNo}: ${err.message}`);
        }
    }
    async handleReject(chatId) {
        const pending = this.pendingBills.get(chatId);
        if (!pending) {
            await this.telegramService.sendMessage(chatId, '⚠️ No pending bill found to cancel.');
            return;
        }
        this.pendingBills.delete(chatId);
        await this.telegramService.sendMessage(chatId, '❌ Pending bill creation discarded.');
    }
    async handleAddCustomer(chatId, payload) {
        if (!payload || !payload.includes('\n')) {
            await this.telegramService.sendMessage(chatId, `⚠️ <b>Usage:</b>\n/addcustomer\nCustomer Name\nAddress\nGSTIN\nState\nPhone`);
            return;
        }
        const parseResult = this.addCustomerParser.parse(payload);
        if (!parseResult.success || !parseResult.dto) {
            const errorMsg = parseResult.errors.join('\n');
            await this.telegramService.sendMessage(chatId, `⚠️ <b>Add Customer Error:</b>\n\n${errorMsg}`);
            return;
        }
        const dto = parseResult.dto;
        const customer = await this.createCustomerUseCase.execute(dto);
        await this.telegramService.sendMessage(chatId, `✅ Customer <b>${customer.name}</b> registered successfully!\n` +
            `<b>Address:</b> ${customer.address}\n` +
            `<b>State:</b> ${customer.state}` +
            (customer.gstin ? `\n<b>GSTIN:</b> ${customer.gstin}` : ''));
    }
    async handleEditLast(chatId, text) {
        const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
        let rate;
        let quantity;
        const remainingText = text.replace(/^\/editlast/i, '').trim();
        if (remainingText) {
            const numbers = remainingText.match(/\d+(\.\d+)?/g)?.map(Number);
            if (numbers && numbers.length >= 2) {
                rate = numbers[0];
                quantity = numbers[1];
            }
            else if (numbers && numbers.length === 1) {
                rate = numbers[0];
            }
        }
        const updatedBill = await this.editLastBillUseCase.execute({ rate, quantity });
        const company = await this.companyService.getCompany();
        let customer = await this.customerRepository.findById(updatedBill.customerId);
        if (!customer) {
            customer = {
                id: updatedBill.customerId,
                name: 'Customer',
                address: '',
                gstin: null,
                state: 'Kerala',
                phone: null,
                createdAt: new Date(),
            };
        }
        const confirmMsg = `✏️ Invoice <b>${updatedBill.invoiceNo}</b> revised successfully!\n\n` +
            `<b>New Rate:</b> ₹${Number(updatedBill.rate).toFixed(2)}\n` +
            `<b>New Quantity:</b> ${updatedBill.quantity}\n` +
            `<b>New Grand Total:</b> ₹${Number(updatedBill.grandTotal).toFixed(2)}`;
        await this.telegramService.sendMessage(chatId, confirmMsg);
        try {
            const pdfBuffer = await this.pdfGeneratorService.generatePdf({
                company,
                customer,
                bill: updatedBill,
            });
            const safeFilename = `${updatedBill.invoiceNo.replace(/\//g, '_')}_REVISED.pdf`;
            await this.telegramService.sendDocument(chatId, pdfBuffer, safeFilename, `Revised Invoice ${updatedBill.invoiceNo}`);
        }
        catch (err) {
            this.logger.error(`Failed to send revised PDF for ${updatedBill.invoiceNo}: ${err.message}`);
        }
    }
    async handleCancelBill(chatId, invoiceNo) {
        if (!invoiceNo) {
            await this.telegramService.sendMessage(chatId, `⚠️ <b>Usage:</b> /cancel <invoiceNo>\nExample: <code>/cancel AMT/2026-27/001</code>`);
            return;
        }
        const cancelledBill = await this.cancelBillUseCase.execute(invoiceNo);
        await this.telegramService.sendMessage(chatId, `🚫 Invoice <b>${cancelledBill.invoiceNo}</b> has been marked as <b>CANCELLED</b>.`);
    }
    async handleSummary(chatId) {
        const summary = await this.monthlySummaryUseCase.execute();
        const summaryText = `<b>📊 Monthly Billing Summary (${summary.month})</b>\n\n` +
            `<b>Active Bills:</b> ${summary.billCount}\n` +
            `<b>Cancelled Bills:</b> ${summary.cancelledCount}\n` +
            `<b>Total Sales:</b> ₹${summary.totalSales.toFixed(2)}\n` +
            `<b>CGST Collected:</b> ₹${summary.totalCgst.toFixed(2)}\n` +
            `<b>SGST Collected:</b> ₹${summary.totalSgst.toFixed(2)}\n` +
            `<b>Total GST:</b> ₹${summary.totalGst.toFixed(2)}`;
        await this.telegramService.sendMessage(chatId, summaryText);
    }
    async handleCustomers(chatId) {
        const customers = await this.customerRepository.findAll();
        if (customers.length === 0) {
            await this.telegramService.sendMessage(chatId, `👥 No customers registered yet. Use <b>/addcustomer</b> to add one.`);
            return;
        }
        const listText = customers
            .map((c) => `• <b>${c.name}</b> — ${c.address}, ${c.state}${c.gstin ? ` (GSTIN: ${c.gstin})` : ''}`)
            .join('\n');
        await this.telegramService.sendMessage(chatId, `<b>👥 Registered Customers (${customers.length})</b>\n\n${listText}`);
    }
    async handleFindCustomer(chatId, query) {
        if (!query) {
            await this.telegramService.sendMessage(chatId, `⚠️ <b>Usage:</b> /find <name>\nExample: <code>/find Moreland</code>`);
            return;
        }
        const result = await this.findCustomerUseCase.execute(query);
        if (result.status === 'NO_MATCH') {
            await this.telegramService.sendMessage(chatId, `🔍 No customers found matching "<b>${query}</b>".`);
            return;
        }
        const listText = result.customers
            .map((c) => `• <b>${c.name}</b> — ${c.address}, ${c.state}${c.phone ? ` (Phone: ${c.phone})` : ''}`)
            .join('\n');
        await this.telegramService.sendMessage(chatId, `<b>🔍 Search Results for "${query}" (${result.matchCount}):</b>\n\n${listText}`);
    }
};
exports.TelegramHandlerService = TelegramHandlerService;
exports.TelegramHandlerService = TelegramHandlerService = TelegramHandlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [message_router_service_1.MessageRouterService,
        telegram_service_1.TelegramService,
        bill_parser_1.BillParser,
        addcustomer_parser_1.AddCustomerParser,
        find_customer_usecase_1.FindCustomerUseCase,
        create_customer_usecase_1.CreateCustomerUseCase,
        customer_repository_1.CustomerRepository,
        company_service_1.CompanyService,
        gst_calculator_service_1.GstCalculatorService,
        create_bill_usecase_1.CreateBillUseCase,
        edit_last_bill_usecase_1.EditLastBillUseCase,
        cancel_bill_usecase_1.CancelBillUseCase,
        monthly_summary_usecase_1.MonthlySummaryUseCase,
        pdf_generator_service_1.PdfGeneratorService])
], TelegramHandlerService);
//# sourceMappingURL=telegram-handler.service.js.map