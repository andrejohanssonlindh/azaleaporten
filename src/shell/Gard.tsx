import { useEffect, useState } from 'preact/hooks';
import { chestModal, dataRev, go, heroId, toast, touch } from '../state';
import { getHeroState, getProfile, saveHeroState } from '../platform/profiles';
import { getArea } from '../platform/rpg/progress';
import { KUNSKAP_TITLE_LEVELS, kunskapLevel, levelTitle, needXP } from '../platform/rpg/balance';
import { ensurePioneerChest, equip, getInv, heroStats, isEquipped, salvage, salvageCommon, statDiff, statExplain, statScale, syncPetItems, unequip } from '../platform/rpg/inventory';
import { salvageValue, SLOTS, STATS, type Slot, type Stat } from '../platform/rpg/items';
import { COSMETICS, getWardrobe, LOOK_SLOTS, owns, takeOff, unlockText, wear } from '../platform/rpg/wardrobe';
import type { BossDef } from '../platform/rpg/types';
import { gradeName, heroClass } from '../content/heroes';
import { PLAYABLE } from '../content/areas';
import { mistByArea, solidCount } from '../platform/learning/skills';
import { leaveToPicker } from '../session';
import { bossName } from './AreaView';
import { ItemCard } from './Loot';
import { HeroFigure } from './HeroFigure';
import { BackBar, Screen } from './ui';

// Azaleagården: hjältens hem. Flikar: Hjälten (figur, egenskaper, utrustning och packning),
// Garderoben (utseende) och Kunskaper (kunskaper, titlar, mentorer).

export function bossByKey(key: string): { areaId: string; boss: BossDef } | null {
  const [areaId, id] = key.split(':');
  const n = PLAYABLE[areaId]?.def.eras.flatMap((e) => e.nodes).find((x) => x.id === id);
  return n && n.type === 'boss' ? { areaId, boss: n } : null;
}

const lowerFirst = (t: string) => t[0].toLowerCase() + t.slice(1);

const TABS = [['hjalten', 'Hjälten'], ['garderob', 'Garderoben'], ['kunskaper', 'Kunskaper']] as const;
type Tab = (typeof TABS)[number][0];

