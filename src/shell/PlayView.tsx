import { beatenBy, GROUPS } from '../platform/rpg/vapen';
import { useMemo, useState } from 'preact/hooks';
import { chestModal, dataRev, gate, go, heroId, toast, touch } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import {
  abandonRun, advance, currentQuestion, findNode, finishRun, getPlay, hintsLeft, nextOpenNode, getArea,
  bossHearts, bossPreview, recordAnswer, recordFixed, REVIEW_NODE, VECKANS_NODE, runLength, runOver, startReview, startRun, useHint, type Hit, type Outcome, type RunState,
} from '../platform/rpg/progress';
import { reviewPlan } from '../platform/learning/skills';
import { currentList, veckansSkill, wordOfSkill } from '../platform/learning/veckans';
import { noteRun, type QuestNews } from '../platform/learning/quests';
import { noteBig, WEEK_KINDS, type BigNews } from '../platform/learning/storuppdrag';
import { PRACTICE_LENGTH } from '../platform/rpg/balance';
import { levelTitle } from '../platform/rpg/balance';
import { skillLabel } from '../content/skills';
import type { BossDef, GameModule, PathNode } from '../platform/rpg/types';
import { playable, regionProgress } from '../content/areas';
import { personaFor } from '../content/bosses';
import { region as regionById } from '../content/world';
import { leaveToPicker } from '../session';
import { Mentor, Portrait, Screen, Stars } from './ui';
import { ItemCard } from './Loot';
import { getInv } from '../platform/rpg/inventory';
import { stigmonster } from '../content/monsters';
import { HeroFigure } from './HeroFigure';
import { Loading, useGame } from './useGame';
import { findLesson, LessonLayer, NudgeAsk, NudgeBar, type LessonAt } from './Klassrum';
import { lessonDone, lessonForNode, nudgeFor } from '../platform/learning/lektioner';

