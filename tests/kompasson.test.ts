import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { allNodes, type AreaDef } from '../src/platform/rpg/types';
import { avstand, diagnoseAny, explainAny, isRight, nara, normNamn } from '../src/engines/karta/check';
import type { KartaGame, KartaQ } from '../src/engines/karta/types';
import { ballongGame, flaggGame, globGame, huvudstadGame, kartrumGame, sverigeGame } from '../src/games/geografi';
import { BALLONGRESAN, FLAGGMASTEN, GLOBEN, HUVUDSTADSEXPRESSEN, KARTRUMMET, SVERIGERESAN } from '../src/games/geografi/content';
import { DELAR, LAND, LAND_BY_ID, LIKNANDE_NAMN } from '../src/games/geografi/land';
import { FLAGGOR, LIKNANDE_FLAGGOR } from '../src/games/geografi/flaggor';
import { GRUPPER, META, VY, grannar, iGrupp, varldKarta } from '../src/games/geografi/kartor';
import { GRONLAND_FINNS } from '../src/games/geografi/globen';
import { ERR, type GQ } from '../src/games/geografi/gen';
import { skillLabel } from '../src/content/skills';
import { loadAllGames } from '../src/content/areas';
import { reveals, specsOf } from './ordcheck';

const AREAS: [AreaDef, KartaGame<GQ>][] = [
  [KARTRUMMET, kartrumGame], [GLOBEN, globGame], [SVERIGERESAN, sverigeGame],
  [BALLONGRESAN, ballongGame], [HUVUDSTADSEXPRESSEN, huvudstadGame], [FLAGGMASTEN, flaggGame],
];

describe('kartdatan och länderna', () => {
  it('varje land finns i kartdatan, med unika id:n och namn', () => {
    for (const l of LAND) expect(META[l.iso], `${l.id} (${l.iso})`).toBeTruthy();
    expect(new Set(LAND.map((l) => l.id)).size).toBe(LAND.length);
    expect(new Set(LAND.map((l) => l.iso)).size).toBe(LAND.length);
    const namn = LAND.flatMap((l) => [l.namn, ...(l.alias ?? [])].map(normNamn));
    expect(new Set(namn).size, 'namn och alias är unika').toBe(namn.length);
  });

  it('grannarna är ömsesidiga', () => {
    for (const l of LAND) for (const g of grannar(l.id)) expect(grannar(g), `${l.id} – ${g}`).toContain(l.id);
    expect(grannar('sverige').sort()).toEqual(['finland', 'norge']);
    expect(grannar('island')).toEqual([]);
  });

  it('världsdelarna stämmer för några kända länder', () => {
    const del = (id: string) => META[LAND_BY_ID[id].iso].del;
    expect(del('sverige')).toBe('europa');
    expect(del('kina')).toBe('asien');
    expect(del('kenya')).toBe('afrika');
    expect(del('mexiko')).toBe('nordamerika');
    expect(del('brasilien')).toBe('sydamerika');
    expect(del('australien')).toBe('oceanien');
    expect(del('papuanyaguinea')).toBe('oceanien');
    expect(del('indonesien')).toBe('asien');
    expect(GRONLAND_FINNS).toBe(true);
  });

  it('varje världsdel och varje grupp har något att visa', () => {
    const k = varldKarta({ delar: true });
    for (const d of DELAR) expect(k.ytor.find((y) => y.id === d.id)?.d.length, d.id).toBeGreaterThan(50);
    for (const g of Object.keys(GRUPPER)) expect(iGrupp(g).length, g).toBeGreaterThanOrEqual(4);
    expect(VY.sverige.landskap && Object.keys(VY.sverige.landskap).length).toBe(25);
  });

  it('liknande namn och flaggor pekar på riktiga länder', () => {
    for (const p of LIKNANDE_NAMN) for (const id of p) expect(LAND_BY_ID[id], id).toBeTruthy();
    for (const id of Object.keys(FLAGGOR)) expect(LAND_BY_ID[id], id).toBeTruthy();
    for (const g of LIKNANDE_FLAGGOR) for (const id of g) expect(FLAGGOR[id], id).toBeTruthy();
  });
});

