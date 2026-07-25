import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { MessageRouterService } from './message-router.service';
import { TelegramService } from './telegram.service';
import { TelegramHandlerService } from './telegram-handler.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CompanyModule } from '../company/company.module';
import { CustomerModule } from '../customer/customer.module';
import { BillingModule } from '../billing/billing.module';
import { PdfModule } from '../pdf/pdf.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    CompanyModule,
    CustomerModule,
    BillingModule,
    PdfModule,
    StorageModule,
  ],
  controllers: [TelegramController],
  providers: [MessageRouterService, TelegramService, TelegramHandlerService],
  exports: [MessageRouterService, TelegramService, TelegramHandlerService],
})
export class TelegramModule {}
