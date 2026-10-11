import { useMemo, useState } from 'preact/hooks';
import { chestModal, dataRev, gate, go, heroId, toast, touch } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import {
  abandonRun, advance, currentQuestion, findNode, finishRun, getPlay, hintsLeft, nextOpenNode, getArea,
  recordAnswer, recordFixed, REVIEW_NODE, runLength, runOver, startReview, startRun, useHint, type Outcome, type RunState,
} from '../platform/rpg/progress';
import { reviewPlan } from '../platform/learning/skills';
import { noteRun, type QuestNews } from '../platform/learning/quests';
import { PRACTICE_LENGTH } from '../platform/rpg/balance';
import { levelTitle } from '../platform/rpg/balance';
import type { BossDef, PathNode } from '../platform/rpg/types';
import { playable, regionProgress } from '../content/areas';
import { personaFor } from '../content/bosses';
import { leaveToPicker } from '../session';
import { Portrait, Screen, Stars } from './ui';
import { ItemCard } from './Loot';
import { getInv } from '../platform/rpg/inventory';

// Spelskärmen: en runda (10 frågor), en repetition (5 frågor) eller en bossstrid.

interface BossFace { name: string; title: string; portrait: string; entrance: string; phase2?: string; onHeroMiss: string[]; onBossHit: string[]; defeat: string; signature?: { name: string; slot: string; flavor: string } }

function bossFace(areaId: string, b: BossDef, grade: number): BossFace {
  if (b.kind === 'mastare') {
    const per = personaFor(b.personaId ?? `${areaId}.mastare`, gate.value?.pack ?? null, grade);
    if (per) return { name: per.name, title: per.title, portrait: per.portrait ?? b.icon, entrance: per.entrance, phase2: per.phase2,
      onHeroMiss: per.onHeroMiss ?? [], onBossHit: per.onBossHit ?? [], defeat: per.defeat, signature: per.signatureItem };
  }
  return { name: b.name, title: b.title, portrait: b.icon, entrance: b.lines.entrance, phase2: b.lines.phase2,
    onHeroMiss: b.lines.onHeroMiss ?? [], onBossHit: b.lines.onBossHit ?? [], defeat: b.lines.defeat };
}

const pickLine = (lines: string[]) => (lines.length ? lines[Math.floor(Math.random() * lines.length)] : '');

function resumeOrStart(hid: string, areaId: string, node: PathNode, kind: RunState['kind']): RunState | null {
  const pl = playable(areaId)!;
  const ex = getPlay(hid).run;
  if (kind === 'review') {
    if (ex && ex.kind === 'review' && ex.areaId === areaId && !runOver(ex)) return ex.results.length > ex.index ? advance(hid, ex) : ex;
    const plan = reviewPlan(hid, areaId, PRACTICE_LENGTH);
    return plan.length ? startReview(hid, pl.def, plan) : null;
  }
  if (ex && ex.areaId === areaId && ex.nodeId === node.id && ex.kind === kind && !runOver(ex)) {
    // Svarade men hann inte trycka Nästa innan omladdning: gå vidare.
    return ex.results.length > ex.index ? advance(hid, ex) : ex;
  }
  if (kind === 'boss') return null; // bossen startas från introt
  return startRun(hid, pl.def, node, kind);
}

