import { describe, expect, it } from 'vitest';
import { decryptWithKey, encryptPack, fromB64, normalizePassword, toB64, unlockPack } from '../src/platform/gate/crypto';

const FAST = { iterations: 1000 };
const data = { format: 'azaleaporten-familjepaket', v: 1, personas: [{ boss: 'x', name: 'Exempelmästaren' }] };

describe('familjepaketets kryptering', () => {
  it('låser upp med rätt lösenord', async () => {
    const pack = await encryptPack(data, 'kastanj-drake-sju-azalea', FAST);
    expect(JSON.stringify(pack)).not.toContain('Exempelmästaren');
    const { data: out, rawKey } = await unlockPack(pack, 'kastanj-drake-sju-azalea');
    expect(out).toEqual(data);
    expect(await decryptWithKey(pack, rawKey)).toEqual(data);
  });

  it('förlåter versaler, mellanslag och bindestreck', async () => {
    const pack = await encryptPack(data, 'kastanj-drake-sju-azalea', FAST);
    await expect(unlockPack(pack, 'Kastanj Drake Sju Azalea')).resolves.toBeTruthy();
    expect(normalizePassword(' Ä-ö_å ')).toBe('äöå');
  });

  it('avvisar fel lösenord', async () => {
    const pack = await encryptPack(data, 'rätt', FAST);
    await expect(unlockPack(pack, 'fel')).rejects.toThrow();
  });

  it('samma salt ger samma nyckel, så enheter förblir upplåsta när paketet uppdateras', async () => {
    const salt = new Uint8Array(16).fill(7);
    const a = await encryptPack(data, 'lösen', { ...FAST, salt });
    const b = await encryptPack({ ...data, personas: [] }, 'lösen', { ...FAST, salt });
    const { rawKey } = await unlockPack(a, 'lösen');
    expect(await decryptWithKey(b, rawKey)).toEqual({ ...data, personas: [] });
  });

  it('base64 klarar stora data', () => {
    const big = new Uint8Array(200_000).map((_, i) => i % 256);
    expect(fromB64(toB64(big))).toEqual(big);
  });
});