/** Lektioner som redan har öppnats av sig själva före en bana i det här besöket (så att Hoppa över inte tjatar). */
const visadeForeBanan = new Set<string>();

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
  if (kind === 'review' || kind === 'veckans') {
    if (ex && ex.kind === kind && ex.areaId === areaId && !runOver(ex)) return ex.results.length > ex.index ? advance(hid, ex) : ex;
    if (kind === 'veckans') {
      // Alla veckans ord en gång, i blandad ordning.
      const words = currentList(hid)?.words ?? [];
      return words.length ? startReview(hid, pl.def, [...words].sort(() => Math.random() - 0.5).map(veckansSkill), 'veckans') : null;
    }
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

interface PlayProps { areaId: string; nodeId: string; practice?: boolean; review?: boolean; veckans?: boolean }

export function PlayView(props: PlayProps) {
  const g = useGame(props.areaId);
  if (!playable(props.areaId)) { queueMicrotask(() => go('karta')); return null; }
  if (typeof g === 'string') return <Loading failed={g === 'fel'} back={`omrade/${props.areaId}`} />;
  return <PlayRun {...props} game={g} />;
}

function PlayRun({ areaId, nodeId, practice = false, review = false, veckans = false, game }: PlayProps & { game: GameModule }) {
  dataRev.value;
  const hid = heroId.value;
  const p = hid ? getProfile(hid) : null;
  const pl = playable(areaId);
  const node = pl && (review ? REVIEW_NODE : veckans ? VECKANS_NODE : findNode(pl.def, nodeId));
  const kind: RunState['kind'] = review ? 'review' : veckans ? 'veckans' : practice ? 'practice' : node?.type === 'boss' ? 'boss' : 'stage';
  const [run, setRun] = useState<RunState | null>(() => (p && node ? resumeOrStart(p.id, areaId, node, kind) : null));
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [news, setNews] = useState<QuestNews | null>(null);
  const [big, setBig] = useState<BigNews | null>(null);
  const [hintIdx, setHintIdx] = useState<number | null>(null);
  const [bossLine, setBossLine] = useState<string>('');
  const [confirmQuit, setConfirmQuit] = useState(false);
  /** Klassrummets lektion som ligger över rundan, och om Mästare Kastanj redan har frågat (stark) i den här rundan. */
  // En oläst lektion till banan öppnas av sig själv när en runda börjar (en gång per besök); den går att hoppa över.
  const [intro, setIntro] = useState<LessonAt | null>(() => {
    if (!p || !node || !pl || !run || run.index > 0 || run.results.length || (run.kind !== 'stage' && run.kind !== 'boss')) return null;
    const meta = lessonForNode(pl.def, node.id);
    const key = `${p.id}/${areaId}/${meta?.id}`;
    if (!meta || lessonDone(p.id, areaId, meta.id) || visadeForeBanan.has(key)) return null;
    visadeForeBanan.add(key);
    return { areaId, meta };
  });
  const [lessonOpen, setLessonOpen] = useState<LessonAt | null>(null);
  const [asked, setAsked] = useState(false);
  const q = useMemo(() => (run && node && pl ? currentQuestion(run, node, game) : null), [run?.seed, run?.index]);

  if (!p) { queueMicrotask(leaveToPicker); return null; }
  if (!pl || !node) { queueMicrotask(() => go('karta')); return null; }
  const area = pl.def;
  const era = area.eras.find((e) => e.nodes.some((n) => n.id === node.id));
  const boss = node.type === 'boss' ? node : null;
  const face = boss ? bossFace(areaId, boss, p.grade) : null;
  const back = practice || review ? 'ovning' : area.region ? `region/${area.region.id}` : `omrade/${areaId}`;
  // Lektionen för den här banan (eller frågans färdighet). Veckans ord har ingen.
  const lesson = run && q && run.kind !== 'veckans' ? findLesson(areaId, node.id, game.skillOf(q), game.areaOf?.(q)) : null;
  const lessonAfter = lesson && run ? { at: lesson, nudge: nudgeFor(run.results) } : null;

  /* ---------- resultat ---------- */
  if (outcome) {
    return <Result o={outcome} news={news} big={big} areaId={areaId} node={node} face={face} practice={practice || review} lesson={lessonAfter}
      onAgain={review ? null : () => { setOutcome(null); setNews(null); setBig(null); setBossLine(''); setRun(veckans ? resumeOrStart(p.id, areaId, node, kind) : boss && !practice ? null : startRun(p.id, area, node, kind)); }} />;
  }

  /* ---------- inga veckans ord ---------- */
  if (!run && veckans) {
    return (
      <Screen class="play result">
        <div class="result-card">
          <div class="big-emoji">📝</div>
          <h1>Inga veckans ord än</h1>
          <p>Be en vuxen skriva in veckans stavningsord från skolan i Vuxenläge – då kan du öva på dem här.</p>
          <button class="btn primary" onClick={() => go(`omrade/${areaId}`)}>Tillbaka</button>
        </div>
      </Screen>
    );
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
          <p>Besegra {lock.need} av {regionById(area.region!.id)?.name}s Mästare först. Du har besegrat {lock.have}.</p>
          <button class="btn primary" onClick={() => go(back)}>Tillbaka</button>
        </div>
      </Screen>
    );
  }

  /* ---------- bossintro ---------- */
  if (!run && boss && face) {
    const h = bossHearts(p.id, getInv(p.id).potions.liv > 0);
    const pv = bossPreview(p.id, boss);
    const extra = [h.klass && `+${h.klass} riddare`, h.skydd && `+${h.skydd} från Skydd`, h.potion && '+1 livsdryck'].filter(Boolean);
    return (
      <Screen class="play boss-intro">
        <div class="boss-card">
          <div class="versus">
            <HeroFigure hid={p.id} size={96} />
            <span class="arena-vs">VS</span>
            <Portrait src={face.portrait} size={110} />
          </div>
          <h1>{face.name}</h1>
          <p class="boss-title">{face.title}</p>
          <blockquote class="boss-speech">"{face.entrance}"</blockquote>
          <p class="boss-rules">
            Du har {'❤️'.repeat(h.total)}{extra.length > 0 && <small> ({h.base} {extra.join(', ')})</small>}. Ett fel kostar ett hjärta.
            {' '}{face.name} har {pv.maxHp} liv. Varje rätt svar gör {pv.dmg} skada, så du behöver ungefär {pv.hits} träffar.
            {boss.trap && <> Akta dig: varannan fråga är en fälla ({game.errLabel(boss.trap)?.toLowerCase()}).</>}
          </p>
          <p class="boss-group">{GROUPS[pv.group].icon} {face.name} är {GROUPS[pv.group].name.toLowerCase()}. {pv.m === 'stark'
            ? `Ditt vapen (${GROUPS[pv.weapon!].name.toLowerCase()}) biter extra hårt! 💪`
            : pv.m === 'svag'
              ? `Ditt vapen (${GROUPS[pv.weapon!].name.toLowerCase()}) biter sämre – ${GROUPS[beatenBy(pv.group)].icon} ${GROUPS[beatenBy(pv.group)].name.toLowerCase()} hade varit bättre.`
              : `${GROUPS[beatenBy(pv.group)].icon} ${GROUPS[beatenBy(pv.group)].name} biter bäst på den.`}</p>
          <p class="note">Bättre utrustning ger fler hjärtan och hårdare slag. Svaren måste du alltid kunna själv!</p>
          <div class="row center-row">
            <button class="btn" onClick={() => go(back)}>Inte än</button>
            <button class="btn primary big" onClick={() => { setRun(startRun(p.id, area, node, 'boss')); setBossLine(face.entrance); }}>⚔️ Strid!</button>
          </div>
        </div>
      </Screen>
    );
  }
  if (!run || !q) return null;

  const View = game.View;
  const answered = run.results.length > run.index;
  const canHint = !answered && hintIdx !== run.index && hintsLeft(p.id) > 0;

  function onAnswer(r: { correct: boolean; ms: number; errTag?: string; hint: boolean }) {
    const before = run!;
    const next = recordAnswer(p!.id, before, node!, { correct: r.correct, ms: r.ms, hint: r.hint }, game.skillOf(q), r.errTag, game.areaOf?.(q));
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
      const report = { kind: r.kind, areaId, nodeId: node!.id, cleared: o.cleared, won: o.bossWon, progressed: o.firstClear || o.firstWin || o.newStars > 0 };
      const qn = noteRun(p!.id, report);
      setNews(qn);
      setBig(noteBig(p!.id, { ...report, correct: o.correct, total: o.total, mobs: o.mobs?.beaten ?? 0, dayDone: qn.allDone && !!qn.chest }));
      setOutcome(o);
      touch();
      return;
    }
    setRun(advance(p!.id, r));
    setHintIdx(null);
  }

  const len = runLength(run);
  const nudge = lesson ? nudgeFor(run.results) : 'none';
  const read = !!lesson && lessonDone(p.id, lesson.areaId, lesson.meta.id);
  // Stark: Mästare Kastanj frågar en gång, före nästa fråga (frågan visas inte än, så inget svar kan räknas två gånger).
  if (lesson && nudge === 'stark' && !asked && !answered && !lessonOpen) {
    return (
      <Screen class="play">
        <NudgeAsk at={lesson} read={read} onOpen={() => { setAsked(true); setLessonOpen(lesson); }} onSkip={() => setAsked(true)} />
      </Screen>
    );
  }
  return (
    <Screen class="play">
      {lessonOpen && <LessonLayer at={lessonOpen} onClose={() => setLessonOpen(null)} />}
      {intro && !lessonOpen && <LessonLayer at={intro} intro closeLabel="Börja banan" onClose={() => setIntro(null)} />}
      <header class="play-head">
        <div class="play-title">
          <small>{review ? `🌫️ ${area.title}` : veckans ? `📝 ${area.title}` : practice ? '🎯 Övningsängen' : `${era!.icon} ${era!.name}`}</small>
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
            <span key={run.results.length}><HeroFigure hid={p.id} size={52} pose={answered ? (run.lastHit ? 'attack' : 'hurt') : null} /></span>
            <div class="boss-hud-mid">
              <div class="hpbar" aria-label={`Bossen har ${run.hp} av ${run.maxHp} kvar`}><div style={{ width: `${((run.hp ?? 0) / (run.maxHp ?? 1)) * 100}%` }} /></div>
              <div class="hearts" aria-label={`${run.hearts} hjärtan kvar`}>{'❤️'.repeat(run.hearts ?? 0)}<span class="hearts-off">{'🖤'.repeat((run.maxHearts ?? 0) - (run.hearts ?? 0))}</span></div>
            </div>
            <span key={`b${run.results.length}`} class={answered && run.lastHit ? 'shake' : ''}><Portrait src={face!.portrait} size={56} /></span>
          </div>
          {run.lastHit && answered && <p class={`hit${run.lastHit.crit ? ' crit' : ''}`}>{hitText(run.lastHit)}</p>}
          {bossLine && <p class="boss-line">"{bossLine}"</p>}
        </div>
      ) : (
        <>
        {run.mob && <MobStrip hid={p.id} run={run} answered={answered} />}
        <div class="run-dots" aria-label={`Fråga ${Math.min(run.index + 1, len)} av ${len}`}>
          {Array.from({ length: len }, (_, i) => {
            const r = run.results[i];
            return <span key={i} class={`dot${r ? (r.correct ? ' ok' : ' bad') : i === run.index ? ' now' : ''}`} />;
          })}
        </div>
        </>
      )}

      {lesson && <NudgeBar nudge={nudge} at={lesson} read={read} onOpen={() => setLessonOpen(lesson)} />}

      {canHint && (
        <button class="tool" onClick={() => { if (useHint(p.id)) setHintIdx(run.index); }}>💡 Ledtråd ({hintsLeft(p.id)} kvar idag)</button>
      )}

      <View key={`${run.seed}-${run.index}`} q={q} hint={hintIdx === run.index} onAnswer={onAnswer} onDone={onDone}
        nextLabel={runOver(run) ? 'Se resultat' : 'Nästa'} />
    </Screen>
  );
}

