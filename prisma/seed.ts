import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

async function main() {
  const existing = await prisma.company.findFirst();
  if (!existing) {
    const company = await prisma.company.create({
      data: DEFAULT_COMPANY,
    });
    console.log('Seeded Company record:', company);
  } else {
    console.log('Company record already exists:', existing);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
