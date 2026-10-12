import { dataRev, go, heroId } from '../state';
import { getProfile } from '../platform/profiles';
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
  return (
    <Screen class="place">
      <BackBar label="Till ön" to="karta" right={<Purse hid={p.id} />} />
      <div class="place-banner spelon"><span>🎡</span><h1>Spelön</h1></div>
      <section class="card">
        <TokenRow hid={p.id} />
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
    </Screen>
  );
}