const hitText = (h: Hit) => `💥 −${h.dmg}${h.m === 'stark' ? ' 💪 Effektivt!' : h.m === 'svag' ? ' 🛡️ Tålig!' : ''}${h.fast ? ' ⚡ Snabbt!' : ''}${h.crit ? ' ⭐ Fullträff!' : ''}`;

/** Stigmonstret i en vanlig bana: rätta svar slår till det, utrustningen avgör hur hårt. */
function MobStrip({ hid, run, answered }: { hid: string; run: RunState; answered: boolean }) {
  const mob = run.mob!;
  const m = stigmonster(run.seed, mob.k);
  const hit = answered ? mob.lastHit : undefined;
  const beaten = hit?.beat ? stigmonster(run.seed, mob.k - 1) : null;
  return (
    <div class="mob-strip">
      <span key={run.results.length}><HeroFigure hid={hid} size={40} pose={hit ? 'attack' : null} /></span>
      <div class="mob-mid">
        {hit
          ? <p class={`hit small${hit.crit ? ' crit' : ''}`}>{beaten ? `${beaten.icon} ${beaten.name} besegrad!${hit.blad ? ` +${hit.blad} 🌸` : ''}` : hitText(hit)}</p>
          : <small>{mob.beaten > 0 ? `${mob.beaten} besegrade · ` : ''}{m.name} {GROUPS[m.group].icon}</small>}
        <div class="hpbar small" aria-label={`${m.name} har ${mob.hp} av ${mob.maxHp} kvar`}><div style={{ width: `${(mob.hp / mob.maxHp) * 100}%` }} /></div>
      </div>
      <span key={`m${run.results.length}`} class={`mob-icon${hit && !beaten ? ' shake' : ''}${beaten ? ' pop' : ''}`}>{m.icon}</span>
    </div>
  );
}

