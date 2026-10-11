import type { ComponentChildren } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { go, heroId } from '../state';
import { noteAnswer } from '../platform/learning/skills';
import { playable } from '../content/areas';
import { randomSeed, rngFrom } from '../platform/rng';
import type { AreaDef, GameModule, StageDef } from '../platform/rpg/types';
import { BackBar, Screen } from './ui';
import { Loading, useGame, useLoaded } from './useGame';

const loadKlockLabb = () => import('../games/klocka/ui/Labb');

// Fri övning utanför äventyret: inga stjärnor eller belöningar.
// Tidstornet har sitt eget Tidslabb (fri övning + tolkaren); andra områden övar fritt på sina banor.

function FreeStages({ def, game }: { def: AreaDef; game: GameModule }) {
  const stages = def.eras.flatMap((e) => e.nodes).filter((n): n is StageDef => n.type === 'stage');
  const [sel, setSel] = useState(stages[0]);
  const [n, setN] = useState(0);
  const [score, setScore] = useState({ ok: 0, all: 0 });
  const q = useMemo(() => game.makeQuestion(sel.spec, rngFrom(randomSeed())), [sel, n]);
  const View = game.View;
  return (
    <div class="labb">
      <div class="seg" role="group" aria-label="Vad vill du öva på?">
        {stages.map((s) => <button key={s.id} class={sel.id === s.id ? 'on' : ''} onClick={() => { setSel(s); setN((x) => x + 1); }}>{s.icon} {s.name}</button>)}
      </div>
      <p class="note">{sel.desc}</p>
      <View key={`${sel.id}-${n}`} q={q} hint={false}
        onAnswer={(r) => {
          setScore((s) => ({ ok: s.ok + (r.correct ? 1 : 0), all: s.all + 1 }));
          if (heroId.value) noteAnswer(heroId.value, def.areaId, game.skillOf(q), r.correct, r.hint, r.errTag);
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
      {tab === 'tolka' ? <Tolkaren /> : <FreePractice onResult={(q, r) => { if (heroId.value) noteAnswer(heroId.value, areaId, game.skillOf(q), r.correct, r.hint, r.errTag); }} />}
    </Screen>
  );
}
