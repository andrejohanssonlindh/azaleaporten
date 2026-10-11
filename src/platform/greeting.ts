// Mästare Kastanjs hälsning. Byggs ut i fas 4 med vad som behöver repeteras (Glömskans dimma).

const DAY = 86_400_000;

function daysBetween(from: Date, to: Date) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / DAY);
}

/** lastPlace = namnet på det hjälten spelade senast, t.ex. "Halvsaurus i Tidstornet". */
export function greeting(name: string, previousVisit: string | null, lastPlace: string | null = null, now = new Date()): string {
  if (!previousVisit) {
    return `Välkommen till ön, ${name}! Jag är Mästare Kastanj. Tryck på Talbergen och leta upp Tidstornet – där börjar ditt äventyr.`;
  }
  const days = daysBetween(new Date(previousVisit), now);
  const repeat = lastPlace ? ` Senast var du vid ${lastPlace}. Vill du repetera det på Övningsängen?` : '';
  if (days <= 0) return `Hej igen, ${name}!${repeat}`;
  if (days === 1) return `Välkommen tillbaka, ${name}!${repeat}`;
  if (days < 10) return `Välkommen tillbaka, ${name}! Det var ${days} dagar sedan sist.${repeat}`;
  return `Välkommen tillbaka, ${name}! Det var ${days} dagar sedan sist – vi börjar lugnt och värmer upp.${repeat}`;
}
