import { describe, expect, it } from 'vitest';
import { BITAR, LOST, PLATSER, arLost, bitMedFarger, dragBas, inv, invDrag, pa, parse, sitter, vrid, type Drag, type Farg } from '../src/engines/kub/kub';
import { ALG, delDrag, gulForm, gulFormFri, los, type Del } from '../src/engines/kub/losning';
import { KUB_ERR, blanda, diagnosDrag, diagnosLosa, explainKub, klart, makeKub, specsForSkill, type KubQ } from '../src/games/kub/logic';
import { KUBLABBET } from '../src/games/kub/content';
import { allNodes } from '../src/platform/rpg/types';
import { rngFrom } from '../src/platform/rng';
import { skillLabel } from '../src/content/skills';
import { loadAllGames } from '../src/content/areas';

// Kublabbet: kubmodellen, nybörjarlösaren och frågorna.

const slump = (seed: number, n = 25) => vrid(LOST, blanda(rngFrom(seed), n));

describe('kubmodellen', () => {
  it('har 26 bitar: 6 mitt, 12 kanter och 8 hörn', () => {
    expect(BITAR.filter((b) => b.typ === 'mitt').length).toBe(6);
    expect(BITAR.filter((b) => b.typ === 'kant').length).toBe(12);
    expect(BITAR.filter((b) => b.typ === 'horn').length).toBe(8);
  });

  it('fyra kvartsvarv blir ingenting, och prim tar tillbaka', () => {
    for (const d of ['R', 'L', 'U', 'D', 'F', 'B', 'y']) {
      expect(vrid(LOST, [d, d, d, d])).toBe(LOST);
      expect(vrid(vrid(LOST, d), invDrag(d))).toBe(LOST);
      expect(vrid(LOST, `${d}2`)).toBe(vrid(LOST, [d, d]));
    }
    const a = parse("R U R' U' F2 D B' L");
    expect(vrid(vrid(LOST, a), inv(a))).toBe(LOST);
  });

  it('dragen går åt rätt håll (medurs sett från sidan)', () => {
    // R: framsidans högra kolumn åker upp, så toppens högra kolumn blir grön (framsidans färg).
    const r = vrid(LOST, 'R');
    expect([r[2], r[5], r[8]]).toEqual(['g', 'g', 'g']);
    // U: framsidans översta rad går åt vänster, så vänstersidans översta rad blir grön.
    const u = vrid(LOST, 'U');
    expect(u.slice(36, 39)).toBe('ggg');
    // F: toppens nedersta rad går till höger sida, så höger sidas vänstra kolumn blir gul.
    const f = vrid(LOST, 'F');
    expect([f[9], f[12], f[15]]).toEqual(['y', 'y', 'y']);
    // L: framsidan åker ner, så framsidans vänstra kolumn blir gul (från toppen).
    const l = vrid(LOST, 'L');
    expect([l[18], l[21], l[24]]).toEqual(['y', 'y', 'y']);
  });

  it('höger-tricket sex gånger är ingenting', () => {
    expect(vrid(LOST, Array.from({ length: 6 }, () => ALG.hoger.drag).flat())).toBe(LOST);
  });
});

describe('nybörjarlösaren', () => {
  const losningar: { k: string; d: Del[] }[] = [];
  for (let s = 1; s <= 400; s++) { const k = slump(s); losningar.push({ k, d: los(k) }); }

  it('löser varje blandad kub', () => {
    for (const { k, d } of losningar) expect(arLost(vrid(k, d.flatMap(delDrag)))).toBe(true);
  });

  it('följer lektionernas regler', () => {
    for (const { d } of losningar) {
      const n = (steg: string) => d.filter((x) => x.steg === steg && x.alg.length).length;
      expect(n('gulkors')).toBeLessThanOrEqual(3); // prick → L → linje → kors
      expect(n('gulkant')).toBeLessThanOrEqual(2);
      expect(n('gulhorn')).toBeLessThanOrEqual(3);
      for (const x of d) {
        if (x.steg === 'horn' && !x.lossnar) expect([1, 3, 5]).toContain(x.ganger);
        if (x.steg === 'vridhorn' && x.alg.length) expect([2, 4]).toContain(x.ganger);
        if (x.steg === 'blomma') expect(x.alg.length).toBeLessThanOrEqual(5);
        if (x.steg === 'vridhorn' && x !== d.find((y) => y.steg === 'vridhorn')) expect(x.forbered.every((m) => dragBas(m) === 'U')).toBe(true);
      }
    }
  });

  it('gula korsets lägen i lektionen är rätt', () => {
    const bak = (alg: Drag[]) => vrid(LOST, inv(alg));
    expect(gulForm(bak(ALG.gulkors.drag))).toBe('linje');
    expect(gulForm(bak([...ALG.gulkors.drag, ...ALG.gulkors.drag]))).toBe('L');
    expect(gulFormFri('obyoygbrgyyrrrrrrryyobbbbbbwwwwwwwwwyyroooooogybgggggg')).toBe('prick');
  });
});

