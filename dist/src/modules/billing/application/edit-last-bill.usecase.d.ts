import { BillRepository } from '../infrastructure/bill.repository';
import { CompanyService } from '../../company/company.service';
import { GstCalculatorService } from '../services/gst-calculator.service';
import { Bill } from '@prisma/client';
import { PdfGeneratorService } from '../../pdf/pdf-generator.service';
import { R2StorageService } from '../../storage/r2-storage.service';
export interface EditLastBillDto {
    rate?: number;
    quantity?: number;
}
export declare class EditLastBillUseCase {
    private readonly billRepository;
    private readonly companyService;
    private readonly gstCalculatorService;
    private readonly pdfGeneratorService;
    private readonly r2StorageService;
    private readonly logger;
    constructor(billRepository: BillRepository, companyService: CompanyService, gstCalculatorService: GstCalculatorService, pdfGeneratorService: PdfGeneratorService, r2StorageService: R2StorageService);
    execute(dto: EditLastBillDto): Promise<Bill>;
}
