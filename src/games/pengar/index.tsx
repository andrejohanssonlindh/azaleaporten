import { drillModule } from '../../engines/drill/DrillView';
import type { DrillGame } from '../../engines/drill/types';
import { COINS, diagnose, ERR, explain, hint, kr, makeQ, solution, specsForSkill, type PQ } from './logic';

// Myntmarknaden som frågefabrik. Mynten och sedlarna ritas förenklat (inga riktiga motiv).

const NOTE_COLOR: Record<number, string> = { 20: '#9775fa', 50: '#f59f00', 100: '#4dabf7', 200: '#51cf66', 500: '#ff6b6b' };

export function Piece({ v }: { v: number }) {
  if (COINS.includes(v)) {
    const r = { 1: 17, 2: 20, 5: 21, 10: 19 }[v]!;
    const gold = v >= 5;
    return (
      <svg class="coin" width={r * 2 + 4} height={r * 2 + 4} viewBox={`0 0 ${r * 2 + 4} ${r * 2 + 4}`} role="img" aria-label={`${v} krona${v > 1 ? 'or' : ''}`}>
        <circle cx={r + 2} cy={r + 2} r={r} fill={gold ? '#f2c94c' : '#ced4da'} stroke={gold ? '#b8860b' : '#868e96'} stroke-width="2" />
        <circle cx={r + 2} cy={r + 2} r={r - 4} fill="none" stroke={gold ? '#b8860b' : '#868e96'} stroke-width="1" opacity=".6" />
        <text x={r + 2} y={r + 3} text-anchor="middle" dominant-baseline="central" class="coin-v">{v}</text>
      </svg>
    );
  }
  return (
    <svg class="note" width="92" height="50" viewBox="0 0 92 50" role="img" aria-label={`${v}-lapp`}>
      <rect x="1" y="1" width="90" height="48" rx="6" fill={NOTE_COLOR[v] ?? '#adb5bd'} stroke="rgba(0,0,0,.25)" stroke-width="2" />
      <circle cx="68" cy="25" r="14" fill="rgba(255,255,255,.35)" />
      <text x="24" y="26" text-anchor="middle" dominant-baseline="central" class="note-v">{v}</text>
    </svg>
  );
}

function Market({ q }: { q: PQ; hint: boolean; done: boolean }) {
  if (q.mode === 'rakna') return <div class="money" aria-label="Pengar på bordet">{q.pieces!.map((v, i) => <Piece key={i} v={v} />)}</div>;
  return (
    <div class="market">
      {q.wares!.map((w, i) => (
        <span key={i} class="ware"><span class="ware-icon" aria-hidden="true">{w.icon}</span><span class="price-tag">{q.count ? `${kr(w.price)}/st` : kr(w.price)}</span></span>
      ))}
      {q.count && <span class="ware-count">× {q.count}</span>}
      {q.paid && <span class="paid"><small>Du betalar</small><Piece v={q.paid} /></span>}
    </div>
  );
}

export const pengarGame: DrillGame<PQ> = { id: 'pengar', make: makeQ, specsForSkill, diagnose, explain, solution, hint, Visual: Market, errLabels: ERR };

export const pengar = drillModule(pengarGame);
