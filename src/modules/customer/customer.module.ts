import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CustomerRepository } from './infrastructure/customer.repository';
import { AddCustomerParser } from './parsers/addcustomer.parser';
import { CreateCustomerUseCase } from './application/create-customer.usecase';
import { FindCustomerUseCase } from './application/find-customer.usecase';
import { ListCustomersUseCase } from './application/list-customers.usecase';
import { CustomerController } from './customer.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerController],
  providers: [
    CustomerRepository,
    AddCustomerParser,
    CreateCustomerUseCase,
    FindCustomerUseCase,
    ListCustomersUseCase,
  ],
  exports: [
    CustomerRepository,
    AddCustomerParser,
    CreateCustomerUseCase,
    FindCustomerUseCase,
    ListCustomersUseCase,
  ],
})
export class CustomerModule {}
