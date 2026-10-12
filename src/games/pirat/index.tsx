import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, hint, makeQ, solution, specsForSkill, type PQ } from './logic';

// Piratskeppet som frågefabrik. Prepositionsfrågorna får en ritad bild: en låda eller ett bord och något som står där.

const EMOJI_Y: Record<string, Record<string, [number, number, number]>> = {
  // [x, y, storlek] för emojin; y är textens baslinje.
  box: { in: [100, 92, 30], on: [100, 72, 34], 'next to': [162, 124, 34], behind: [124, 74, 30], 'in front of': [100, 134, 40] },
  table: { on: [100, 66, 34], under: [100, 124, 32], 'next to': [176, 124, 34], behind: [100, 80, 30], 'in front of': [100, 134, 40] },
};

function Scene({ q }: { q: PQ }) {
  const s = q.scene!;
  const [x, y, size] = EMOJI_Y[s.obj][s.prep];
  const thing = <text x={x} y={y} font-size={size} text-anchor="middle">{s.sak}</text>;
  const before = s.prep === 'behind' || s.prep === 'in';
  return (
    <div class="pirat-scene">
      <svg viewBox="0 0 200 140" width="220" height="154" role="img" aria-label="Bild">
        <line x1="0" y1="126" x2="200" y2="126" class="pirat-ground" stroke-width="2" />
        {s.obj === 'box' && s.prep === 'in' && <path d="M70 80 L80 70 H140 L130 80 Z" class="pirat-inside" />}
        {before && thing}
        {s.obj === 'box'
          ? (
            <g class="pirat-box">
              <rect x="70" y="80" width="60" height="46" rx="3" />
              {s.prep !== 'in' && <path d="M70 80 L80 70 H140 L130 80 Z" />}
              <path d="M130 80 L140 70 V116 L130 126 Z" class="pirat-side" />
            </g>
          )
          : (
            <g class="pirat-table">
              <rect x="44" y="70" width="112" height="9" rx="2" />
              <rect x="50" y="79" width="100" height="18" class="pirat-skirt" />
              <rect x="54" y="97" width="7" height="29" /><rect x="139" y="97" width="7" height="29" />
            </g>
          )}
        {!before && thing}
      </svg>
    </div>
  );
}

function Visual({ q }: { q: PQ; done: boolean }) {
  return q.scene ? <Scene q={q} /> : null;
}

export const piratGame: OrdGame<PQ> = { id: 'pirat', make: makeQ, diagnose, explain, solution, hint, specsForSkill, errLabels: ERR, Visual };

export const pirat = ordModule(piratGame);
