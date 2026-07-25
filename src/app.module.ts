import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CompanyModule } from './modules/company/company.module';
import { CustomerModule } from './modules/customer/customer.module';
import { BillingModule } from './modules/billing/billing.module';
import { TelegramModule } from './modules/telegram/telegram.module';

@Module({
  imports: [PrismaModule, CompanyModule, CustomerModule, BillingModule, TelegramModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