describe('stavning av namn', () => {
  it('små stavfel räknas, men aldrig en annan huvudstad', () => {
    expect(nara('Stokholm', 'Stockholm')).toBe(true);
    expect(nara('Kopenhamn', 'Köpenhamn')).toBe(true);
    expect(nara('brasilia', 'Brasília')).toBe(true);
    expect(nara('Rom', 'Rom')).toBe(true);
    expect(nara('Ron', 'Rom')).toBe(false);
    expect(avstand('kitten', 'sitting')).toBe(3);
  });
});

/** Platserna som går att trycka på. */
const tappable = (q: KartaQ) => [
  ...(q.karta?.ytor ?? []).filter((y) => y.tap).map((y) => y.id),
  ...(q.karta?.prickar ?? []).filter((p) => p.tap).map((p) => p.id),
  ...(q.karta?.linjer ?? []).filter((l) => l.tap).map((l) => l.id),
];

const hasNumber = (text: string, n: string) => new RegExp(`(?<![\\d,.])${n.replace('.', '[.,]')}(?![\\d]|[,.]\\d)`).test(text);

/** Varje fråga i området: ett rätt svar, felen känns igen, och förklaringar och ledtrådar avslöjar aldrig svaret. */
function checkArea(def: AreaDef, g: KartaGame<GQ>, seeds = 40) {
  const tags = new Set<string>();
  for (const spec of specsOf(def)) {
    for (let seed = 0; seed < seeds; seed++) {
      const q = g.make(spec, rngFrom(seed * 7919 + spec.level), { seed, index: seed % 10 });
      const where = `${def.areaId} ${JSON.stringify(spec)} seed ${seed}`;
      expect(skillLabel(q.skill), q.skill).not.toBe('något du har övat på');
      expect(g.specsForSkill(q.skill).length, q.skill).toBeGreaterThan(0);
      expect(isRight(q, q.answer), where).toBe(true);
      const flagAlts = q.alts?.some((a) => a.flagga);
      const wrongs: string[] = [];
      if (q.kind === 'val') {
        const alts = q.alts!;
        expect(alts.filter((a) => !a.err).map((a) => a.text), where).toEqual([q.answer]);
        expect(new Set(alts.map((a) => a.text)).size, where).toBe(alts.length);
        expect(alts.length, where).toBeGreaterThanOrEqual(3);
        for (const a of alts.filter((x) => x.err)) { expect(diagnoseAny(q, a.text), where).toBe(a.err); wrongs.push(a.text); }
        if (!flagAlts) {
          expect(reveals(q.prompt, q.answer), `prompt: ${where}`).toBe(false);
          expect(reveals(q.tips, q.answer), `ledtråd: ${where}: ${q.tips}`).toBe(false);
          expect(q.los.toLocaleLowerCase('sv'), `lösning: ${where}`).toContain(q.answer.toLocaleLowerCase('sv'));
        }
      }
      if (q.kind === 'peka') {
        const t = tappable(q);
        expect(t, where).toContain(q.answer);
        for (const id of t.filter((x) => x !== q.answer)) { expect(q.misses?.[id], `${where}: ${id}`).toBeTruthy(); wrongs.push(id); }
      }
      if (q.kind === 'skriv') {
        expect(reveals(q.prompt, q.answer), `prompt: ${where}`).toBe(false);
        expect(reveals(q.tips, q.answer), `ledtråd: ${where}`).toBe(false);
        for (const a of q.answers ?? []) expect(isRight(q, a), where).toBe(true);
        // En annan huvudstad är aldrig rätt, hur lik den än är.
        for (const l of LAND) if (l.stad !== q.answer && !(q.answers ?? []).includes(l.stad)) expect(isRight(q, l.stad), `${where}: ${l.stad}`).toBe(false);
        for (const [k, tag] of Object.entries(q.cand ?? {})) { expect(diagnoseAny(q, k), where).toBe(tag); wrongs.push(k); }
      }
      if (q.kind === 'tal') {
        expect(hasNumber(q.prompt, q.answer), `prompt: ${where}`).toBe(false);
        expect(hasNumber(q.los, q.answer), `lösning: ${where}`).toBe(true);
        for (const [k, tag] of Object.entries(q.cand ?? {})) { expect(isRight(q, k), where).toBe(false); expect(diagnoseAny(q, k), where).toBe(tag); wrongs.push(k); }
      }
      for (const given of wrongs) {
        const tag = diagnoseAny(q, given);
        tags.add(tag);
        expect(ERR[tag] ?? (tag === 'annat' ? 'Annat fel' : undefined), `${where}: etikett för ${tag}`).toBeTruthy();
        const ex = explainAny(g, tag, q, given);
        const all = `${ex.title} ${ex.text}`;
        expect(all, where).not.toMatch(/undefined|NaN/);
        // Vid peka står platsens namn redan i frågan ("Tryck på Norge"), så då får förklaringen nämna det.
        if (q.kind === 'tal') expect(hasNumber(all, q.answer), `${where}: ${tag}: ${all}`).toBe(false);
        else if (q.kind !== 'peka' && !flagAlts) expect(reveals(all, q.answer), `${where}: ${tag}: ${all}`).toBe(false);
      }
    }
  }
  return tags;
}

