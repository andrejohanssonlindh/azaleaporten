import { useState } from 'preact/hooks';
import { dataRev, heroId, toast, touch } from '../state';
import { getHeroState, getProfile, NAME_MAX, type Profile } from '../platform/profiles';
import { animalOpen, changeAnimal, changeClass, changeName, FORVANDLING } from '../platform/rpg/forvandling';
import { ANIMALS, CLASSES, type AnimalId, type ClassId } from '../content/heroes';
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
                  <small>{has ? (worn ? 'Har på dig' : 'Din') : c.unlock ? `🔒 ${unlockText(c.unlock)}` : c.kista ? '🎁 Finns i Spelöns skattkistor' : c.uppdrag ? '🏅 Belöning från ett äventyrsuppdrag' : `${c.cost} 🌰`}</small>
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

      <Forvandling p={p} kastanjer={s.kastanjer} />
    </Screen>
  );
}

/** Byt djur, klass eller namn. Dyrt, och djuren utan lås finns från början. */
function Forvandling({ p, kastanjer }: { p: Profile; kastanjer: number }) {
  const [djur, setDjur] = useState<AnimalId | null>(null);
  const [klass, setKlass] = useState<ClassId | null>(null);
  const [namn, setNamn] = useState('');
  const NAME_MSG = { tomt: 'Skriv ett namn.', samma: 'Det är redan ditt namn.', upptaget: 'Det namnet har redan en annan hjälte.', kastanjer: 'Du har inte råd än.' };
  return (
    <section class="card forvandling">
      <h2>🪄 Förvandling</h2>
      <p class="note">Ångrar du ditt val? Här kan du byta – men det kostar en hel del kastanjer.</p>

      <h3>Byt djur · {FORVANDLING.djur} 🌰</h3>
      <div class="choice-grid animals">
        {ANIMALS.map((a) => {
          const open = animalOpen(p.id, a.id);
          return (
            <button key={a.id} class={`pick${(djur ?? p.animal) === a.id ? ' on' : ''}${open ? '' : ' locked'}`} aria-pressed={(djur ?? p.animal) === a.id}
              onClick={() => (open ? setDjur(a.id) : toast(`🔒 ${a.name}: ${'unlock' in a ? unlockText(a.unlock) : ''}`))}>
              <span class="pick-emoji">{open ? a.emoji : '🔒'}</span><small>{a.name}</small>
            </button>
          );
        })}
      </div>
      {djur && djur !== p.animal && (
        <button class="btn primary" disabled={kastanjer < FORVANDLING.djur}
          onClick={() => { if (changeAnimal(p.id, djur)) { toast(`🪄 Du är nu en ${ANIMALS.find((a) => a.id === djur)!.name.toLowerCase()}!`); setDjur(null); touch(); } }}>
          Bli {ANIMALS.find((a) => a.id === djur)!.emoji} för {FORVANDLING.djur} 🌰
        </button>
      )}

      <h3>Byt klass · {FORVANDLING.klass} 🌰</h3>
      <div class="class-list">
        {CLASSES.map((c) => (
          <button key={c.id} class={`class-card${(klass ?? p.heroClass) === c.id ? ' on' : ''}`} aria-pressed={(klass ?? p.heroClass) === c.id} onClick={() => setKlass(c.id)}>
            <span class="class-emoji">{c.emoji}</span>
            <span class="class-text"><b>{c.name}</b><span class="perk">{c.perk}</span></span>
          </button>
        ))}
      </div>
      {klass && klass !== p.heroClass && (
        <button class="btn primary" disabled={kastanjer < FORVANDLING.klass}
          onClick={() => { if (changeClass(p.id, klass)) { toast(`🪄 Du är nu ${CLASSES.find((c) => c.id === klass)!.name.toLowerCase()}!`); setKlass(null); touch(); } }}>
          Bli {CLASSES.find((c) => c.id === klass)!.name.toLowerCase()} för {FORVANDLING.klass} 🌰
        </button>
      )}

      <h3>Byt namn · {FORVANDLING.namn} 🌰</h3>
      <form class="row" onSubmit={(e) => {
        e.preventDefault();
        const r = changeName(p.id, namn);
        if (r === 'ok') { toast('🪄 Nytt namn!'); setNamn(''); touch(); } else toast(NAME_MSG[r]);
      }}>
        <input value={namn} maxLength={NAME_MAX} autocomplete="off" aria-label="Nytt namn" placeholder={p.name} onInput={(e) => setNamn(e.currentTarget.value)} />
        <button class="btn primary" disabled={kastanjer < FORVANDLING.namn || !namn.trim()}>Byt</button>
      </form>
    </section>
  );
}
