import { Injectable, Logger } from '@nestjs/common';
import { MessageRouterService, RouteType, RouteResult } from './message-router.service';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.dto';
import { BillParser } from '../billing/parsers/bill.parser';
import { AddCustomerParser } from '../customer/parsers/addcustomer.parser';
import { FindCustomerUseCase } from '../customer/application/find-customer.usecase';
import { CreateCustomerUseCase } from '../customer/application/create-customer.usecase';
import { CustomerRepository } from '../customer/infrastructure/customer.repository';
import { CompanyService } from '../company/company.service';
import { GstCalculatorService, GstCalculationResult } from '../billing/services/gst-calculator.service';
import { CreateBillUseCase } from '../billing/application/create-bill.usecase';
import { EditLastBillUseCase } from '../billing/application/edit-last-bill.usecase';
import { CancelBillUseCase } from '../billing/application/cancel-bill.usecase';
import { MonthlySummaryUseCase } from '../billing/application/monthly-summary.usecase';
import { PdfGeneratorService } from '../pdf/pdf-generator.service';
import { ParsedBillDto } from '../billing/domain/bill.entity';
import { Customer, Company } from '@prisma/client';

export interface PendingBill {
  chatId: number | string;
  dto: ParsedBillDto;
  customer: Customer;
  gstResult: GstCalculationResult;
  company: Company;
  createdAt: Date;
}

@Injectable()
export class TelegramHandlerService {
  private readonly logger = new Logger(TelegramHandlerService.name);
  private readonly pendingBills = new Map<string | number, PendingBill>();

