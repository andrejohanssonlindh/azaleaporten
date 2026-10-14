// Diagramdalens teman: påhittade saker som dalens invånare räknar. Bara påhittad data, aldrig "riktig" statistik.
// Varje tema har frågorna formulerade i sin egen stil.

/** En kategori: namnet i diagrammet, ordet i en fråga (t.ex. "ankor" eller "på måndagen") och en bild. */
export interface Sak { namn: string; p: string; ikon: string }

export interface Tema {
  id: string;
  titel: string;
  /** Rubriken över kategorierna, t.ex. 'Fågel'. */
  katNamn: string;
  /** Vad talen räknar, t.ex. 'fåglar' eller 'kg'. */
  enhet: string;
  /** Ordet efter svarsrutan (bara för mått, t.ex. 'kg'). */
  svarEnhet?: string;
  kat: Sak[];
  /** Samma bild på alla rader i ett bilddiagram (annars kategorins bild). */
  ikon?: string;
  /** Kategorierna har en ordning (veckodagar) och blandas inte. */
  ordnad?: boolean;
  las(k: Sak): string;
  mest: string;
  minst: string;
  fler(a: Sak, b: Sak): string;
  alla: string;
  /** Uppmaningen när barnet ska räkna sakerna i en bild. */
  plock?: string;
}

const s = (namn: string, p: string, ikon: string): Sak => ({ namn, p, ikon });

const DAGAR: Sak[] = [
  s('Måndag', 'på måndagen', ''), s('Tisdag', 'på tisdagen', ''), s('Onsdag', 'på onsdagen', ''),
  s('Torsdag', 'på torsdagen', ''), s('Fredag', 'på fredagen', ''), s('Lördag', 'på lördagen', ''), s('Söndag', 'på söndagen', ''),
];

export const FAGLAR: Tema = {
  id: 'faglar', titel: 'Fåglar vid tornet', katNamn: 'Fågel', enhet: 'fåglar',
  kat: [s('Duva', 'duvor', '🕊️'), s('Anka', 'ankor', '🦆'), s('Svan', 'svanar', '🦢'), s('Uggla', 'ugglor', '🦉'), s('Sparv', 'sparvar', '🐦'), s('Örn', 'örnar', '🦅'), s('Höna', 'hönor', '🐔')],
  las: (k) => `Hur många ${k.p} räknade Fågelvakten?`,
  mest: 'Vilken fågel räknade Fågelvakten flest av?',
  minst: 'Vilken fågel räknade Fågelvakten färst av?',
  fler: (a, b) => `Hur många fler ${a.p} än ${b.p} räknade Fågelvakten?`,
  alla: 'Hur många fåglar räknade Fågelvakten sammanlagt?',
  plock: 'Räkna fåglarna på bilden. Rita ett streck för varje fågel.',
};

export const DJUR: Tema = {
  id: 'djur', titel: 'Klassens favoritdjur', katNamn: 'Djur', enhet: 'röster',
  kat: [s('Katt', 'katt', '🐱'), s('Hund', 'hund', '🐶'), s('Kanin', 'kanin', '🐰'), s('Häst', 'häst', '🐴'), s('Hamster', 'hamster', '🐹'), s('Fisk', 'fisk', '🐟')],
  las: (k) => `Hur många röstade på ${k.p}?`,
  mest: 'Vilket djur fick flest röster?',
  minst: 'Vilket djur fick färst röster?',
  fler: (a, b) => `Hur många fler röstade på ${a.p} än på ${b.p}?`,
  alla: 'Hur många röstade sammanlagt?',
};

export const FRUKT: Tema = {
  id: 'frukt', titel: 'Frukt i korgen', katNamn: 'Frukt', enhet: 'frukter',
  kat: [s('Äpple', 'äpplen', '🍎'), s('Päron', 'päron', '🍐'), s('Banan', 'bananer', '🍌'), s('Apelsin', 'apelsiner', '🍊'), s('Citron', 'citroner', '🍋'), s('Kiwi', 'kiwier', '🥝')],
  las: (k) => `Hur många ${k.p} finns i korgen?`,
  mest: 'Vilken frukt finns det flest av i korgen?',
  minst: 'Vilken frukt finns det färst av i korgen?',
  fler: (a, b) => `Hur många fler ${a.p} än ${b.p} finns i korgen?`,
  alla: 'Hur många frukter finns i korgen sammanlagt?',
  plock: 'Räkna frukterna på bilden. Rita ett streck för varje frukt.',
};

