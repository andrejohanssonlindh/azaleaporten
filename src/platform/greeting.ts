// Mästare Kastanjs hälsning. I fas 4 byggs den ut med vad hjälten övade senast och vad som behöver repeteras.

const DAY = 86_400_000;

function daysBetween(from: Date, to: Date) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / DAY);
}

export function greeting(name: string, previousVisit: string | null, now = new Date()): string {
  if (!previousVisit) {
    return `Välkommen till Azaleaporten, ${name}! Jag är Mästare Kastanj. Här ute väntar Talbergen, Ordskogen och Västerön. Snart öppnar Tidstornet sina dörrar – det blir ditt första äventyr.`;
  }
  const days = daysBetween(new Date(previousVisit), now);
  if (days <= 0) return `Hej igen, ${name}! Redo för mer äventyr?`;
  if (days === 1) return `Välkommen tillbaka, ${name}! Kul att se dig igen.`;
  if (days < 10) return `Välkommen tillbaka, ${name}! Det var ${days} dagar sedan sist.`;
  return `Välkommen tillbaka, ${name}! Det var ${days} dagar sedan sist – vi börjar lugnt och värmer upp.`;
}
