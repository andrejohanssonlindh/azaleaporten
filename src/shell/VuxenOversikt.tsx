import { getProfile, type Profile } from '../platform/profiles';
import { getEvents, type LogEvent } from '../platform/learning/events';
import { dayOf, getSkills } from '../platform/learning/skills';
import { minutesPerDay, sessions, skillColor, topErrors, type SkillColor } from '../platform/learning/stats';
import { bestStreak, peekQuests, streakOf } from '../platform/learning/quests';
import { PLAYABLE } from '../content/areas';
import { cap, skillLabel } from '../content/skills';
import { useGame } from './useGame';
import { Avatar } from './ui';

// Vuxenläge: hur det går för en hjälte. Tid per dag, uppdrag, färdighetskarta (grön/gul/röd),
// vanligaste felen och de senaste passen. Allt räknas ur det som redan sparas på enheten.

const areaTitle = (a: string) => PLAYABLE[a]?.def.title ?? a;
const weekday = (day: string) => new Date(`${day}T12:00`).toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '');
const dateLong = (day: string) => new Date(`${day}T12:00`).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
/** Minuter, men "<1" när det har övats lite (så att en dag med övning aldrig ser tom ut). */
const mins = (d: { min: number; n: number }) => (d.min === 0 && d.n > 0 ? '<1' : String(d.min));
const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);

const COLOR: Record<SkillColor, { icon: string; text: string }> = {
  gron: { icon: '✓', text: 'Sitter' },
  gul: { icon: '…', text: 'Övar' },
  rod: { icon: '🌫️', text: 'Dags att repetera' },
};

function TimeChart({ days }: { days: { day: string; min: number; n: number }[] }) {
  const max = Math.max(10, ...days.map((d) => d.min));
  const today = days.at(-1)!;
  return (
    <figure class="time-chart">
      <figcaption>Aktiv tid per dag, senaste {days.length} dagarna <small>(skala upp till {max} min)</small></figcaption>
      <div class="tc-plot" role="list">
        {days.map((d) => {
          const label = `${dateLong(d.day)}: ${mins(d)} min, ${d.n} frågor`;
          return (
            <div class="tc-col" role="listitem" key={d.day} tabIndex={0} aria-label={label} data-tip={`${mins(d)} min · ${d.n} frågor`}>
              <div class="tc-bar" style={{ height: d.n ? `max(3px, ${(100 * d.min) / max}%)` : '0' }} />
              <small class={d === today ? 'tc-day today' : 'tc-day'}>{weekday(d.day)}</small>
            </div>
          );
        })}
      </div>
      <p class="note">Idag: {mins(today)} min. Tiden räknas per fråga (högst en minut per fråga), så pauser räknas inte.</p>
    </figure>
  );
}

