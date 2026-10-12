import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, hint, makeQ, solution, specsForSkill, type LogikQ } from './logic';

// Logikslingan som frågefabrik. Regelkortet (OM … SÅ … ANNARS) ritas som bild ovanför frågan.

function Regelkort({ q }: { q: LogikQ; done: boolean }) {
  if (!q.rule) return null;
  const r = q.rule;
  return (
    <div class="logik-rule" aria-label="Robos regel">
      <div><b>OM</b> {r.om}</div>
      <div><b>SÅ</b> {r.sa}</div>
      {r.annars && <div><b>ANNARS</b> {r.annars}</div>}
      <div class="logik-now">Just nu: {r.now}</div>
    </div>
  );
}

export const logikGame: OrdGame<LogikQ> = {
  id: 'logik', make: makeQ, diagnose, explain, solution, hint, specsForSkill, errLabels: ERR, Visual: Regelkort,
};

export const logik = ordModule(logikGame);
