# Donor Receipt Runbook

**When to use:**
1. Within 24h of any new donation (auto-issued by Stripe webhook).
2. January 31 each year — annual giving summary for every donor with prior-year activity.
3. On-demand — donor requests a replacement.

**Owner:** Treasurer.
**Pre-requisite reading:** `donor-policy.json` → `taxReceipts`, `financials.json` → `donorAcknowledgments`.

---

## Automated path (Stripe → email within minutes)

```bash
# Stripe webhook → donate-api Worker → receipt template fill → email send
# All canonical: template lives at /scripts/nonprofit/templates/tax-receipt.html
# Filled with: amount, date, method, fund, donor email, EIN, IRS language
```

Required IRS language for any contribution >= $250:
> "No goods or services were provided in exchange for this contribution."
> (or an itemized description + good-faith value if any were)

## Manual path (one receipt)

```bash
npm run nonprofit:receipt -- \
  --donor "Jane Doe" \
  --email "jane@example.com" \
  --amount 100 \
  --date 2026-05-01 \
  --method check \
  --fund unrestricted

# Outputs: PDF + plain-text email
# Stores: encrypted record in donor-records (kv namespace)
```

## Annual path (January 31 batch)

```bash
# 1. Confirm prior-year donor list
npm run nonprofit:donors -- --year 2026

# 2. Generate annual summary receipts (one per donor)
npm run nonprofit:receipt -- --annual --year 2026

# 3. Sends to all donor emails on file
# Includes: total prior-year giving, list of individual gifts, IRS language, EIN
```

## Conditional language for pending 501(c)(3)

Until IRS determination letter received:
> "P31 Labs, Inc. has applied for 501(c)(3) status. Donations made before IRS determination are deductible retroactively to incorporation date if the application is approved. We will notify you upon receipt of the determination letter."

After determination letter:
> "P31 Labs, Inc. is a 501(c)(3) tax-exempt organization. EIN: 42-1888158."

When `compliance.json` `federal.form1023.status` flips from `preparing` to `approved`, the receipt template auto-switches.

## What NOT to put in receipts

- "Thank you for being amazing!" (voice violation)
- Premium / quid-pro-quo language unless actually applicable
- Marketing CTAs for upgrade / monthly conversion
- Anything beyond what IRS requires + simple thanks

## Replacement receipt request

Donor emails `treasurer@phosphorus31.org` requesting a replacement.

```bash
npm run nonprofit:receipt -- \
  --regenerate \
  --donor-id <id> \
  --year 2026

# Same content; clearly marked "REPLACEMENT" in PDF metadata
# Original retained; this is a re-issue, not a new receipt
```

## Refund handling

If a donation is refunded (per `donor-policy.json` `refundPolicy`):

1. Issue refund through original payment method
2. Mark original receipt as `voided` in donor records
3. Generate a "REFUND NOTICE" letter (template) to donor:
   > "We have processed your refund. The original donation receipt issued on {date} is no longer valid for tax purposes. If you have already filed taxes claiming this deduction, you may need to file an amended return."
4. Update `financials.json` revenue line for the affected period

## Audit trail

Every receipt issued, replacement issued, and refund letter is retained in:
- Encrypted KV (`donor-records:{donor_id}:receipts:{receipt_id}`)
- Quarterly export to `nonprofit-archive` R2 bucket
- 7-year retention per IRS + state requirements

## Cross-references

- Template: `scripts/nonprofit/templates/tax-receipt.html`
- Annual summary template: `scripts/nonprofit/templates/tax-receipt-annual.html`
- Stripe webhook: `donate-api.phosphorus31.org/webhooks/stripe`
- IRS publication 1771 — Charitable Contributions: Substantiation and Disclosure
