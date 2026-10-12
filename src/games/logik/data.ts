// Logikslingans innehåll: bilder till mönster, vardagsrutiner, färger och former, och robotregler.

/** Bilder till mönster: [emoji, namn]. Namnen är svaret (och knappens etikett för skärmläsare). */
export const BILDER: [string, string][][] = [
  [['🔴', 'röd cirkel'], ['🔵', 'blå cirkel'], ['🟢', 'grön cirkel'], ['🟡', 'gul cirkel']],
  [['🍎', 'äpple'], ['🍌', 'banan'], ['🍇', 'vindruvor'], ['🍓', 'jordgubbe']],
  [['🐶', 'hund'], ['🐱', 'katt'], ['🐭', 'mus'], ['🐸', 'groda']],
  [['⭐', 'stjärna'], ['🌙', 'måne'], ['☀️', 'sol'], ['☁️', 'moln']],
  [['🟥', 'röd fyrkant'], ['🟦', 'blå fyrkant'], ['🟩', 'grön fyrkant'], ['🟨', 'gul fyrkant']],
  [['🚗', 'bil'], ['🚲', 'cykel'], ['🚌', 'buss'], ['🚀', 'raket']],
];

/** Mönstrens upprepade bit: 0, 1, 2 = första, andra, tredje bilden. band 2 = kluriga mönster. */
export const ENHETER: { unit: number[]; band: 1 | 2 }[] = [
  { unit: [0, 1], band: 1 }, { unit: [0, 0, 1], band: 1 }, { unit: [0, 1, 1], band: 1 }, { unit: [0, 1, 2], band: 1 },
  { unit: [0, 0, 1, 1], band: 2 }, { unit: [0, 1, 2, 1], band: 2 }, { unit: [0, 1, 0, 2], band: 2 }, { unit: [0, 0, 1, 2], band: 2 },
];

/** Talmönster: start och steg. band 2 = större steg och baklänges. */
export const TALMONSTER: { start: [number, number]; step: number; band: 1 | 2 }[] = [
  { start: [0, 6], step: 2, band: 1 }, { start: [0, 10], step: 5, band: 1 }, { start: [10, 40], step: 10, band: 1 },
  { start: [1, 9], step: 3, band: 2 }, { start: [20, 30], step: -2, band: 2 }, { start: [50, 90], step: -10, band: 2 }, { start: [3, 12], step: 4, band: 2 },
];