export function PlayView({ areaId, nodeId, practice = false, review = false }: { areaId: string; nodeId: string; practice?: boolean; review?: boolean }) {
  dataRev.value;
  const hid = heroId.value;
  const p = hid ? getProfile(hid) : null;
  const pl = playable(areaId);
  const node = pl && (review ? REVIEW_NODE : findNode(pl.def, nodeId));
  const kind: RunState['kind'] = review ? 'review' : practice ? 'practice' : node?.type === 'boss' ? 'boss' : 'stage';
  const [run, setRun] = useState<RunState | null>(() => (p && node ? resumeOrStart(p.id, areaId, node, kind) : null));
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [news, setNews] = useState<QuestNews | null>(null);
  const [hintIdx, setHintIdx] = useState<number | null>(null);
  const [bossLine, setBossLine] = useState<string>('');
  const [confirmQuit, setConfirmQuit] = useState(false);
  const q = useMemo(() => (run && node && pl ? currentQuestion(run, node, pl.game) : null), [run?.seed, run?.index]);

  if (!p) { queueMicrotask(leaveToPicker); return null; }
  if (!pl || !node) { queueMicrotask(() => go('karta')); return null; }
  const area = pl.def;
  const era = area.eras.find((e) => e.nodes.some((n) => n.id === node.id));
  const boss = node.type === 'boss' ? node : null;
  const face = boss ? bossFace(areaId, boss, p.grade) : null;
  const back = practice || review ? 'ovning' : area.region ? `region/${area.region.id}` : `omrade/${areaId}`;

  /* ---------- resultat ---------- */
  if (outcome) {
    return <Result o={outcome} news={news} areaId={areaId} node={node} face={face} practice={practice || review}
      onAgain={review ? null : () => { setOutcome(null); setNews(null); setBossLine(''); setRun(boss && !practice ? null : startRun(p.id, area, node, kind)); }} />;
  }

  /* ---------- ingen dimma att jaga ---------- */
  if (!run && review) {
    return (
      <Screen class="play result">
        <div class="result-card">
          <div class="big-emoji">🌤️</div>
          <h1>Ingen dimma här!</h1>
          <p>Allt i {area.title} sitter fint just nu.</p>
          <button class="btn primary" onClick={() => go('ovning')}>Till Övningsängen</button>
        </div>
      </Screen>
    );
  }

  /* ---------- regionbossen är låst tills tillräckligt många Mästare är besegrade ---------- */
  const lock = regionProgress(p.id, area);
  if (!run && !lock.open) {
    return (
      <Screen class="play result">
        <div class="result-card">
          <div class="big-emoji">🔒</div>
          <h1>Stigen är stängd</h1>
          <p>Besegra {lock.need} av bergets Mästare först. Du har besegrat {lock.have}.</p>
          <button class="btn primary" onClick={() => go(back)}>Tillbaka</button>
        </div>
      </Screen>
    );
  }

  /* ---------- bossintro ---------- */
  if (!run && boss && face) {
    const hearts = getProfile(p.id)?.heroClass === 'riddare' ? 4 : 3;
    return (
      <Screen class="play boss-intro">
        <div class="boss-card">
          <Portrait src={face.portrait} size={120} />
          <h1>{face.name}</h1>
          <p class="boss-title">{face.title}</p>
          <blockquote class="boss-speech">"{face.entrance}"</blockquote>
          <p class="boss-rules">
            Du har {'❤️'.repeat(hearts)}. Svara rätt {boss.hp} gånger för att vinna – ett fel kostar ett hjärta.
            {boss.trap && <> Akta dig: varannan fråga är en fälla ({pl.game.errLabel(boss.trap)?.toLowerCase()}).</>}
          </p>
          <div class="row center-row">
            <button class="btn" onClick={() => go(back)}>Inte än</button>
            <button class="btn primary big" onClick={() => { setRun(startRun(p.id, area, node, 'boss')); setBossLine(face.entrance); }}>⚔️ Strid!</button>
          </div>
        </div>
      </Screen>
    );
  }
  if (!run || !q) return null;

  const View = pl.game.View;
  const answered = run.results.length > run.index;
  const canHint = !answered && hintIdx !== run.index && hintsLeft(p.id) > 0;

  function onAnswer(r: { correct: boolean; ms: number; errTag?: string; hint: boolean }) {
    const before = run!;
    const next = recordAnswer(p!.id, before, node!, { correct: r.correct, ms: r.ms, hint: r.hint }, pl!.game.skillOf(q), r.errTag, pl!.game.areaOf?.(q));
    if (next.levelUps > before.levelUps) toast(`⭐ Ny nivå: ${getHeroState(p!.id).level}!`);
    if (face && boss) {
      const half = (next.maxHp ?? 0) / 2;
      if ((before.hp ?? 0) > half && (next.hp ?? 0) <= half && face.phase2) setBossLine(face.phase2);
      else setBossLine(pickLine(r.correct ? face.onBossHit : face.onHeroMiss));
    }
    setRun(next);
  }

  function onDone(fixed?: 'self' | 'shown') {
    let r = run!;
    if (fixed) r = recordFixed(p!.id, r, fixed);
    if (runOver(r)) {
      const o = finishRun(p!.id, area, r, { signature: face?.signature });
      setNews(noteRun(p!.id, { kind: r.kind, areaId, nodeId: node!.id, cleared: o.cleared, won: o.bossWon, progressed: o.firstClear || o.firstWin || o.newStars > 0 }));
      setOutcome(o);
      touch();
      return;
    }
    setRun(advance(p!.id, r));
    setHintIdx(null);
  }

  const len = runLength(run);
  return (
    <Screen class="play">
      <header class="play-head">
        <div class="play-title">
          <small>{review ? `🌫️ ${area.title}` : practice ? '🎯 Övningsängen' : `${era!.icon} ${era!.name}`}</small>
          <b>{boss && face && !practice ? face.name : review ? 'Jaga bort dimman' : node.name}</b>
        </div>
        {confirmQuit ? (
          <span class="row">
            <button class="btn small danger" onClick={() => { abandonRun(p.id); go(back); }}>Avbryt</button>
            <button class="btn small" onClick={() => setConfirmQuit(false)}>Fortsätt</button>
          </span>
        ) : <button class="btn small" onClick={() => setConfirmQuit(true)} aria-label="Avbryt">✕</button>}
      </header>

      {boss && !practice ? (
        <div class="boss-hud">
          <div class="boss-hud-row">
            <Portrait src={face!.portrait} size={56} />
            <div class="hpbar" aria-label={`Bossen har ${run.hp} av ${run.maxHp} kvar`}><div style={{ width: `${((run.hp ?? 0) / (run.maxHp ?? 1)) * 100}%` }} /></div>
          </div>
          <div class="hearts" aria-label={`${run.hearts} hjärtan kvar`}>{'❤️'.repeat(run.hearts ?? 0)}<span class="hearts-off">{'🖤'.repeat((run.maxHearts ?? 0) - (run.hearts ?? 0))}</span></div>
          {run.lastHit && answered && <p class={`hit${run.lastHit.crit ? ' crit' : ''}`}>💥 −{run.lastHit.dmg}{run.lastHit.crit ? ' Fullträff!' : ''}</p>}
          {bossLine && <p class="boss-line">"{bossLine}"</p>}
        </div>
      ) : (
        <div class="run-dots" aria-label={`Fråga ${Math.min(run.index + 1, len)} av ${len}`}>
          {Array.from({ length: len }, (_, i) => {
            const r = run.results[i];
            return <span key={i} class={`dot${r ? (r.correct ? ' ok' : ' bad') : i === run.index ? ' now' : ''}`} />;
          })}
        </div>
      )}

      {canHint && (
        <button class="tool" onClick={() => { if (useHint(p.id)) setHintIdx(run.index); }}>💡 Ledtråd ({hintsLeft(p.id)} kvar idag)</button>
      )}

      <View key={`${run.seed}-${run.index}`} q={q} hint={hintIdx === run.index} onAnswer={onAnswer} onDone={onDone}
        nextLabel={runOver(run) ? 'Se resultat' : 'Nästa'} />
    </Screen>
  );
}

