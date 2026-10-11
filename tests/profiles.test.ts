import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, deleteHero, enterHero, getHeroState, getMeta, getProfile, listHeroes, nameTaken } from '../src/platform/profiles';
import { listBackups } from '../src/platform/storage/backup';
import { kv } from '../src/platform/storage/kv';
import { greeting } from '../src/platform/greeting';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });

const hero = (name: string) => createHero({ name, animal: 'rav', color: 'azalea', heroClass: 'riddare', grade: 4 });

describe('hjältar', () => {
  it('skapar hjältar med UUID, inte namn, som id', () => {
    const p = hero('  Hjälte   Ett ');
    expect(p.name).toBe('Hjälte Ett');
    expect(p.id).not.toContain('Hjälte');
    expect(listHeroes().map((h) => h.name)).toEqual(['Hjälte Ett']);
    expect(getHeroState(p.id).level).toBe(1);
    expect(getMeta().lastHero).toBe(p.id);
  });

  it('tillåter samma namn två gånger men varnar', () => {
    hero('Hjälte1');
    expect(nameTaken('hjälte1')).toBe(true);
    hero('Hjälte1');
    expect(listHeroes()).toHaveLength(2);
  });

  it('enterHero returnerar förra besöket', () => {
    const p = hero('Hjälte1');
    expect(enterHero(p.id)).toBeNull();
    const before = getProfile(p.id)!.lastActiveAt; // enterHero sparar ett nytt besök, så läs det förra först
    expect(enterHero(p.id)).toBe(before);
  });

  it('radering tar backup och tar bort alla hjältens nycklar', () => {
    const a = hero('Hjälte1');
    const b = hero('Hjälte2');
    deleteHero(a.id);
    expect(listBackups()).toHaveLength(1);
    expect(kv.keys(`h:${a.id}:`)).toEqual([]);
    expect(listHeroes().map((h) => h.id)).toEqual([b.id]);
  });
});

describe('Mästare Kastanjs hälsning', () => {
  const now = new Date('2026-10-11T15:00:00');
  it('hälsar välkommen första gången', () => expect(greeting('Hjälte1', null, null, now)).toContain('Välkommen till ön'));
  it('samma dag', () => expect(greeting('Hjälte1', '2026-10-11T08:00:00', null, now)).toContain('Hej igen'));
  it('räknar dagar', () => expect(greeting('Hjälte1', '2026-10-06T20:00:00', null, now)).toContain('5 dagar'));
  it('lång paus', () => expect(greeting('Hjälte1', '2026-09-01T20:00:00', null, now)).toContain('värmer upp'));
  it('föreslår repetition av det senaste', () => expect(greeting('Hjälte1', '2026-10-10T08:00:00', 'Halvsaurus', now)).toContain('Övningsängen'));
});
