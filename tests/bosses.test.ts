import { describe, expect, it } from 'vitest';
import { BOSS_SLOTS, GENERIC_PERSONAS, personaFor } from '../src/content/bosses';
import type { FamilyPack } from '../src/platform/gate/gate';

const pack: FamilyPack = {
  format: 'azaleaporten-familjepaket', v: 1,
  personas: [
    { boss: 'talbergen.region', name: 'Åk4-mästaren', title: 't', entrance: 'e', defeat: 'd', grades: [4, 4] },
    { boss: 'talbergen.region', name: 'Alla-mästaren', title: 't', entrance: 'e', defeat: 'd' },
  ],
};

describe('boss-personor', () => {
  it('varje allmän persona hör till en känd boss-plats', () => {
    const ids = new Set(BOSS_SLOTS.map((s) => s.id));
    for (const p of GENERIC_PERSONAS) expect(ids.has(p.boss)).toBe(true);
  });
  it('utan paket används den allmänna personan', () => expect(personaFor('talbergen.region', null, 4)?.name).toBe('Professor Pi'));
  it('paketet väljer årskursens persona först', () => expect(personaFor('talbergen.region', pack, 4)?.name).toBe('Åk4-mästaren'));
  it('annars paketets persona utan årskurs', () => expect(personaFor('talbergen.region', pack, 2)?.name).toBe('Alla-mästaren'));
  it('platser som paketet inte täcker får den allmänna', () => expect(personaFor('ordskogen.region', pack, 2)?.name).toBe('Fru Grammatika'));
});
