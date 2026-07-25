import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import type { CreateCustomerDto } from './domain/customer.entity';
import { AddCustomerParser } from './parsers/addcustomer.parser';
import { CreateCustomerUseCase } from './application/create-customer.usecase';
import { FindCustomerUseCase } from './application/find-customer.usecase';
import { ListCustomersUseCase } from './application/list-customers.usecase';

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly addCustomerParser: AddCustomerParser,
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly findCustomerUseCase: FindCustomerUseCase,
    private readonly listCustomersUseCase: ListCustomersUseCase,
  ) {}

  @Post('parse-and-create')
  async parseAndCreate(@Body('rawText') rawText: string) {
    if (!rawText) {
      throw new BadRequestException('Field "rawText" is required.');
    }

    const parseResult = this.addCustomerParser.parse(rawText);
    if (!parseResult.success || !parseResult.dto) {
      throw new BadRequestException({
        message: 'Customer text parsing failed',
        errors: parseResult.errors,
      });
    }

    const customer = await this.createCustomerUseCase.execute(parseResult.dto);
    return {
      customer,
      warnings: parseResult.warnings,
    };
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    if (!dto.name || !dto.address || !dto.state) {
      throw new BadRequestException('Name, address, and state are required fields.');
    }
    return this.createCustomerUseCase.execute(dto);
  }

  @Get()
  async findAll() {
    return this.listCustomersUseCase.execute();
  }

  @Get('find')
  async findByName(@Query('name') name: string) {
    if (!name) {
      throw new BadRequestException('Query parameter "name" is required.');
    }
    return this.findCustomerUseCase.execute(name);
  }
}
