# Telegram Billing Bot — Project Brief

## 1. Purpose
A Telegram-bot-driven GST billing system for a single company (A M Trading pattern). Staff send fixed-format text messages via Telegram; the bot parses them, calculates GST, generates a PDF invoice matching the company's existing invoice layout, and sends it back in the same chat.

Single tenant. No multi-tenancy. Product is always "Face Veneer" with a variable dimension. Estimated volume: ~3 bills/day.

## 2. Tech Stack
- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **PDF generation:** Puppeteer (HTML → PDF, matched to existing invoice layout)
- **File storage:** Cloudflare R2 (stores generated invoice PDFs; S3-compatible API via AWS SDK v3, same pattern used in TaxAI)
- **Bot platform:** Telegram Bot API (via `node-telegram-bot-api` or raw webhook + `axios`)
- **Hosting (free tier):** Render / Railway for API, Supabase / Neon for Postgres

## 3. Architecture
Clean architecture, modular monolith (NOT microservices — single company, low volume, single developer; microservices would add operational overhead with no corresponding benefit here).

```
src/
  modules/
    telegram/
      telegram.controller.ts       # webhook receiver, routes by message shape
      telegram.service.ts          # sendMessage, sendDocument helpers
      message-router.service.ts    # detects: bill / addcustomer / command
    customer/
      domain/
        customer.entity.ts
      application/
        create-customer.usecase.ts
        find-customer.usecase.ts   # fuzzy match by name
      infrastructure/
        customer.repository.ts
      parsers/
        addcustomer.parser.ts      # fixed 5-line format
    billing/
      domain/
        bill.entity.ts
      application/
        create-bill.usecase.ts
        edit-last-bill.usecase.ts
        cancel-bill.usecase.ts
        monthly-summary.usecase.ts
      infrastructure/
        bill.repository.ts
      parsers/
        bill.parser.ts             # fixed 5-line format
      invoice-numbering.service.ts # FY-based sequential numbering
      gst-calculator.service.ts    # CGST + SGST calculation
    pdf/
      pdf-template.html
      pdf-generator.service.ts     # Puppeteer render
    storage/
      r2-storage.service.ts        # uploads generated PDF to Cloudflare R2, returns URL
    company/
      company.service.ts           # single-row seller config
  shared/
    validation/
      input-validators.ts          # numeric checks, format checks
    interfaces/
      messaging-channel.interface.ts  # future-proofing for WhatsApp swap
```

## 4. Database Schema (Prisma models)

```prisma
model Company {
  id            Int    @id @default(autoincrement())
  name          String
  address       String
  phone         String
  gstin         String
  hsnCode       String
  gstRate       Decimal @default(18)
  bankName      String
  branch        String
  ifsc          String
  accountNo     String
  lastInvoiceSeq Int   @default(0)
  currentFY     String   // e.g. "2026-27"
}
// Money fields below should use @db.Decimal(10, 2) in the actual Prisma
// schema to fix precision (2 decimal places) at the DB level, not just
// in application code.

model Customer {
  id        Int      @id @default(autoincrement())
  name      String
  address   String
  gstin     String?
  state     String
  phone     String?
  createdAt DateTime @default(now())
  bills     Bill[]
}

model Bill {
  id           Int      @id @default(autoincrement())
  invoiceNo    String   @unique
  customerId   Int
  customer     Customer @relation(fields: [customerId], references: [id])
  vehicleNo    String
  eWayBillNo   String
  dimension    String
  rate         Decimal
  quantity     Decimal
  amount       Decimal
  cgst         Decimal
  sgst         Decimal
  roundOff     Decimal
  grandTotal   Decimal
  status       String   @default("ACTIVE") // ACTIVE | CANCELLED | REVISED
  pdfUrl       String?  // Cloudflare R2 URL, set after successful PDF generation + upload
  createdAt    DateTime @default(now())
}
```

No separate `Product` or `BillItem` table — product is fixed (Face Veneer), one line item per bill.

## 5. Telegram Message Formats

### Create bill (6 fixed lines, in order)
```
KL01BJ3019
34AB1234C5678D1E2
Moreland
8*4
14.50
11609.52
```
Line order: `vehicleNo`, `eWayBillNo`, `customerName`, `dimension`, `rate`, `quantity`

### Add customer — `/addcustomer` (5 fixed lines after command)
```
/addcustomer
Moreland Ply&Boards
Manari P.O, Triveni, Muvattupuzha
32ACCFM3093K1Z7
Kerala
9847xxxxxx
```
Line order: `name`, `address`, `gstin`, `state`, `phone`

