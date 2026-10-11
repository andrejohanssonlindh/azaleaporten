import { dataRev, heroId, touch } from '../state';
import { getHeroState, getProfile, saveHeroState } from '../platform/profiles';
import { getArea } from '../platform/rpg/progress';
import { kunskapLevel, levelTitle, needXP } from '../platform/rpg/balance';
import type { BossDef } from '../platform/rpg/types';
import { gradeName, heroClass } from '../content/heroes';
import { PLAYABLE } from '../content/areas';
import { leaveToPicker } from '../session';
import { bossName } from './AreaView';
import { Avatar, BackBar, Screen } from './ui';

// Azaleagården: hjältens hem i Azaleabyn. Hjältebladet, husdjur, mentorer och titlar.
// Utrustning och skattkistor kommer i fas 3.

const SLOTS = [
  { id: 'huvud', icon: '⛑️', name: 'Huvud' }, { id: 'kropp', icon: '🦺', name: 'Kropp' }, { id: 'vapen', icon: '🗡️', name: 'Vapen' },
  { id: 'skold', icon: '🛡️', name: 'Sköld/Bok' }, { id: 'amulett', icon: '📿', name: 'Amulett' }, { id: 'husdjur', icon: '🐾', name: 'Husdjur' },
];

function bossByKey(key: string): { areaId: string; boss: BossDef } | null {
  const [areaId, id] = key.split(':');
  const n = PLAYABLE[areaId]?.def.eras.flatMap((e) => e.nodes).find((x) => x.id === id);
  return n && n.type === 'boss' ? { areaId, boss: n } : null;
}

export function Gard() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);
  const c = heroClass(p.heroClass);
  const pets = s.pets.map(bossByKey).filter(Boolean) as { areaId: string; boss: BossDef }[];
  const mentors = s.mentors.map(bossByKey).filter(Boolean) as { areaId: string; boss: BossDef }[];

  return (
    <Screen class="gard">
      <BackBar label="Azaleabyn" to="by" right={<span class="purse">🌰 {s.kastanjer} · 🌸 {s.blad}</span>} />
      <h1 class="page-title">🏡 Azaleagården</h1>

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

        <h3>Kunskaper</h3>
        {Object.values(PLAYABLE).map(({ def }) => {
          const k = kunskapLevel(getArea(p.id, def.areaId).xp);
          return (
            <div class="skill-row" key={def.areaId}>
              <span>{def.kunskap.icon} {def.kunskap.name}</span>
              <span class="skill-bar"><span style={{ width: `${(k.into / k.need) * 100}%` }} /></span>
              <span class="skill-level">Nivå {k.level}</span>
            </div>
          );
        })}
        <p class="note">Fler kunskaper vaknar när nya platser öppnar på ön.</p>

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

        <h3>Husdjur</h3>
        {pets.length ? (
          <div class="pets">{pets.map(({ boss }) => <div class="pet" key={boss.id}><span>{boss.pet?.icon ?? boss.icon}</span><small>{boss.pet?.name ?? boss.name}</small></div>)}</div>
        ) : <p class="note">Besegra en boss så följer den med dig hem.</p>}

        {mentors.length > 0 && (
          <>
            <h3>Mentorer</h3>
            <div class="pets">{mentors.map(({ areaId, boss }) => <div class="pet" key={boss.id}><span>🎓</span><small>{bossName(areaId, boss, p.grade)}</small></div>)}</div>
          </>
        )}

        {s.legacy.pioneerChest === 'pending' && (
          <div class="chest-note">🎁 <b>Pionjärkistan</b> väntar på dig! Den öppnas när Smedjan öppnar.</div>
        )}

        <h3>Utrustning</h3>
        <div class="slots">
          {SLOTS.map((sl) => <div class="slot" key={sl.id}><span>{sl.icon}</span><small>{sl.name}</small></div>)}
        </div>
        <p class="note">Skattkistor och utrustning kommer snart!</p>
      </section>

      <footer class="map-foot"><button class="link" onClick={leaveToPicker}>Byt hjälte</button></footer>
    </Screen>
  );
}
