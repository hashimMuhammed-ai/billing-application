import { Prisma } from '@prisma/client';

export interface BillEntity {
  id: number;
  invoiceNo: string;
  customerId: number;
  vehicleNo: string;
  eWayBillNo: string;
  dimension: string;
  rate: Prisma.Decimal;
  quantity: Prisma.Decimal;
  amount: Prisma.Decimal;
  cgst: Prisma.Decimal;
  sgst: Prisma.Decimal;
  roundOff: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
  status: string;
  pdfUrl: string | null;
  createdAt: Date;
}

export interface ParsedBillDto {
  vehicleNo: string;
  eWayBillNo: string;
  customerName: string;
  dimension: string;
  rate: number;
  quantity: number;
}

export interface ParseBillResult {
  success: boolean;
  dto?: ParsedBillDto;
  errors: string[];
  warnings: string[];
}
