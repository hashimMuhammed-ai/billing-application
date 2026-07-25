import { Injectable } from '@nestjs/common';
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

@Injectable()
export class BillRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tx: Prisma.TransactionClient | undefined, data: CreateBillInput): Promise<Bill> {
    const client = tx || this.prisma;
    return client.bill.create({
      data: {
        invoiceNo: data.invoiceNo,
        customerId: data.customerId,
        vehicleNo: data.vehicleNo,
        eWayBillNo: data.eWayBillNo,
        dimension: data.dimension,
        rate: data.rate,
        quantity: data.quantity,
        amount: data.amount,
        cgst: data.cgst,
        sgst: data.sgst,
        roundOff: data.roundOff,
        grandTotal: data.grandTotal,
        status: data.status ?? 'ACTIVE',
        pdfUrl: data.pdfUrl ?? null,
      },
      include: {
        customer: true,
      },
    });
  }

  async findMostRecent(): Promise<(Bill & { customer: any }) | null> {
    return this.prisma.bill.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: true,
      },
    });
  }

  async findByInvoiceNo(invoiceNo: string): Promise<(Bill & { customer: any }) | null> {
    return this.prisma.bill.findUnique({
      where: { invoiceNo },
      include: {
        customer: true,
      },
    });
  }

  async update(id: number, data: Prisma.BillUpdateInput): Promise<Bill> {
    return this.prisma.bill.update({
      where: { id },
      data,
      include: {
        customer: true,
      },
    });
  }

  async findBillsByDateRange(startDate: Date, endDate: Date): Promise<Bill[]> {
    return this.prisma.bill.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
