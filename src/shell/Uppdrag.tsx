import { dataRev, go, heroId } from '../state';
import { getProfile } from '../platform/profiles';
import { getPlay } from '../platform/rpg/progress';
import { getInv } from '../platform/rpg/inventory';
import { currentStreak, getQuests, type Quest } from '../platform/learning/quests';
import { leaveToPicker } from '../session';
import { BackBar, Mentor, Screen } from './ui';

// Uppdragstavlan i Azaleabyn: dagens tre uppdrag, sviten och dagens kista.

const ICON: Record<Quest['kind'], string> = { dimma: '🌫️', ova: '🎯', framsteg: '🧗', klara: '⭐', ang: '🌼' };

function target(q: Quest, lastArea: string | undefined): string {
  switch (q.kind) {
    case 'dimma': return `repetera/${q.areaId}`;
    case 'ova': return `ovning/${q.areaId}/${q.nodeId}`;
    case 'framsteg': return `spela/${q.areaId}/${q.nodeId}`;
    case 'klara': return lastArea ? `omrade/${lastArea}` : 'region/talbergen';
    case 'ang': return 'ovning';
  }
}

export function Uppdrag() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const st = getQuests(p.id);
  const amulets = getInv(p.id).potions.skold ?? 0;
  const streak = currentStreak(st, undefined, amulets);
  const left = st.list.filter((q) => !q.done).length;
  const lastArea = getPlay(p.id).last?.areaId;
  const say = st.chest
    ? `Alla uppdrag klara för idag – bra jobbat, ${p.name}! Kom tillbaka imorgon, så har jag nya.`
    : left === st.list.length
      ? `Här är dagens uppdrag, ${p.name}. Klarar du alla tre får du dagens kista!`
      : `${left === 1 ? 'Ett uppdrag' : `${left} uppdrag`} kvar. Sedan väntar dagens kista!`;

  return (
    <Screen class="place">
      <BackBar label="Azaleabyn" to="by" right={streak.n > 0 ? <span class="purse" title="Dagar i rad">🔥 {streak.n}</span> : undefined} />
      <div class="place-banner board"><span>📜</span><h1>Uppdragstavlan</h1></div>
      <Mentor text={say} />
      <ol class="quests">
        {st.list.map((q, i) => (
          <li key={i} class={`quest${q.done ? ' done' : ''}`}>
            <span class="quest-icon" aria-hidden="true">{q.done ? '✅' : ICON[q.kind]}</span>
            <span class="quest-label">{q.label}</span>
            {!q.done && <button class="btn small primary" onClick={() => go(target(q, lastArea))}>Gå dit</button>}
          </li>
        ))}
      </ol>
      <section class="card streak-card">
        <h2>🔥 {streak.n === 0 ? 'Starta en svit idag!' : `${streak.n} ${streak.n === 1 ? 'dag' : 'dagar'} i rad`}</h2>
        <p class="muted">
          Klara alla tre uppdragen en dag för att hålla sviten vid liv.
          {streak.freezeLeft ? ' Du har en frysdag kvar den här veckan: missar du en dag räddar den sviten.' : ' Veckans frysdag är använd.'}
          {amulets > 0 && ` Du har ${amulets} sköldamulett${amulets === 1 ? '' : 'er'} 🧿 som skyddar sviten.`}
          {st.best > 1 && ` Ditt rekord: ${st.best} dagar.`}
        </p>
      </section>
    </Screen>
  );
}