describe('Kompassöns områden', () => {
  it('Kartrummet', () => {
    const tags = checkArea(KARTRUMMET, kartrumGame);
    for (const t of ['ost-vast', 'fel-vaderstreck', 'fel-riktning', 'norr-upp', 'fel-symbol', 'fel-hojd', 'skala-bakvand', 'skala-glomd', 'skala-plus']) expect(tags, t).toContain(t);
  });
  it('Globen', () => {
    const tags = checkArea(GLOBEN, globGame);
    for (const t of ['fel-varldsdel', 'nord-syd-amerika', 'oceanien-asien', 'fel-hav', 'norr-soder']) expect(tags, t).toContain(t);
  });
  it('Globen: Grönland i Europa är fällan "politisk"', () => {
    let seen = false;
    for (let seed = 0; seed < 300 && !seen; seed++) {
      const q = globGame.make({ mode: 'land', level: 0 }, rngFrom(seed));
      if (q.om !== 'Grönland') continue;
      seen = true;
      expect(q.answer).toBe('Nordamerika');
      expect(q.alts!.find((a) => a.text === 'Europa')?.err).toBe('politisk');
    }
    expect(seen).toBe(true);
  });
  it('Sverigeresan', () => {
    const tags = checkArea(SVERIGERESAN, sverigeGame);
    for (const t of ['fel-stad', 'fel-plats', 'granne', 'fel-landsdel', 'fel-landskap']) expect(tags, t).toContain(t);
  });
  it('Ballongresan', () => {
    const tags = checkArea(BALLONGRESAN, ballongGame);
    for (const t of ['granne', 'fel-land', 'liknande-namn']) expect(tags, t).toContain(t);
  });
  it('Huvudstadsexpressen', () => {
    const tags = checkArea(HUVUDSTADSEXPRESSEN, huvudstadGame);
    for (const t of ['storsta-staden', 'granne-huvudstad', 'fel-stad', 'ar-huvudstad']) expect(tags, t).toContain(t);
  });
  it('Flaggmasten', () => {
    const tags = checkArea(FLAGGMASTEN, flaggGame);
    for (const t of ['liknande-flagga', 'fel-land']) expect(tags, t).toContain(t);
  });
});

describe('Kompassöns bossar', () => {
  it('varje fälla kan slå till i varje fråga som riktar in sig på den', () => {
    for (const [def, g] of AREAS) {
      for (const n of allNodes(def)) {
        if (n.type !== 'boss' || !n.trap) continue;
        for (const s of n.pool) for (const level of [s.level, s.level + 1]) for (let seed = 0; seed < 30; seed++) {
          const q = g.make({ ...s, level, trap: n.trap }, rngFrom(seed));
          const tags = [...(q.alts ?? []).map((a) => a.err), ...Object.values(q.misses ?? {}), ...Object.values(q.cand ?? {})];
          expect(tags, `${n.id} nivå ${level} seed ${seed}`).toContain(n.trap);
        }
      }
    }
  });

  it('samma seed ger samma fråga', () => {
    for (const [def, g] of AREAS) for (const spec of specsOf(def)) {
      expect(JSON.stringify(g.make(spec, rngFrom(42)))).toBe(JSON.stringify(g.make(spec, rngFrom(42))));
    }
  });

  it('regionbossen blandar alla områden', async () => {
    const games = await loadAllGames();
    const region = games.kompasson;
    for (const area of AREAS.map(([d]) => d.areaId)) {
      const q = region.makeQuestion({ mode: `${area}/blandat`, level: 1 }, rngFrom(3));
      expect(region.areaOf?.(q)).toBe(area);
      expect(skillLabel(region.skillOf(q))).not.toBe('något du har övat på');
    }
  });
});
