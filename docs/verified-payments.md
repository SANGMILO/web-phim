# Manual QR wallet payments (default)

The default flow does not require a SePay account. An administrator uploads a
bank QR image, the user transfers money and submits the request, then the admin
checks the real bank transaction before approving it.

## Manual QR setup

1. Apply `202610200001_create_verified_wallet_ledger.sql`.
2. Apply `202610200002_add_manual_topup_approval.sql`.
3. Sign in as an admin and open `/admin/payments`.
4. Upload a PNG/JPEG/WebP bank QR image, set a short prefix such as `CVNAP`, and
   save the configuration.
5. A user creates a request, transfers the exact amount with the displayed code,
   then clicks **I have transferred – Send to admin**.
6. The admin opens the transaction history, checks the bank app, and clicks
   **Approve** or **Reject**.

Clicking the user button never credits the wallet. Approval locks the request and
wallet, credits it once, and appends an audited ledger entry atomically. Repeated
approval cannot credit the same request twice.

Use two accounts for acceptance testing: an ordinary user creates and submits a
10,000 VND request; an admin verifies the amount and payment code in the bank app
and approves it. Confirm that the wallet and ledger increase exactly once.

## Optional SePay automation

The remaining sections describe the optional automatic SePay mode. They are not
required when using manual admin approval.

The wallet balance is derived from an append-only server ledger. A browser cannot
credit its own balance. A top-up is credited only after the SePay webhook is
authenticated and the bank transfer matches an active request by payment code,
amount, and destination account.

## 1. Apply the database migration

Apply `supabase/migrations/202610200001_create_verified_wallet_ledger.sql` to the
production Supabase project before deploying the application code.

The migration creates:

- wallet accounts and immutable transaction records;
- expiring top-up requests with unique payment codes;
- idempotent SePay webhook processing;
- atomic VIP purchases and administrator wallet adjustments;
- RLS policies that prevent clients from changing balances directly.

## 2. Configure production secrets

Add these server-only variables to the production deployment:

```text
SUPABASE_SECRET_KEY=sb_secret_...
SEPAY_WEBHOOK_SECRET=<a long random value shared only with SePay>
```

Create `SUPABASE_SECRET_KEY` in Supabase project settings under API Keys. Never
use it in a variable prefixed with `NEXT_PUBLIC_`, commit it, or expose it to the
browser. The legacy `SUPABASE_SERVICE_ROLE_KEY` name is accepted as a temporary
fallback, but the current secret key is preferred.

Generate `SEPAY_WEBHOOK_SECRET` with a password manager or a cryptographically
secure random generator. Use the exact same value in SePay's HMAC webhook
configuration and in the deployment environment.

## 3. Configure the bank account

Sign in as an application administrator and open `/admin/payments`. Configure:

- VietQR as enabled;
- bank ID;
- bank account number;
- account holder name;
- a short payment-code prefix, for example `CVNAP`.

The account number must exactly match the account reported by SePay. Do not
enable payment methods that do not yet have a verified provider integration.

## 4. Configure SePay

Connect the same bank account in SePay and create a webhook with:

```text
URL: https://<production-domain>/api/webhooks/sepay
Event: Incoming transfer / Có tiền vào
Content type: application/json
Authentication: HMAC-SHA256
```

Use the value of `SEPAY_WEBHOOK_SECRET` as the HMAC secret. Configure SePay's
payment-code extraction with the same prefix used in `/admin/payments`, ignore
transactions without a payment code, and keep retries enabled.

The endpoint verifies `X-SePay-Signature` and `X-SePay-Timestamp` against the raw
request body. It rejects stale or modified requests, deduplicates provider
transaction IDs, and credits only an exact active request.

## 5. Deployment order

1. Apply the production database migration.
2. Add both secrets to the production environment.
3. Configure the bank account and SePay webhook.
4. Deploy the application.
5. Run the acceptance checks below with a small real transfer.

Deploying the application before the migration or secrets are available will
leave the payment flow unavailable by design; it will not fall back to a fake
client-side credit.

## 6. Acceptance checks

Use two real accounts: one admin and one ordinary user.

### Ordinary user

- Cannot open admin pages or call admin payment RPCs.
- Can create a VietQR top-up request and sees a unique payment code.
- Sending a wrong amount, wrong code, expired code, or transfer to another
  account does not credit the wallet.
- A matching incoming transfer credits the wallet exactly once.
- Replaying the same webhook does not credit the wallet again.
- VIP purchase debits the ledger atomically and updates the user's role.

### Administrator

- Can update payment settings without exposing server secrets.
- Can list verified transactions.
- Can make a wallet adjustment only with an audit reason.
- Cannot remove their own active administrator access.

### Security checks

- A browser request cannot insert or update ledger rows or wallet balances.
- A forged, malformed, stale, or incorrectly signed webhook is rejected.
- Server logs and API responses do not contain either secret.
- The test transfer appears in the bank, SePay event log, top-up request, and
  wallet ledger with the same provider transaction reference.

