import { dataRev, go, heroId } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import { gradeName, heroClass } from '../content/heroes';
import { REGIONS } from '../content/world';
import { leaveToPicker } from '../session';
import { Avatar, Screen } from './ui';

// Azaleagården: hjältens hem. Hjältebladet fylls med riktiga värden i fas 3.

const SLOTS = [
  { id: 'huvud', icon: '⛑️', name: 'Huvud' },
  { id: 'kropp', icon: '🦺', name: 'Kropp' },
  { id: 'vapen', icon: '🗡️', name: 'Vapen' },
  { id: 'skold', icon: '🛡️', name: 'Sköld/Bok' },
  { id: 'amulett', icon: '📿', name: 'Amulett' },
  { id: 'husdjur', icon: '🐾', name: 'Husdjur' },
];

const KUNSKAPER: Record<string, { name: string; icon: string }> = {
  talbergen: { name: 'Talkraft', icon: '🔢' },
  ordskogen: { name: 'Ordmagi', icon: '🔤' },
  vasteron: { name: 'Världsspråk', icon: '🌍' },
};

export function Gard() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);
  const c = heroClass(p.heroClass);

  return (
    <Screen class="gard">
      <header class="topbar">
        <button class="btn" onClick={() => go('karta')}>← Till kartan</button>
        <span class="purse">🌰 {s.kastanjer} · 🌸 {s.blad}</span>
      </header>
      <h1 class="page-title">🏡 Azaleagården</h1>

      <section class="sheet card">
        <div class="sheet-head">
          <Avatar p={p} size={88} />
          <div>
            <h2>{p.name}</h2>
            <p>{c.emoji} {c.name} · Nivå {s.level}</p>
            <p class="muted">{gradeName(p.grade)} · {c.perk}</p>
          </div>
        </div>
        <div class="xpbar" aria-label={`${s.xp} XP`}><div style={{ width: '0%' }} /></div>

        <h3>Kunskaper</h3>
        {REGIONS.map((r) => (
          <div class="skill-row" key={r.id}>
            <span>{KUNSKAPER[r.id].icon} {KUNSKAPER[r.id].name}</span>
            <small class="muted">{r.name}</small>
            <span class="skill-level">Nivå 0</span>
          </div>
        ))}

        <h3>Utrustning</h3>
        <div class="slots">
          {SLOTS.map((sl) => (
            <div class="slot" key={sl.id}><span>{sl.icon}</span><small>{sl.name}</small></div>
          ))}
        </div>
        <p class="note">Besegra bossar och öppna skattkistor för att hitta utrustning. Det kommer snart!</p>
      </section>

      <footer class="map-foot">
        <button class="link" onClick={leaveToPicker}>Byt hjälte</button>
      </footer>
    </Screen>
  );
}
