import type { Atom, Explained, Prog, RobotQ } from './types';
import { hasAtom, ids, loopCounts, run, samePos, solves, stepOff, swapLR } from './world';

// Rättning och förklaringar för alla robotspel. Felkoderna är permanenta.
// Rättningen är alltid en körning: varje program som får roboten fram är rätt.

export const ROBOT_ERR: Record<string, string> = {
  'vanster-hoger': 'Vänster och höger bytta',
  'ett-steg': 'Ett steg för långt eller för kort',
  forbi: 'Körde förbi batteriet',
  krock: 'Körde in i en sten',
  missade: 'Missade en diamant',
  'fel-vag': 'Fel väg',
  'loop-antal': 'Fel antal varv i loopen',
  'bara-forsta': 'Trodde att bara första blocket upprepas',
  'loop-en-gang': 'Trodde att loopen bara körs en gång',
  'svang-flyttar': 'Trodde att en sväng flyttar roboten',
  'sista-blocket': 'Letade där krocken syntes',
  'fel-block': 'Fel block',
  'fel-ruta': 'Fel ruta',
};

/** Felkoden för ett byggt program som inte kom fram. Provar små ändringar: går det med dem, var det det felet. */
export function diagnoseProg(q: RobotQ, prog: Prog): string {
  const w = q.world, t = run(w, prog);
  const ok = (p: Prog) => solves(w, p);
  if (hasAtom(prog, (a) => a === 'V' || a === 'H') && ok(swapLR(prog))) return 'vanster-hoger';
  if ([...loopCounts(prog, 1), ...loopCounts(prog, -1)].some(ok)) return 'loop-antal';
  const { fewer, more } = stepOff(prog);
  if (fewer.some(ok) || more.some(ok)) return 'ett-steg';
  if (w.goal && !t.crash && t.gems.length === w.gems.length && t.states.slice(0, -1).some((s) => samePos([s.x, s.y], w.goal!))) return 'forbi';
  if (w.goal && !t.crash && samePos(t.end, w.goal) && t.gems.length < w.gems.length) return 'missade';
  if (t.crash) return 'krock';
  return 'fel-vag';
}

const svang = (q: RobotQ) => q.palette === 'svang';

/** Förklaringen vid ett fel. Den säger vad som gick fel, aldrig vad som är rätt. */
export function explainRobot(tag: string, q: RobotQ): Explained {
  switch (tag) {
    case 'vanster-hoger':
      return svang(q)
        ? { title: 'Robotens vänster', text: 'Roboten svänger åt sitt eget håll. När den tittar mot dig är dess vänster din höger! Låtsas att du är roboten och vänd dig likadant.' }
        : { title: 'Vänster och höger', text: 'Kolla pilarna åt sidan en gång till: åt vilket håll pekar de?' };
    case 'ett-steg':
      return { title: 'Ett steg fel', text: 'Nästan! Roboten hamnar ett steg fel. Räkna stegen igen – rutan där roboten står räknas inte.' };
    case 'forbi':
      return { title: 'Förbi batteriet', text: 'Roboten var framme vid batteriet, men körde vidare. Programmet ska ta slut när roboten står på 🔋.' };
    case 'krock':
      return { title: 'Pang!', text: 'Roboten körde in i en sten eller ut över kanten. Titta var den krockade och ändra programmet där.' };
    case 'missade':
      return { title: 'En diamant blev kvar', text: 'Roboten kom fram, men den plockade inte alla 💎. Hitta en väg som går över alla diamanterna.' };
    case 'fel-vag':
      return { title: 'Fel väg', text: 'Roboten hamnade inte vid batteriet. Följ programmet med fingret, ett block i taget, och se var det går fel.' };
    case 'loop-antal':
      return q.kind === 'bygg'
        ? { title: 'Räkna varven', text: 'Loopen går ett varv för mycket eller för lite. Hur många gånger behöver det upprepas?' }
        : { title: 'Räkna varven', text: 'Loopen körs precis så många gånger som det står – inte en gång mer eller mindre.' };
    case 'bara-forsta':
      return { title: 'Allt i loopen upprepas', text: 'Allt som står inne i loopen upprepas, inte bara det första blocket. Gå igenom hela loopen, varv för varv.' };
    case 'loop-en-gang':
      return { title: 'Loopen går flera varv', text: 'En loop gör samma sak om och om igen. Hur många varv står det? Gå igenom loopen så många gånger.' };
    case 'svang-flyttar':
      return { title: 'En sväng flyttar inte', text: 'När roboten svänger vänder den sig bara – den står kvar på samma ruta. Det är bara Framåt som flyttar den.' };
    case 'sista-blocket':
      return { title: 'Där var det redan fel', text: 'När roboten kom till det blocket hade den redan kommit fel. Testkör och titta: var börjar roboten gå åt fel håll?' };
    case 'fel-block':
      return q.kind === 'lucka'
        ? { title: 'Inte det', text: 'Prova det alternativet i huvudet: vart åker roboten då? Kommer den fram till 🔋?' }
        : { title: 'Det blocket gör rätt', text: 'Testkör och följ roboten. Vilket block skickar den åt fel håll?' };
    case 'fel-ruta':
    default:
      return { title: 'Inte där', text: 'Följ programmet med fingret, ett block i taget. Var står roboten efter varje block?' };
  }
}

export function hintRobot(q: RobotQ): string {
  switch (q.kind) {
    case 'bygg':
      if (q.maxBlocks) return 'Leta efter något som upprepas. Det kan du lägga i en loop, så räcker blocken.';
      return svang(q)
        ? 'Låtsas att du är roboten. Vart tittar du? Vänd dig i huvudet innan du väljer vänster eller höger.'
        : 'Räkna rutorna till batteriet: hur många åt sidan, och hur många upp eller ner? Rutan där roboten står räknas inte.';
    case 'vart':
      return 'Följ programmet med fingret, ett block i taget. Var står roboten efter varje block?';
    case 'bugg':
      return 'Testkör programmet och titta noga: var börjar roboten gå åt fel håll?';
    case 'lucka':
      return 'Prova varje alternativ i huvudet: vart åker roboten då?';
  }
}

export const ATOM_NAME: Record<Atom, string> = { U: 'Upp', R: 'Höger', D: 'Ner', L: 'Vänster', F: 'Framåt', V: 'Sväng vänster', H: 'Sväng höger' };
export const LETTERS = ['A', 'B', 'C', 'D'];

/** Vid bugg: är det tryckta blocket rätt, och vilken felkod får det annars? */
export function checkBug(q: RobotQ, id: string): string | undefined {
  if (q.targets!.includes(id)) return undefined;
  const order = ids(q.prog!);
  const first = Math.min(...q.targets!.map((t) => order.indexOf(t)));
  return order.indexOf(id) > first ? 'sista-blocket' : 'fel-block';
}
