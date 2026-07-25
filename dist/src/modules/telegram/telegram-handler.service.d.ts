import { MessageRouterService, RouteResult } from './message-router.service';
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
export declare class TelegramHandlerService {
    private readonly messageRouterService;
    private readonly telegramService;
    private readonly billParser;
    private readonly addCustomerParser;
    private readonly findCustomerUseCase;
    private readonly createCustomerUseCase;
    private readonly customerRepository;
    private readonly companyService;
    private readonly gstCalculatorService;
    private readonly createBillUseCase;
    private readonly editLastBillUseCase;
    private readonly cancelBillUseCase;
    private readonly monthlySummaryUseCase;
    private readonly pdfGeneratorService;
    private readonly logger;
    private readonly pendingBills;
    constructor(messageRouterService: MessageRouterService, telegramService: TelegramService, billParser: BillParser, addCustomerParser: AddCustomerParser, findCustomerUseCase: FindCustomerUseCase, createCustomerUseCase: CreateCustomerUseCase, customerRepository: CustomerRepository, companyService: CompanyService, gstCalculatorService: GstCalculatorService, createBillUseCase: CreateBillUseCase, editLastBillUseCase: EditLastBillUseCase, cancelBillUseCase: CancelBillUseCase, monthlySummaryUseCase: MonthlySummaryUseCase, pdfGeneratorService: PdfGeneratorService);
    getPendingBill(chatId: string | number): PendingBill | undefined;
    handleUpdate(update: TelegramUpdate): Promise<{
        status: string;
        route?: RouteResult;
    }>;
    private handleBillCreate;
    private handleConfirm;
    private handleReject;
    private handleAddCustomer;
    private handleEditLast;
    private handleCancelBill;
    private handleSummary;
    private handleCustomers;
    private handleFindCustomer;
}
