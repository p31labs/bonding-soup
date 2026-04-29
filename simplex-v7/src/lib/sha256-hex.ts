/** SHA-256 hex digest (Web Crypto) for genesis / content hashes. */

export async function sha256HexUtf8(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
