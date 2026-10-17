import { BITAR, FACE_DRAG, MOTSATT, arLost, mitt, bitMedFarger, farger, hem, pa, paPlats, sitter, varv, vrid, type Bit, type Drag, type Farg, type Kub, type Sida, type Vec } from './kub';

// Nybörjarmetoden, precis som barnen lär sig den (gul upp, vit ner hela tiden):
// 1 blomman (fyra vita kanter runt den gula mitten), 2 vita korset, 3 vita hörnen med höger-tricket,
// 4 mittenlagret, 5 gula korset, 6 gula kanterna, 7 gula hörnen på plats, 8 vrid gula hörnen.
// Lösaren delar upp lösningen i små delar (en bit eller ett kubprogram i taget). Delarna blir uppgifter:
// läget före en del, och delens drag som lösning.

export type StegId = 'blomma' | 'kors' | 'horn' | 'mitten' | 'gulkors' | 'gulkant' | 'gulhorn' | 'vridhorn';
export const STEG: StegId[] = ['blomma', 'kors', 'horn', 'mitten', 'gulkors', 'gulkant', 'gulhorn', 'vridhorn'];

export type AlgId = 'hoger' | 'mitten-h' | 'mitten-v' | 'gulkors' | 'gulkant' | 'gulhorn' | 'ner';

