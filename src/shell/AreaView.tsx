import { dataRev, go, heroId, toast } from '../state';
import { getProfile } from '../platform/profiles';
import { getArea, nextOpenNode, nodeStatus } from '../platform/rpg/progress';
import { kunskapLevel } from '../platform/rpg/balance';
import type { BossDef, PathNode } from '../platform/rpg/types';
import { playable } from '../content/areas';
import { areaById } from '../content/world';
import { personaFor } from '../content/bosses';
import { gate } from '../state';
import { leaveToPicker } from '../session';
import { BackBar, Screen, Stars } from './ui';
import { dueSkills } from '../platform/learning/skills';
import { skillLabel } from '../content/skills';

// Ett område som en stig genom epoker: banor och bossar i tur och ordning.

export function bossName(areaId: string, b: BossDef, grade: number): string {
  if (b.kind !== 'mastare') return b.name;
  return personaFor(b.personaId ?? `${areaId}.mastare`, gate.value?.pack ?? null, grade)?.name ?? b.name;
}

export function AreaView({ id }: { id: string }) {
  dataRev.value;
  const p = getProfile(heroId.value!);
  const pl = playable(id);
  const info = areaById(id);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  if (pl?.def.region) { queueMicrotask(() => go(`region/${pl.def.region!.id}`)); return null; }
  if (!pl || !info) { queueMicrotask(() => go('karta')); return null; }
  const area = pl.def;
  const prog = getArea(p.id, id);
  const next = nextOpenNode(area, prog);
  const k = kunskapLevel(prog.xp);
  const due = dueSkills(p.id, id);
  let i = 0;

  const tap = (n: PathNode) => {
    const st = nodeStatus(area, prog, n.id);
    if (st === 'locked') { toast('🔒 Klara banan innan först.'); return; }
    go(`spela/${id}/${n.id}`);
  };

  return (
    <Screen class="place area-view">
      <BackBar label={info.region.name} to={`region/${info.region.id}`}
        right={<span class="purse">{area.kunskap.icon} {area.kunskap.name} {k.level}</span>} />
      <div class="tower-head">
        <span class="tower-icon">{info.area.icon}</span>
        <h1>{area.title}</h1>
        <p>{area.story}</p>
      </div>
      {due.length > 0 && (
        <section class="mist-banner">
          <span class="mist-icon" aria-hidden="true">🌫️</span>
          <div>
            <b>Glömskans dimma ligger här</b>
            <small>{due.length === 1 ? '1 sak' : `${due.length} saker`} att repetera: {due.slice(0, 3).map((d) => skillLabel(d.skill)).join(', ')}{due.length > 3 ? ' …' : ''}</small>
          </div>
          <button class="btn small primary" onClick={() => go(`repetera/${id}`)}>Jaga bort den</button>
        </section>
      )}
      {next && <button class="btn primary big continue" onClick={() => tap(next)}>▶ {next.type === 'boss' ? `Möt ${bossName(id, next, p.grade)}` : `Spela: ${next.name}`}</button>}

      {area.eras.map((era) => (
        <section class="era" key={era.id}>
          <div class="era-head"><span class="era-icon">{era.icon}</span><div><h2>{era.name}</h2><p>{era.fact}</p></div></div>
          <div class="path">
            {era.nodes.map((n) => {
              const st = nodeStatus(area, prog, n.id);
              const right = i++ % 2 === 1;
              const isBoss = n.type === 'boss';
              const name = isBoss ? bossName(id, n, p.grade) : n.name;
              const sub = isBoss ? (n.kind === 'mastare' ? 'Mästare' : 'Boss') : n.desc;
              const label = (
                <div class="node-label">
                  {name}<small>{sub}</small>
                  {n.type === 'stage' && st === 'done' && <Stars n={prog.stages[n.id]?.stars ?? 0} />}
                  {isBoss && st === 'done' && <span class="node-won">Besegrad</span>}
                </div>
              );
              return (
                <div class="node-row" key={n.id}>
                  <div class="nl">{right ? label : null}</div>
                  <button class={`node ${st}${isBoss ? ' boss' : ''}${isBoss && n.kind === 'mastare' ? ' mastare' : ''}`} onClick={() => tap(n)} aria-label={`${name} (${st === 'locked' ? 'låst' : st === 'done' ? 'klar' : 'öppen'})`}>
                    {st === 'locked' ? '🔒' : n.icon}
                  </button>
                  <div class="nl">{right ? null : label}</div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section class="card lab-links">
        {area.gameId === 'klocka' ? (
          <>
            <h2>🧪 Tidslabbet</h2>
            <p class="muted">Öva fritt utan stjärnor, eller låt tidsmaskinen tolka en tid du skriver.</p>
            <div class="row">
              <button class="btn" onClick={() => go(`labb/${id}`)}>Öva fritt</button>
              <button class="btn" onClick={() => go(`labb/${id}/tolka`)}>Tolka en tid</button>
            </div>
          </>
        ) : (
          <>
            <h2>🧪 Öva fritt</h2>
            <p class="muted">Välj själv vad du vill träna på. Inga stjärnor – bara träning.</p>
            <div class="row"><button class="btn" onClick={() => go(`labb/${id}`)}>Öva fritt</button></div>
          </>
        )}
      </section>
    </Screen>
  );
}
