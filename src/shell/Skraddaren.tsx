import { useState } from 'preact/hooks';
import { dataRev, heroId, toast, touch } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import { buyCosmetic, COSMETICS, getWardrobe, LOOK_SLOTS, owns, unlockText, wear, type Cosmetic } from '../platform/rpg/wardrobe';
import { leaveToPicker } from '../session';
import { HeroFigure } from './HeroFigure';
import { BackBar, Screen } from './ui';

// Skräddaren: köp utseende till hjältefiguren för kastanjer. Prova först – figuren högst upp visar hur det blir.

export function Skraddaren() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  const [trying, setTrying] = useState<Cosmetic | null>(null);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);
  const w = getWardrobe(p.id);

  return (
    <Screen class="place">
      <BackBar label="Azaleabyn" to="by" right={<span class="purse">🌰 {s.kastanjer}</span>} />
      <div class="place-banner tailor"><span>🧵</span><h1>Skräddaren</h1></div>
      <section class="card try-on">
        <HeroFigure hid={p.id} size={130} preview={trying} />
        <p class="note">{trying ? `Så här ser du ut med ${trying.name.toLowerCase()}.` : 'Tryck på Prova för att se hur det blir. Utseende är bara för stil – det ger inga egenskaper.'}</p>
        {trying && <button class="btn small" onClick={() => setTrying(null)}>Sluta prova</button>}
      </section>

      {LOOK_SLOTS.map((ls) => (
        <section class="card" key={ls.id}>
          <h2>{ls.icon} {ls.name}</h2>
          {COSMETICS.filter((c) => c.slot === ls.id).map((c) => {
            const has = owns(p.id, c, w);
            const worn = w.worn[c.slot] === c.id;
            return (
              <div class={`shop-row${trying?.id === c.id ? ' trying' : ''}`} key={c.id}>
                <span class="item-icon">{c.icon}</span>
                <div class="item-text">
                  <b>{c.name}</b>
                  <small>{has ? (worn ? 'Har på dig' : 'Din') : c.unlock ? `🔒 ${unlockText(c.unlock)}` : `${c.cost} 🌰`}</small>
                </div>
                <div class="item-actions">
                  <button class="btn small" aria-pressed={trying?.id === c.id} onClick={() => setTrying(trying?.id === c.id ? null : c)}>Prova</button>
                  {has
                    ? !worn && <button class="btn small primary" onClick={() => { wear(p.id, c.id); setTrying(null); touch(); }}>Ta på</button>
                    : c.cost !== undefined && (
                      <button class="btn small primary" disabled={s.kastanjer < c.cost}
                        onClick={() => { if (buyCosmetic(p.id, c.id)) { toast(`🧵 ${c.name} är din!`); setTrying(null); touch(); } }}>{c.cost} 🌰</button>
                    )}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </Screen>
  );
}
