import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CustomerModule } from '../customer/customer.module';
import { CompanyModule } from '../company/company.module';
import { BillRepository } from './infrastructure/bill.repository';
import { BillParser } from './parsers/bill.parser';
import { GstCalculatorService } from './services/gst-calculator.service';
import { InvoiceNumberingService } from './services/invoice-numbering.service';
import { CreateBillUseCase } from './application/create-bill.usecase';
import { EditLastBillUseCase } from './application/edit-last-bill.usecase';
import { CancelBillUseCase } from './application/cancel-bill.usecase';
import { MonthlySummaryUseCase } from './application/monthly-summary.usecase';
import { BillingController } from './billing.controller';

import { PdfModule } from '../pdf/pdf.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, CustomerModule, CompanyModule, PdfModule, StorageModule],
  controllers: [BillingController],
  providers: [
    BillRepository,
    BillParser,
    GstCalculatorService,
    InvoiceNumberingService,
    CreateBillUseCase,
    EditLastBillUseCase,
    CancelBillUseCase,
    MonthlySummaryUseCase,
  ],
  exports: [
    BillRepository,
    BillParser,
    GstCalculatorService,
    InvoiceNumberingService,
    CreateBillUseCase,
    EditLastBillUseCase,
    CancelBillUseCase,
    MonthlySummaryUseCase,
  ],
})
export class BillingModule {}
