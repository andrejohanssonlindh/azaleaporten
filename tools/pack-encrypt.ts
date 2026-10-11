// Krypterar familjepaketet (lärar-bossarna) till public/packs/familj.enc.
//
//   npm run pack:encrypt                       läser ../privat/familjepaket/pack.json
//   npm run pack:encrypt -- --src <mapp>       annan källmapp
//   npm run pack:encrypt -- --out <fil>        annan utfil
//
// Källan ligger UTANFÖR repot och committas aldrig. Bara chiffertexten publiceras.
// Saltet sparas i källmappen (.salt) så att samma lösenord ger samma nyckel – då förblir
// redan upplåsta enheter upplåsta när paketet uppdateras.
// Körs direkt av Node (typ-strippning), därför bara "raderbar" TypeScript här.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as readline from 'node:readline';
import { encryptPack, fromB64, toB64 } from '../src/platform/gate/crypto.ts';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcArg = process.argv.indexOf('--src');
const src = srcArg > 0 ? resolve(process.argv[srcArg + 1]) : resolve(repo, '../privat/familjepaket');
const outArg = process.argv.indexOf('--out');
const out = outArg > 0 ? resolve(process.argv[outArg + 1]) : join(repo, 'public/packs/familj.enc');

const MIME: Record<string, string> = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function ask(question: string): Promise<string> {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const anyRl = rl as unknown as { _writeToOutput: (s: string) => void };
    anyRl._writeToOutput = (s: string) => { if (s.startsWith(question)) process.stdout.write(s); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); res(answer); });
  });
}

const packFile = join(src, 'pack.json');
if (!existsSync(packFile)) fail(`Hittar inte ${packFile}`);

let source: { personas?: Record<string, unknown>[] };
try { source = JSON.parse(readFileSync(packFile, 'utf8')); } catch (e) { fail(`pack.json är inte giltig JSON: ${(e as Error).message}`); }
const personas = (source.personas ?? []).filter((p) => !p._exempel);
if (!personas.length) fail('pack.json innehåller inga personor (exempel med "_exempel": true räknas inte).');

for (const p of personas) {
  for (const field of ['boss', 'name', 'title', 'entrance', 'defeat']) {
    if (typeof p[field] !== 'string' || !(p[field] as string).trim()) fail(`Personan ${JSON.stringify(p.name ?? p.boss)} saknar fältet "${field}".`);
  }
  // Porträtt som filer bäddas in som data-URL.
  const portrait = p.portrait;
  if (typeof portrait === 'string' && MIME[extname(portrait).toLowerCase()]) {
    const file = join(src, portrait);
    if (!existsSync(file)) fail(`Porträttet ${portrait} saknas.`);
    p.portrait = `data:${MIME[extname(portrait).toLowerCase()]};base64,${toB64(new Uint8Array(readFileSync(file)))}`;
  }
}

const saltFile = join(src, '.salt');
let salt: Uint8Array<ArrayBuffer>;
if (existsSync(saltFile)) salt = fromB64(readFileSync(saltFile, 'utf8').trim());
else {
  salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  writeFileSync(saltFile, toB64(salt) + '\n');
  console.log('Nytt salt skapat i', saltFile);
}

console.log(`\nKrypterar ${personas.length} personor från ${src}`);
console.log('Lösenordet sparas ingenstans. Välj gärna fyra ord, t.ex. "ord-ord-ord-ord".');
// Miljövariabeln finns för skriptad användning (tester). Skriv annars lösenordet interaktivt.
const fromEnv = process.env.AZALEAPORTEN_PACK_PASSWORD;
const pw = fromEnv ?? (await ask('Lösenord: '));
if (pw.trim().length < 8) fail('Lösenordet är för kort (minst 8 tecken).');
if (!fromEnv && pw !== (await ask('Samma lösenord igen: '))) fail('Lösenorden var inte likadana.');

const pack = await encryptPack({ format: 'azaleaporten-familjepaket', v: 1, personas }, pw, { salt });
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(pack));
console.log(`\n✔ Skrev ${out} (${Math.round(JSON.stringify(pack).length / 1024)} kB, bara chiffertext).`);
console.log('  Committa och pusha public/packs/familj.enc – sedan ber porten om lösenordet.\n');