### Other commands
- `/editlast` — edit the most recently created bill (rate/quantity), regenerate PDF, mark `REVISED`
- `/cancel <invoiceNo>` — mark a bill `CANCELLED` (kept for audit, not deleted)
- `/summary` — reply with current month's total sales, total GST, bill count
- `/customers` — list all registered customer names
- `/find <name>` — show matching customer(s)

## 6. Business Rules

**GST calculation** (CGST + SGST only, no IGST branch needed — confirmed single-state operation). Derive from `company.gstRate` rather than hardcoding, so a future rate change doesn't require a code edit:
```
amount        = rate * quantity
halfRate      = company.gstRate / 2 / 100     // e.g. 18 / 2 / 100 = 0.09
cgst          = amount * halfRate
sgst          = amount * halfRate
totalBeforeRound = amount + cgst + sgst
grandTotal    = round(totalBeforeRound)
roundOff      = grandTotal - totalBeforeRound
```
Verified against the reference invoice: `168338.04 × 0.09 = 15150.42` (CGST/SGST), total before round `198638.88` → grand total `198639.00`, round off `0.12` — matches exactly.

**Invoice numbering** — sequential per financial year (April–March), resets each FY:
```
Format: {COMPANY_CODE}/{FY}/{SEQ}
Example: AMT/2026-27/001
```
`lastInvoiceSeq` and `currentFY` are stored on `Company` and incremented atomically (inside the same DB transaction as bill creation) to avoid duplicate numbers on near-simultaneous bills. When the FY rolls over, reset `lastInvoiceSeq` to 0 before incrementing.

**Customer matching** — case-insensitive partial match (`ILIKE '%name%'`) against `Customer.name`.
- 0 matches → bot replies: customer not found, register with `/addcustomer` first.
- 1 match → auto-select, proceed.
- 2+ matches → bot lists matches (name + address) and asks staff to specify.

**Customer creation** — explicit only, via `/addcustomer`. Never auto-created from a billing message.

**Confirmation step** — before generating a PDF, bot sends a summary (customer, amount, CGST, SGST, grand total) and waits for a confirmation reply before finalizing and sending the document. The parsed-but-unconfirmed bill is held in an **in-memory Map keyed by Telegram chat ID** (simple and sufficient at this volume). Caveat: if the server restarts while a bill is pending confirmation, that pending bill is lost and the staff member needs to resend the original message — acceptable at ~3 bills/day, but worth knowing.

**Message routing** — the router applies these checks in order:
1. Message starts with `/` → route to the matching command handler (`/addcustomer`, `/editlast`, `/cancel`, `/summary`, `/customers`, `/find`, or a confirmation reply like `yes`/`confirm`).
2. Otherwise, expect exactly 6 lines → route to the bill parser.
3. Anything else → reject with a "message not recognized" error listing the valid formats.

**PDF storage (Cloudflare R2)** — after a bill is confirmed and the PDF is generated:
1. Upload the PDF buffer to R2 under a predictable key, e.g. `bills/{invoiceNo}.pdf`.
2. Save the returned R2 URL to `Bill.pdfUrl`.
3. Send the same PDF buffer to Telegram via `sendDocument` — the R2 upload and the Telegram send both happen from the one generated buffer, not two separate renders.
4. If the R2 upload fails, still send the PDF to Telegram (don't block delivery on storage) but log the failure — `pdfUrl` stays `null`, and the bill remains valid; storage is a backup, not a dependency for the core flow.
5. On `/editlast`, regenerate the PDF and re-upload to R2 under the same key (overwrite), keeping `pdfUrl` pointing at the latest version.

## 7. Input Validation Rules
- `rate` and `quantity` must parse as valid positive numbers — reject with a specific line-number error otherwise.
- `dimension` should loosely match a pattern like `NUMBER*NUMBER` — warn (not block) if it doesn't.
- Message must have exactly 6 lines for bill (including e-way bill no) / exactly 5 lines after `/addcustomer` — reject with a clear "expected N lines, got M" message otherwise.
- `eWayBillNo` — no strict format enforced (formats vary), but reject if the line is empty.
- GSTIN format check (basic regex, 15 chars, standard pattern) on `/addcustomer` — warn if malformed but allow save (avoids blocking real edge cases).

## 8. Explicitly Out of Scope (for this build)
- Multi-tenancy
- Payment recording (deferred)
- WhatsApp integration (architecture leaves room for it via `MessagingChannel` interface, not built now)
- Fuzzy/typo-tolerant search beyond simple partial match (e.g. pg_trgm) — not needed at this volume