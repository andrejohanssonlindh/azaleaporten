import type { ComponentChildren } from 'preact';
import { dataRev, go, heroId, previousVisit, toast } from '../state';
import { getProfile } from '../platform/profiles';
import { greeting } from '../platform/greeting';
import { getArea, getPlay, nextOpenNode, findNode } from '../platform/rpg/progress';
import { playable } from '../content/areas';
import { fitsGrade, REGIONS } from '../content/world';
import { animal } from '../content/heroes';
import { leaveToPicker } from '../session';
import { Mentor, Screen, TopBar, UpdateBanner } from './ui';

// Ön: startskärmen efter porten. Allt detaljerat ligger ett tryck bort.
// Reserverade platser (dimman) och småöarna runt om är till för framtida ämnen.

function Spot({ label, onClick, x, y, children, cls = '' }: { label: string; onClick: () => void; x: number; y: number; children: ComponentChildren; cls?: string }) {
  const w = label.length * 7.4 + 22;
  return (
    <g class={`isle-spot ${cls}`} role="button" tabIndex={0} aria-label={label} onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}>
      {children}
      <g class="isle-label" transform={`translate(${x} ${y})`}>
        <rect x={-w / 2} y={-13} width={w} height={26} rx={13} />
        <text text-anchor="middle" dominant-baseline="central">{label}</text>
      </g>
    </g>
  );
}

const fog = () => toast('🌫️ Dimman ligger tät här. Något nytt väntar – snart!');

