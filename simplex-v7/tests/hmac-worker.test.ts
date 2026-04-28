import { describe, expect, it } from 'vitest';
import { hexToBytes, verifyHmacSha256 } from '../src/lib/hmac-worker';

async function expectedHex(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

describe('hexToBytes', () => {
  it('parses lowercase hex pairs', () => {
    expect([...hexToBytes('0102ff')]).toEqual([1, 2, 255]);
  });

  it('returns empty for odd length', () => {
    expect(hexToBytes('123').length).toBe(0);
  });

  it('returns empty for empty string', () => {
    expect(hexToBytes('').length).toBe(0);
  });
});

describe('verifyHmacSha256', () => {
  it('accepts valid signature', async () => {
    const secret = 'node-zero';
    const body = '{"t":1}';
    const hex = await expectedHex(body, secret);
    expect(await verifyHmacSha256(body, hex, secret)).toBe(true);
  });

  it('rejects tampered payload', async () => {
    const secret = 'k';
    const hex = await expectedHex('a', secret);
    expect(await verifyHmacSha256('b', hex, secret)).toBe(false);
  });

  it('rejects wrong secret', async () => {
    const hex = await expectedHex('a', 's1');
    expect(await verifyHmacSha256('a', hex, 's2')).toBe(false);
  });

  it('rejects odd-length hex', async () => {
    expect(await verifyHmacSha256('a', 'abc', 's')).toBe(false);
  });

  it('rejects empty hex', async () => {
    expect(await verifyHmacSha256('payload', '', 's')).toBe(false);
  });
});
