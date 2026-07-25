import { Controller, Post, Patch, Get, Body, Query, BadRequestException } from '@nestjs/common';
import { BillParser } from './parsers/bill.parser';
import { CreateBillUseCase } from './application/create-bill.usecase';
import { EditLastBillUseCase } from './application/edit-last-bill.usecase';
import type { EditLastBillDto } from './application/edit-last-bill.usecase';
import { CancelBillUseCase } from './application/cancel-bill.usecase';
import { MonthlySummaryUseCase } from './application/monthly-summary.usecase';
import type { ParsedBillDto } from './domain/bill.entity';

@Controller('bills')
export class BillingController {
  constructor(
    private readonly billParser: BillParser,
    private readonly createBillUseCase: CreateBillUseCase,
    private readonly editLastBillUseCase: EditLastBillUseCase,
    private readonly cancelBillUseCase: CancelBillUseCase,
    private readonly monthlySummaryUseCase: MonthlySummaryUseCase,
  ) {}

  @Post('parse-and-create')
  async parseAndCreate(@Body('rawText') rawText: string) {
    if (!rawText) {
      throw new BadRequestException('Field "rawText" is required.');
    }

    const parseResult = this.billParser.parse(rawText);
    if (!parseResult.success || !parseResult.dto) {
      throw new BadRequestException({
        message: 'Bill parsing failed',
        errors: parseResult.errors,
      });
    }

    const bill = await this.createBillUseCase.execute(parseResult.dto);
    return {
      bill,
      warnings: parseResult.warnings,
    };
  }

  @Post()
  async create(@Body() dto: ParsedBillDto) {
    return this.createBillUseCase.execute(dto);
  }

  @Patch('edit-last')
  async editLast(@Body() dto: EditLastBillDto) {
    return this.editLastBillUseCase.execute(dto);
  }

  @Post('cancel')
  async cancel(@Body('invoiceNo') invoiceNo: string) {
    return this.cancelBillUseCase.execute(invoiceNo);
  }

  @Get('summary')
  async getSummary(
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    let targetDate = new Date();
    if (yearStr && monthStr) {
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // 1-indexed query -> 0-indexed JS month
      if (!isNaN(year) && !isNaN(month)) {
        targetDate = new Date(year, month, 15);
      }
    }

    return this.monthlySummaryUseCase.execute(targetDate);
  }
}
