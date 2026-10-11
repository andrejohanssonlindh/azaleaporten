import { dataRev, go, heroId, previousVisit, toast } from '../state';
import { getProfile } from '../platform/profiles';
import { greeting } from '../platform/greeting';
import { getArea, getPlay, findNode, nodeDone } from '../platform/rpg/progress';
import { allNodes } from '../platform/rpg/types';
import { playable } from '../content/areas';
import { region as regionById, fitsGrade, type Region } from '../content/world';
import { leaveToPicker } from '../session';
import { BackBar, Mentor, Screen, Stars } from './ui';

// Azaleabyn (byn i mitten av ön) och regionsidorna med sina områden ("grottor").

const BUILDINGS = [
  { id: 'gard', icon: '🏡', name: 'Azaleagården', desc: 'Ditt hem och ditt hjälteblad', to: 'gard' },
  { id: 'uppdrag', icon: '📜', name: 'Uppdragstavlan', desc: 'Dagens uppdrag', to: null },
  { id: 'smedjan', icon: '⚒️', name: 'Smedjan', desc: 'Köp, smid och sälj', to: null },
  { id: 'biblioteket', icon: '📖', name: 'Biblioteket', desc: 'Dina framsteg', to: null },
];

export function Azaleabyn() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const last = getPlay(p.id).last;
  const la = last && playable(last.areaId);
  const ln = la && findNode(la.def, last!.nodeId);
  return (
    <Screen class="place">
      <BackBar label="Till ön" to="karta" />
      <div class="place-banner village"><span>🌸</span><h1>Azaleabyn</h1></div>
      <Mentor text={greeting(p.name, previousVisit.value, ln ? `${ln.name} i ${la!.def.title}` : null)} />
      <div class="building-grid">
        {BUILDINGS.map((b) => (
          <button key={b.id} class={`building${b.to ? '' : ' soon'}`} onClick={() => (b.to ? go(b.to) : toast(`${b.icon} ${b.name} öppnar snart!`))}>
            <span class="building-icon">{b.icon}</span>
            <b>{b.name}</b>
            <small>{b.desc}</small>
            {!b.to && <span class="badge-soon">Snart</span>}
          </button>
        ))}
      </div>
    </Screen>
  );
}

function RegionBanner({ r }: { r: Region }) {
  const [top, bottom, ground] = r.sky;
  return (
    <div class="region-sky">
      <svg viewBox="0 0 300 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><linearGradient id={`sky-${r.id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color={top} /><stop offset="1" stop-color={bottom} /></linearGradient></defs>
        <rect width="300" height="80" fill={`url(#sky-${r.id})`} />
        {r.id === 'talbergen' && <path d="M0 80 L50 34 L82 58 L130 18 L178 60 L214 36 L262 64 L300 44 V80 Z" fill={ground} />}
        {r.id === 'ordskogen' && <g fill={ground}>{[10, 40, 70, 100, 130, 160, 190, 220, 250, 280].map((x, i) => <path key={x} d={`M${x} 80 L${x + 16} ${30 + (i % 3) * 10} L${x + 32} 80 Z`} />)}</g>}
        {r.id === 'vasteron' && <><circle cx="240" cy="34" r="14" fill="#ffd43b" opacity=".9" /><rect y="58" width="300" height="22" fill="#4dabf7" opacity=".7" /><path d="M60 62 Q120 40 180 62 Z" fill={ground} /></>}
        {r.id === 'betongbukten' && <><rect y="62" width="300" height="18" fill={ground} /><path d="M40 62 a30 30 0 0 1 30 -30 v30 z M260 62 a30 30 0 0 0 -30 -30 v30 z" fill="#adb5bd" /><circle cx="150" cy="30" r="12" fill="#fff3bf" /></>}
      </svg>
      <div class="region-name"><span>{r.icon} {r.name}</span><small>{r.subject}</small></div>
    </div>
  );
}

export function RegionView({ id }: { id: string }) {
  dataRev.value;
  const p = getProfile(heroId.value!);
  const r = regionById(id);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  if (!r) { queueMicrotask(() => go('karta')); return null; }
  return (
    <Screen class="place">
      <BackBar label="Till ön" to="karta" />
      <section class="region card">
        <RegionBanner r={r} />
        <p class="region-tagline">{r.tagline}</p>
        <div class="area-grid">
          {r.areas.map((a) => {
            const pl = playable(a.id);
            let progress = null;
            if (pl) {
              const ap = getArea(p.id, a.id), nodes = allNodes(pl.def);
              const done = nodes.filter((n) => nodeDone(ap, n)).length;
              const stars = Object.values(ap.stages).reduce((s, x) => s + x.stars, 0);
              const maxStars = nodes.filter((n) => n.type === 'stage').length * 3;
              progress = <span class="area-progress">{done}/{nodes.length} klara · ★ {stars}/{maxStars}</span>;
            }
            return (
              <button key={a.id} class={`area area-${a.status}`} onClick={() => (a.status === 'open' ? go(`omrade/${a.id}`) : toast(`${a.icon} ${a.name} öppnar snart!`))}>
                <span class="area-icon">{a.icon}</span>
                <span class="area-text"><b>{a.name}</b><small>{a.desc}</small>{progress}</span>
                {a.status === 'soon' && <span class="badge-soon">Snart</span>}
                {a.status === 'open' && fitsGrade(a, p.grade) && <span class="badge-fit">Passar dig</span>}
              </button>
            );
          })}
        </div>
      </section>
    </Screen>
  );
}

export { Stars };