function Result({ o, news, big, areaId, node, face, practice, lesson, onAgain }: { o: Outcome; news: QuestNews | null; big: BigNews | null; areaId: string; node: PathNode; face: BossFace | null; practice: boolean; lesson: { at: LessonAt; nudge: ReturnType<typeof nudgeFor> } | null; onAgain: (() => void) | null }) {
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
  } else if (o.kind === 'veckans') {
    const missed = (o.missed ?? []).map((s) => wordOfSkill(s) ?? s);
    head = (
      <>
        <div class="big-emoji">📝</div>
        <h1>{missed.length ? 'Veckans ord – bra kämpat!' : 'Alla veckans ord rätt!'}</h1>
        <p>{o.correct} av {o.total} rätt första gången.</p>
        <p>{missed.length ? `Öva lite extra på: ${missed.join(', ')}. ${missed.length === 1 ? 'Det' : 'De'} kommer tillbaka imorgon.` : 'Orden kommer tillbaka om några dagar, så att de fastnar till provet – och efter det.'}</p>
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
        <p>{o.correct} av {o.total} rätt{o.stars === 1 ? ' – alla tio rätt ger två stjärnor' : ''}{o.stars === 2 && !o.usedHint ? ` – svara snabbare för tredje stjärnan (snitt ${(o.avgMs / 1000).toFixed(1)} s)` : ''}{o.usedHint && o.stars === 2 ? ' – utan ledtråd kan du få tre stjärnor' : ''}.</p>
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
          {o.mastery && <span>🧠 Sitter bättre än någonsin: {[...new Set(o.mastery.skills)].map(skillLabel).join(', ')} (+{o.mastery.xp} kunskap)</span>}
          {o.kunskap && <span>{pl.def.kunskap.icon} {pl.def.kunskap.name} nivå {o.kunskap.level}!</span>}
          {o.kunskap?.titles.map((t) => <span key={t}>🏷️ Ny titel: {t}</span>)}
          {o.mobs && o.mobs.beaten > 0 && <span>👾 {o.mobs.beaten} stigmonster besegrade{o.mobs.blad > 0 ? ` · 🌸 +${o.mobs.blad}` : ''}</span>}
          {o.kastanjer > 0 && <span>🌰 +{o.kastanjer}</span>}
          {o.key && <span>🗝️ Du hittade en spelnyckel! Använd den på Spelön.</span>}
          {o.levelUps > 0 && <span>⭐ Nivå {hs.level} – {levelTitle(hs.level)}</span>}
          {o.gained.pet && <span>🐾 {o.gained.pet} följer med dig hem!</span>}
          {o.gained.petGrew && <span>🐾 {o.gained.petGrew} växte och blev starkare!</span>}
          {o.gained.mentor && <span>🎓 {o.gained.mentor} blir din mentor!</span>}
          {o.gained.title && <span>🏷️ Ny titel: {o.gained.title}</span>}
        </div>
        {o.gained.items?.map((it) => <ItemCard key={it.id} it={it} />)}
        {[...o.chests, ...(news?.chest ? [news.chest] : []), ...(big?.chests ?? [])].filter((c) => getInv(hid).chests.some((x) => x.id === c.id)).slice(0, 1).map((c) => (
          <button key={c.id} class="chest-found" onClick={() => { chestModal.value = c.id; }}>
            <span class="chest-big small-chest">{c.kind === 'boss' ? '💎' : c.kind === 'dag' || c.kind === 'vecka' || c.kind === 'uppdrag' ? '📜' : '🧰'}</span>
            <span><b>{c.kind === 'dag' ? 'Dagens kista!' : c.kind === 'vecka' ? 'En veckokista!' : c.kind === 'uppdrag' ? 'En uppdragskista!' : 'Du hittade en skattkista!'}</b><small>Tryck för att öppna</small></span>
          </button>
        ))}
        {news && news.done.length > 0 && (
          <div class="quest-news">
            {news.done.map((q) => <p key={q.kind}>📜 Uppdrag klart: {q.label}</p>)}
            {news.allDone && news.chest && <p><b>Alla dagens uppdrag är klara! 🔥 {news.streak} {news.streak === 1 ? 'dag' : 'dagar'} i rad.</b>{news.usedFreeze ? ' (Frysdagen räddade sviten.)' : ''}{news.usedAmulets ? ` (${news.usedAmulets === 1 ? 'En sköldamulett' : `${news.usedAmulets} sköldamuletter`} räddade sviten.)` : ''} Du får dagens kista{news.tokens ? ` och ${news.tokens === 1 ? 'en pollett' : `${news.tokens} polletter`} 🎟️` : ''}!</p>}
          </div>
        )}
        {big && (big.weekly.length > 0 || big.weekBonus || big.errandDone) && (
          <div class="quest-news">
            {big.weekly.map((q) => <p key={q.kind}>{WEEK_KINDS[q.kind].icon} Veckans utmaning klar: {WEEK_KINDS[q.kind].label(q.goal)}! +15 🌰 och en veckokista.</p>)}
            {big.weekBonus && <p><b>Alla veckans utmaningar klara! Du får en spelnyckel 🗝️.</b></p>}
            {big.errandDone && <p>{big.errandDone.icon} <b>{big.errandDone.who}:</b> "{big.errandDone.thanks}" +25 🌰 och en uppdragskista.</p>}
          </div>
        )}
        {lesson && lesson.nudge !== 'none' && <ResultLesson at={lesson.at} strong={lesson.nudge === 'stark' || (o.kind === 'boss' && !o.bossWon)} hid={hid} />}
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

/** Efter en runda med många fel: Mästare Kastanj föreslår lektionen (tydligare när det gick riktigt tungt). */
function ResultLesson({ at, strong, hid }: { at: LessonAt; strong: boolean; hid: string }) {
  const read = lessonDone(hid, at.areaId, at.meta.id);
  const open = () => go(`klassrum/${at.areaId}/${at.meta.id}`);
  if (!strong) {
    return (
      <button class="lesson-nudge mild" onClick={open}>
        <span aria-hidden="true">📖</span><span>{read ? 'Titta i lektionen igen' : 'I Klassrummet finns en lektion'}: <b>{at.meta.title}</b></span>
      </button>
    );
  }
  return (
    <div class="result-lesson">
      <Mentor compact text={read
        ? `Det här är fortfarande klurigt. Läs lektionen om ${at.meta.title.toLowerCase()} en gång till och prova några själv – sen går det lättare!`
        : `Det här är klurigt! Innan du försöker igen: gå till Klassrummet, så visar jag hur man tänker med ${at.meta.title.toLowerCase()}.`}>
        <div class="row mentor-actions"><button class="btn primary" onClick={open}>📖 Till Klassrummet</button></div>
      </Mentor>
    </div>
  );
}
