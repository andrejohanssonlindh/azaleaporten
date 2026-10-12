import { useState } from 'preact/hooks';
import { chestModal, dataRev, go, heroId, toast, touch } from '../state';
import { getProfile } from '../platform/profiles';
import { getPlay } from '../platform/rpg/progress';
import { getInv } from '../platform/rpg/inventory';
import { currentStreak, getQuests, type Quest } from '../platform/learning/quests';
import { chainReward, chainState, CHAINS, claimChain, getBigQuests, skipArende, WEEK_KINDS, type ChainReward } from '../platform/learning/storuppdrag';
import { arende } from '../content/arenden';
import { cosmetic } from '../platform/rpg/wardrobe';
import { leaveToPicker } from '../session';
import { PLAYABLE } from '../content/areas';
import { BackBar, Mentor, Screen } from './ui';

// Uppdragstavlan i Azaleabyn: dagens tre uppdrag (sviten, dagens kista), veckans utmaningar,
// äventyrsuppdragen (kedjor) och byns ärende.

const ICON: Record<Quest['kind'], string> = { dimma: '🌫️', ova: '🎯', framsteg: '🧗', klara: '⭐', ang: '🌼', veckans: '📝' };

function target(q: Quest, lastArea: string | undefined): string {
  switch (q.kind) {
    case 'dimma': return `repetera/${q.areaId}`;
    case 'ova': return `ovning/${q.areaId}/${q.nodeId}`;
    case 'framsteg': return `spela/${q.areaId}/${q.nodeId}`;
    case 'klara': return lastArea ? `omrade/${lastArea}` : 'region/talbergen';
    case 'ang': return 'ovning';
    case 'veckans': return 'veckans';
  }
}

const TABS = [['idag', 'Idag'], ['veckan', 'Veckan'], ['aventyr', 'Äventyr']] as const;
type Tab = (typeof TABS)[number][0];

export function Uppdrag({ tab: initial }: { tab?: string } = {}) {
  dataRev.value;
  const p = getProfile(heroId.value!);
  const [tab, setTab] = useState<Tab>(TABS.some(([id]) => id === initial) ? (initial as Tab) : 'idag');
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const st = getQuests(p.id);
  const big = getBigQuests(p.id);
  const ready = CHAINS.filter((c) => chainState(p.id, c, big).ready).length;
  const amulets = getInv(p.id).potions.skold ?? 0;
  const streak = currentStreak(st, undefined, amulets);
  const left = st.list.filter((q) => !q.done).length;
  const lastArea = getPlay(p.id).last?.areaId;
  const say = st.chest
    ? `Alla uppdrag klara för idag – bra jobbat, ${p.name}! Kom tillbaka imorgon, så har jag nya.`
    : left === st.list.length
      ? `Här är dagens uppdrag, ${p.name}. Klarar du alla tre får du dagens kista och två polletter 🎟️!`
      : `${left === 1 ? 'Ett uppdrag' : `${left} uppdrag`} kvar. Sedan väntar dagens kista!`;

  return (
    <Screen class="place">
      <BackBar label="Azaleabyn" to="by" right={streak.n > 0 ? <span class="purse" title="Dagar i rad">🔥 {streak.n}</span> : undefined} />
      <div class="place-banner board"><span>📜</span><h1>Uppdragstavlan</h1></div>
      <div class="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} class={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}{id === 'aventyr' && ready > 0 ? ` (${ready})` : ''}
          </button>
        ))}
      </div>
      {tab === 'idag' && (
        <>
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
          <ErrandCard hid={p.id} />
        </>
      )}
      {tab === 'veckan' && <WeekTab hid={p.id} />}
      {tab === 'aventyr' && <ChainTab hid={p.id} />}
    </Screen>
  );
}

