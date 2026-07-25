# Task List — 2-Day Build Plan

Reference `PROJECT_BRIEF.md` for schema, message formats, and business rules while working through these tasks. Order matters: Day 1 builds and proves the domain logic in isolation; Day 2 wraps it with Telegram + PDF so bugs are caught before they're hidden behind a chat interface.

---

## DAY 1 — Core Domain (no Telegram, no PDF yet)

### Setup
- [x] Initialize NestJS project, set up folder structure per `PROJECT_BRIEF.md`
- [x] Set up PostgreSQL (Supabase/Neon free tier) and connect Prisma
- [x] Write Prisma schema (`Company`, `Customer`, `Bill`) and run first migration
- [x] Seed `Company` row with A M Trading's real details (name, address, GSTIN, bank details, HSN code, `lastInvoiceSeq: 0`, `currentFY` set to current FY)

### Customer module
- [x] Build `addcustomer.parser.ts` — parse 5 fixed lines into a DTO
- [x] Implement input validation (line count check, basic GSTIN format check)
- [x] Implement `create-customer.usecase.ts`
- [x] Implement `find-customer.usecase.ts` — case-insensitive partial name match, return 0/1/many cases
- [x] Implement `/customers` (list all) and `/find <name>` (lookup) use cases
- [x] Test all of the above via a temporary REST endpoint or unit tests (no Telegram needed yet)

### Billing module
- [x] Build `bill.parser.ts` — parse 6 fixed lines into a DTO (vehicleNo, eWayBillNo, customerName, dimension, rate, quantity)
- [x] Implement input validation (numeric checks on rate/quantity, dimension pattern warning)
- [x] Implement `gst-calculator.service.ts` per the formula in `PROJECT_BRIEF.md`
- [x] Implement `invoice-numbering.service.ts` — FY detection + atomic sequential increment
- [x] Implement `create-bill.usecase.ts` — ties together customer lookup, GST calc (derived from `company.gstRate`), invoice numbering, DB transaction (bill insert)
- [x] Implement `edit-last-bill.usecase.ts` — fetch most recent bill, allow rate/quantity update, recalculate, mark `REVISED`
- [x] Implement `cancel-bill.usecase.ts` — mark bill `CANCELLED` by invoice number
- [x] Implement `monthly-summary.usecase.ts` — grouped query: total sales, total GST, bill count for current month
- [x] Test full billing flow end-to-end via REST endpoint or unit tests: create → edit → cancel → summary

**End of Day 1 checkpoint:** you should be able to create a customer, create a bill against them, edit it, cancel it, and pull a monthly summary — all without touching Telegram or PDF.

---

## DAY 2 — Telegram + PDF + Integration

### PDF generation & storage
- [x] Build `pdf-template.html` matching the existing invoice layout (header, buyer/seller blocks, e-way bill no field, item table, GST breakdown, amount in words, bank details, signatory)
- [x] Add a number-to-words utility for the "Total Invoice Amount in words" line
- [x] Implement `pdf-generator.service.ts` using Puppeteer — render HTML with real bill/customer/company data, output PDF buffer
- [x] Test PDF generation directly against a few sample bills, visually compare to the reference invoice
- [x] Set up a Cloudflare R2 bucket, get access key/secret/endpoint, add to env vars
- [x] Implement `r2-storage.service.ts` — upload PDF buffer to `bills/{invoiceNo}.pdf`, return the URL
- [x] Wire R2 upload into `create-bill.usecase.ts` (or the PDF-send step): upload happens after generation, `Bill.pdfUrl` is saved, upload failure doesn't block sending the PDF to Telegram
- [x] Wire R2 re-upload (overwrite same key) into `/editlast` flow

### Telegram integration
- [x] Create bot via BotFather, get token, set up webhook endpoint (`telegram.controller.ts`)
- [x] Implement `message-router.service.ts` — detect message type: bill format (6 lines) vs `/addcustomer` vs `/editlast` vs `/cancel` vs `/summary` vs `/customers` vs `/find`
- [x] Wire each route to its corresponding use case from Day 1
- [x] Implement `telegram.service.ts` — `sendMessage` (confirmations, errors, summaries) and `sendDocument` (PDF delivery)
- [x] Add the pre-send confirmation step for bill creation (show summary, hold pending bill in an in-memory `Map<chatId, PendingBill>`, wait for confirmation reply, then generate + send PDF and clear the map entry)

### Polish and validation pass
- [x] Confirm friendly error messages surface correctly through Telegram for all validation failures (wrong line count, bad numbers, customer not found, ambiguous match)
- [x] Test `/editlast` and `/cancel` end-to-end through Telegram
- [x] Test `/summary`, `/customers`, `/find` end-to-end through Telegram
- [x] Full run-through: register a customer, create a bill, receive PDF, edit it, cancel a different one, pull summary — all via actual Telegram messages
- [x] Write a short `README.md` with local setup steps (Telegram, DB, and R2 env vars; webhook URL setup via tunnel/hosting) for deployment reference

**End of Day 2 checkpoint:** the full loop works end-to-end through real Telegram messages, PDF matches the reference invoice layout, and all four extra features (edit/cancel, summary, validation, lookup) are functional.