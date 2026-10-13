import { useMemo, useState } from 'preact/hooks';
import { dataRev, go, heroId, toast, touch } from '../state';
import { getHeroState } from '../platform/profiles';
import { canSpeak, speak } from '../platform/speech';
import { randomSeed, rngFrom } from '../platform/rng';
import { finishLesson, lessonDone, lessonForNode, lessonForSkill, recentNudge, type Nudge } from '../platform/learning/lektioner';
import type { GameModule, LessonMeta, LessonPage } from '../platform/rpg/types';
import { playable } from '../content/areas';
import { BackBar, Mentor, Screen } from './ui';
import { Loading, useGame } from './useGame';

// Klassrummet: frivilliga lektioner bredvid banorna. En lektion är några sidor med text, bild,
// ett räkneexempel som visas steg för steg och "Prova själv" med en riktig fråga ur spelet (räknas inte).
// Lektionen öppnas som en egen sida (#/klassrum/<område>/<lektion>) eller som ett lager över en runda,
// så att rundan ligger kvar orörd under.

/** Var en lektion finns: området (vars spel har innehållet) och lektionens data. */
export interface LessonAt { areaId: string; meta: LessonMeta }

/** Lektionen för en bana, annars för frågans färdighet (repetition, regionboss: frågans eget område). */
export function findLesson(areaId: string, nodeId: string, skill?: string, qArea?: string): LessonAt | null {
  const def = playable(areaId)?.def;
  const byNode = def && lessonForNode(def, nodeId);
  if (byNode) return { areaId, meta: byNode };
  if (!skill) return null;
  for (const id of [qArea, areaId]) {
    const d = id ? playable(id)?.def : undefined;
    const m = d && lessonForSkill(d, skill);
    if (m) return { areaId: id!, meta: m };
  }
  return null;
}

/** Text som ska läsas upp: räknetecken blir ord. */
export const forSpeech = (s: string) => s
  .replace(/\s·\s/g, ' gånger ').replace(/\s\/\s/g, ' delat med ').replace(/\s=\s/g, ' är lika med ')
  .replace(/\s[−-]\s/g, ' minus ').replace(/\s\+\s/g, ' plus ').replace(/→/g, ', ').replace(/≈/g, ' ungefär ');

const paragraphs = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function PageView({ page, game, shown, onShow }: { page: LessonPage; game: GameModule; shown: number; onShow: () => void }) {
  const [n, setN] = useState(0);
  const [tries, setTries] = useState({ ok: 0, all: 0 });
  const q = useMemo(() => (page.prova ? game.makeQuestion(page.prova, rngFrom(randomSeed())) : null), [page, n]);
  const steps = page.steps ?? [];
  const View = game.View;
  const read = () => speak(forSpeech([page.title, ...paragraphs(page.text), ...steps.slice(0, shown), page.tips ?? ''].join('. ')));
  return (
    <article class="lesson-page">
      <div class="lesson-page-head">
        <h2>{page.title}</h2>
        {canSpeak() && <button class="speak" onClick={read} aria-label="Läs upp">🔊</button>}
      </div>
      {paragraphs(page.text).map((p, i) => <p key={i}>{p}</p>)}
      {page.pic && <div class="lesson-pic">{page.pic}</div>}
      {steps.length > 0 && (
        <ol class="lesson-steps">
          {steps.slice(0, shown).map((s, i) => <li key={i} class="pop-in">{s}</li>)}
          {shown < steps.length && <li class="lesson-more"><button class="btn small" onClick={onShow}>👉 Visa nästa steg</button></li>}
        </ol>
      )}
      {page.tips && <p class="lesson-tips">💡 {page.tips}</p>}
      {q && (
        <section class="lesson-prova">
          <h3>✏️ Prova själv</h3>
          <p class="note">Det här räknas inte – här får du göra fel och testa dig fram. Ledtråden står överst.</p>
          <View key={n} q={q} hint
            onAnswer={(r) => setTries((t) => ({ ok: t.ok + (r.correct ? 1 : 0), all: t.all + 1 }))}
            onDone={() => setN((x) => x + 1)} nextLabel="En till" />
          {tries.all > 0 && <p class="note">Rätt direkt: {tries.ok} av {tries.all}</p>}
        </section>
      )}
    </article>
  );
}

