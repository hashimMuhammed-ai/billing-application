"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COMPANY = void 0;
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
exports.DEFAULT_COMPANY = {
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
            data: exports.DEFAULT_COMPANY,
        });
        console.log('Seeded Company record:', company);
    }
    else {
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
//# sourceMappingURL=seed.js.map