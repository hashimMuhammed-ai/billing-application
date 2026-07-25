# A M Trading Billing Application

A NestJS-based automated billing system integrated with Telegram and Cloudflare R2 for invoice PDF generation and storage.

## Features

- 🧾 **Telegram Bot Billing**: Create GST compliant invoices directly from Telegram using a 6-line message format.
- 📄 **Puppeteer PDF Invoice Generation**: Automatic generation of official PDF invoices matching standard layout with company branding, buyer details, item breakdown, CGST/SGST split, amount in words, and signatory blocks.
- ☁️ **Cloudflare R2 Storage**: PDF buffer upload to Cloudflare R2 storage for cloud persistence and public download links.
- ✏️ **Invoice Revision (`/editlast`)**: Re-calculate tax and totals for the last issued invoice, overwrite PDF on R2, and deliver revised PDF via Telegram.
- 🚫 **Invoice Cancellation (`/cancel`)**: Atomic invoice status updates to `CANCELLED` with audit trail protection.
- 📊 **Monthly Billing Summary (`/summary`)**: Instant aggregate reporting of active bill count, total sales, and CGST/SGST breakdown for the current month.
- 👥 **Customer Management (`/addcustomer`, `/customers`, `/find`)**: Register customers via multi-line messages, list active customers, and perform case-insensitive partial searches.

---

## Environment Configuration

Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Server Port
PORT=3000

# PostgreSQL Database (Supabase / Neon / Local)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/billing_db?schema=public"

# Telegram Bot Token & Webhook Secret
TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
TELEGRAM_WEBHOOK_SECRET="your_custom_webhook_secret_header"

# Cloudflare R2 Bucket Configuration
R2_ACCOUNT_ID="your_r2_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_BUCKET_NAME="billing-invoices"
R2_PUBLIC_DOMAIN="https://pub-yourbucket.r2.dev"
```

---

## Local Setup & Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup & Prisma Migrations**:
   Ensure PostgreSQL is running and `DATABASE_URL` is set, then run:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

3. **Start Development Server**:
   ```bash
   npm run start:dev
   ```
   The application listens on `http://localhost:3000`.

---

## Telegram Webhook Setup

### 1. Tunneling Local App (for Local Testing)
Expose local port `3000` via ngrok or localtunnel:
```bash
ngrok http 3000
```
Copy the HTTPS URL generated (e.g. `https://a1b2c3d4.ngrok-free.app`).

### 2. Register Webhook with Telegram
Run the following cURL command to register your webhook endpoint:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<YOUR_TUNNEL_DOMAIN>/telegram/webhook",
    "secret_token": "<YOUR_TELEGRAM_WEBHOOK_SECRET>"
  }'
```

### 3. Verify Webhook Status
Check that Telegram connected to your webhook properly:
```bash
curl "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

---

## Telegram Bot Message Formats & Commands

### 1. Create Invoice (6 Lines)
Send a 6-line message formatted as:
```text
KL01BJ3019
34AB1234C5678D1E2
Moreland Builders
8*4
14.50
1000
```
- Line 1: Vehicle No
- Line 2: E-Way Bill No
- Line 3: Customer Name
- Line 4: Dimension (e.g., `8*4`)
- Line 5: Rate
- Line 6: Quantity

The bot presents a pending summary confirmation. Reply `yes` or `confirm` to finalize the invoice and receive the PDF.

### 2. Register Customer (`/addcustomer`)
```text
/addcustomer
Moreland Builders
Muvattupuzha, Kerala
32ACCFM3093K1Z7
Kerala
9847000000
```

### 3. Edit Last Bill (`/editlast`)
```text
/editlast 15.00 1200
```
Updates rate and quantity of the last bill, recalculates tax, updates DB, overwrites R2 PDF, and delivers the revised document to chat.

### 4. Cancel Invoice (`/cancel`)
```text
/cancel AMT/2026-27/001
```

### 5. Other Commands
- `/summary` — Pull monthly total sales, bill counts, and CGST/SGST totals.
- `/customers` — View all registered customers.
- `/find <name>` — Case-insensitive search for a customer.

---

## Running Tests

Run the complete test suite (unit tests and Telegram end-to-end integration flows):
```bash
# Run tests
npm test

# Run end-to-end flow tests specifically
npx jest src/modules/telegram/telegram-e2e-runthrough.spec.ts
```
