#!/usr/bin/env node
// npm run nonprofit:receipt -- --donor "Name" --email x@y --amount 100 --date 2026-05-01 --method check --fund unrestricted
// Generates a tax-deductible donation receipt (HTML + plain text).

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { loadContract, ROOT_DIR } from './lib/load-contracts.mjs';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}

const donorName = arg('donor');
const donorEmail = arg('email');
const amount = parseFloat(arg('amount', '0'));
const date = arg('date', new Date().toISOString().slice(0, 10));
const method = arg('method', 'cash');
const fund = arg('fund', 'unrestricted');
const out = arg('out');

if (!donorName || !amount) {
  console.error('Usage: nonprofit:receipt -- --donor "Name" --email x@y --amount N --date YYYY-MM-DD --method M --fund F');
  console.error('  Optional: --out path/to/receipt.html');
  process.exit(1);
}

const governance = loadContract('governance');
const compliance = loadContract('compliance');
const donorPolicy = loadContract('donor-policy');

if (!governance || !compliance || !donorPolicy) {
  console.error('Required contracts missing — see error above');
  process.exit(1);
}

const ein = governance.entity.ein;
const legalName = governance.entity.legalName;
const stateOfInc = governance.entity.stateOfIncorporation;
const irsStatus = governance.entity.irsStatus;
const isApproved = irsStatus === 'approved';

const irsLanguage = isApproved
  ? donorPolicy.taxReceipts.irsConditionalLanguage.afterDeterminationLetter
  : donorPolicy.taxReceipts.irsConditionalLanguage.untilDeterminationLetter;

const receiptId = `R-${Date.now().toString(36).toUpperCase()}`;
const formattedAmount = `$${amount.toFixed(2)}`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Donation Receipt · ${legalName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.6; }
    .header { border-bottom: 2px solid #0f1115; padding-bottom: 16px; margin-bottom: 24px; }
    .org-name { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .org-meta { font-size: 13px; color: #555; }
    .receipt-title { font-size: 16px; font-weight: 600; color: #555; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.08em; }
    .amount-box { background: #f5f5f5; border-radius: 8px; padding: 24px; margin: 16px 0 24px; text-align: center; }
    .amount { font-size: 36px; font-weight: 700; color: #0f1115; }
    .amount-label { font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { text-align: left; padding: 8px 0; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
    th { color: #555; font-weight: 500; width: 40%; }
    .irs-language { background: #fffbe5; border-left: 3px solid #ccc44e; padding: 12px 16px; margin: 24px 0; font-size: 13px; line-height: 1.55; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #888; }
    .receipt-id { font-family: monospace; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="org-name">${legalName}</div>
    <div class="org-meta">EIN ${ein} · ${stateOfInc} nonprofit corporation</div>
  </div>
  
  <div class="receipt-title">Tax-Deductible Donation Receipt</div>
  
  <div class="amount-box">
    <div class="amount">${formattedAmount}</div>
    <div class="amount-label">${method.toUpperCase()} · ${fund.toUpperCase()}</div>
  </div>
  
  <table>
    <tr><th>Donor</th><td>${donorName}</td></tr>
    ${donorEmail ? `<tr><th>Email</th><td>${donorEmail}</td></tr>` : ''}
    <tr><th>Date received</th><td>${date}</td></tr>
    <tr><th>Receipt ID</th><td class="receipt-id">${receiptId}</td></tr>
  </table>
  
  <div class="irs-language">
    <strong>No goods or services were provided in exchange for this contribution.</strong><br>
    ${irsLanguage}
  </div>
  
  <p>Thank you for supporting our mission.</p>
  
  <div class="footer">
    Please retain this receipt for your tax records.<br>
    Questions: <a href="mailto:treasurer@phosphorus31.org">treasurer@phosphorus31.org</a><br>
    <a href="https://phosphorus31.org/donor-policy">Donor policy</a> · <a href="https://phosphorus31.org/privacy">Privacy</a>
  </div>
</body>
</html>`;

const plainText = `${legalName}
EIN ${ein} · ${stateOfInc} nonprofit corporation

TAX-DEDUCTIBLE DONATION RECEIPT

Amount:        ${formattedAmount}
Method:        ${method}
Fund:          ${fund}
Donor:         ${donorName}
${donorEmail ? `Email:         ${donorEmail}\n` : ''}Date received: ${date}
Receipt ID:    ${receiptId}

No goods or services were provided in exchange for this contribution.
${irsLanguage}

Thank you for supporting our mission.

Please retain this receipt for your tax records.
Questions: treasurer@phosphorus31.org
`;

if (out) {
  const outPath = path.resolve(out);
  fs.writeFileSync(outPath, html);
  console.log(`receipt: written to ${outPath}`);
} else {
  // Print preview (plaintext) and html separately
  console.log('─── PLAINTEXT PREVIEW ─────────────────────────────────');
  console.log(plainText);
  console.log('─── HTML (write with --out path) ──────────────────────');
  console.log(`(${html.length} chars; pass --out to write to a file)`);
}

console.log(`\nReceipt ID: ${receiptId}`);
console.log(`IRS status: ${irsStatus}`);
if (!isApproved) {
  console.log(`Note: receipts during 'pending' status include conditional-deductibility language.`);
}
