import { PrismaService } from '../../../prisma/prisma.service';
import { FindCustomerUseCase } from '../../customer/application/find-customer.usecase';
import { CompanyService } from '../../company/company.service';
import { GstCalculatorService } from '../services/gst-calculator.service';
import { InvoiceNumberingService } from '../services/invoice-numbering.service';
import { BillRepository } from '../infrastructure/bill.repository';
import { ParsedBillDto } from '../domain/bill.entity';
import { Bill } from '@prisma/client';
import { PdfGeneratorService } from '../../pdf/pdf-generator.service';
import { R2StorageService } from '../../storage/r2-storage.service';
export declare class CreateBillUseCase {
    private readonly prisma;
    private readonly findCustomerUseCase;
    private readonly companyService;
    private readonly gstCalculatorService;
    private readonly invoiceNumberingService;
    private readonly billRepository;
    private readonly pdfGeneratorService;
    private readonly r2StorageService;
    private readonly logger;
    constructor(prisma: PrismaService, findCustomerUseCase: FindCustomerUseCase, companyService: CompanyService, gstCalculatorService: GstCalculatorService, invoiceNumberingService: InvoiceNumberingService, billRepository: BillRepository, pdfGeneratorService: PdfGeneratorService, r2StorageService: R2StorageService);
    execute(dto: ParsedBillDto): Promise<Bill>;
}