/** Byns ärende: en invånare som behöver hjälp. Visas också i Azaleabyn. */
export function ErrandCard({ hid }: { hid: string }) {
  dataRev.value;
  const st = getBigQuests(hid);
  const a = arende(st.errand.id);
  if (!a) return null;
  return (
    <section class="card errand">
      <div class="errand-head"><span class="errand-icon" aria-hidden="true">{a.icon}</span><h2>{a.who} behöver hjälp</h2></div>
      <p>"{a.story}"</p>
      <div class="progress" role="progressbar" aria-valuemin={0} aria-valuemax={a.n} aria-valuenow={st.errand.n} aria-label="Ärendet">
        <div style={{ width: `${(st.errand.n / a.n) * 100}%` }} />
      </div>
      <p class="muted small">Klara {a.n} rundor med minst 9 rätt (eller besegra en boss) i {PLAYABLE[a.areaId]?.def.title ?? a.areaId}: {st.errand.n} av {a.n}. Belöning: 25 🌰 och en uppdragskista.</p>
      <div class="row">
        <button class="btn small primary" onClick={() => go(`omrade/${a.areaId}`)}>Gå dit</button>
        <button class="btn small" onClick={() => { const n = skipArende(hid); if (n) { toast(`${n.icon} ${n.who} har ett annat ärende.`); touch(); } }}>Ett annat ärende</button>
      </div>
    </section>
  );
}

function WeekTab({ hid }: { hid: string }) {
  const st = getBigQuests(hid);
  const left = st.weekly.filter((q) => !q.done).length;
  return (
    <>
      <Mentor text={left === 0 ? 'Alla veckans utmaningar är klara! På måndag kommer nya.' : `Tre större mål den här veckan. Varje klart ger 15 🌰 och en veckokista – alla tre ger en spelnyckel 🗝️!`} />
      <ol class="quests">
        {st.weekly.map((q) => (
          <li key={q.kind} class={`quest${q.done ? ' done' : ''}`}>
            <span class="quest-icon" aria-hidden="true">{q.done ? '✅' : WEEK_KINDS[q.kind].icon}</span>
            <span class="quest-label">{WEEK_KINDS[q.kind].label(q.goal)}<small class="muted"> · {q.n} av {q.goal}</small></span>
          </li>
        ))}
      </ol>
    </>
  );
}

const rewardText = (r: ChainReward) => [
  r.kastanjer && `${r.kastanjer} 🌰`,
  r.nycklar && `${r.nycklar} 🗝️`,
  r.chest !== undefined && (r.chest >= 3 ? 'en episk kista' : r.chest === 2 ? 'en sällsynt kista' : 'en kista'),
  r.title && `titeln ${r.title}`,
  r.look && cosmetic(r.look) && `${cosmetic(r.look)!.icon} ${cosmetic(r.look)!.name}`,
].filter(Boolean).join(' + ');

function ChainTab({ hid }: { hid: string }) {
  const st = getBigQuests(hid);
  return (
    <>
      <Mentor text="Äventyrsuppdragen tar lång tid – de finns kvar tills du klarar dem. Sista steget i varje ger en titel!" />
      {CHAINS.map((c) => {
        const cs = chainState(hid, c, st);
        return (
          <section class={`card chain${cs.ready ? ' ready' : ''}`} key={c.id}>
            <h3>{c.icon} {c.name} <small class="muted">steg {Math.min(cs.claimed + 1, c.goals.length)} av {c.goals.length}</small></h3>
            {cs.done ? <p>✅ Alla steg klara!</p> : (
              <>
                <p>{c.label(cs.goal)} <small class="muted">({Math.min(cs.count, cs.goal)} av {cs.goal})</small></p>
                <div class="progress"><div style={{ width: `${Math.min(1, cs.count / cs.goal) * 100}%` }} /></div>
                <p class="muted small">Belöning: {rewardText(chainReward(c, cs.claimed))}</p>
                {cs.ready && (
                  <button class="btn primary" onClick={() => {
                    const got = claimChain(hid, c.id);
                    if (!got) return;
                    toast(`${c.icon} ${rewardText(got.reward)}!`);
                    if (got.chest) chestModal.value = got.chest.id;
                    touch();
                  }}>Hämta belöningen!</button>
                )}
              </>
            )}
          </section>
        );
      })}
    </>
  );
}
