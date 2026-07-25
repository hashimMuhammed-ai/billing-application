---
trigger: always_on
---

- Follow PROJECT_BRIEF.md and TASKLIST.md as the source of truth. Do not
  introduce patterns not described there (e.g. no microservices, no
  multi-tenancy, no Product/BillItem tables).
- Bill message format is exactly 6 lines: vehicleNo, eWayBillNo,
  customerName, dimension, rate, quantity. Do not add/remove fields
  without updating PROJECT_BRIEF.md first.
- Customer.balance was intentionally removed — do not reintroduce
  balance tracking unless explicitly asked.
- GST split is always CGST + SGST (never IGST) — single-state only.
- Money fields use Decimal(10,2), never float.
- Any schema change must be reflected in PROJECT_BRIEF.md in the same task.