function Island({ heroEmoji }: { heroEmoji: string }) {
  return (
    <svg class="island" viewBox="0 0 400 520" role="group" aria-label="Karta över ön">
      <defs>
        <linearGradient id="isle-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#74c0fc" /><stop offset="1" stop-color="#1c7ed6" /></linearGradient>
        <radialGradient id="isle-grass" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#a9e34b" /><stop offset="1" stop-color="#74b816" /></radialGradient>
      </defs>
      <rect width="400" height="520" fill="url(#isle-sea)" />
      <g stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round">
        {[[30, 40], [90, 110], [20, 200], [370, 200], [380, 330], [30, 410], [120, 500], [300, 505], [200, 30]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} q6 -5 12 0 q6 5 12 0`} />
        ))}
      </g>

      {/* framtida småöar */}
      <g class="isle-future" onClick={fog} role="button" tabIndex={0} aria-label="Okänd ö">
        <ellipse cx="350" cy="58" rx="32" ry="18" /><text x="350" y="59" text-anchor="middle" dominant-baseline="central">?</text>
      </g>
      <g class="isle-future" onClick={fog} role="button" tabIndex={0} aria-label="Okänd ö">
        <ellipse cx="365" cy="478" rx="24" ry="15" /><text x="365" y="479" text-anchor="middle" dominant-baseline="central">?</text>
      </g>

      {/* båtrutt till Västerön */}
      <path d="M112 330 Q85 330 72 310" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="4 6" />

      {/* huvudön */}
      <path d="M230 62 C300 58 360 100 372 170 C384 240 368 300 352 350 C336 410 300 470 240 478 C180 486 130 455 112 400 C96 350 104 300 108 250 C112 190 120 130 160 92 C182 72 205 63 230 62 Z" fill="#f4e3b5" />
      <path transform="translate(236 268) scale(.92) translate(-236 -268)" d="M230 62 C300 58 360 100 372 170 C384 240 368 300 352 350 C336 410 300 470 240 478 C180 486 130 455 112 400 C96 350 104 300 108 250 C112 190 120 130 160 92 C182 72 205 63 230 62 Z" fill="url(#isle-grass)" />

      {/* Västerön */}
      <Spot label="Västerön" x={58} y={344} onClick={() => go('region/vasteron')}>
        <path d="M25 300 C25 272 55 262 78 270 C98 278 100 305 88 320 C74 336 34 334 25 300 Z" fill="#f4e3b5" />
        <path d="M33 300 C34 280 56 273 74 279 C90 285 90 304 82 314 C70 326 40 324 33 300 Z" fill="#94d82d" />
        <path d="M50 300 L52 282" stroke="#8d6e4a" stroke-width="3" />
        <path d="M52 282 q-10 -2 -14 4 M52 282 q10 -3 14 3 M52 282 q-4 -8 -12 -8 M52 282 q4 -8 12 -7" stroke="#2f9e44" stroke-width="3" fill="none" stroke-linecap="round" />
        <rect x="66" y="282" width="7" height="20" fill="#fff" /><rect x="66" y="288" width="7" height="4" fill="#e03131" /><path d="M65 282 l4.5 -6 l4.5 6 z" fill="#e03131" />
      </Spot>

      {/* Talbergen + Tidstornet */}
      <Spot label="Talbergen" x={232} y={196} onClick={() => go('region/talbergen')}>
        <path d="M168 182 L206 108 L244 182 Z" fill="#868e96" />
        <path d="M212 182 L256 86 L300 182 Z" fill="#adb5bd" />
        <path d="M244 112 L256 86 L268 112 L262 106 L256 114 L250 106 Z" fill="#fff" />
        <path d="M196 128 L206 108 L216 128 L210 124 L206 130 L202 124 Z" fill="#fff" />
        <path d="M268 186 L298 130 L328 186 Z" fill="#868e96" />
        <rect x="300" y="96" width="20" height="56" fill="#7048e8" />
        <path d="M296 98 L310 76 L324 98 Z" fill="#5f3dc4" />
        <circle cx="310" cy="112" r="7" fill="#fff" /><path d="M310 112 V107 M310 112 H314" stroke="#212529" stroke-width="1.6" stroke-linecap="round" />
      </Spot>

      {/* Ordskogen */}
      <Spot label="Ordskogen" x={154} y={330} onClick={() => go('region/ordskogen')}>
        {[[130, 300], [152, 284], [174, 300], [140, 262], [168, 258], [120, 330], [158, 318], [186, 326], [196, 280]].map(([x, y], i) => (
          <g key={i}><path d={`M${x} ${y} l12 -30 l12 30 z`} fill={i % 2 ? '#2b8a3e' : '#2f9e44'} /><rect x={x + 10} y={y} width="4" height="6" fill="#8d6e4a" /></g>
        ))}
      </Spot>

      {/* Betongbukten */}
      <Spot label="Betongbukten" x={300} y={448} onClick={() => go('region/betongbukten')}>
        <path d="M250 380 L345 372 L338 430 L262 438 Z" fill="#ced4da" />
        <path d="M262 420 a22 22 0 0 1 22 -22 v22 z" fill="#adb5bd" stroke="#868e96" />
        <path d="M335 420 a22 22 0 0 0 -22 -22 v22 z" fill="#adb5bd" stroke="#868e96" />
        <ellipse cx="300" cy="392" rx="14" ry="7" fill="#868e96" />
        <text x="298" y="415" font-size="16" text-anchor="middle">🛹</text>
      </Spot>

      {/* Övningsängen */}
      <Spot label="Övningsängen" x={232} y={392} onClick={() => go('ovning')}>
        <ellipse cx="232" cy="352" rx="36" ry="20" fill="#d8f5a2" />
        <circle cx="222" cy="350" r="10" fill="#fff" /><circle cx="222" cy="350" r="6.5" fill="#e03131" /><circle cx="222" cy="350" r="3" fill="#fff" />
        <path d="M246 362 v-16 M240 350 h12 M246 346 a4 4 0 1 1 0.1 0" stroke="#8d6e4a" stroke-width="2.5" fill="none" stroke-linecap="round" />
      </Spot>

      {/* Azaleabyn */}
      <Spot label="Azaleabyn" x={240} y={316} cls="isle-home" onClick={() => go('by')}>
        <circle cx="240" cy="272" r="34" fill="#ffe3e3" opacity=".7" />
        {[[218, 270], [242, 258], [258, 278]].map(([x, y], i) => (
          <g key={i}><rect x={x - 9} y={y} width="18" height="14" fill="#fff4e6" stroke="#d9480f" stroke-width=".8" /><path d={`M${x - 11} ${y} L${x} ${y - 10} L${x + 11} ${y} Z`} fill="#e8590c" /></g>
        ))}
        {[[208, 290], [232, 294], [270, 292], [250, 246]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill="#e64980" />)}
        <text x="240" y="236" font-size="20" text-anchor="middle" class="isle-hero">{heroEmoji}</text>
      </Spot>

      {/* reserverade platser */}
      <g class="isle-fog" role="button" tabIndex={0} aria-label="Dimmiga höglandet" onClick={fog}>
        {[[330, 248, 18], [348, 262, 16], [318, 268, 15], [340, 236, 13]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        <text x="335" y="256" text-anchor="middle" dominant-baseline="central">?</text>
      </g>
      <g class="isle-fog" role="button" tabIndex={0} aria-label="Dimmiga dalen" onClick={fog}>
        {[[160, 420, 16], [178, 432, 14], [146, 434, 13]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        <text x="162" y="428" text-anchor="middle" dominant-baseline="central">?</text>
      </g>
      <g class="isle-fog" role="button" tabIndex={0} aria-label="Dimmiga udden" onClick={fog}>
        {[[150, 140, 15], [166, 150, 13], [136, 152, 12]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        <text x="152" y="146" text-anchor="middle" dominant-baseline="central">?</text>
      </g>
    </svg>
  );
}

export function IslandMap() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const last = getPlay(p.id).last;
  const lastArea = last && playable(last.areaId);
  const lastNode = lastArea && findNode(lastArea.def, last!.nodeId);
  const lastPlace = lastNode ? `${lastNode.name} i ${lastArea!.def.title}` : null;

  // Snabbknapp: fortsätt där äventyret pågår – senaste området, annars det första som passar årskursen.
  const cont = continueTarget(p.id, p.grade, last?.areaId);
  return (
    <Screen class="map">
      <TopBar p={p} />
      <UpdateBanner />
      <Mentor text={greeting(p.name, previousVisit.value, lastPlace)} compact />
      <Island heroEmoji={animal(p.animal).emoji} />
      {cont && (
        <button class="btn primary big continue" onClick={() => go(`spela/${cont.areaId}/${cont.node.id}`)}>
          {cont.icon} Fortsätt: {cont.node.name}
        </button>
      )}
      <footer class="map-foot">
        <button class="link" onClick={leaveToPicker}>Byt hjälte</button>
      </footer>
    </Screen>
  );
}

function continueTarget(hid: string, grade: number, lastAreaId: string | undefined) {
  const open = REGIONS.flatMap((r) => r.areas).filter((a) => a.status === 'open' && playable(a.id));
  const order = [...open.filter((a) => a.id === lastAreaId), ...open.filter((a) => fitsGrade(a, grade)), ...open];
  for (const a of order) {
    const node = nextOpenNode(playable(a.id)!.def, getArea(hid, a.id));
    if (node) return { areaId: a.id, node, icon: a.icon };
  }
  return null;
}
