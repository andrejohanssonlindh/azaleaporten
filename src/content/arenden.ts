// Byns ärenden: invånare i Azaleabyn som ber hjälten om hjälp med en liten berättelse, ett i taget.
// Ett ärende klaras genom att klara rundor (minst 9 rätt) eller besegra bossar i ett visst område.
// Id:n är permanenta (de sparas i hjältens uppdrag). Lägg till nya i slutet.

export interface Arende {
  id: string;
  who: string;
  icon: string;
  /** Området där hjälpen behövs. */
  areaId: string;
  /** Antal klarade rundor eller bossvinster i området. */
  n: number;
  story: string;
  thanks: string;
}

export const ARENDEN: Arende[] = [
  { id: 'klockmakaren', who: 'Klockmakaren Tick', icon: '🕰️', areaId: 'tidstornet', n: 3,
    story: 'Alla klockor i min verkstad har stannat, och jag har tappat bort mina glasögon! Kan du läsa klockorna i Tidstornet åt mig?',
    thanks: 'Tick tack! Nu tickar varenda klocka igen.' },
  { id: 'brovakten', who: 'Brovakten Bodil', icon: '🌉', areaId: 'tiokompisbron', n: 3,
    story: 'Bron gungar! Varje planka behöver en tiokompis för att hålla. Hjälper du mig att laga den?',
    thanks: 'Bron står stadigt igen. Nu kan alla komma över forsen!' },
  { id: 'marknadsfrun', who: 'Marknadsfrun Mynta', icon: '🪙', areaId: 'myntmarknaden', n: 3,
    story: 'Det är marknadsdag och jag hinner inte räkna växeln. Kan du stå i mitt stånd en stund?',
    thanks: 'Varje mynt på rätt plats! Du är den bästa marknadshjälpen.' },
  { id: 'skejtaren', who: 'Skejtaren Sixten', icon: '🛹', areaId: 'fluffy', n: 3,
    story: 'Jag ska bygga en ny ramp, men ritningen är full av former jag inte känner igen. Hjälper du mig i Fluffy?',
    thanks: 'Rampen blev perfekt! Kom och åk när du vill.' },
  { id: 'grodan', who: 'Grodan Kvack', icon: '🐸', areaId: 'stavningstrasket', n: 3,
    story: 'Kvack! Någon har stavat fel på alla skyltar i träsket, och nu går alla vilse. Kan du rätta dem?',
    thanks: 'Kvack kvack! Nu hittar alla hem igen.' },
  { id: 'gruvarbetaren', who: 'Gruvarbetaren Gruve', icon: '⛏️', areaId: 'tabellgruvan', n: 3,
    story: 'Vagnarna i gruvan ska fyllas med lika många stenar var, men räknemaskinen är trasig. Räknar du åt mig?',
    thanks: 'Alla vagnar fulla och rättvist fördelade. Tack, hjälte!' },
  { id: 'poeten', who: 'Poeten Rimfrida', icon: '🎶', areaId: 'rimbacken', n: 3,
    story: 'Jag skriver en visa till byfesten, men orden rimmar inte! Hjälper du mig vid Rimbäcken?',
    thanks: 'Min visa blev så fin att hela byn sjunger den!' },
  { id: 'svampplockaren', who: 'Svampplockaren Murkla', icon: '🍄', areaId: 'svampen', n: 3,
    story: 'Mönstren på mina svampar har blandats ihop. Kan du hitta vad som kommer sedan?',
    thanks: 'Nu ligger svamparna i rätt mönster igen. Vackert!' },
  { id: 'bagaren', who: 'Bagaren Bulle', icon: '🧑‍🍳', areaId: 'brakbageriet', n: 3,
    story: 'Kunderna vill ha halva tårtor och tredjedels pajer, och jag blir alldeles snurrig. Hjälper du till i Bråkbageriet?',
    thanks: 'Varje bit lika stor! Här, ta en bulle för besväret.' },
  { id: 'smeden', who: 'Smeden Hamra', icon: '⚒️', areaId: 'meningssmedjan', n: 3,
    story: 'Jag smider meningar till byns nya skylt, men punkterna och frågetecknen har hamnat fel. Kan du hjälpa mig?',
    thanks: 'Skylten är klar och varenda mening håller!' },
  { id: 'lantmataren', who: 'Lantmätaren Linnea', icon: '📏', areaId: 'tallinjebron', n: 3,
    story: 'Jag ska sätta ut stolpar längs tallinjen, men jag har tappat bort var talen ska stå. Mäter du åt mig?',
    thanks: 'Varje stolpe på rätt plats. Nu kan bron byggas!' },
  { id: 'snickaren', who: 'Snickaren Spik', icon: '🪚', areaId: 'oxie', n: 3,
    story: 'Jag bygger ett staket runt skejtparken, men jag vet inte hur långt det ska vara. Mäter du omkretsen?',
    thanks: 'Staketet räckte precis runt! Du mäter som en mästare.' },
];

export const arende = (id: string | null | undefined) => ARENDEN.find((a) => a.id === id);