/** Kubprogrammen (algoritmerna) som barnen lär sig, med namn. */
export const ALG: Record<AlgId, { namn: string; drag: Drag[] }> = {
  hoger: { namn: 'Höger-tricket', drag: ['R', 'U', "R'", "U'"] },
  'mitten-h': { namn: 'Mitten åt höger', drag: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'] },
  'mitten-v': { namn: 'Mitten åt vänster', drag: ["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"] },
  gulkors: { namn: 'Gula korset', drag: ['F', 'R', 'U', "R'", "U'", "F'"] },
  gulkant: { namn: 'Gula kanterna', drag: ['R', 'U', "R'", 'U', 'R', 'U2', "R'"] },
  gulhorn: { namn: 'Gula hörnen', drag: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'] },
  ner: { namn: 'Ner-tricket', drag: ["R'", "D'", 'R', 'D'] },
};

export interface Del {
  steg: StegId;
  /** Kuben före delen. */
  fore: Kub;
  /** Vrid U och/eller hela kuben (y) så att biten står rätt. */
  forbered: Drag[];
  /** Själva knepet (kan vara samma kubprogram flera gånger). */
  alg: Drag[];
  algId?: AlgId;
  ganger?: number;
  /** Till sist (t.ex. vrid U på plats). */
  efter: Drag[];
  /** Färgerna på biten som delen handlar om. */
  bit?: Farg[];
  /** Delen lossar bara en bit som har fastnat på fel plats. */
  lossnar?: boolean;
}

export const delDrag = (d: Del): Drag[] => [...d.forbered, ...d.alg, ...d.efter];

const U_KANT: Record<string, Vec> = { UF: [0, 1, 1], UR: [1, 1, 0], UB: [0, 1, -1], UL: [-1, 1, 0] };
const UFR: Vec = [1, 1, 1];
const samma = (a: Vec, b: Vec) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const kanter = BITAR.filter((b) => b.typ === 'kant');
const horn = BITAR.filter((b) => b.typ === 'horn');
const rep = (alg: Drag[], n: number) => Array.from({ length: n }, () => alg).flat();
/** Bitens position när den har de här färgerna. */
const var_ = (k: Kub, f: Farg[]) => bitMedFarger(k, f).pos;

// ---------- räknare för varje steg ----------

/** Antal vita kanter med vitt uppåt (kronbladen runt den gula mitten). */
export const kronblad = (k: Kub) => kanter.filter((b) => b.pos[1] === 1 && k[pa(b, 'U')!] === 'w').length;
const vitaKanter = (k: Kub) => kanter.filter((b) => farger(k, b).includes('w'));
/** Vita kanter som sitter rätt i korset. */
export const korsKanter = (k: Kub) => kanter.filter((b) => b.pos[1] === -1 && sitter(k, b) && farger(k, b).includes('w')).length;
export const korsKlart = (k: Kub) => korsKanter(k) === 4;
/** Hela första lagret (vita sidan) sitter. */
export const forstaLagret = (k: Kub) => BITAR.filter((b) => b.pos[1] === -1).every((b) => sitter(k, b));
export const tvaLager = (k: Kub) => BITAR.filter((b) => b.pos[1] <= 0).every((b) => sitter(k, b));
/** Kanter i övre lagret med gult uppåt. */
export const gulaUpp = (k: Kub) => kanter.filter((b) => b.pos[1] === 1 && k[pa(b, 'U')!] === 'y');
export const gultKors = (k: Kub) => gulaUpp(k).length === 4;
export const gulaKanterSitter = (k: Kub) => kanter.filter((b) => b.pos[1] === 1).every((b) => sitter(k, b));
export const gulaHornPaPlats = (k: Kub) => horn.filter((b) => b.pos[1] === 1).every((b) => paPlats(k, b));

// ---------- sökning (blomman) ----------

const SOK: Drag[] = FACE_DRAG.flatMap((f) => [f, `${f}'`, `${f}2`]);

/** Kortaste dragen till målet (iterativ fördjupning). */
export function sok(k: Kub, mal: (k: Kub) => boolean, max = 5): Drag[] | null {
  const path: Drag[] = [];
  const dfs = (s: Kub, djup: number, last: string): boolean => {
    if (mal(s)) return true;
    if (djup === 0) return false;
    for (const d of SOK) {
      const b = d[0];
      // Samma sida två gånger i rad är onödigt, och motsatta sidor tas bara i en ordning.
      if (b === last || (MOTSATT[b] === last && b < last)) continue;
      path.push(d);
      if (dfs(vrid(s, d), djup - 1, b)) return true;
      path.pop();
    }
    return false;
  };
  for (let djup = 0; djup <= max; djup++) if (dfs(k, djup, '')) return path.slice();
  return null;
}

// ---------- lösaren ----------

/** Löser kuben med nybörjarmetoden och delar upp lösningen. */
export function los(start: Kub): Del[] {
  const ut: Del[] = [];
  let k = start;
  const push = (d: Omit<Del, 'fore'>) => {
    ut.push({ ...d, fore: k });
    k = vrid(k, delDrag(d as Del));
  };
  const vakt = (n: number, vad: string) => { if (n > 40) throw new Error(`Lösaren fastnade i ${vad}`); };

  // 1–2. Blomman och korset.
  if (!korsKlart(k)) {
    for (let n = 0; kronblad(k) < 4; n++) {
      vakt(n, 'blomman');
      const fore = kronblad(k);
      const fore_ = vitaKanter(k).filter((b) => b.pos[1] === 1 && k[pa(b, 'U')!] === 'w').map((b) => farger(k, b).join(''));
      const s = sok(k, (x) => kronblad(x) > fore, 6);
      if (!s) throw new Error('Inget kronblad hittades');
      const efter = vrid(k, s);
      const ny = vitaKanter(efter).find((b) => b.pos[1] === 1 && efter[pa(b, 'U')!] === 'w' && !fore_.some((f) => sammaF(f, farger(efter, b))));
      push({ steg: 'blomma', forbered: [], alg: s, efter: [], bit: ny ? farger(efter, ny) : undefined });
    }
    for (let n = 0; !korsKlart(k); n++) {
      vakt(n, 'korset');
      let gjort = false;
      for (let u = 0; u < 4 && !gjort; u++) {
        const kk = vrid(k, varv('U', u));
        const b = kanter.find((e) => e.pos[1] === 1 && kk[pa(e, 'U')!] === 'w' && sitterSidan(kk, e));
        if (!b) continue;
        const sida = sidanAv(b);
        push({ steg: 'kors', forbered: varv('U', u), alg: [`${sida}2`], efter: [], bit: farger(kk, b) });
        gjort = true;
      }
      if (!gjort) throw new Error('Korset gick inte');
    }
  }

  // 3. Vita hörnen med höger-tricket.
  for (let n = 0; !forstaLagret(k); n++) {
    vakt(n, 'vita hörnen');
    const uppe = horn.find((b) => b.pos[1] === 1 && farger(k, b).includes('w'));
    if (uppe) {
      const f = farger(k, uppe);
      const mal = hem(k, f).pos;
      const u = [0, 1, 2, 3].find((i) => { const p = var_(vrid(k, varv('U', i)), f); return p[0] === mal[0] && p[2] === mal[2]; })!;
      const r = [0, 1, 2, 3].find((i) => samma(var_(vrid(k, [...varv('U', u), ...varv('y', i)]), f), UFR))!;
      const forbered = [...varv('U', u), ...varv('y', r)];
      let kk = vrid(k, forbered), g = 0;
      while (!sitter(kk, hem(kk, f))) { kk = vrid(kk, ALG.hoger.drag); if (++g > 6) throw new Error('Hörnet vill inte'); }
      push({ steg: 'horn', forbered, alg: rep(ALG.hoger.drag, g), algId: 'hoger', ganger: g, efter: [], bit: f });
    } else {
      const fast = horn.find((b) => b.pos[1] === -1 && !sitter(k, b))!;
      const f = farger(k, fast);
      const r = [0, 1, 2, 3].find((i) => samma(var_(vrid(k, varv('y', i)), f), [1, -1, 1]))!;
      push({ steg: 'horn', forbered: varv('y', r), alg: ALG.hoger.drag, algId: 'hoger', ganger: 1, efter: [], bit: f, lossnar: true });
    }
  }

  // 4. Mittenlagret.
  for (let n = 0; !tvaLager(k); n++) {
    vakt(n, 'mittenlagret');
    const uppe = kanter.find((b) => b.pos[1] === 1 && !farger(k, b).includes('y'));
    if (uppe) {
      const f = farger(k, uppe);
      const u = [0, 1, 2, 3].find((i) => { const kk = vrid(k, varv('U', i)); return sitterSidan(kk, bitMedFarger(kk, f)); })!;
      const r = [0, 1, 2, 3].find((i) => samma(var_(vrid(k, [...varv('U', u), ...varv('y', i)]), f), U_KANT.UF))!;
      const forbered = [...varv('U', u), ...varv('y', r)];
      const kk = vrid(k, forbered);
      const topp = kk[pa(bitMedFarger(kk, f), 'U')!];
      const algId: AlgId = topp === kk[13] ? 'mitten-h' : 'mitten-v'; // 13 = mittbiten på R
      push({ steg: 'mitten', forbered, alg: ALG[algId].drag, algId, ganger: 1, efter: [], bit: f });
    } else {
      const fast = kanter.find((b) => b.pos[1] === 0 && !sitter(k, b))!;
      const f = farger(k, fast);
      const r = [0, 1, 2, 3].find((i) => samma(var_(vrid(k, varv('y', i)), f), [1, 0, 1]))!;
      push({ steg: 'mitten', forbered: varv('y', r), alg: ALG['mitten-h'].drag, algId: 'mitten-h', ganger: 1, efter: [], bit: f, lossnar: true });
    }
  }

  // 5. Gula korset: prick → L → linje → kors. L:et hålls bak och till vänster, linjen liggande.
  for (let n = 0; !gultKors(k); n++) {
    vakt(n, 'gula korset');
    const u = [0, 1, 2, 3].find((i) => gulForm(vrid(k, varv('U', i))) !== 'fel')!;
    push({ steg: 'gulkors', forbered: varv('U', u), alg: ALG.gulkors.drag, algId: 'gulkors', ganger: 1, efter: [] });
  }

  // 6. Gula kanterna: vrid U så att två kanter passar, håll dem bak och till höger.
  for (let n = 0; !gulaKanterSitter(k); n++) {
    vakt(n, 'gula kanterna');
    const u = basta(k, (x) => kanterSomSitter(x).length);
    const ku = vrid(k, varv('U', u));
    if (kanterSomSitter(ku).length === 4) { push({ steg: 'gulkant', forbered: varv('U', u), alg: [], efter: [] }); break; }
    const r = [0, 1, 2, 3].find((i) => { const s = kanterSomSitter(vrid(ku, varv('y', i))); return s.includes('UB') && s.includes('UR'); }) ?? 0;
    const kk = vrid(ku, [...varv('y', r), ...ALG.gulkant.drag]);
    const u2 = basta(kk, (x) => kanterSomSitter(x).length);
    push({ steg: 'gulkant', forbered: [...varv('U', u), ...varv('y', r)], alg: ALG.gulkant.drag, algId: 'gulkant', ganger: 1, efter: varv('U', u2) });
  }

  // 7. Gula hörnen på plats: ett hörn som är på plats hålls fram till höger.
  for (let n = 0; !gulaHornPaPlats(k); n++) {
    vakt(n, 'gula hörnen');
    const r = [0, 1, 2, 3].find((i) => { const kk = vrid(k, varv('y', i)); return paPlats(kk, bitVidPos(UFR)); }) ?? 0;
    push({ steg: 'gulhorn', forbered: varv('y', r), alg: ALG.gulhorn.drag, algId: 'gulhorn', ganger: 1, efter: [] });
  }

  // 8. Vrid gula hörnen: ner-tricket tills gult är uppåt, sedan bara U till nästa hörn.
  if (!arLost(k)) {
    const vriden = (x: Kub) => x[pa(bitVidPos(UFR), 'U')!] !== 'y';
    let forsta = true;
    for (let n = 0; ; n++) {
      vakt(n, 'vrid hörnen');
      const kvar = horn.some((b) => b.pos[1] === 1 && k[pa(b, 'U')!] !== 'y');
      if (!kvar) {
        const u = [0, 1, 2, 3].find((i) => arLost(vrid(k, varv('U', i))));
        if (u === undefined) throw new Error('Kuben blev inte löst');
        if (u) {
          if (ut.length && ut[ut.length - 1].steg === 'vridhorn') { const sista = ut.pop()!; k = sista.fore; push({ ...sista, efter: varv('U', u) }); }
          else push({ steg: 'vridhorn', forbered: varv('U', u), alg: [], efter: [] });
        }
        break;
      }
      const vrida = forsta ? 'y' : 'U';
      const i = [0, 1, 2, 3].find((j) => vriden(vrid(k, varv(vrida, j))))!;
      const forbered = varv(vrida, i);
      let kk = vrid(k, forbered), g = 0;
      while (vriden(kk)) { kk = vrid(kk, ALG.ner.drag); if (++g > 6) throw new Error('Hörnet vrids inte'); }
      push({ steg: 'vridhorn', forbered, alg: rep(ALG.ner.drag, g), algId: 'ner', ganger: g, efter: [], bit: farger(vrid(k, forbered), bitVidPos(UFR)) });
      forsta = false;
    }
  }
  if (!arLost(k)) throw new Error('Kuben blev inte löst');
  return ut;
}

const sammaF = (a: string, b: Farg[]) => a.length === b.length && b.every((f) => a.includes(f));
const bitVidPos = (p: Vec): Bit => BITAR.find((b) => samma(b.pos, p))!;
const sidanAv = (b: Bit): Sida => (b.pos[0] === 1 ? 'R' : b.pos[0] === -1 ? 'L' : b.pos[2] === 1 ? 'F' : 'B');
/** En kant i övre lagret vars sidofärg (den som inte pekar uppåt) passar mittbiten under. */
function sitterSidan(k: Kub, b: Bit) {
  const sida = sidanAv(b);
  return k[pa(b, sida)!] === mitt(k, sida);
}
const kanterSomSitter = (k: Kub) => Object.entries(U_KANT).filter(([, p]) => sitter(k, bitVidPos(p))).map(([n]) => n);
/** U-vridningen (0–3) som ger mest. */
function basta(k: Kub, varde: (k: Kub) => number) {
  let best = 0, v = -1;
  for (let u = 0; u < 4; u++) { const x = varde(vrid(k, varv('U', u))); if (x > v) { v = x; best = u; } }
  return best;
}

/** Gula toppens form: prick, L (bak och vänster), linje (liggande) – eller 'fel' om den inte hålls rätt. */
export function gulForm(k: Kub): 'prick' | 'L' | 'linje' | 'kors' | 'fel' {
  const s = Object.entries(U_KANT).filter(([, p]) => k[pa(bitVidPos(p), 'U')!] === 'y').map(([n]) => n).sort().join(',');
  if (s === '') return 'prick';
  if (s === 'UB,UF,UL,UR') return 'kors';
  if (s === 'UL,UR') return 'linje';
  if (s === 'UB,UL') return 'L';
  return 'fel';
}

/** Gula topp-formen oavsett hur den hålls (för lektioner och frågor). */
export function gulFormFri(k: Kub): 'prick' | 'L' | 'linje' | 'kors' {
  const n = gulaUpp(k).length;
  if (n === 0) return 'prick';
  if (n === 4) return 'kors';
  for (let u = 0; u < 4; u++) { const f = gulForm(vrid(k, varv('U', u))); if (f === 'linje') return 'linje'; if (f === 'L') return 'L'; }
  return 'prick';
}

/** Steget som kuben står på (det första som inte är klart). */
export function stegNu(k: Kub): StegId | 'klar' {
  if (arLost(k)) return 'klar';
  const d = los(k)[0];
  return d ? d.steg : 'klar';
}