/** En lektion. onClose = tillbaka till rundan eller sidan man kom från. */
export function LessonView({ at, onClose, closeLabel }: { at: LessonAt; onClose: () => void; closeLabel: string }) {
  dataRev.value;
  const game = useGame(at.areaId);
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  if (typeof game === 'string') return <Loading failed={game === 'fel'} back={`omrade/${at.areaId}`} />;
  const lesson = game.lessons?.[at.meta.id];
  const hid = heroId.value;
  const head = (
    <header class="lesson-head">
      <div><small>📖 Klassrummet</small><b>{at.meta.icon} {at.meta.title}</b></div>
      <button class="btn small" onClick={onClose} aria-label={closeLabel}>✕</button>
    </header>
  );
  if (!lesson) return <div class="lesson">{head}<Mentor text="Den här lektionen är inte klar än. Kom tillbaka snart!"><button class="btn primary" onClick={onClose}>{closeLabel}</button></Mentor></div>;

  if (finished) {
    return (
      <div class="lesson">
        {head}
        <Mentor text={`Bra jobbat! Nu vet du hur man kan tänka med ${at.meta.title.toLowerCase()}. Kom tillbaka hit när du vill – lektionen finns alltid kvar bredvid stigen.`}>
          <div class="row mentor-actions">
            <button class="btn primary" onClick={onClose}>{closeLabel}</button>
            <button class="btn small" onClick={() => { setFinished(false); setPage(0); setShown({}); }}>Läs igen</button>
          </div>
        </Mentor>
      </div>
    );
  }

  const pages = lesson.pages;
  const p = pages[page];
  const last = page === pages.length - 1;
  const done = () => {
    if (hid) {
      const r = finishLesson(hid, at.areaId, at.meta.id);
      if (r.first && r.xp) toast(`📖 Lektionen klar! +${r.xp} XP`);
      if (r.levelUps) toast(`⭐ Ny nivå: ${getHeroState(hid).level}!`);
      touch();
    }
    setFinished(true);
  };
  return (
    <div class="lesson">
      {head}
      <div class="run-dots lesson-dots" aria-label={`Sida ${page + 1} av ${pages.length}`}>
        {pages.map((_, i) => <span key={i} class={`dot${i < page ? ' ok' : i === page ? ' now' : ''}`} />)}
      </div>
      <PageView key={page} page={p} game={game} shown={shown[page] ?? 0} onShow={() => setShown((s) => ({ ...s, [page]: (s[page] ?? 0) + 1 }))} />
      <nav class="lesson-nav">
        <button class="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Förra</button>
        {last
          ? <button class="btn primary" onClick={done}>✓ Klart!</button>
          : <button class="btn primary" onClick={() => setPage(page + 1)}>Nästa →</button>}
      </nav>
    </div>
  );
}

/** Lektionen som en egen sida (från stigen eller resultatskärmen). */
export function KlassrumPage({ areaId, lessonId }: { areaId: string; lessonId: string }) {
  const meta = playable(areaId)?.def.lessons?.find((l) => l.id === lessonId);
  if (!meta) { queueMicrotask(() => go(playable(areaId) ? `omrade/${areaId}` : 'karta')); return null; }
  const back = playable(areaId)!.def;
  return (
    <Screen class="place">
      <BackBar label={back.title} to={`omrade/${areaId}`} />
      <LessonView at={{ areaId, meta }} onClose={() => go(`omrade/${areaId}`)} closeLabel={`Tillbaka till ${back.title}`} />
    </Screen>
  );
}

/** Lektionen som ett lager över en runda eller fri övning: det som ligger under rörs inte. */
export function LessonLayer({ at, onClose, closeLabel = 'Tillbaka till frågan' }: { at: LessonAt; onClose: () => void; closeLabel?: string }) {
  return (
    <div class="lesson-layer" role="dialog" aria-modal="true" aria-label={`Klassrummet: ${at.meta.title}`}>
      <LessonView at={at} onClose={onClose} closeLabel={closeLabel} />
    </div>
  );
}

/** Lektionen som en skylt på stigen, före banorna den hör till. */
export function LessonSign({ hid, areaId, meta }: { hid: string; areaId: string; meta: LessonMeta }) {
  dataRev.value;
  const read = lessonDone(hid, areaId, meta.id);
  const need = recentNudge(hid, areaId, meta);
  return (
    <div class="lesson-row">
      <button class={`lesson-sign${need !== 'none' && !read ? ' need' : ''}${read ? ' read' : ''}`} onClick={() => go(`klassrum/${areaId}/${meta.id}`)}>
        <span class="lesson-sign-icon" aria-hidden="true">{meta.icon}</span>
        <span class="lesson-sign-text"><small>📖 Klassrummet</small><b>{meta.title}</b><small>{meta.desc}</small></span>
        {read ? <span class="lesson-badge ok" aria-label="Läst">✓</span> : need !== 'none' ? <span class="lesson-badge">Tips!</span> : null}
      </button>
    </div>
  );
}

/** Förslaget i en runda: en liten knapp (mild) eller en tydligare (stark). */
export function NudgeBar({ nudge, at, read, onOpen }: { nudge: Nudge; at: LessonAt; read: boolean; onOpen: () => void }) {
  if (nudge === 'none') return null;
  return (
    <button class={`lesson-nudge ${nudge}`} onClick={onOpen}>
      <span aria-hidden="true">📖</span>
      <span>{nudge === 'stark' ? <b>Knepigt? Titta i Klassrummet: {at.meta.title}</b> : <>Klurigt? {read ? 'Titta i lektionen igen' : 'Klassrummet visar hur man tänker'}: <b>{at.meta.title}</b></>}</span>
    </button>
  );
}

/** Mästare Kastanj frågar en gång (stark): ska vi titta i klassrummet? Rundan väntar. */
export function NudgeAsk({ at, read, onOpen, onSkip }: { at: LessonAt; read: boolean; onOpen: () => void; onSkip: () => void }) {
  const text = read
    ? `Det här verkar knepigt just nu. Ska vi titta på lektionen om ${at.meta.title.toLowerCase()} en gång till? Rundan väntar på dig här.`
    : `Det här verkar knepigt just nu – och det är helt okej! I Klassrummet visar jag hur man kan tänka med ${at.meta.title.toLowerCase()}. Rundan väntar på dig här.`;
  return (
    <div class="nudge-ask">
      <Mentor text={text}>
        <div class="row mentor-actions">
          <button class="btn primary" onClick={onOpen}>📖 Ja, visa mig</button>
          <button class="btn small" onClick={onSkip}>Jag kör vidare</button>
        </div>
      </Mentor>
    </div>
  );
}
