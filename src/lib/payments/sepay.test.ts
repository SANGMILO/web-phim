import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseSepayPayload, verifySepayHmac } from './sepay';

describe('SePay webhook verification', () => {
  const secret = 'test-secret';
  const timestamp = '1800000000';
  const rawBody = JSON.stringify({
    id: 92704,
    transferType: 'in',
    transferAmount: 100000,
    code: 'CVNAPABC123456789',
  });

  it('accepts a valid signature', () => {
    const signature = `sha256=${createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')}`;

    expect(
      verifySepayHmac({
        rawBody,
        signature,
        timestamp,
        secret,
        nowSeconds: 1800000000,
      }),
    ).toEqual({ valid: true });
  });

  it('rejects payload tampering and replayed timestamps', () => {
    const signature = `sha256=${createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')}`;

    expect(
      verifySepayHmac({
        rawBody: `${rawBody} `,
        signature,
        timestamp,
        secret,
        nowSeconds: 1800000000,
      }).valid,
    ).toBe(false);
    expect(
      verifySepayHmac({
        rawBody,
        signature,
        timestamp,
        secret,
        nowSeconds: 1800001000,
      }).reason,
    ).toBe('expired_timestamp');
  });

  it('validates the required transaction fields', () => {
    expect(parseSepayPayload(rawBody)).toMatchObject({
      id: 92704,
      transferType: 'in',
      transferAmount: 100000,
    });
    expect(() => parseSepayPayload('{"id":1,"transferType":"in","transferAmount":0}')).toThrow();
  });
});