/** Vardagsrutiner som algoritmer: stegen i rätt ordning. Inga steg får kunna byta plats. */
export const RUTINER: { title: string; steps: string[] }[] = [
  { title: 'Gör en smörgås', steps: ['Ta fram en brödskiva', 'Bred på smör', 'Lägg på osten', 'Ät upp smörgåsen'] },
  { title: 'Borsta tänderna', steps: ['Ta fram tandborsten', 'Tryck ut tandkräm på borsten', 'Borsta tänderna', 'Skölj munnen'] },
  { title: 'Plantera en blomma', steps: ['Gräv ett hål', 'Lägg i fröet', 'Täck över med jord', 'Vattna'] },
  { title: 'Skicka ett brev', steps: ['Skriv brevet', 'Lägg brevet i kuvertet', 'Klistra på ett frimärke', 'Lägg kuvertet i brevlådan'] },
  { title: 'Ta på dig skorna', steps: ['Ta på strumporna', 'Stoppa in fötterna i skorna', 'Knyt skosnörena', 'Gå ut'] },
  { title: 'Ta ett foto', steps: ['Ta fram kameran', 'Rikta kameran mot det du vill fota', 'Tryck på knappen', 'Titta på bilden'] },
  { title: 'Ge katten mat', steps: ['Hämta kattens skål', 'Häll i maten', 'Ställ ner skålen', 'Ropa på katten'] },
  { title: 'Gå och lägg dig', steps: ['Ta på pyjamasen', 'Krup ner i sängen', 'Släck lampan', 'Somna'] },
  { title: 'Drick ett glas mjölk', steps: ['Ta fram mjölken ur kylen', 'Häll mjölk i glaset', 'Drick mjölken', 'Diska glaset'] },
  { title: 'Rita en teckning', steps: ['Ta fram papper och pennor', 'Rita teckningen', 'Färglägg teckningen', 'Sätt upp teckningen på väggen'] },
  { title: 'Cykla till skolan', steps: ['Ta på hjälmen', 'Sätt dig på cykeln', 'Cykla till skolan', 'Lås fast cykeln'] },
  { title: 'Duscha', steps: ['Sätt på vattnet', 'Tvätta håret med schampo', 'Skölj ur schampot', 'Torka dig med handduken'] },
  { title: 'Baka bullar', steps: ['Blanda degen', 'Forma bullarna', 'Lägg bullarna på plåten', 'Grädda i ugnen', 'Låt bullarna svalna'] },
  { title: 'Tvätta händerna', steps: ['Blöt händerna', 'Ta tvål', 'Gnugga händerna', 'Skölj bort tvålen', 'Torka händerna'] },
  { title: 'Laga pannkakor', steps: ['Vispa smeten', 'Värm stekpannan', 'Häll i smet', 'Vänd pannkakan', 'Lägg pannkakan på tallriken'] },
  { title: 'Spela ett spel på datorn', steps: ['Starta datorn', 'Öppna spelet', 'Spela en runda', 'Stäng spelet', 'Stäng av datorn'] },
  { title: 'Byt en glödlampa', steps: ['Stäng av strömbrytaren', 'Skruva ur den trasiga glödlampan', 'Skruva i en ny glödlampa', 'Slå på strömbrytaren', 'Njut av ljuset'] },
  { title: 'Gör en fruktsallad', steps: ['Tvätta frukten', 'Skär frukten i bitar', 'Lägg bitarna i en skål', 'Rör om', 'Ät fruktsalladen'] },
  { title: 'Låna en bok', steps: ['Gå till biblioteket', 'Välj en bok', 'Låna boken i lånedisken', 'Läs boken hemma', 'Lämna tillbaka boken'] },
  { title: 'Laga en punktering', steps: ['Ta av däcket', 'Hitta hålet', 'Laga hålet med en lapp', 'Sätt tillbaka däcket', 'Pumpa däcket'] },
  { title: 'Tvätta kläder', steps: ['Sortera kläderna', 'Lägg in kläderna i maskinen', 'Stäng luckan', 'Starta maskinen', 'Häng upp tvätten'] },
  { title: 'Bygg en snögubbe', steps: ['Rulla en stor snöboll', 'Rulla en mindre snöboll', 'Lyft upp den mindre på den stora', 'Sätt dit ögon och näsa', 'Ge snögubben en halsduk'] },
];

/** Färger: [namn, cirkel, fyrkant]. */
export const FARGER: [string, string, string][] = [
  ['röd', '🔴', '🟥'], ['orange', '🟠', '🟧'], ['gul', '🟡', '🟨'], ['grön', '🟢', '🟩'], ['blå', '🔵', '🟦'], ['lila', '🟣', '🟪'],
];

/** Robotregler: OM villkor SÅ sak, ANNARS annan sak. Situationerna när villkoret stämmer och inte stämmer. */
export const REGLER: { om: string; sa: string; annars: string; ja: string; nej: string }[] = [
  { om: 'det regnar', sa: 'tar Robo paraply', annars: 'tar Robo solglasögon', ja: 'Det regnar.', nej: 'Solen skiner.' },
  { om: 'lampan är grön', sa: 'kör Robo framåt', annars: 'står Robo still', ja: 'Lampan lyser grönt.', nej: 'Lampan lyser rött.' },
  { om: 'batteriet är tomt', sa: 'laddar Robo', annars: 'leker Robo', ja: 'Batteriet är tomt.', nej: 'Batteriet är fullt.' },
  { om: 'det knackar', sa: 'öppnar Robo dörren', annars: 'läser Robo en bok', ja: 'Det knackar på dörren.', nej: 'Det är alldeles tyst.' },
  { om: 'det är mörkt', sa: 'tänder Robo lampan', annars: 'släcker Robo lampan', ja: 'Det är mörkt i rummet.', nej: 'Det är ljust i rummet.' },
  { om: 'hunden är hungrig', sa: 'ger Robo hunden mat', annars: 'går Robo ut med hunden', ja: 'Hunden är hungrig.', nej: 'Hunden är mätt.' },
  { om: 'det är kallt', sa: 'tar Robo på mössan', annars: 'tar Robo på kepsen', ja: 'Det är kallt ute.', nej: 'Det är varmt ute.' },
  { om: 'golvet är smutsigt', sa: 'dammsuger Robo', annars: 'vilar Robo', ja: 'Golvet är smutsigt.', nej: 'Golvet är rent.' },
];

/** Det roboten gör, som ett svar: "tar Robo paraply" → "Tar paraply". */
export const gor = (sak: string) => { const s = sak.replace(' Robo', ''); return s.charAt(0).toUpperCase() + s.slice(1); };
