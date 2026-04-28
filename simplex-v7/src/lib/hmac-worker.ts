/** Web Crypto HMAC-SHA256 verify (Workers + Vitest global crypto). */

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  if (!clean.length || clean.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function verifyHmacSha256(payload: string, hexSig: string, secret: string): Promise<boolean> {
  const trimmed = hexSig.trim();
  if (!trimmed || trimmed.length % 2 !== 0) return false;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = hexToBytes(trimmed);
    if (!sigBytes.length) return false;
    return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload));
  } catch {
    return false;
  }
}
