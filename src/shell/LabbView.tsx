import type { ComponentChildren } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { go, heroId, toast, touch } from '../state';
import { grantKunskapTitles, learn } from '../platform/rpg/progress';
import { skillLabel, cap } from '../content/skills';
import { playable } from '../content/areas';
import { randomSeed, rngFrom } from '../platform/rng';
import type { AreaDef, GameModule, StageDef } from '../platform/rpg/types';
import { BackBar, Screen } from './ui';
import { Loading, useGame, useLoaded } from './useGame';
import { LessonLayer, NudgeBar, type LessonAt } from './Klassrum';
import { lessonDone, lessonForNode, nudgeFor } from '../platform/learning/lektioner';

const loadKlockLabb = () => import('../games/klocka/ui/Labb');

// Fri övning utanför äventyret: inga stjärnor eller belöningar.
// Tidstornet har sitt eget Tidslabb (fri övning + tolkaren); andra områden övar fritt på sina banor.

/** Fri övning ger inga belöningar, men lärandet räknas – också behärskningen och kunskapstitlarna. */
function learnFree(def: AreaDef, game: GameModule, q: unknown, r: { correct: boolean; hint: boolean; errTag?: string }) {
  const hid = heroId.value;
  if (!hid) return;
  const skill = game.skillOf(q);
  const m = learn(hid, game.areaOf?.(q) ?? def.areaId, skill, r.correct, r.hint, r.errTag);
  const titles = grantKunskapTitles(hid, def);
  if (m.xp) toast(`🧠 ${cap(skillLabel(skill))} sitter bättre än någonsin! +${m.xp} kunskap`);
  for (const t of titles) toast(`🏷️ Ny titel: ${t}`);
  if (m.xp || titles.length) touch();
}

function FreeStages({ def, game }: { def: AreaDef; game: GameModule }) {
  const stages = def.eras.flatMap((e) => e.nodes).filter((n): n is StageDef => n.type === 'stage');
  const [sel, setSel] = useState(stages[0]);
  const [n, setN] = useState(0);
  const [score, setScore] = useState({ ok: 0, all: 0 });
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([]);
  const [lessonOpen, setLessonOpen] = useState<LessonAt | null>(null);
  const q = useMemo(() => game.makeQuestion(sel.spec, rngFrom(randomSeed())), [sel, n]);
  const View = game.View;
  const meta = lessonForNode(def, sel.id);
  const lesson: LessonAt | null = meta ? { areaId: def.areaId, meta } : null;
  const nudge = nudgeFor(answers);
  return (
    <div class="labb">
      <div class="seg" role="group" aria-label="Vad vill du öva på?">
        {stages.map((s) => <button key={s.id} class={sel.id === s.id ? 'on' : ''} onClick={() => { setSel(s); setN((x) => x + 1); setAnswers([]); }}>{s.icon} {s.name}</button>)}
      </div>
      <p class="note">{sel.desc}</p>
      {lessonOpen && <LessonLayer at={lessonOpen} onClose={() => setLessonOpen(null)} />}
      {lesson && (nudge !== 'none'
        ? <NudgeBar nudge={nudge} at={lesson} read={lessonDone(heroId.value ?? '', lesson.areaId, lesson.meta.id)} onOpen={() => setLessonOpen(lesson)} />
        : <button class="btn small lesson-link" onClick={() => setLessonOpen(lesson)}>📖 Lektion: {lesson.meta.title}</button>)}
      <View key={`${sel.id}-${n}`} q={q} hint={false}
        onAnswer={(r) => {
          setScore((s) => ({ ok: s.ok + (r.correct ? 1 : 0), all: s.all + 1 }));
          setAnswers((a) => [...a, { correct: r.correct }].slice(-10));
          learnFree(def, game, q, r);
        }}
        onDone={() => setN((x) => x + 1)} />
      <p class="note">Rätt: {score.ok} av {score.all}</p>
    </div>
  );
}

export function LabbView({ areaId, tab }: { areaId: string; tab: string }) {
  const pl = playable(areaId);
  const game = useGame(areaId);
  if (!pl) { queueMicrotask(() => go('karta')); return null; }
  if (typeof game === 'string') return <Loading failed={game === 'fel'} back={`omrade/${areaId}`} />;
  const back = <BackBar label={pl.def.title} to={`omrade/${areaId}`} />;
  if (pl.def.gameId === 'klocka') return <Tidslabbet areaId={areaId} tab={tab} game={game} back={back} />;
  return (
    <Screen class="place">
      {back}
      <h1 class="page-title">🧪 Öva fritt</h1>
      <FreeStages def={pl.def} game={game} />
    </Screen>
  );
}

function Tidslabbet({ areaId, tab, game, back }: { areaId: string; tab: string; game: GameModule; back: ComponentChildren }) {
  const labb = useLoaded('klocka-labb', loadKlockLabb);
  if (typeof labb === 'string') return <Loading failed={labb === 'fel'} back={`omrade/${areaId}`} />;
  const { FreePractice, Tolkaren } = labb;
  return (
    <Screen class="place">
      {back}
      <h1 class="page-title">🧪 Tidslabbet</h1>
      <div class="tabs" role="tablist">
        <button role="tab" aria-selected={tab !== 'tolka'} class={tab !== 'tolka' ? 'on' : ''} onClick={() => go(`labb/${areaId}`)}>Öva fritt</button>
        <button role="tab" aria-selected={tab === 'tolka'} class={tab === 'tolka' ? 'on' : ''} onClick={() => go(`labb/${areaId}/tolka`)}>Tolka en tid</button>
      </div>
      {tab === 'tolka' ? <Tolkaren /> : <FreePractice onResult={(q, r) => learnFree(playable(areaId)!.def, game, q, r)} />}
    </Screen>
  );
}
