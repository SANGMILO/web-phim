import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SepayWebhookPayload {
  id: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string;
  code?: string | null;
  content?: string;
  transferType: string;
  description?: string;
  transferAmount: number;
  accumulated?: number;
  referenceCode?: string;
}

export function verifySepayHmac(params: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  secret: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): { valid: boolean; reason?: string } {
  const {
    rawBody,
    signature,
    timestamp,
    secret,
    nowSeconds = Math.floor(Date.now() / 1000),
    toleranceSeconds = 300,
  } = params;

  if (!signature || !signature.startsWith('sha256=') || !timestamp) {
    return { valid: false, reason: 'missing_signature' };
  }

  const parsedTimestamp = Number(timestamp);
  if (!Number.isInteger(parsedTimestamp)) {
    return { valid: false, reason: 'invalid_timestamp' };
  }
  if (Math.abs(nowSeconds - parsedTimestamp) > toleranceSeconds) {
    return { valid: false, reason: 'expired_timestamp' };
  }

  const expected = `sha256=${createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex')}`;
  const actualBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (actualBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: 'invalid_signature' };
  }

  return timingSafeEqual(actualBuffer, expectedBuffer)
    ? { valid: true }
    : { valid: false, reason: 'invalid_signature' };
}

export function parseSepayPayload(rawBody: string): SepayWebhookPayload {
  const parsed: unknown = JSON.parse(rawBody);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Payload không hợp lệ.');
  }

  const payload = parsed as Record<string, unknown>;
  const id = payload.id;
  const transferAmount = Number(payload.transferAmount);
  const transferType = payload.transferType;

  if ((typeof id !== 'number' && typeof id !== 'string') || String(id).trim() === '') {
    throw new Error('Thiếu mã giao dịch SePay.');
  }
  if (!Number.isSafeInteger(transferAmount) || transferAmount <= 0) {
    throw new Error('Số tiền giao dịch không hợp lệ.');
  }
  if (typeof transferType !== 'string') {
    throw new Error('Loại giao dịch không hợp lệ.');
  }

  return {
    id,
    gateway: typeof payload.gateway === 'string' ? payload.gateway : undefined,
    transactionDate:
      typeof payload.transactionDate === 'string' ? payload.transactionDate : undefined,
    accountNumber: typeof payload.accountNumber === 'string' ? payload.accountNumber : undefined,
    subAccount: typeof payload.subAccount === 'string' ? payload.subAccount : undefined,
    code: typeof payload.code === 'string' ? payload.code : null,
    content: typeof payload.content === 'string' ? payload.content : undefined,
    transferType,
    description: typeof payload.description === 'string' ? payload.description : undefined,
    transferAmount,
    accumulated: typeof payload.accumulated === 'number' ? payload.accumulated : undefined,
    referenceCode:
      typeof payload.referenceCode === 'string' ? payload.referenceCode : undefined,
  };
}

