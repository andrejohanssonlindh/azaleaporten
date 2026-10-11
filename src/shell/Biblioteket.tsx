import { dataRev, go, heroId } from '../state';
import { getProfile } from '../platform/profiles';
import { getArea, nodeDone } from '../platform/rpg/progress';
import { kunskapLevel } from '../platform/rpg/balance';
import { getEvents } from '../platform/learning/events';
import { dayOf, getSkills, type SkillItem } from '../platform/learning/skills';
import { allNodes } from '../platform/rpg/types';
import { PLAYABLE } from '../content/areas';
import { cap, skillLabel } from '../content/skills';
import { leaveToPicker } from '../session';
import { BackBar, Mentor, Screen } from './ui';

// Biblioteket i Azaleabyn: barnets egen statistik. Hur säker varje färdighet är (repetitionslådan),
// och vad som har varit klurigt på sistone (felkoderna). Inga jämförelser med andra, bara med sig själv.

function status(it: SkillItem, today: string): { cls: string; text: string } {
  if (it.due <= today) return { cls: 'mist', text: 'Dags att repetera' };
  if (it.box >= 4) return { cls: 'safe', text: 'Sitter som berget' };
  if (it.box >= 2) return { cls: 'near', text: 'Nästan säker' };
  return { cls: 'practice', text: 'Övar på' };
}

export function Biblioteket() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const today = dayOf();
  const events = getEvents(p.id);
  const right = events.filter((e) => e.c).length;
  const pct = events.length ? Math.round((100 * right) / events.length) : 0;
  const days = new Set(events.filter((e) => e.t).map((e) => dayOf(new Date(e.t)))).size;
  const skills = Object.entries(getSkills(p.id).items);
  const safe = skills.filter(([, it]) => it.box >= 4).length;

  const say = events.length === 0
    ? `Här samlar jag allt du lär dig, ${p.name}. Spela lite, så fylls hyllorna!`
    : `Du har svarat på ${events.length} frågor och ${pct} % var rätt direkt. ${safe > 0 ? `${cap(safe === 1 ? 'en sak' : `${safe} saker`)} sitter redan som berget!` : 'Fortsätt öva, så blir kunskapen säker.'}`;

  return (
    <Screen class="place">
      <BackBar label="Azaleabyn" to="by" />
      <div class="place-banner library"><span>📖</span><h1>Biblioteket</h1></div>
      <Mentor text={say} />
      <div class="stat-tiles">
        <div class="stat-tile"><b>{events.length}</b><small>frågor</small></div>
        <div class="stat-tile"><b>{pct} %</b><small>rätt direkt</small></div>
        <div class="stat-tile"><b>{days}</b><small>{days === 1 ? 'dag' : 'dagar'} med övning</small></div>
      </div>

      {Object.values(PLAYABLE).filter(({ def }) => !def.region).map(({ def, game }) => {
        const prog = getArea(p.id, def.areaId);
        const nodes = allNodes(def);
        const done = nodes.filter((n) => nodeDone(prog, n)).length;
        const stars = Object.values(prog.stages).reduce((s, x) => s + x.stars, 0);
        const maxStars = nodes.filter((n) => n.type === 'stage').length * 3;
        const mine = skills.filter(([, it]) => it.area === def.areaId).sort((a, b) => b[1].box - a[1].box);
        if (!mine.length && !done) return null;
        const errs = new Map<string, number>();
        for (const e of events.filter((x) => x.a === def.areaId && !x.c && x.e && x.e !== 'annat').slice(-200)) errs.set(e.e!, (errs.get(e.e!) ?? 0) + 1);
        const tricky = [...errs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => game.errLabel(tag)).filter(Boolean);
        const due = mine.filter(([, it]) => it.due <= today).length;
        return (
          <details class="card shelf" key={def.areaId}>
            <summary>
              <span class="shelf-icon" aria-hidden="true">{def.kunskap.icon}</span>
              <span class="shelf-title"><b>{def.title}</b><small>{def.kunskap.name} nivå {kunskapLevel(prog.xp).level} · {done}/{nodes.length} klara · ★ {stars}/{maxStars}{due ? ` · 🌫️ ${due}` : ''}</small></span>
            </summary>
            {mine.length > 0 && (
              <ul class="skill-list">
                {mine.map(([id, it]) => {
                  const st = status(it, today);
                  return (
                    <li key={id} class={`skill-item ${st.cls}`}>
                      <span>{cap(skillLabel(id))}</span>
                      <small>{st.text} · {it.correct} av {it.seen} rätt</small>
                    </li>
                  );
                })}
              </ul>
            )}
            {tricky.length > 0 && <p class="tricky"><b>Klurigt på sistone:</b> {tricky.join(', ').toLowerCase()}.</p>}
            <div class="row">
              <button class="btn small" onClick={() => go(`omrade/${def.areaId}`)}>Till {def.title}</button>
              {due > 0 && <button class="btn small primary" onClick={() => go(`repetera/${def.areaId}`)}>Jaga bort dimman</button>}
            </div>
          </details>
        );
      })}
    </Screen>
  );
}
