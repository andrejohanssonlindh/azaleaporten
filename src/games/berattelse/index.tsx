import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, hint, makeQ, solution, specsForSkill, type LQ } from './logic';
import { TEXTER } from './texter';

// Berättelsebiblioteket som frågefabrik. Texten står i ett eget kort ovanför frågan.

function TextKort({ q }: { q: LQ; done: boolean }) {
  const t = TEXTER[q.text];
  return (
    <article class={`las-text las-${t.typ}`} aria-label={t.titel}>
      <h3>{t.titel}</h3>
      {t.text.split('\n').map((rad, i) => <p key={i}>{rad}</p>)}
    </article>
  );
}

export const berattelseGame: OrdGame<LQ> = { id: 'berattelse', make: makeQ, diagnose, explain, solution, hint, specsForSkill, errLabels: ERR, Visual: TextKort };

export const berattelse = ordModule(berattelseGame);
