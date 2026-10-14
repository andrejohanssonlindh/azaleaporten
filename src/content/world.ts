// Ön. Region- och område-ID:n är permanenta (de blir del av sparnycklar och färdighets-ID:n).
// Nya ämnen läggs på de reserverade platserna (dimman) eller som nya småöar runt ön.

export interface Area {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** Rekommenderade årskurser [från, till]. Bara en rekommendation, aldrig ett lås. */
  grades: [number, number];
  status: 'open' | 'soon';
}

export type RegionId = 'talbergen' | 'ordskogen' | 'vasteron' | 'betongbukten' | 'roboton' | 'diagramdalen' | 'kompasson';

export interface Region {
  id: RegionId;
  name: string;
  subject: string;
  icon: string;
  tagline: string;
  /** Färger för regionens banner [topp, botten, mark]. */
  sky: [string, string, string];
  areas: Area[];
}

export const REGIONS: Region[] = [
  {
    id: 'talbergen', name: 'Talbergen', subject: 'Matematik', icon: '⛰️',
    tagline: 'Höga toppar av tal och tid. Vid foten ligger marknaden och bageriet, broarna går över forsen, gruvan ligger djupt i berget – och högst upp står Tidstornet.',
    sky: ['#4f9fe0', '#cde9f8', '#6a7f5a'],
    areas: [
      { id: 'tidstornet', name: 'Tidstornet', icon: '🕰️', desc: 'Res genom tiden och läs klockor.', grades: [1, 5], status: 'open' },
      { id: 'tiokompisbron', name: 'Tiokompisbron', icon: '🌉', desc: 'Plus och minus med tiotalsövergång.', grades: [1, 3], status: 'open' },
      { id: 'tabellgruvan', name: 'Tabellgruvan', icon: '⛏️', desc: 'Gångertabeller och division.', grades: [2, 6], status: 'open' },
      { id: 'myntmarknaden', name: 'Myntmarknaden', icon: '🪙', desc: 'Pengar och växel.', grades: [1, 4], status: 'open' },
      { id: 'brakbageriet', name: 'Bråkbageriet', icon: '🥧', desc: 'Bråk du kan se och smaka på.', grades: [3, 6], status: 'open' },
      { id: 'tallinjebron', name: 'Tallinjebron', icon: '📏', desc: 'Tallinjen, decimaler och negativa tal.', grades: [2, 6], status: 'open' },
    ],
  },
  {
    id: 'betongbukten', name: 'Betongbukten', subject: 'Geometri', icon: '🛹',
    tagline: 'Skejtparkerna vid havet. Former och speglar, mått och vinklar, ytor, kroppar och cirklar – en park i taget. I de svåraste parkerna finns räknare och formelkort.',
    sky: ['#ff922b', '#ffe8cc', '#868e96'],
    areas: [
      { id: 'fluffy', name: 'Fluffy', icon: '🛹', desc: 'Former, hörn och sidor.', grades: [1, 3], status: 'open' },
      { id: 'svampen', name: 'Svampen', icon: '🍄', desc: 'Symmetri och mönster.', grades: [1, 4], status: 'open' },
      { id: 'oxie', name: 'Oxie skatepark', icon: '📐', desc: 'Mät längd och omkrets.', grades: [2, 5], status: 'open' },
      { id: 'sibbarp', name: 'Sibbarp', icon: '🌊', desc: 'Vinklar i bowlen: räta, spetsiga och trubbiga.', grades: [3, 6], status: 'open' },
      { id: 'bryggeriet', name: 'Bryggeriet', icon: '🏭', desc: 'Area – hur stor är ytan?', grades: [3, 6], status: 'open' },
      { id: 'kroksback', name: 'Kroksbäck', icon: '📦', desc: 'Kroppar i 3D och volym.', grades: [4, 6], status: 'open' },
      { id: 'stapelbaddsparken', name: 'Stapelbäddsparken', icon: '⭕', desc: 'Cirklar och skala – med räknare.', grades: [4, 6], status: 'open' },
    ],
  },
  {
    id: 'ordskogen', name: 'Ordskogen', subject: 'Svenska', icon: '🌲',
    tagline: 'En trolsk skog där orden växer. Genom dimman slingrar sig träsket, bäcken porlar, i smedjan hamras meningar och djupast inne står templet och biblioteket.',
    sky: ['#3b7a57', '#b8e0c2', '#2f5d3a'],
    areas: [
      { id: 'stavningstrasket', name: 'Stavningsträsket', icon: '🐸', desc: 'Hör ordet och stava rätt.', grades: [1, 6], status: 'open' },
      { id: 'rimbacken', name: 'Rimbäcken', icon: '🎶', desc: 'Rim, motsatser och synonymer.', grades: [1, 4], status: 'open' },
      { id: 'meningssmedjan', name: 'Meningssmedjan', icon: '⚒️', desc: 'Punkt, frågetecken och meningar som håller.', grades: [1, 6], status: 'open' },
      { id: 'ordklassernas-tempel', name: 'Ordklassernas tempel', icon: '🏛️', desc: 'Substantiv, verb och adjektiv – och hur orden böjs.', grades: [2, 6], status: 'open' },
      { id: 'berattelsebiblioteket', name: 'Berättelsebiblioteket', icon: '📚', desc: 'Läs korta texter och svara.', grades: [2, 6], status: 'open' },
    ],
  },
  {
    id: 'vasteron', name: 'Västerön', subject: 'Engelska', icon: '🏝️',
    tagline: 'En liten ö i väster där alla pratar engelska. I viken fångar fiskarna ord, i hamnen ropar alla på engelska, klocktornet slår på engelska, klippan ska bestigas och vid kajen ligger ett piratskepp. Ta båten dit!',
    sky: ['#2b6cb0', '#ffd8a8', '#c2a878'],
    areas: [
      { id: 'glosviken', name: 'Glosviken', icon: '⚓', desc: 'Engelska ord med bild och ljud.', grades: [1, 6], status: 'open' },
      { id: 'hamnen', name: 'Hamnen', icon: '🚢', desc: 'Lyssna och välj rätt.', grades: [1, 5], status: 'open' },
      { id: 'big-ben-tornet', name: 'Big Ben-tornet', icon: '🕰️', desc: 'Klockan på engelska.', grades: [3, 6], status: 'open' },
      { id: 'stavklippan', name: 'Stavklippan', icon: '🧗', desc: 'Stava på engelska – det låter inte som det stavas!', grades: [3, 6], status: 'open' },
      { id: 'piratskeppet', name: 'Piratskeppet', icon: '🏴‍☠️', desc: 'a och an, am, is och are, och orden i rätt ordning.', grades: [2, 6], status: 'open' },
    ],
  },
  {
    id: 'roboton', name: 'Robotön', subject: 'Programmering', icon: '🤖',
    tagline: 'En ö full av robotar som bara gör exakt det man säger. Längs Logikslingan lär man sig tänka som en robot, på Kodstigen styr man dem, i Loopverkstaden snurrar maskinerna, i Buggjakten kryper felen omkring – och i Pythonhamnen pratar robotarna riktig kod.',
    sky: ['#364fc7', '#a5d8ff', '#868e96'],
    areas: [
      { id: 'logikslingan', name: 'Logikslingan', icon: '🧩', desc: 'Logiska pussel: vad hör ihop och vad kommer sedan?', grades: [1, 4], status: 'open' },
      { id: 'kodstigen', name: 'Kodstigen', icon: '🧭', desc: 'Styr roboten steg för steg.', grades: [1, 5], status: 'open' },
      { id: 'loopverkstaden', name: 'Loopverkstaden', icon: '🔁', desc: 'Gör samma sak många gånger: loopar.', grades: [2, 5], status: 'open' },
      { id: 'buggjakten', name: 'Buggjakten', icon: '🐞', desc: 'Hitta felet i robotens instruktioner.', grades: [2, 6], status: 'open' },
      { id: 'pythonhamnen', name: 'Pythonhamnen', icon: '🐍', desc: 'Läs dina första rader Python.', grades: [4, 6], status: 'open' },
    ],
  },
  {
    // Läsa och tolka diagram, lägesmått, och till sist diagram som lurar (PLAN.md §14f). Byggs ett område i taget.
    id: 'diagramdalen', name: 'Diagramdalen', subject: 'Statistik', icon: '📊',
    tagline: 'En dal där alla räknar allt: fåglarna vid tornet, skörden på marknaden, vädret och rösterna på torget. Längst in står tivolits spegelsal, där diagrammen sträcker och krymper sig – och tidningen som alltid har en rubrik som låter för bra för att vara sann.',
    sky: ['#f59f00', '#fff3bf', '#5c940d'],
    areas: [
      { id: 'fageltornet', name: 'Fågeltornet', icon: '🐦', desc: 'Räkna fåglar med streck och tabeller.', grades: [1, 3], status: 'open' },
      { id: 'skordemarknaden', name: 'Skördemarknaden', icon: '🌾', desc: 'Stapeldiagram och bilddiagram.', grades: [1, 4], status: 'open' },
      { id: 'vaderstationen', name: 'Väderstationen', icon: '🌦️', desc: 'Linjediagram: hur ändras vädret?', grades: [3, 6], status: 'soon' },
      { id: 'omrostningstorget', name: 'Omröstningstorget', icon: '🗳️', desc: 'Cirkeldiagram: vem fick flest röster?', grades: [3, 6], status: 'soon' },
      { id: 'vagmastarens-bod', name: 'Vågmästarens bod', icon: '⚖️', desc: 'Medelvärde, median och typvärde.', grades: [4, 6], status: 'soon' },
      { id: 'spegelsalen', name: 'Spegelsalen', icon: '🪞', desc: 'Diagram som lurar ögat. Hitta knepet!', grades: [4, 6], status: 'soon' },
      { id: 'skvallerpressen', name: 'Skvallerpressen', icon: '📰', desc: 'Rubriker som lurar. Stämmer det verkligen?', grades: [4, 6], status: 'soon' },
    ],
  },
  {
    // Planerad (PLAN.md §14g): kartkunskap, världsdelar, Sverige, länder, huvudstäder och flaggor.
    id: 'kompasson', name: 'Kompassön', subject: 'Geografi', icon: '🧭',
    tagline: 'En ö långt ute i havet, dit man flyger med luftballong. I observatoriet snurrar en jättelik jordglob. Härifrån reser man över Sverige, genom alla världsdelar och till ländernas huvudstäder.',
    sky: ['#1971c2', '#d0ebff', '#f4e3b5'],
    areas: [
      { id: 'kartrummet', name: 'Kartrummet', icon: '🗺️', desc: 'Väderstreck, kartsymboler och skala.', grades: [1, 6], status: 'soon' },
      { id: 'globen', name: 'Globen', icon: '🌍', desc: 'Världsdelar och hav. Var ligger landet?', grades: [1, 6], status: 'soon' },
      { id: 'sverigeresan', name: 'Sverigeresan', icon: '🦢', desc: 'Flyg över Sverige: städer, sjöar och landskap.', grades: [1, 6], status: 'soon' },
      { id: 'ballongresan', name: 'Ballongresan', icon: '🎈', desc: 'Peka ut länderna på kartan.', grades: [3, 6], status: 'soon' },
      { id: 'huvudstadsexpressen', name: 'Huvudstadsexpressen', icon: '🚂', desc: 'Vad heter landets huvudstad?', grades: [3, 6], status: 'soon' },
      { id: 'flaggmasten', name: 'Flaggmasten', icon: '🚩', desc: 'Vilket land har flaggan?', grades: [1, 6], status: 'soon' },
    ],
  },
];

export const region = (id: string) => REGIONS.find((r) => r.id === id);
export const areaById = (id: string) => {
  for (const r of REGIONS) {
    const a = r.areas.find((x) => x.id === id);
    if (a) return { region: r, area: a };
  }
  return undefined;
};
export const fitsGrade = (a: Area, grade: number) => grade >= a.grades[0] && grade <= a.grades[1];