describe('frågorna', () => {
  const lagen: [string, number][] = [
    ['bitar', 0], ['bitar', 1], ['bitar', 2], ['drag', 0], ['drag', 1], ['vilket', 0], ['vilket', 1], ['sekvens', 0], ['sekvens', 1],
    ['baklanges', 0], ['blomma', 0], ['blomma', 1], ['kors', 0], ['kors', 1], ['horn', 0], ['horn', 1], ['horn', 2],
    ['mitten', 0], ['mitten', 1], ['mitten', 2], ['gulkors', 0], ['gulkors', 1], ['gulkant', 0], ['gulkant', 1],
    ['gulhorn', 0], ['gulhorn', 1], ['vridhorn', 0], ['vridhorn', 1], ['steg', 0], ['steg', 1], ['trick', 0], ['trick', 1],
    ['gul', 1], ['blandat', 0], ['blandat', 1], ['hela', 0],
  ];

  for (const [mode, level] of lagen) {
    it(`${mode} ${level}: riktiga frågor med ett rätt svar`, () => {
      for (let seed = 1; seed <= 30; seed++) {
        const q = makeKub({ mode, level }, rngFrom(seed * 31 + level));
        expect(skillLabel(q.skill), q.skill).not.toBe('något du har övat på');
        expect(q.start.length).toBe(54);
        check(q);
      }
    });
  }

  function check(q: KubQ) {
    switch (q.kind) {
      case 'gor': expect(q.alg!.length).toBeGreaterThan(0); break;
      case 'losa': {
        expect(klart(q, q.start), `${q.mode} är redan klar`).toBe(false);
        expect(klart(q, vrid(q.start, q.losning!)), `${q.mode}: lösningen fungerar inte`).toBe(true);
        if (q.maxDrag) expect(q.losning!.length).toBeLessThanOrEqual(q.maxDrag);
        break;
      }
      case 'bit': {
        expect(q.ratt!.length).toBeGreaterThan(0);
        // Biten syns från början, och varje klistermärke är antingen rätt eller har en felkod (kuben kan vridas).
        expect(q.ratt!.some((p) => ['U', 'F', 'R'].includes(PLATSER[p].sida))).toBe(true);
        for (let p = 0; p < 54; p++) expect(q.ratt!.includes(p) !== (q.fel![p] !== undefined), `${q.mode} ${p}`).toBe(true);
        break;
      }
      case 'vilket': case 'valj': {
        const labels = q.alts!.map((a) => a.label);
        expect(new Set(labels).size).toBe(labels.length);
        expect(q.alts!.filter((a) => !a.err).length).toBe(1);
        if (q.kind === 'vilket') expect(q.alts!.find((a) => !a.err)!.label).toBe(q.drag);
        break;
      }
    }
  }

  it('varje felkod har en etikett och en egen förklaring', () => {
    const q = makeKub({ mode: 'horn', level: 1 }, rngFrom(1));
    for (const tag of Object.keys(KUB_ERR)) expect(explainKub(tag, q).title, tag).not.toBe('Inte riktigt');
  });

  it('förklaringarna säger aldrig vilket drag som är rätt', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = makeKub({ mode: 'drag', level: 1 }, rngFrom(seed));
      for (const tag of Object.keys(KUB_ERR)) {
        const t = explainKub(tag, q).text;
        expect(t.includes(q.alg![0].replace("'", '′')), `${tag}: ${q.alg![0]}`).toBe(false);
      }
    }
  });

  it('fel drag diagnostiseras', () => {
    expect(diagnosDrag('R', "R'")).toBe('prim');
    expect(diagnosDrag('R', 'L')).toBe('motsatt-sida');
    expect(diagnosDrag('R', 'U')).toBe('fel-sida');
    expect(diagnosDrag('R2', "R'")).toBe('dubbel');
  });

  it('Krabban Bakfram (prim) kan slå till', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const q = makeKub({ mode: 'drag', level: 1, trap: 'prim' }, rngFrom(seed));
      expect(q.alg![0].endsWith("'")).toBe(true);
      expect(diagnosDrag(q.alg![0], invDrag(q.alg![0]))).toBe('prim');
    }
  });

  it('Målarmusen (fel-mitt): kronbladet ner utan att vrida U först', () => {
    let traffar = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const q = makeKub({ mode: 'kors', level: 1, trap: 'fel-mitt' }, rngFrom(seed));
      const b = BITAR.find((e) => e.typ === 'kant' && e.pos[1] === 1 && q.start[pa(e, 'U')!] === 'w')!;
      const sida = b.pos[0] === 1 ? 'R' : b.pos[0] === -1 ? 'L' : b.pos[2] === 1 ? 'F' : 'B';
      const k = vrid(q.start, `${sida}2`);
      if (!klart(q, k)) { expect(diagnosLosa(q, k, [`${sida}2`])).toBe('fel-mitt'); traffar++; }
    }
    expect(traffar).toBeGreaterThan(10);
  });

  it('Bläckfisken Rörallt (förstörde): att vrida botten förstör det som var klart', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const q = makeKub({ mode: rngFrom(seed).pick(['horn', 'mitten']), level: 1 }, rngFrom(seed));
      const k = vrid(q.start, ['D', 'R']);
      if (!klart(q, k)) expect(diagnosLosa(q, k, ['D', 'R'])).toBe('forstorde');
    }
  });

  it('baklänges: framlänges och fel ordning känns igen', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = makeKub({ mode: 'baklanges', level: 0 }, rngFrom(seed));
      const fram = vrid(q.start, q.alg!);
      if (!arLost(fram)) expect(diagnosLosa(q, fram, q.alg!)).toBe('framlanges');
      const ordning = vrid(q.start, q.alg!.map(invDrag));
      if (!arLost(ordning) && ordning !== fram) expect(diagnosLosa(q, ordning, q.alg!)).toBe('ordning');
    }
  });

  it('ett hörn som är på plats men fel vänt känns igen', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = makeKub({ mode: 'horn', level: 0 }, rngFrom(seed));
      const k = vrid(q.start, ALG.hoger.drag);
      const b = bitMedFarger(k, (q.mal as { typ: "horn"; bit: Farg[] }).bit);
      if (!klart(q, k) && !sitter(k, b) && b.pos[1] === -1 && b.pos[0] === 1 && b.pos[2] === 1) expect(diagnosLosa(q, k, ALG.hoger.drag)).toBe('vand-fel');
    }
  });

  it('färdigheterna har frågor för repetition', () => {
    const skills = new Set<string>();
    for (const [mode, level] of lagen) for (let s = 1; s <= 5; s++) skills.add(makeKub({ mode, level }, rngFrom(s)).skill);
    skills.delete('prog.kub.hela');
    for (const sk of skills) {
      const specs = specsForSkill(sk);
      expect(specs.length, sk).toBeGreaterThan(0);
      for (const sp of specs) expect(makeKub(sp, rngFrom(3)).skill).toBe(sk);
    }
  });
});

describe('området', () => {
  it('har banor, tre monster och en Mästare, och alla lägen fungerar', async () => {
    const games = await loadAllGames();
    const g = games.kublabbet;
    const nodes = allNodes(KUBLABBET);
    expect(nodes.filter((n) => n.type === 'boss' && n.kind === 'monster').length).toBe(3);
    expect(nodes.filter((n) => n.type === 'boss' && n.kind === 'mastare').length).toBe(1);
    for (const n of nodes) {
      const specs = n.type === 'stage' ? [n.spec] : n.pool;
      for (const sp of specs) for (let s = 1; s <= 5; s++) expect(g.skillOf(g.makeQuestion(sp, rngFrom(s)))).toMatch(/^prog\.kub\./);
    }
  });

  it('varje monsters fälla finns bland felkoderna', () => {
    for (const n of allNodes(KUBLABBET)) if (n.type === 'boss' && n.trap) expect(KUB_ERR[n.trap], n.trap).toBeDefined();
  });
});