export function Gard({ tab: initial }: { tab?: string }) {
  dataRev.value;
  const hid = heroId.value!;
  const [tab, setTab] = useState<Tab>(TABS.some(([id]) => id === initial) ? (initial as Tab) : 'hjalten');
  useEffect(() => {
    // Pionjärkistan och husdjur som tämjdes innan utrustning fanns.
    ensurePioneerChest(hid);
    syncPetItems(hid, (k) => bossByKey(k)?.boss ?? null);
    touch();
  }, [hid]);
  const p = getProfile(hid);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);
  const inv = getInv(p.id);

  return (
    <Screen class="gard">
      <BackBar label="Azaleabyn" to="by" right={<span class="purse">🌰 {s.kastanjer} · 🌸 {s.blad}</span>} />
      <h1 class="page-title">🏡 Azaleagården</h1>

      {inv.chests.length > 0 && (
        <section class="card chests">
          <h2>🎁 Oöppnade kistor ({inv.chests.length})</h2>
          <div class="chest-row">
            {inv.chests.map((k) => (
              <button key={k.id} class="chest-btn" onClick={() => { chestModal.value = k.id; }}>
                <span>{k.kind === 'pionjar' ? '🎁' : k.kind === 'boss' ? '💎' : '🧰'}</span><small>{k.kind === 'pionjar' ? 'Pionjärkistan' : k.source}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      <div class="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} class={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'hjalten' && <HeroTab hid={p.id} />}
      {tab === 'garderob' && <WardrobeTab hid={p.id} />}
      {tab === 'kunskaper' && <SkillsTab hid={p.id} />}

      <footer class="map-foot"><button class="link" onClick={leaveToPicker}>Byt hjälte</button></footer>
    </Screen>
  );
}

function HeroHead({ hid }: { hid: string }) {
  dataRev.value; // underkomponenter måste själva lyssna, annars hoppar signals över dem
  const p = getProfile(hid)!;
  const s = getHeroState(hid);
  const c = heroClass(p.heroClass);
  return (
    <div class="hero-stage">
      <HeroFigure hid={hid} size={132} />
      <div class="hero-stage-text">
        <h2>{p.name}</h2>
        <p>{c.emoji} {c.name} · Nivå {s.level}</p>
        <p class="muted small">{s.title ?? levelTitle(s.level)} · {gradeName(p.grade)}</p>
        <p class="muted small">{c.perk}</p>
        <div class="xpbar" aria-label={`${s.xp} av ${needXP(s.level)} XP till nästa nivå`}><div style={{ width: `${(s.xp / needXP(s.level)) * 100}%` }} /></div>
        <p class="muted small">{s.xp} av {needXP(s.level)} XP till nivå {s.level + 1}</p>
      </div>
    </div>
  );
}

function HeroTab({ hid }: { hid: string }) {
  dataRev.value; // underkomponenter måste själva lyssna, annars hoppar signals över dem
  const [slot, setSlot] = useState<Slot | null>(null);
  const [stat, setStat] = useState<Stat | null>(null);
  const [melt, setMelt] = useState<string | null>(null);
  const p = getProfile(hid)!;
  const inv = getInv(hid);
  const st = heroStats(hid);
  const ranger = p.heroClass === 'ranger';
  const shown = inv.items.filter((it) => !slot || it.slot === slot).sort((a, b) => b.rarity - a.rarity || b.ilvl - a.ilvl);
  const greys = inv.items.filter((it) => it.rarity === 0 && !it.unique && !isEquipped(inv, it.id));
  const greyBlad = greys.reduce((a, it) => a + salvageValue(it), 0);
  const equippedIn = (sl: Slot) => inv.items.find((x) => x.id === inv.equipped[sl]);

  return (
    <>
      <section class="sheet card">
        <HeroHead hid={hid} />
        <h3>Egenskaper</h3>
        <div class="stat-grid">
          {STATS.map((x) => (
            <button class={`stat${stat === x.id ? ' on' : ''}`} key={x.id} aria-expanded={stat === x.id} onClick={() => setStat(stat === x.id ? null : x.id)}>
              <span>{x.icon}</span><b>{st[x.id]}</b><small>{x.name}</small>
            </button>
          ))}
        </div>
        {stat
          ? <p class="stat-explain"><b>{STATS.find((x) => x.id === stat)!.icon} {STATS.find((x) => x.id === stat)!.name}:</b> {statExplain(stat, st, ranger, statScale(getHeroState(hid).level))}</p>
          : <p class="note">Tryck på en egenskap så ser du vad den gör. Egenskaper hjälper i strider och med skatter – men svaren måste du alltid kunna själv! Ju högre nivå du har, desto fler poäng behövs, så bättre utrustning gör alltid nytta.</p>}
      </section>

      <section class="card">
        <h2>⚔️ Utrustning</h2>
        <div class="slots">
          {SLOTS.map((sl) => {
            const it = equippedIn(sl.id);
            return (
              <button class={`slot${it ? ' filled' : ''}${slot === sl.id ? ' on' : ''}`} key={sl.id} aria-pressed={slot === sl.id} onClick={() => setSlot(slot === sl.id ? null : sl.id)}>
                <span>{it?.icon ?? sl.icon}</span><small>{it ? it.name : sl.name}</small>
              </button>
            );
          })}
        </div>
        <p class="note">Tryck på en plats för att bara se sådana saker i packningen.</p>

        <h2 class="pack-head">🎒 Packningen <small class="muted">{inv.items.length}/{inv.capacity}</small></h2>
        {slot && <p class="note">Visar bara {SLOTS.find((x) => x.id === slot)!.name.toLowerCase()}. <button class="link" onClick={() => setSlot(null)}>Visa allt</button></p>}
        {greys.length > 0 && (
          <div class="row center-row">
            {melt === '*grey'
              ? <><span>Smält {greys.length} gråa saker?</span><button class="btn small danger" onClick={() => { const r = salvageCommon(hid); setMelt(null); toast(`🔥 ${r.n === 1 ? 'En sak smält' : `${r.n} saker smälta`}: +${r.blad} 🌸`); touch(); }}>Ja, smält</button><button class="btn small" onClick={() => setMelt(null)}>Nej</button></>
              : <button class="btn small" onClick={() => setMelt('*grey')}>🔥 Smält alla gråa ({greys.length} st, +{greyBlad} 🌸)</button>}
          </div>
        )}
        {shown.length === 0 && <p class="note">{inv.items.length ? 'Inget sådant än.' : 'Tom! Klara banor och besegra bossar för att hitta skattkistor.'}</p>}
        {shown.map((it) => {
          const on = isEquipped(inv, it.id);
          const diff = on ? {} : statDiff(it, equippedIn(it.slot));
          const diffKeys = STATS.filter((x) => diff[x.id]);
          return (
            <ItemCard key={it.id} it={it} equipped={on}
              note={!on && diffKeys.length > 0 && (
                <span class="item-diff">{equippedIn(it.slot) ? 'Mot det du har: ' : 'Om du tar på den: '}
                  {diffKeys.map((x) => <span key={x.id} class={diff[x.id]! > 0 ? 'up' : 'down'}>{x.icon} {diff[x.id]! > 0 ? '+' : ''}{diff[x.id]} </span>)}
                </span>
              )}>
              <button class={`btn small${on ? '' : ' primary'}`} onClick={() => { if (on) unequip(hid, it.slot); else equip(hid, it.id); touch(); }}>{on ? 'Ta av' : 'Använd'}</button>
              {!on && !it.unique && (melt === it.id
                ? <button class="btn small danger" onClick={() => { const b = salvage(hid, it.id); setMelt(null); toast(`🔥 +${b} 🌸`); touch(); }}>Smält! +{salvageValue(it)} 🌸</button>
                : <button class="btn small" onClick={() => setMelt(it.id)}>Smält</button>)}
            </ItemCard>
          );
        })}
        {inv.items.length > 0 && <p class="note">Smälta saker blir azaleablad 🌸. Med dem kan du göra din utrustning starkare i Smedjan.</p>}
      </section>
    </>
  );
}

function WardrobeTab({ hid }: { hid: string }) {
  dataRev.value; // underkomponenter måste själva lyssna, annars hoppar signals över dem
  const w = getWardrobe(hid);
  return (
    <section class="card">
      <div class="center"><HeroFigure hid={hid} size={150} /></div>
      {LOOK_SLOTS.map((ls) => {
        const mine = COSMETICS.filter((c) => c.slot === ls.id && owns(hid, c, w));
        const locked = COSMETICS.filter((c) => c.slot === ls.id && c.unlock && !owns(hid, c, w));
        return (
          <div key={ls.id}>
            <h3>{ls.icon} {ls.name}</h3>
            <div class="chips">
              {mine.map((c) => {
                const on = w.worn[ls.id] === c.id;
                return <button key={c.id} class={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => { if (on) takeOff(hid, ls.id); else wear(hid, c.id); touch(); }}>{c.icon} {c.name}</button>;
              })}
              {locked.map((c) => <span key={c.id} class="chip locked" title={unlockText(c.unlock!)}>🔒 {c.name}: {lowerFirst(unlockText(c.unlock!))}</span>)}
              {mine.length === 0 && locked.length === 0 && <span class="muted small">Inget än.</span>}
            </div>
          </div>
        );
      })}
      <p class="note">Mer finns att köpa hos Skräddaren i Azaleabyn.</p>
      <div class="center"><button class="btn primary" onClick={() => go('skraddaren')}>🧵 Till Skräddaren</button></div>
    </section>
  );
}

function SkillsTab({ hid }: { hid: string }) {
  dataRev.value; // underkomponenter måste själva lyssna, annars hoppar signals över dem
  const p = getProfile(hid)!;
  const s = getHeroState(hid);
  const mentors = s.mentors.map(bossByKey).filter(Boolean) as { areaId: string; boss: BossDef }[];
  return (
    <section class="card">
      <h2>📚 Kunskaper</h2>
      <p class="muted small">Kunskaper växer bara av att öva – utrustning hjälper inte här. Det som sitter kvar dag efter dag (🧠) ger extra kunskap.</p>
      {Object.values(PLAYABLE).filter(({ def }) => !def.region).map(({ def }) => {
        const mist = mistByArea(p.id)[def.areaId] ?? 0;
        const k = kunskapLevel(getArea(p.id, def.areaId).xp);
        const solid = solidCount(p.id, def.areaId);
        const nextTitle = def.kunskap.titles?.map((t, i) => [KUNSKAP_TITLE_LEVELS[i], t] as const).find(([lvl]) => k.level < lvl);
        return (
          <div class="skill-block" key={def.areaId}>
            <div class="skill-row">
              <span>{def.kunskap.icon} {def.kunskap.name}</span>
              <span class="skill-bar"><span style={{ width: `${(k.into / k.need) * 100}%` }} /></span>
              <span class="skill-level">Nivå {k.level}{mist > 0 && <span class="skill-mist" title={`${mist} att repetera`}> 🌫️</span>}</span>
            </div>
            {(solid > 0 || nextTitle) && (
              <small class="skill-sub">
                {solid > 0 && `🧠 ${solid} ${solid === 1 ? 'sak sitter' : 'saker sitter'} som berget`}
                {solid > 0 && nextTitle && ' · '}
                {nextTitle && `Nivå ${nextTitle[0]}: titeln ${nextTitle[1]}`}
              </small>
            )}
          </div>
        );
      })}

      {s.titles.length > 0 && (
        <>
          <h3>Titlar</h3>
          <div class="chips">
            {s.titles.map((t) => (
              <button key={t} class={`chip${s.title === t ? ' on' : ''}`} onClick={() => { saveHeroState(p.id, { ...s, title: s.title === t ? null : t }); touch(); }}>{t}</button>
            ))}
          </div>
        </>
      )}

      {mentors.length > 0 && (
        <>
          <h3>Mentorer</h3>
          <div class="pets">{mentors.map(({ areaId, boss }) => <div class="pet" key={boss.id}><span>🎓</span><small>{bossName(areaId, boss, p.grade)}</small></div>)}</div>
        </>
      )}
    </section>
  );
}
