import { toast, touch } from '../state';
import { getHeroState } from '../platform/profiles';
import { ARENA, buyToken } from '../platform/rpg/arena';

// Polletterna som minispelen kostar: plånboken i hörnet och raden där man köper fler.

export function Purse({ hid }: { hid: string }) {
  const s = getHeroState(hid);
  return <span class="purse">🌰 {s.kastanjer} · 🎟️ {s.polletter}{s.nycklar > 0 ? ` · 🗝️ ${s.nycklar}` : ''} · 🌸 {s.blad}</span>;
}

export function TokenRow({ hid }: { hid: string }) {
  const s = getHeroState(hid);
  return (
    <>
      <div class="row center-row">
        <span class="small">Du har {s.polletter} 🎟️</span>
        <button class="btn small" disabled={s.kastanjer < ARENA.tokenCost || s.polletter >= ARENA.maxTokens}
          onClick={() => { if (buyToken(hid)) { toast('🎟️ En pollett!'); touch(); } }}>Köp pollett {ARENA.tokenCost} 🌰</button>
      </div>
      <p class="muted small">Klarar du alla dagens uppdrag får du {ARENA.dailyTokens} polletter.</p>
    </>
  );
}
