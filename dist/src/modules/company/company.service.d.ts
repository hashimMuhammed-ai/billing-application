import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Company } from '@prisma/client';
export declare const DEFAULT_COMPANY: {
    name: string;
    address: string;
    phone: string;
    gstin: string;
    hsnCode: string;
    gstRate: number;
    bankName: string;
    branch: string;
    ifsc: string;
    accountNo: string;
    lastInvoiceSeq: number;
    currentFY: string;
};
export declare class CompanyService implements OnModuleInit {
    private readonly prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    getCompany(): Promise<Company>;
    ensureCompanySeeded(): Promise<Company>;
}
