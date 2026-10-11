import { useEffect, useState } from 'preact/hooks';
import { chestModal, dataRev, heroId, touch } from '../state';
import { getHeroState, getProfile, saveHeroState } from '../platform/profiles';
import { getArea } from '../platform/rpg/progress';
import { kunskapLevel, levelTitle, needXP } from '../platform/rpg/balance';
import { ensurePioneerChest, equip, getInv, heroStats, isEquipped, syncPetItems, unequip } from '../platform/rpg/inventory';
import { SLOTS, STATS, type Slot } from '../platform/rpg/items';
import type { BossDef } from '../platform/rpg/types';
import { gradeName, heroClass } from '../content/heroes';
import { PLAYABLE } from '../content/areas';
import { mistByArea } from '../platform/learning/skills';
import { leaveToPicker } from '../session';
import { bossName } from './AreaView';
import { ItemCard } from './Loot';
import { Avatar, BackBar, Screen } from './ui';

// Azaleagården: hjältens hem. Hjältebladet, utrustning, packning, kistor, husdjur och titlar.

export function bossByKey(key: string): { areaId: string; boss: BossDef } | null {
  const [areaId, id] = key.split(':');
  const n = PLAYABLE[areaId]?.def.eras.flatMap((e) => e.nodes).find((x) => x.id === id);
  return n && n.type === 'boss' ? { areaId, boss: n } : null;
}

export function Gard() {
  dataRev.value;
  const hid = heroId.value!;
  const [slot, setSlot] = useState<Slot | null>(null);
  useEffect(() => {
    // Pionjärkistan och husdjur som tämjdes innan utrustning fanns.
    ensurePioneerChest(hid);
    syncPetItems(hid, (k) => bossByKey(k)?.boss ?? null);
    touch();
  }, [hid]);
  const p = getProfile(hid);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);
  const c = heroClass(p.heroClass);
  const inv = getInv(p.id);
  const st = heroStats(p.id);
  const mentors = s.mentors.map(bossByKey).filter(Boolean) as { areaId: string; boss: BossDef }[];
  const shown = inv.items.filter((it) => !slot || it.slot === slot).sort((a, b) => b.rarity - a.rarity || b.ilvl - a.ilvl);

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

      <section class="sheet card">
        <div class="sheet-head">
          <Avatar p={p} size={88} />
          <div>
            <h2>{p.name}</h2>
            <p>{c.emoji} {c.name} · Nivå {s.level} · {s.title ?? levelTitle(s.level)}</p>
            <p class="muted">{gradeName(p.grade)} · {c.perk}</p>
          </div>
        </div>
        <div class="xpbar" aria-label={`${s.xp} av ${needXP(s.level)} XP till nästa nivå`}><div style={{ width: `${(s.xp / needXP(s.level)) * 100}%` }} /></div>
        <p class="muted small">{s.xp} av {needXP(s.level)} XP till nivå {s.level + 1}</p>

        <h3>Egenskaper</h3>
        <div class="stat-grid">
          {STATS.map((x) => <div class="stat" key={x.id} title={x.desc}><span>{x.icon}</span><b>{st[x.id]}</b><small>{x.name}</small></div>)}
        </div>
        <p class="note">Egenskaper hjälper i bossstrider och med skatter – men svaren måste du alltid kunna själv!</p>

        <h3>Utrustning</h3>
        <div class="slots">
          {SLOTS.map((sl) => {
            const it = inv.items.find((x) => x.id === inv.equipped[sl.id]);
            return (
              <button class={`slot${it ? ' filled' : ''}${slot === sl.id ? ' on' : ''}`} key={sl.id} onClick={() => setSlot(slot === sl.id ? null : sl.id)}>
                <span>{it?.icon ?? sl.icon}</span><small>{it ? it.name : sl.name}</small>
              </button>
            );
          })}
        </div>

        <h3>Kunskaper</h3>
        {Object.values(PLAYABLE).filter(({ def }) => !def.region).map(({ def }) => {
          const mist = mistByArea(p.id)[def.areaId] ?? 0;
          const k = kunskapLevel(getArea(p.id, def.areaId).xp);
          return (
            <div class="skill-row" key={def.areaId}>
              <span>{def.kunskap.icon} {def.kunskap.name}</span>
              <span class="skill-bar"><span style={{ width: `${(k.into / k.need) * 100}%` }} /></span>
              <span class="skill-level">Nivå {k.level}{mist > 0 && <span class="skill-mist" title={`${mist} att repetera`}> 🌫️</span>}</span>
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

      <section class="card">
        <h2>🎒 Packningen <small class="muted">{inv.items.length}/{inv.capacity}</small></h2>
        {slot && <p class="note">Visar bara {SLOTS.find((x) => x.id === slot)!.name.toLowerCase()}. <button class="link" onClick={() => setSlot(null)}>Visa allt</button></p>}
        {shown.length === 0 && <p class="note">{inv.items.length ? 'Inget sådant än.' : 'Tom! Klara banor och besegra bossar för att hitta skattkistor.'}</p>}
        {shown.map((it) => {
          const on = isEquipped(inv, it.id);
          return (
            <ItemCard key={it.id} it={it} equipped={on}>
              <button class={`btn small${on ? '' : ' primary'}`} onClick={() => { if (on) unequip(p.id, it.slot); else equip(p.id, it.id); touch(); }}>{on ? 'Ta av' : 'Använd'}</button>
            </ItemCard>
          );
        })}
      </section>

      <footer class="map-foot"><button class="link" onClick={leaveToPicker}>Byt hjälte</button></footer>
    </Screen>
  );
}
