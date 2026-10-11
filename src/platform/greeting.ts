// Mästare Kastanjs hälsning: välkommen tillbaka, hur det gick sist, och var Glömskans dimma ligger.

const DAY = 86_400_000;

function daysBetween(from: Date, to: Date) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / DAY);
}

export interface GreetingExtra {
  /** Hur det gick på senaste rundan (bara banor och repetition, inte bossar). */
  lastResult?: { correct: number; total: number };
  /** Det viktigaste som behöver repeteras: färdighetens namn och området. */
  mist?: { skill: string; area: string; count: number };
}

/** lastPlace = namnet på det hjälten spelade senast, t.ex. "Halvsaurus i Tidstornet". */
export function greeting(name: string, previousVisit: string | null, lastPlace: string | null = null, now = new Date(), extra: GreetingExtra = {}): string {
  if (!previousVisit) {
    return `Välkommen till ön, ${name}! Jag är Mästare Kastanj. Tryck på Talbergen och välj ett ställe som passar dig – där börjar ditt äventyr.`;
  }
  const days = daysBetween(new Date(previousVisit), now);
  const hello = days <= 0 ? `Hej igen, ${name}!` : days === 1 ? `Välkommen tillbaka, ${name}!` : `Välkommen tillbaka, ${name}! Det var ${days} dagar sedan sist.`;
  const warm = days >= 10 ? ' Vi börjar lugnt och värmer upp.' : '';
  const last = lastPlace && extra.lastResult ? ` Senast var du vid ${lastPlace} och fick ${extra.lastResult.correct} av ${extra.lastResult.total}.` : '';
  if (extra.mist) {
    const more = extra.mist.count > 1 ? ` (och ${extra.mist.count - 1} till)` : '';
    return `${hello}${warm}${last} Glömskans dimma har krupit in över ${extra.mist.skill}${more} i ${extra.mist.area}. Ska vi jaga bort den? Det tar fem frågor.`;
  }
  const repeat = lastPlace ? (last ? ' Vill du repetera det på Övningsängen?' : ` Senast var du vid ${lastPlace}. Vill du repetera det på Övningsängen?`) : '';
  return `${hello}${warm}${last}${repeat}`;
}
