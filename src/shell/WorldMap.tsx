import { dataRev, heroId, previousVisit, toast } from '../state';
import { getProfile } from '../platform/profiles';
import { greeting } from '../platform/greeting';
import { REGIONS, fitsGrade, type Region } from '../content/world';
import { leaveToPicker } from '../session';
import { Mentor, Screen, TopBar, UpdateBanner } from './ui';

const ACADEMY = [
  { id: 'uppdrag', icon: '📜', name: 'Uppdragstavlan', desc: 'Dagens uppdrag' },
  { id: 'smedjan', icon: '⚒️', name: 'Smedjan', desc: 'Köp, smid och sälj' },
  { id: 'biblioteket', icon: '📖', name: 'Biblioteket', desc: 'Dina framsteg' },
];

function RegionSky({ r }: { r: Region }) {
  const [top, bottom, ground] = r.sky;
  return (
    <svg viewBox="0 0 300 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${r.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color={top} /><stop offset="1" stop-color={bottom} />
        </linearGradient>
      </defs>
      <rect width="300" height="80" fill={`url(#sky-${r.id})`} />
      {r.id === 'talbergen' && <path d="M0 80 L50 34 L82 58 L130 18 L178 60 L214 36 L262 64 L300 44 V80 Z" fill={ground} />}
      {r.id === 'ordskogen' && (
        <g fill={ground}>
          {[10, 40, 70, 100, 130, 160, 190, 220, 250, 280].map((x, i) => (
            <path key={x} d={`M${x} ${80} L${x + 16} ${30 + (i % 3) * 10} L${x + 32} 80 Z`} />
          ))}
        </g>
      )}
      {r.id === 'vasteron' && (
        <>
          <circle cx="240" cy="34" r="14" fill="#ffd43b" opacity=".9" />
          <rect y="58" width="300" height="22" fill="#4dabf7" opacity=".7" />
          <path d="M60 62 Q120 40 180 62 Z" fill={ground} />
        </>
      )}
    </svg>
  );
}

export function WorldMap() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  if (!p) { queueMicrotask(leaveToPicker); return null; }

  return (
    <Screen class="map">
      <TopBar p={p} />
      <UpdateBanner />
      <Mentor text={greeting(p.name, previousVisit.value)} />

      <section class="academy card">
        <h2>🏰 Kastanjeakademin</h2>
        <div class="academy-row">
          {ACADEMY.map((b) => (
            <button key={b.id} class="building" onClick={() => toast(`${b.icon} ${b.name} öppnar snart!`)}>
              <span class="building-icon">{b.icon}</span>
              <b>{b.name}</b>
              <small>{b.desc}</small>
            </button>
          ))}
        </div>
      </section>

      {REGIONS.map((r) => (
        <section class="region card" key={r.id}>
          <div class="region-sky">
            <RegionSky r={r} />
            <div class="region-name"><span>{r.icon} {r.name}</span><small>{r.subject}</small></div>
          </div>
          <p class="region-tagline">{r.tagline}</p>
          <div class="area-grid">
            {r.areas.map((a) => (
              <button key={a.id} class={`area area-${a.status}`} onClick={() => toast(`${a.icon} ${a.name} öppnar snart!`)}>
                <span class="area-icon">{a.icon}</span>
                <span class="area-text">
                  <b>{a.name}</b>
                  <small>{a.desc}</small>
                </span>
                {fitsGrade(a, p.grade) && <span class="badge-fit">Passar dig</span>}
                {a.status === 'soon' && <span class="badge-soon">Snart</span>}
              </button>
            ))}
          </div>
        </section>
      ))}

      <footer class="map-foot">
        <button class="link" onClick={leaveToPicker}>Byt hjälte</button>
      </footer>
    </Screen>
  );
}
