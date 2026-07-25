import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Company } from '@prisma/client';

export const DEFAULT_COMPANY = {
  name: 'A M TRADING',
  address: 'Main Road, Muvattupuzha, Kerala',
  phone: '9847000000',
  gstin: '32AAAAA0000A1Z5',
  hsnCode: '4408',
  gstRate: 18.0,
  bankName: 'Federal Bank',
  branch: 'Muvattupuzha',
  ifsc: 'FDRL0001234',
  accountNo: '12340100012345',
  lastInvoiceSeq: 0,
  currentFY: '2026-27',
};

@Injectable()
export class CompanyService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureCompanySeeded();
    } catch {
      // Allow app startup even if DB is not connected during build/tests
    }
  }

  async getCompany(): Promise<Company> {
    let company = await this.prisma.company.findFirst();
    if (!company) {
      company = await this.ensureCompanySeeded();
    }
    return company;
  }

  async ensureCompanySeeded(): Promise<Company> {
    const existing = await this.prisma.company.findFirst();
    if (existing) {
      return existing;
    }
    return this.prisma.company.create({
      data: DEFAULT_COMPANY,
    });
  }
}
