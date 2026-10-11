import { beforeEach, describe, expect, it } from 'vitest';
import { kv, MemoryBackend, onSpaceFreed, setBackend, StorageFullError } from '../src/platform/storage/kv';
import { _resetRecordState, saveRecord } from '../src/platform/storage/record';
import { listBackups, snapshot } from '../src/platform/storage/backup';
import { getEvents, logEvents, type LogEvent } from '../src/platform/learning/events';
import { minutesPerDay, sessions, skillColor, topErrors } from '../src/platform/learning/stats';
import { getQuests, QUESTS } from '../src/platform/learning/quests';
import { backupDue, createHero, getMeta, heroKey, markExported } from '../src/platform/profiles';
import { freshStorage } from './helpers';

/** Lagring med ett tak, som en riktig webbläsare (räknar tecken i nyckel + värde). */
class SmallBackend extends MemoryBackend {
  limit: number;
  constructor(limit: number) { super(); this.limit = limit; }
  used() { let n = 0; for (let i = 0; i < this.length; i++) { const k = this.key(i)!; n += k.length + this.getItem(k)!.length; } return n; }
  setItem(key: string, value: string) {
    const old = this.getItem(key);
    const after = this.used() - (old == null ? 0 : key.length + old.length) + key.length + value.length;
    if (after > this.limit) throw new DOMException('full', 'QuotaExceededError');
    super.setItem(key, value);
  }
}

const ev = (t: string, patch: Partial<LogEvent> = {}): LogEvent => ({ t, a: 'tabellgruvan', n: 'x', k: 'ma.mult.2', c: true, ms: 5000, ...patch });
const hero = () => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'ranger', grade: 4 }).id;

describe('full lagring', () => {
  let b: SmallBackend;
  beforeEach(() => {
    b = new SmallBackend(10_000_000);
    setBackend(b);
    _resetRecordState();
  });

  it('rensar gamla backuper och gammal statistik men aldrig framsteg', () => {
    const hid = hero();
    logEvents(hid, Array.from({ length: 1000 }, (_, i) => ev(new Date(2026, 9, 1, 10, 0, i).toISOString())));
    kv.set(`h:${hid}:area:tabellgruvan`, { v: 1, stages: { a: { stars: 3 } }, bosses: {}, xp: 99 });
    snapshot('ett'); snapshot('två'); snapshot('tre');
    expect(listBackups()).toHaveLength(3);
    const newest = listBackups().at(-1);

    let freed = 0;
    onSpaceFreed(() => freed++);
    b.limit = b.used() + 100; // nästan fullt
    kv.set('stort', 'x'.repeat(5000));

    expect(kv.get('stort')).toHaveLength(5000);
    expect(freed).toBe(1);
    expect(listBackups()).toEqual([newest]); // den senaste backupen finns kvar
    expect(getEvents(hid)).toHaveLength(1000); // backuperna räckte, statistiken orörd
    expect(kv.get<{ xp: number }>(`h:${hid}:area:tabellgruvan`)!.xp).toBe(99);
  });

  it('halverar händelseloggen när backuperna inte räcker, men behåller minst 200', () => {
    const hid = hero();
    logEvents(hid, Array.from({ length: 1000 }, (_, i) => ev(new Date(2026, 9, 1, 10, 0, i).toISOString(), { n: `n${i}` })));
    b.limit = b.used() + 100;
    kv.set('stort', 'x'.repeat(20_000));
    const log = getEvents(hid);
    expect(log.length).toBeLessThan(1000);
    expect(log.length).toBeGreaterThanOrEqual(200);
    expect(log.at(-1)!.n).toBe('n999'); // de nyaste behålls
  });

  it('kastar StorageFullError när inget mer går att rensa, och lämnar datan orörd', () => {
    const hid = hero();
    b.limit = b.used() + 10;
    expect(() => kv.set('stort', 'x'.repeat(1000))).toThrow(StorageFullError);
    expect(kv.get('stort')).toBeUndefined();
    expect(getMeta().heroes).toEqual([hid]);
  });
});

