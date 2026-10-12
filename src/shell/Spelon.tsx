import { dataRev, go, heroId } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import { SPEL_TITLAR } from '../platform/rpg/nycklar';
import { leaveToPicker } from '../session';
import { BackBar, Screen } from './ui';
import { Purse, TokenRow } from './Polletter';

// Spelön: en egen liten ö med minispelen. De kostar polletter och ger azaleablad, aldrig kastanjer.

export const MINISPEL = [
  { id: 'dimstormen', icon: '🌪️', name: 'Dimstormen', desc: 'Stå emot monstren ur dimman' },
  { id: 'grottdyket', icon: '⛏️', name: 'Grottdyket', desc: 'Hur djupt vågar du gå?' },
  { id: 'arenan', icon: '🏟️', name: 'Arenan', desc: 'Bossduellen: hoppa, blockera, slå' },
] as const;

export function Spelon() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);
  return (
    <Screen class="place">
      <BackBar label="Till ön" to="karta" right={<Purse hid={p.id} />} />
      <div class="place-banner spelon"><span>🎡</span><h1>Spelön</h1></div>
      <section class="card">
        <TokenRow hid={p.id} />
        <p class="small">🗝️ Spelnycklar: <b>{s.nycklar}</b>. Ibland hittar du en när du klarar en bana eller besegrar en boss. Med en nyckel blir minispelet en <b>skattrunda</b>, där skattkistor 🎁 med ovanliga saker och kläder dyker upp.</p>
      </section>
      <div class="building-grid">
        {MINISPEL.map((g) => (
          <button key={g.id} class="building" onClick={() => go(g.id)}>
            <span class="building-icon">{g.icon}</span>
            <b>{g.name}</b>
            <small>{g.desc}</small>
          </button>
        ))}
      </div>
      <section class="card">
        <h3>🏷️ Titlar på Spelön</h3>
        <ul class="arena-stats">
          {SPEL_TITLAR.map((t) => <li key={t.title}>{s.titles.includes(t.title) ? '✅' : '🔒'} <b>{t.title}</b>: {t.how}</li>)}
        </ul>
      </section>
    </Screen>
  );
}
