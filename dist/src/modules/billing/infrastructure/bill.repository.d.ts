import { PrismaService } from '../../../prisma/prisma.service';
import { Bill, Prisma } from '@prisma/client';
export interface CreateBillInput {
    invoiceNo: string;
    customerId: number;
    vehicleNo: string;
    eWayBillNo: string;
    dimension: string;
    rate: Prisma.Decimal | number;
    quantity: Prisma.Decimal | number;
    amount: Prisma.Decimal | number;
    cgst: Prisma.Decimal | number;
    sgst: Prisma.Decimal | number;
    roundOff: Prisma.Decimal | number;
    grandTotal: Prisma.Decimal | number;
    status?: string;
    pdfUrl?: string | null;
}
export declare class BillRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tx: Prisma.TransactionClient | undefined, data: CreateBillInput): Promise<Bill>;
    findMostRecent(): Promise<(Bill & {
        customer: any;
    }) | null>;
    findByInvoiceNo(invoiceNo: string): Promise<(Bill & {
        customer: any;
    }) | null>;
    update(id: number, data: Prisma.BillUpdateInput): Promise<Bill>;
    findBillsByDateRange(startDate: Date, endDate: Date): Promise<Bill[]>;
}