export const KRYP: Tema = {
  id: 'kryp', titel: 'Småkryp i gräset', katNamn: 'Kryp', enhet: 'kryp',
  kat: [s('Myra', 'myror', '🐜'), s('Nyckelpiga', 'nyckelpigor', '🐞'), s('Fjäril', 'fjärilar', '🦋'), s('Snigel', 'sniglar', '🐌'), s('Bi', 'bin', '🐝'), s('Spindel', 'spindlar', '🕷️')],
  las: (k) => `Hur många ${k.p} hittade barnen i gräset?`,
  mest: 'Vilket kryp hittade barnen flest av?',
  minst: 'Vilket kryp hittade barnen färst av?',
  fler: (a, b) => `Hur många fler ${a.p} än ${b.p} hittade barnen?`,
  alla: 'Hur många kryp hittade barnen sammanlagt?',
  plock: 'Räkna krypen på bilden. Rita ett streck för varje kryp.',
};

export const GRONSAKER: Tema = {
  id: 'gronsaker', titel: 'Sålda grönsaker på marknaden', katNamn: 'Grönsak', enhet: 'kg', svarEnhet: 'kg',
  kat: [s('Morot', 'morötter', '🥕'), s('Potatis', 'potatis', '🥔'), s('Majs', 'majs', '🌽'), s('Pumpa', 'pumpor', '🎃'), s('Kål', 'kål', '🥬'), s('Lök', 'lök', '🧅')],
  las: (k) => `Hur många kilo ${k.p} såldes?`,
  mest: 'Vilken grönsak såldes det mest av?',
  minst: 'Vilken grönsak såldes det minst av?',
  fler: (a, b) => `Hur många kilo mer ${a.p} än ${b.p} såldes?`,
  alla: 'Hur många kilo grönsaker såldes sammanlagt?',
};

export const KASTANJER: Tema = {
  id: 'kastanjer', titel: 'Kastanjer som ekorren hittade', katNamn: 'Dag', enhet: 'kastanjer', ikon: '🌰', ordnad: true,
  kat: DAGAR,
  las: (k) => `Hur många kastanjer hittade ekorren ${k.p}?`,
  mest: 'Vilken dag hittade ekorren flest kastanjer?',
  minst: 'Vilken dag hittade ekorren färst kastanjer?',
  fler: (a, b) => `Hur många fler kastanjer hittade ekorren ${a.p} än ${b.p}?`,
  alla: 'Hur många kastanjer hittade ekorren sammanlagt?',
};

export const GLASS: Tema = {
  id: 'glass', titel: 'Glass som såldes på marknaden', katNamn: 'Smak', enhet: 'glassar',
  kat: [s('Jordgubb', 'jordgubbsglassar', '🍓'), s('Choklad', 'chokladglassar', '🍫'), s('Vanilj', 'vaniljglassar', '🍦'), s('Päron', 'päronglassar', '🍐'), s('Citron', 'citronglassar', '🍋'), s('Mint', 'mintglassar', '🌿')],
  las: (k) => `Hur många ${k.p} såldes?`,
  mest: 'Vilken glass sålde mest?',
  minst: 'Vilken glass sålde minst?',
  fler: (a, b) => `Hur många fler ${a.p} än ${b.p} såldes?`,
  alla: 'Hur många glassar såldes sammanlagt?',
};

export const MAL: Tema = {
  id: 'mal', titel: 'Mål i byns fotbollscup', katNamn: 'Lag', enhet: 'mål',
  kat: [s('Rävarna', 'Rävarna', '🦊'), s('Ugglorna', 'Ugglorna', '🦉'), s('Bävrarna', 'Bävrarna', '🦫'), s('Igelkottarna', 'Igelkottarna', '🦔'), s('Grodorna', 'Grodorna', '🐸')],
  las: (k) => `Hur många mål gjorde ${k.p}?`,
  mest: 'Vilket lag gjorde flest mål?',
  minst: 'Vilket lag gjorde färst mål?',
  fler: (a, b) => `Hur många fler mål gjorde ${a.p} än ${b.p}?`,
  alla: 'Hur många mål gjordes sammanlagt?',
};

export const BATAR: Tema = {
  id: 'batar', titel: 'Båtar som kom till hamnen', katNamn: 'Dag', enhet: 'båtar', ikon: '⛵', ordnad: true,
  kat: DAGAR,
  las: (k) => `Hur många båtar kom till hamnen ${k.p}?`,
  mest: 'Vilken dag kom flest båtar?',
  minst: 'Vilken dag kom färst båtar?',
  fler: (a, b) => `Hur många fler båtar kom ${a.p} än ${b.p}?`,
  alla: 'Hur många båtar kom sammanlagt?',
};

/** Fågeltornets teman (saker man räknar med streck). */
export const TORNET = [FAGLAR, DJUR, FRUKT, KRYP];
/** Teman med saker att räkna på en bild. */
export const PLOCK = [FAGLAR, FRUKT, KRYP];
/** Skördemarknadens teman. */
export const MARKNADEN = [GRONSAKER, KASTANJER, GLASS, MAL, BATAR, FRUKT];
