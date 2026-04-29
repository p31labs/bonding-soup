import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyHmacSha256 } from '../src/lib/hmac-worker';

describe('Phos / device HMAC parity (CLI vs Worker)', () => {
  it('Node createHmac hex verifies with verifyHmacSha256', async () => {
    const body = '{"child_id":"x","input":""}';
    const secret = 'test-phos-secret';
    const hex = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
    expect(await verifyHmacSha256(body, hex, secret)).toBe(true);
    expect(await verifyHmacSha256(body, 'deadbeef', secret)).toBe(false);
  });
});