function Result({ o, news, areaId, node, face, practice, onAgain }: { o: Outcome; news: QuestNews | null; areaId: string; node: PathNode; face: BossFace | null; practice: boolean; onAgain: (() => void) | null }) {
  const hid = heroId.value!;
  const pl = playable(areaId)!;
  const next = nextOpenNode(pl.def, getArea(hid, areaId));
  const hs = getHeroState(hid);
  const back = practice ? 'ovning' : pl.def.region ? `region/${pl.def.region.id}` : `omrade/${areaId}`;

  let head;
  if (o.kind === 'boss') {
    head = o.bossWon ? (
      <>
        <div class="big-emoji">🏆</div>
        <h1>Du besegrade {face?.name}!</h1>
        {face && <blockquote class="boss-speech">"{face.defeat}"</blockquote>}
      </>
    ) : (
      <>
        <div class="big-emoji">💨</div>
        <h1>{face?.name} vann den här gången</h1>
        <p>Du träffade {o.correct} gånger. Öva lite på Övningsängen och kom tillbaka – du klarar det!</p>
      </>
    );
  } else if (o.kind === 'review') {
    head = <><div class="big-emoji">🌤️</div><h1>Dimman har lättat!</h1><p>{o.correct} av {o.total} rätt.{o.correct < o.total ? ' Det som var klurigt kommer tillbaka imorgon, så att det fastnar.' : ''}</p></>;
  } else if (o.kind === 'practice') {
    head = <><div class="big-emoji">🎯</div><h1>Repetition klar!</h1><p>{o.correct} av {o.total} rätt.</p></>;
  } else if (o.cleared) {
    head = (
      <>
        <div class="big-emoji">⚡</div>
        <h1>{pl.def.texts.cleared}</h1>
        <div class="result-stars"><Stars n={o.stars} /></div>
        <p>{o.correct} av {o.total} rätt{o.stars === 2 && !o.usedHint ? ` – svara snabbare för tredje stjärnan (snitt ${(o.avgMs / 1000).toFixed(1)} s)` : ''}{o.usedHint && o.stars === 2 ? ' – utan ledtråd kan du få tre stjärnor' : ''}.</p>
      </>
    );
  } else {
    head = <><div class="big-emoji">🔋</div><h1>Nästan!</h1><p>{o.correct} av {o.total} rätt. {pl.def.texts.notYet}</p></>;
  }

  return (
    <Screen class="play result">
      <div class="result-card">
        {head}
        <div class="rewards">
          {o.xp > 0 && <span>✨ +{o.xp} XP</span>}
          {o.kastanjer > 0 && <span>🌰 +{o.kastanjer}</span>}
          {o.levelUps > 0 && <span>⭐ Nivå {hs.level} – {levelTitle(hs.level)}</span>}
          {o.gained.pet && <span>🐾 {o.gained.pet} följer med dig hem!</span>}
          {o.gained.mentor && <span>🎓 {o.gained.mentor} blir din mentor!</span>}
          {o.gained.title && <span>🏷️ Ny titel: {o.gained.title}</span>}
        </div>
        {o.gained.items?.map((it) => <ItemCard key={it.id} it={it} />)}
        {[...o.chests, ...(news?.chest ? [news.chest] : [])].filter((c) => getInv(hid).chests.some((x) => x.id === c.id)).slice(0, 1).map((c) => (
          <button key={c.id} class="chest-found" onClick={() => { chestModal.value = c.id; }}>
            <span class="chest-big small-chest">{c.kind === 'boss' ? '💎' : c.kind === 'dag' ? '📜' : '🧰'}</span>
            <span><b>{c.kind === 'dag' ? 'Dagens kista!' : 'Du hittade en skattkista!'}</b><small>Tryck för att öppna</small></span>
          </button>
        ))}
        {news && news.done.length > 0 && (
          <div class="quest-news">
            {news.done.map((q) => <p key={q.kind}>📜 Uppdrag klart: {q.label}</p>)}
            {news.allDone && news.chest && <p><b>Alla dagens uppdrag är klara! 🔥 {news.streak} {news.streak === 1 ? 'dag' : 'dagar'} i rad.</b>{news.usedFreeze ? ' (Frysdagen räddade sviten.)' : ''}{news.usedAmulets ? ` (${news.usedAmulets === 1 ? 'En sköldamulett' : `${news.usedAmulets} sköldamuletter`} räddade sviten.)` : ''} Du får dagens kista!</p>}
          </div>
        )}
        {o.tired && <p class="note">Hjälten är trött för idag – inga fler kastanjer, men allt du lär dig räknas!</p>}
        <div class="row center-row">
          <button class="btn" onClick={() => go(back)}>{practice ? 'Tillbaka' : pl.def.texts.back}</button>
          {onAgain && <button class="btn" onClick={onAgain}>{o.kind === 'boss' && !o.bossWon ? 'Försök igen' : 'Spela igen'}</button>}
          {!practice && next && next.id !== node.id && (o.cleared || o.bossWon) && (
            <button class="btn primary" onClick={() => go(`spela/${areaId}/${next.id}`)}>Vidare: {next.type === 'boss' ? 'Bossen!' : next.name}</button>
          )}
        </div>
      </div>
    </Screen>
  );
}
