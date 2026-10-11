import type { GameModule, QuestionSpec, QuestionViewProps } from '../platform/rpg/types';

// En regionboss blandar frågor från regionens alla spel. Frågeinställningarnas mode skrivs
// '<område>/<mode>', t.ex. 'tabellgruvan/ganger'. Varje fråga minns sitt område, så att
// dimman hamnar där färdigheten hör hemma.

interface RQ { area: string; q: unknown }

export function regionGame(id: string, games: Record<string, GameModule>): GameModule {
  const split = (spec: QuestionSpec): [string, QuestionSpec] => {
    const [area, mode] = spec.mode.split('/');
    return [area, { ...spec, mode }];
  };
  function View({ q, ...rest }: QuestionViewProps) {
    const r = q as RQ;
    const G = games[r.area].View;
    return <G q={r.q} {...rest} />;
  }
  return {
    id,
    makeQuestion: (spec, rng) => { const [area, s] = split(spec); return { area, q: games[area].makeQuestion(s, rng) } satisfies RQ; },
    skillOf: (q) => games[(q as RQ).area].skillOf((q as RQ).q),
    areaOf: (q) => (q as RQ).area,
    specsForSkill: (skill) => {
      for (const [area, g] of Object.entries(games)) {
        const specs = g.specsForSkill(skill);
        if (specs.length) return specs.map((s) => ({ ...s, mode: `${area}/${s.mode}` }));
      }
      return [];
    },
    errLabel: (tag) => Object.values(games).map((g) => g.errLabel(tag)).find(Boolean),
    View,
  };
}