describe('statistik för Vuxenläge', () => {
  it('minuter per dag: en minut som mest per fråga, bara de senaste dagarna', () => {
    const days = minutesPerDay([
      ev('2026-10-10T10:00:00', { ms: 30_000 }),
      ev('2026-10-10T10:01:00', { ms: 30_000 }),
      ev('2026-10-11T09:00:00', { ms: 600_000 }), // gick ifrån: räknas som en minut
      ev('2026-09-01T09:00:00', { ms: 60_000 }), // för gammal
    ], 3, '2026-10-11');
    expect(days).toEqual([
      { day: '2026-10-09', min: 0, n: 0 },
      { day: '2026-10-10', min: 1, n: 2 },
      { day: '2026-10-11', min: 1, n: 1 },
    ]);
  });

  it('pass delas vid 20 minuters paus, senaste först, och sorteras på tid', () => {
    const list = sessions([
      ev('2026-10-11T18:00:00', { a: 'tidstornet', c: false }),
      ev('2026-10-11T10:00:00'),
      ev('2026-10-11T10:05:00', { a: 'fluffy' }),
      ev('2026-10-11T18:10:00', { a: 'tidstornet' }),
    ]);
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ start: '2026-10-11T18:00:00', n: 2, right: 1, areas: ['tidstornet'] });
    expect(list[1]).toMatchObject({ n: 2, right: 2, areas: ['tabellgruvan', 'fluffy'] });
  });

  it('färg per färdighet: röd = dags att repetera, grön = sitter', () => {
    const it = { box: 4, due: '2026-10-20', seen: 9, correct: 9, area: 'x', lastSeen: '2026-10-01' };
    expect(skillColor(it, '2026-10-11')).toBe('gron');
    expect(skillColor({ ...it, box: 2 }, '2026-10-11')).toBe('gul');
    expect(skillColor({ ...it, due: '2026-10-11' }, '2026-10-11')).toBe('rod');
  });

  it('vanligaste felen per område, utan "annat"', () => {
    const errs = topErrors([
      ev('t1', { c: false, e: 'plus' }), ev('t2', { c: false, e: 'plus' }), ev('t3', { c: false, e: 'noll-ett' }),
      ev('t4', { c: false, e: 'annat' }), ev('t5', { c: false, e: 'halv', a: 'tidstornet' }), ev('t6', { e: 'plus' }),
    ]);
    expect(errs).toEqual({ tabellgruvan: [{ tag: 'plus', n: 2 }, { tag: 'noll-ett', n: 1 }], tidstornet: [{ tag: 'halv', n: 1 }] });
  });
});

describe('uppdragshistorik och påminnelse om säkerhetskopia', () => {
  beforeEach(() => { freshStorage(); });

  it('gårdagens uppdrag sparas i historiken när en ny dag börjar', () => {
    const hid = hero();
    saveRecord(heroKey(hid, 'quests'), QUESTS, {
      ...QUESTS.defaults(), day: '2026-10-10',
      list: [{ kind: 'dimma', label: 'a', done: true }, { kind: 'ova', label: 'b', done: true }, { kind: 'framsteg', label: 'c', done: false }],
    });
    const q = getQuests(hid, '2026-10-11');
    expect(q.history).toEqual([{ day: '2026-10-10', done: 2, of: 3 }]);
    expect(getQuests(hid, '2026-10-11').history).toHaveLength(1); // samma dag igen: ingen dubblett
  });

  it('påminner efter 30 dagar utan säkerhetskopia', () => {
    const now = Date.now();
    hero();
    expect(backupDue(new Date(now + 29 * 86_400_000))).toBe(false);
    expect(backupDue(new Date(now + 31 * 86_400_000))).toBe(true);
    markExported(new Date(now + 31 * 86_400_000));
    expect(backupDue(new Date(now + 32 * 86_400_000))).toBe(false);
  });

  it('ingen påminnelse utan hjältar', () => {
    expect(backupDue(new Date(Date.now() + 90 * 86_400_000))).toBe(false);
  });
});
