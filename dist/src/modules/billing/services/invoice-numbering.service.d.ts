import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export interface NextInvoiceNumberResult {
    invoiceNo: string;
    seq: number;
    fy: string;
}
export declare class InvoiceNumberingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCurrentFY(date?: Date): string;
    generateNextInvoiceNo(tx?: Prisma.TransactionClient, companyCode?: string, date?: Date): Promise<NextInvoiceNumberResult>;
}
