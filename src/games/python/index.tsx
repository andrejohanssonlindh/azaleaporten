import { ordModule } from '../../engines/ord/OrdView';
import type { OrdGame } from '../../engines/ord/types';
import { diagnose, ERR, explain, explainMiss, hint, makeQ, solution, specsForSkill, type PyQ } from './logic';

// Pythonhamnen som frågefabrik. Koden ritas med färger, som i en riktig kodeditor.

const KW = new Set(['if', 'else', 'for', 'in', 'while', 'and', 'or', 'not']);
const FN = new Set(['print', 'range', 'len']);

/** Färglägger en kodrad: text inom citattecken, tal, nyckelord och funktioner. */
export function Kodrad({ line }: { line: string }) {
  const parts = line.match(/"[^"]*"?|\d+|[A-Za-zåäöÅÄÖ_]+|\s+|./g) ?? [];
  return (
    <>
      {parts.map((p, i) => {
        const cls = p.startsWith('"') ? 'py-str' : /^\d+$/.test(p) ? 'py-num' : KW.has(p) ? 'py-kw' : FN.has(p) ? 'py-fn' : '';
        return cls ? <span key={i} class={cls}>{p}</span> : p;
      })}
    </>
  );
}

function Kod({ q }: { q: PyQ; done: boolean }) {
  if (!q.code) return null;
  return (
    <pre class="py-code" aria-label="Pythonkod" lang="en">
      {q.code.map((l, i) => <div key={i}><span class="py-nr" aria-hidden="true">{i + 1}</span><Kodrad line={l} /></div>)}
    </pre>
  );
}

export const pythonGame: OrdGame<PyQ> = {
  id: 'python', make: makeQ, diagnose, explain, explainMiss, solution, hint, specsForSkill, errLabels: ERR, Visual: Kod,
};

export const python = ordModule(pythonGame);
