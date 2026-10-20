import { NextResponse } from 'next/server';
import { parseSepayPayload, verifySepayHmac } from '@/lib/payments/sepay';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 64 * 1024;

function parseTransactionTime(value?: string): string | null {
  if (!value) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const includesTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const parsed = new Date(includesTimezone ? normalized : `${normalized}+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, message: 'Payload too large' }, { status: 413 });
    }

    const secret = process.env.SEPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('SEPAY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ success: false, message: 'Webhook unavailable' }, { status: 503 });
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, message: 'Payload too large' }, { status: 413 });
    }

    const verification = verifySepayHmac({
      rawBody,
      signature: request.headers.get('x-sepay-signature'),
      timestamp: request.headers.get('x-sepay-timestamp'),
      secret,
    });
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.reason || 'Unauthorized' },
        { status: 401 },
      );
    }

    const payload = parseSepayPayload(rawBody);
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('process_sepay_webhook', {
      p_provider_transaction_id: String(payload.id),
      p_provider_reference_code: payload.referenceCode || '',
      p_detected_payment_code: payload.code || '',
      p_transfer_amount: payload.transferAmount,
      p_transfer_type: payload.transferType,
      p_destination_account: payload.accountNumber || '',
      p_transaction_time: parseTransactionTime(payload.transactionDate),
      p_raw_payload: JSON.parse(rawBody),
    });

    if (error) {
      console.error('SePay webhook processing failed:', error.message);
      return NextResponse.json({ success: false, message: 'Processing failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook payload';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