  constructor(
    private readonly messageRouterService: MessageRouterService,
    private readonly telegramService: TelegramService,
    private readonly billParser: BillParser,
    private readonly addCustomerParser: AddCustomerParser,
    private readonly findCustomerUseCase: FindCustomerUseCase,
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly customerRepository: CustomerRepository,
    private readonly companyService: CompanyService,
    private readonly gstCalculatorService: GstCalculatorService,
    private readonly createBillUseCase: CreateBillUseCase,
    private readonly editLastBillUseCase: EditLastBillUseCase,
    private readonly cancelBillUseCase: CancelBillUseCase,
    private readonly monthlySummaryUseCase: MonthlySummaryUseCase,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  getPendingBill(chatId: string | number): PendingBill | undefined {
    return this.pendingBills.get(chatId);
  }

  async handleUpdate(update: TelegramUpdate): Promise<{ status: string; route?: RouteResult }> {
    const message = update?.message || update?.edited_message;
    if (!message || !message.text) {
      return { status: 'ok' };
    }

    const chatId = message.chat.id;
    const text = message.text;
    const routeResult = this.messageRouterService.route(text);

    try {
      switch (routeResult.type) {
        case RouteType.BILL_CREATE:
          await this.handleBillCreate(chatId, text);
          break;

        case RouteType.CONFIRM:
          await this.handleConfirm(chatId);
          break;

        case RouteType.REJECT:
          await this.handleReject(chatId);
          break;

        case RouteType.ADD_CUSTOMER:
          await this.handleAddCustomer(chatId, routeResult.params?.customerPayload || text);
          break;

        case RouteType.EDIT_LAST:
          await this.handleEditLast(chatId, text);
          break;

        case RouteType.CANCEL_BILL:
          await this.handleCancelBill(chatId, routeResult.params?.invoiceNo);
          break;

        case RouteType.SUMMARY:
          await this.handleSummary(chatId);
          break;

        case RouteType.CUSTOMERS:
          await this.handleCustomers(chatId);
          break;

        case RouteType.FIND_CUSTOMER:
          await this.handleFindCustomer(chatId, routeResult.params?.query);
          break;

        case RouteType.UNKNOWN:
        default:
          await this.telegramService.sendMessage(
            chatId,
            routeResult.errorMessage || 'Message format not recognized.',
          );
          break;
      }
    } catch (err) {
      this.logger.error(`Error handling update for chat ${chatId}: ${(err as Error).message}`, (err as Error).stack);
      await this.telegramService.sendMessage(
        chatId,
        `⚠️ <b>Error:</b> ${(err as Error).message || 'An unexpected error occurred.'}`,
      );
    }

    return { status: 'ok', route: routeResult };
  }

  private async handleBillCreate(chatId: string | number, text: string): Promise<void> {
    const parseResult = this.billParser.parse(text);

    if (!parseResult.success || !parseResult.dto) {
      const errorMsg = parseResult.errors.join('\n');
      await this.telegramService.sendMessage(
        chatId,
        `⚠️ <b>Bill Format Error:</b>\n\n${errorMsg}`,
      );
      return;
    }

    const parsedDto = parseResult.dto;
    const findResult = await this.findCustomerUseCase.execute(parsedDto.customerName);

    if (findResult.status === 'NO_MATCH') {
      await this.telegramService.sendMessage(
        chatId,
        `⚠️ Customer "<b>${parsedDto.customerName}</b>" not found.\n\nPlease register the customer first using <b>/addcustomer</b>.`,
      );
      return;
    }

    if (findResult.status === 'MULTIPLE_MATCHES') {
      const customerList = findResult.customers
        .map((c) => `• <b>${c.name}</b> (${c.address})`)
        .join('\n');
      await this.telegramService.sendMessage(
        chatId,
        `⚠️ Multiple customers match "<b>${parsedDto.customerName}</b>". Please specify the exact name:\n\n${customerList}`,
      );
      return;
    }

    const customer = findResult.customers[0];
    const company = await this.companyService.getCompany();
    const gstResult = this.gstCalculatorService.calculate(parsedDto.rate, parsedDto.quantity, company.gstRate);

    const pendingBill: PendingBill = {
      chatId,
      dto: parsedDto,
      customer,
      gstResult,
      company,
      createdAt: new Date(),
    };

    this.pendingBills.set(chatId, pendingBill);

    const halfRate = (Number(company.gstRate) / 2).toFixed(1);
    let summaryText =
      `<b>📋 Bill Summary (Pending Confirmation)</b>\n\n` +
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

  private async handleConfirm(chatId: string | number): Promise<void> {
    const pending = this.pendingBills.get(chatId);
    if (!pending) {
      await this.telegramService.sendMessage(chatId, '⚠️ No pending bill found to confirm.');
      return;
    }

    this.pendingBills.delete(chatId);

    const { dto, customer, company } = pending;
    const createdBill = await this.createBillUseCase.execute(dto);

    const confirmMsg =
      `✅ Invoice <b>${createdBill.invoiceNo}</b> created successfully!\n\n` +
      `<b>Grand Total:</b> ₹${Number(createdBill.grandTotal).toFixed(2)}`;
    await this.telegramService.sendMessage(chatId, confirmMsg);

    try {
      const pdfBuffer = await this.pdfGeneratorService.generatePdf({
        company,
        customer,
        bill: createdBill,
      });

      const safeFilename = `${createdBill.invoiceNo.replace(/\//g, '_')}.pdf`;
      await this.telegramService.sendDocument(
        chatId,
        pdfBuffer,
        safeFilename,
        `Invoice ${createdBill.invoiceNo}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send PDF attachment for bill ${createdBill.invoiceNo}: ${(err as Error).message}`,
      );
    }
  }

  private async handleReject(chatId: string | number): Promise<void> {
    const pending = this.pendingBills.get(chatId);
    if (!pending) {
      await this.telegramService.sendMessage(chatId, '⚠️ No pending bill found to cancel.');
      return;
    }

    this.pendingBills.delete(chatId);
    await this.telegramService.sendMessage(chatId, '❌ Pending bill creation discarded.');
  }

  private async handleAddCustomer(chatId: string | number, payload: string): Promise<void> {
    if (!payload || !payload.includes('\n')) {
      await this.telegramService.sendMessage(
        chatId,
        `⚠️ <b>Usage:</b>\n/addcustomer\nCustomer Name\nAddress\nGSTIN\nState\nPhone`,
      );
      return;
    }

    const parseResult = this.addCustomerParser.parse(payload);
    if (!parseResult.success || !parseResult.dto) {
      const errorMsg = parseResult.errors.join('\n');
      await this.telegramService.sendMessage(
        chatId,
        `⚠️ <b>Add Customer Error:</b>\n\n${errorMsg}`,
      );
      return;
    }

    const dto = parseResult.dto;
    const customer = await this.createCustomerUseCase.execute(dto);

    await this.telegramService.sendMessage(
      chatId,
      `✅ Customer <b>${customer.name}</b> registered successfully!\n` +
        `<b>Address:</b> ${customer.address}\n` +
        `<b>State:</b> ${customer.state}` +
        (customer.gstin ? `\n<b>GSTIN:</b> ${customer.gstin}` : ''),
    );
  }

  private async handleEditLast(chatId: string | number, text: string): Promise<void> {
    // Extract numbers from message if passed: e.g. /editlast 15.00 1200 or lines
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    let rate: number | undefined;
    let quantity: number | undefined;

    const remainingText = text.replace(/^\/editlast/i, '').trim();
    if (remainingText) {
      const numbers = remainingText.match(/\d+(\.\d+)?/g)?.map(Number);
      if (numbers && numbers.length >= 2) {
        rate = numbers[0];
        quantity = numbers[1];
      } else if (numbers && numbers.length === 1) {
        // If only 1 number passed, we determine if user meant rate or quantity based on decimal/context or pass as rate
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

    const confirmMsg =
      `✏️ Invoice <b>${updatedBill.invoiceNo}</b> revised successfully!\n\n` +
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
      await this.telegramService.sendDocument(
        chatId,
        pdfBuffer,
        safeFilename,
        `Revised Invoice ${updatedBill.invoiceNo}`,
      );
    } catch (err) {
      this.logger.error(`Failed to send revised PDF for ${updatedBill.invoiceNo}: ${(err as Error).message}`);
    }
  }

  private async handleCancelBill(chatId: string | number, invoiceNo?: string): Promise<void> {
    if (!invoiceNo) {
      await this.telegramService.sendMessage(
        chatId,
        `⚠️ <b>Usage:</b> /cancel <invoiceNo>\nExample: <code>/cancel AMT/2026-27/001</code>`,
      );
      return;
    }

    const cancelledBill = await this.cancelBillUseCase.execute(invoiceNo);
    await this.telegramService.sendMessage(
      chatId,
      `🚫 Invoice <b>${cancelledBill.invoiceNo}</b> has been marked as <b>CANCELLED</b>.`,
    );
  }

  private async handleSummary(chatId: string | number): Promise<void> {
    const summary = await this.monthlySummaryUseCase.execute();

    const summaryText =
      `<b>📊 Monthly Billing Summary (${summary.month})</b>\n\n` +
      `<b>Active Bills:</b> ${summary.billCount}\n` +
      `<b>Cancelled Bills:</b> ${summary.cancelledCount}\n` +
      `<b>Total Sales:</b> ₹${summary.totalSales.toFixed(2)}\n` +
      `<b>CGST Collected:</b> ₹${summary.totalCgst.toFixed(2)}\n` +
      `<b>SGST Collected:</b> ₹${summary.totalSgst.toFixed(2)}\n` +
      `<b>Total GST:</b> ₹${summary.totalGst.toFixed(2)}`;

    await this.telegramService.sendMessage(chatId, summaryText);
  }

  private async handleCustomers(chatId: string | number): Promise<void> {
    const customers = await this.customerRepository.findAll();

    if (customers.length === 0) {
      await this.telegramService.sendMessage(
        chatId,
        `👥 No customers registered yet. Use <b>/addcustomer</b> to add one.`,
      );
      return;
    }

    const listText = customers
      .map((c) => `• <b>${c.name}</b> — ${c.address}, ${c.state}${c.gstin ? ` (GSTIN: ${c.gstin})` : ''}`)
      .join('\n');

    await this.telegramService.sendMessage(
      chatId,
      `<b>👥 Registered Customers (${customers.length})</b>\n\n${listText}`,
    );
  }

  private async handleFindCustomer(chatId: string | number, query?: string): Promise<void> {
    if (!query) {
      await this.telegramService.sendMessage(
        chatId,
        `⚠️ <b>Usage:</b> /find <name>\nExample: <code>/find Moreland</code>`,
      );
      return;
    }

    const result = await this.findCustomerUseCase.execute(query);

    if (result.status === 'NO_MATCH') {
      await this.telegramService.sendMessage(
        chatId,
        `🔍 No customers found matching "<b>${query}</b>".`,
      );
      return;
    }

    const listText = result.customers
      .map((c) => `• <b>${c.name}</b> — ${c.address}, ${c.state}${c.phone ? ` (Phone: ${c.phone})` : ''}`)
      .join('\n');

    await this.telegramService.sendMessage(
      chatId,
      `<b>🔍 Search Results for "${query}" (${result.matchCount}):</b>\n\n${listText}`,
    );
  }
}
