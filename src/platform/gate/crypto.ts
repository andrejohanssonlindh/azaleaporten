// Kryptering av familjepaketet (lärar-bossarna). Används både i webbläsaren och av
// tools/pack-encrypt.ts i Node, därför: inga importer och bara WebCrypto.
//
// Lösenord → PBKDF2-SHA256 (många iterationer, salt) → AES-GCM-256.
// Bara chiffertexten publiceras; utan lösenordet går innehållet inte att läsa.

export interface EncryptedPack {
  format: 'azaleaporten-pack';
  v: 1;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  iv: string;
  ct: string;
}

export const DEFAULT_ITERATIONS = 600_000;

const subtle = () => globalThis.crypto.subtle;

/** Förlåtande för barn: versaler, mellanslag och bindestreck spelar ingen roll. */
export function normalizePassword(pw: string): string {
  return pw.normalize('NFC').toLocaleLowerCase('sv').replace(/[\s\-_.]+/g, '');
}

export function toB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Härleder den råa AES-nyckeln (32 byte). Den sparas lokalt så att lösenordet bara behövs en gång per enhet. */
export async function deriveRawKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array<ArrayBuffer>> {
  const base = await subtle().importKey('raw', new TextEncoder().encode(normalizePassword(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, 256);
  return new Uint8Array(bits);
}

async function aesKey(raw: Uint8Array<ArrayBuffer>, usage: 'encrypt' | 'decrypt') {
  return subtle().importKey('raw', raw, 'AES-GCM', false, [usage]);
}

export async function encryptPack(
  data: unknown,
  password: string,
  opts: { salt?: Uint8Array<ArrayBuffer>; iterations?: number } = {},
): Promise<EncryptedPack> {
  const salt = opts.salt ?? globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iterations = opts.iterations ?? DEFAULT_ITERATIONS;
  const raw = await deriveRawKey(password, salt, iterations);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(data));
  const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, await aesKey(raw, 'encrypt'), plain));
  return {
    format: 'azaleaporten-pack', v: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: toB64(salt) },
    iv: toB64(iv), ct: toB64(ct),
  };
}

/** Dekrypterar med en redan härledd nyckel. Kastar om nyckeln är fel (AES-GCM kontrollerar äktheten). */
export async function decryptWithKey<T = unknown>(pack: EncryptedPack, raw: Uint8Array<ArrayBuffer>): Promise<T> {
  const plain = await subtle().decrypt({ name: 'AES-GCM', iv: fromB64(pack.iv) }, await aesKey(raw, 'decrypt'), fromB64(pack.ct));
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

/** Låser upp med lösenord. Kastar vid fel lösenord. */
export async function unlockPack<T = unknown>(pack: EncryptedPack, password: string): Promise<{ data: T; rawKey: Uint8Array<ArrayBuffer> }> {
  const rawKey = await deriveRawKey(password, fromB64(pack.kdf.salt), pack.kdf.iterations);
  return { data: await decryptWithKey<T>(pack, rawKey), rawKey };
}

export function isEncryptedPack(x: unknown): x is EncryptedPack {
  const p = x as EncryptedPack;
  return !!p && p.format === 'azaleaporten-pack' && p.v === 1 && !!p.kdf?.salt && !!p.iv && !!p.ct;
}