function SkillMap({ hid }: { hid: string }) {
  const today = dayOf();
  const byArea: Record<string, [string, SkillColor][]> = {};
  for (const [id, it] of Object.entries(getSkills(hid).items)) (byArea[it.area] ??= []).push([id, skillColor(it, today)]);
  const areas = Object.keys(byArea).filter((a) => PLAYABLE[a]);
  if (!areas.length) return <p class="muted">Inga färdigheter övade än.</p>;
  const order: SkillColor[] = ['rod', 'gul', 'gron'];
  return (
    <>
      <p class="skillmap-legend">
        {order.map((c) => <span key={c} class={`skill-chip ${c}`}><span aria-hidden="true">{COLOR[c].icon}</span> {COLOR[c].text}</span>)}
      </p>
      {areas.map((a) => {
        const list = byArea[a].sort((x, y) => order.indexOf(x[1]) - order.indexOf(y[1]));
        const n = (c: SkillColor) => list.filter((x) => x[1] === c).length;
        return (
          <div class="skillmap-area" key={a}>
            <b>{areaTitle(a)}</b> <small class="muted">{n('gron')} sitter · {n('gul')} övar · {n('rod')} att repetera</small>
            <div class="skillmap-chips">
              {list.map(([id, c]) => (
                <span key={id} class={`skill-chip ${c}`} title={COLOR[c].text}>
                  <span aria-hidden="true">{COLOR[c].icon}</span> {cap(skillLabel(id))}<span class="sr-only"> ({COLOR[c].text})</span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

/** Felkodernas namn finns i spelet, som laddas först här. */
function AreaErrors({ areaId, errs }: { areaId: string; errs: { tag: string; n: number }[] }) {
  const game = useGame(areaId);
  const label = (tag: string) => (typeof game === 'string' ? '…' : game.errLabel(tag) ?? tag);
  return (
    <li>
      <b>{areaTitle(areaId)}:</b> {errs.map((e) => `${label(e.tag).toLowerCase()} (${e.n})`).join(', ')}
    </li>
  );
}

function Quests({ hid }: { hid: string }) {
  const q = peekQuests(hid);
  const today = dayOf();
  const todayDone = q.day === today ? q.list.filter((x) => x.done).length : 0;
  const recent = q.history.filter((h) => h.day >= dayOf(new Date(Date.now() - 13 * 86_400_000)));
  const allDone = recent.filter((h) => h.done >= h.of).length + (q.day === today && q.list.length && todayDone >= q.list.length ? 1 : 0);
  return (
    <ul class="plain">
      <li>Idag: <b>{q.day === today ? `${todayDone} av ${q.list.length}` : 'inte öppnat Uppdragstavlan än'}</b></li>
      <li>Alla uppdrag klara: <b>{allDone}</b> av de senaste 14 dagarna{recent.length < 13 && <small class="muted"> (sparas sedan {q.history[0] ? dateLong(q.history[0].day) : 'idag'})</small>}</li>
      <li>Svit: <b>🔥 {streakOf(hid)}</b> {streakOf(hid) === 1 ? 'dag' : 'dagar'} i rad · längsta: {bestStreak(hid)}</li>
    </ul>
  );
}

function Sessions({ events }: { events: LogEvent[] }) {
  const list = sessions(events, 5);
  if (!list.length) return <p class="muted">Inga pass än.</p>;
  return (
    <ul class="plain session-list">
      {list.map((s) => (
        <li key={s.start}>
          <b>{new Date(s.start).toLocaleString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</b>
          {' '}· {s.min} min · {s.n} frågor · {pct(s.right, s.n)} % rätt direkt
          <br /><small class="muted">{s.areas.map(areaTitle).join(', ')}</small>
        </li>
      ))}
    </ul>
  );
}

export function HeroOverview({ hid }: { hid: string }) {
  const p: Profile | null = getProfile(hid);
  if (!p) return null;
  const events = getEvents(hid);
  const days = minutesPerDay(events, 14);
  const week = days.slice(-7);
  const weekN = week.reduce((s, d) => s + d.n, 0);
  const weekMin = week.reduce((s, d) => s + d.min, 0);
  const since = dayOf(new Date(Date.now() - 6 * 86_400_000));
  const weekRight = events.filter((e) => e.t && dayOf(new Date(e.t)) >= since && e.c).length;
  const errs = Object.entries(topErrors(events)).filter(([a]) => PLAYABLE[a]);
  const last = p.lastActiveAt ? new Date(p.lastActiveAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }) : 'aldrig';

  return (
    <details class="card shelf overview">
      <summary>
        <Avatar p={p} size={40} />
        <span class="shelf-title"><b>{p.name}</b><small>Senast aktiv: {last} · {mins({ min: weekMin, n: weekN })} min senaste veckan</small></span>
      </summary>
      <div class="stat-tiles">
        <div class="stat-tile"><b>{mins({ min: weekMin, n: weekN })}</b><small>minuter (7 dagar)</small></div>
        <div class="stat-tile"><b>{weekN}</b><small>frågor (7 dagar)</small></div>
        <div class="stat-tile"><b>{weekN ? `${pct(weekRight, weekN)} %` : '–'}</b><small>rätt direkt</small></div>
      </div>
      <TimeChart days={days} />
      <h3>Uppdrag</h3>
      <Quests hid={hid} />
      <h3>Färdigheter</h3>
      <SkillMap hid={hid} />
      <h3>Vanligaste felen</h3>
      {errs.length ? <ul class="plain">{errs.map(([a, e]) => <AreaErrors key={a} areaId={a} errs={e} />)}</ul> : <p class="muted">Inga återkommande fel än.</p>}
      <h3>Senaste passen</h3>
      <Sessions events={events} />
    </details>
  );
}
