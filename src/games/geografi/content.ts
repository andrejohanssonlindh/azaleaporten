import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Kompassöns områden. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const mastare = (id: string, name: string, icon: string, title: string, titleReward: string, hp = 12): BossDef => ({
  type: 'boss', id, kind: 'mastare', name, icon, title, hp, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }],
  // Repliker hämtas från personan – se content/bosses.ts, id '<område>.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward,
});

// ---------- Kartrummet ----------

const VINDFLOJELN: BossDef = {
  type: 'boss', id: 'vindflojeln-vimsa', kind: 'monster', name: 'Vindflöjeln Vimsa', icon: '🐓', title: 'Snurrar öster och väster',
  hp: 8, trap: 'ost-vast', pool: [{ mode: 'vaderstreck', level: 0 }, { mode: 'riktning', level: 0 }],
  lines: {
    entrance: 'Kuckeliku! Jag är Vindflöjeln Vimsa, och jag snurrar åt alla håll. Öster, väster – vem bryr sig? Jag pekar dit vinden blåser!',
    phase2: 'Nu blåser det från alla håll – nordost, sydväst, snurr snurr!',
    onHeroMiss: ['Snurr! Fel håll!', 'Väster, öster, samma sak!', 'Kuckeliku!'],
    onBossHit: ['Du vet var öster är!', 'Aj, jag blev yr!', 'Rätt håll!'],
    defeat: 'Öster är där solen går upp … och väster där den går ner. Nu snurrar jag rätt! Får jag följa med? Jag visar alltid var vinden blåser.',
  },
  pet: { name: 'Lilla Vindflöjeln', icon: '🐓' }, titleReward: 'Vindvisaren',
};

export const KARTRUMMET: AreaDef = {
  areaId: 'kartrummet',
  gameId: 'kartrummet',
  title: 'Kartrummet',
  kunskap: { name: 'Kartkunskap', icon: '🗺️', titles: ['Kompassbäraren', 'Kartritaren'] },
  texts: { cleared: 'Kartan stämmer på pricken!', notYet: 'Nio rätt av tio behövs för att kartan ska bli klar – försök igen!', back: 'Till Kartrummet' },
  story: 'Längst ner i observatoriet ligger Kartrummet. Där ritar Kartritarinnan kartor över hela ön, med kompassros, symboler och skala. Lär dig läsa hennes kartor – sedan kan du hitta överallt!',
  lessons: [
    { id: 'kompassrosen', title: 'Kompassrosen', icon: '🧭', desc: 'Norr, öster, söder, väster – medsols', nodes: ['fyra-vaderstreck', 'atta-vaderstreck', 'norr-om-byn', 'fran-plats-till-plats', 'vindflojeln-vimsa', 'vriden-karta'], skills: ['geo.karta.vaderstreck', 'geo.karta.riktning', 'geo.karta.vriden'] },
    { id: 'skalan', title: 'Skalan på kartan', icon: '📏', desc: '1 cm på kartan är mycket längre i verkligheten', nodes: ['skala-km', 'skala-baklanges'], skills: ['geo.karta.skala'] },
  ],
  eras: [
    { id: 'kompassrosen', name: 'Kompassrosen', icon: '🧭', fact: 'Kompassrosen visar väderstrecken. N är norr. Sedan kommer öster, söder och väster, medsols runt.',
      nodes: [
        stage('fyra-vaderstreck', 'Fyra väderstreck', '🧭', 'Norr, öster, söder, väster', 'vaderstreck', 0, 10000),
        stage('atta-vaderstreck', 'Åtta väderstreck', '✳️', 'Nordost, sydväst …', 'vaderstreck', 1, 12000),
      ] },
    { id: 'ons-karta', name: 'Öns karta', icon: '🏝️', fact: 'På de flesta kartor är norr uppåt. Då är öster till höger och väster till vänster.',
      nodes: [
        stage('norr-om-byn', 'Norr om byn', '🏘️', 'Vad ligger åt vilket håll?', 'riktning', 0, 14000),
        stage('fran-plats-till-plats', 'Från plats till plats', '🚶', 'Åt vilket håll ska du gå?', 'riktning', 1, 16000),
        VINDFLOJELN,
      ] },
    { id: 'kartans-tecken', name: 'Kartans tecken', icon: '🌲', fact: 'Kartsymboler är små bilder på kartan. Blått är vatten, grönt är skog och brunt är högt land.',
      nodes: [
        stage('kartsymboler', 'Kartsymboler', '🛤️', 'Väg, järnväg, sjö och skog', 'symboler', 0, 10000),
        stage('hojdfargerna', 'Höjdfärgerna', '⛰️', 'Var är det högst?', 'symboler', 1, 12000),
      ] },
    { id: 'skalan', name: 'Skalan', icon: '📏', fact: 'Skalan säger hur mycket mindre kartan är än verkligheten. 1 cm = 5 km betyder att varje centimeter på kartan är fem kilometer på riktigt.',
      nodes: [
        stage('skala-km', 'Hur långt är det?', '📏', 'Från kartan till verkligheten', 'skala', 0, 18000),
        stage('skala-baklanges', 'Baklänges', '🔁', 'Från verkligheten till kartan', 'skala', 1, 20000),
      ] },
    { id: 'kartritarens-rum', name: 'Kartritarens rum', icon: '✒️', fact: 'Ibland är kartan vriden. Titta alltid på kompassrosen först – var pekar N?',
      nodes: [
        stage('vriden-karta', 'Den vridna kartan', '🔄', 'När norr inte är uppåt', 'vriden', 0, 16000),
        stage('hela-kartrummet', 'Hela kartrummet', '🗺️', 'Allt blandat', 'blandat', 1, 16000),
        mastare('kartritarinnan', 'Kartritarinnan', '🧭', 'Kartrummets Mästare', 'Kartmästaren'),
      ] },
  ],
};

// ---------- Globen ----------

const VALROSSEN: BossDef = {
  type: 'boss', id: 'vilsna-valrossen', kind: 'monster', name: 'Vilsna Valrossen', icon: '🦭', title: 'Hamnar alltid i fel världsdel',
  hp: 8, trap: 'fel-varldsdel', pool: [{ mode: 'land', level: 0 }, { mode: 'land', level: 1 }],
  lines: {
    entrance: 'Hrrumpf! Jag är Vilsna Valrossen. Jag skulle simma till Afrika men hamnade i Asien. Eller var det Amerika? Alla världsdelar ser likadana ut för mig!',
    phase2: 'Nu simmar jag jorden runt – hänger du med?',
    onHeroMiss: ['Hrrumpf, fel världsdel!', 'Vilse igen!', 'Var är jag nu?'],
    onBossHit: ['Du hittade rätt!', 'Aj, du kan kartan!', 'Rätt världsdel!'],
    defeat: 'Så det är där Afrika ligger … och Asien där borta! Får jag följa med dig? Med dig går jag aldrig vilse.',
  },
  pet: { name: 'Lilla Valrossen', icon: '🦭' }, titleReward: 'Världsdelsfinnaren',
};

export const GLOBEN: AreaDef = {
  areaId: 'globen',
  gameId: 'globen',
  title: 'Globen',
  kunskap: { name: 'Världsdelar och hav', icon: '🌍', titles: ['Världsdelsvandraren', 'Jordglobens kännare'] },
  texts: { cleared: 'Globen snurrar av glädje!', notYet: 'Nio rätt av tio behövs för att globen ska lysa – försök igen!', back: 'Till Globen' },
  story: 'Högst upp i observatoriet snurrar en jättelik jordglob. På den finns alla världsdelar och alla hav. Snurra på den och lär dig var allt ligger!',
  lessons: [
    { id: 'sju-varldsdelar', title: 'De sju världsdelarna', icon: '🌍', desc: 'Europa, Asien, Afrika och de andra', nodes: ['sju-varldsdelar', 'storst-och-minst', 'kanda-lander', 'vilsna-valrossen'], skills: ['geo.varldsdel.'] },
  ],
  eras: [
    { id: 'varldsdelarna', name: 'Världsdelarna', icon: '🌍', fact: 'Det finns sju världsdelar: Europa, Asien, Afrika, Nordamerika, Sydamerika, Australien (som också kallas Oceanien) och Antarktis.',
      nodes: [
        stage('sju-varldsdelar', 'Sju världsdelar', '🌍', 'Peka och säg namnet', 'delar', 0, 12000),
        stage('storst-och-minst', 'Störst och minst', '📐', 'Och ekvatorn', 'delar', 1, 12000),
      ] },
    { id: 'haven', name: 'Haven', icon: '🌊', fact: 'Det största havet är Stilla havet. Atlanten ligger mellan Europa och Amerika.',
      nodes: [
        stage('tre-stora-hav', 'Tre stora hav', '🌊', 'Stilla havet, Atlanten, Indiska oceanen', 'hav', 0, 12000),
        stage('fem-hav', 'Fem hav', '🐋', 'Och ishaven', 'hav', 1, 12000),
      ] },
    { id: 'var-ligger-landet', name: 'Var ligger landet?', icon: '📍', fact: 'Grönland hör till Danmark, men ön ligger i Nordamerika. Allt som hör ihop ligger inte alltid nära varandra!',
      nodes: [
        stage('kanda-lander', 'Kända länder', '📍', 'Vilken världsdel?', 'land', 0, 12000),
        VALROSSEN,
        stage('alla-lander', 'Alla länder', '🗺️', 'Utan karta!', 'land', 1, 12000),
      ] },
    { id: 'globens-topp', name: 'Globens topp', icon: '🔭', fact: 'Nu kan du världsdelarna och haven. Klarar du Globens Mästare?',
      nodes: [
        stage('hela-globen', 'Hela globen', '🌐', 'Allt blandat', 'blandat', 1, 14000),
        mastare('globmastaren', 'Professor Globus', '👨‍🏫', 'Globens Mästare', 'Globens hjälte'),
      ] },
  ],
};

// ---------- Sverigeresan ----------

const GRANSHOPPAREN: BossDef = {
  type: 'boss', id: 'granshopparen', kind: 'monster', name: 'Gränshopparen', icon: '🦗', title: 'Hoppar alltid in i grannlandet',
  hp: 8, trap: 'granne', pool: [{ mode: 'norden', level: 0 }, { mode: 'norden', level: 1 }],
  lines: {
    entrance: 'Hopp hopp! Jag är Gränshopparen. Sverige, Norge, Finland – jag hoppar över gränserna hela dagen och vet aldrig var jag landar!',
    phase2: 'Nu hoppar jag längre – ända till Island!',
    onHeroMiss: ['Hopp, fel land!', 'Grannlandet, hihi!', 'Över gränsen!'],
    onBossHit: ['Du landade rätt!', 'Aj, du kan gränserna!', 'Precis rätt land!'],
    defeat: 'Så det är där gränsen går … Får jag följa med? Jag hoppar dit du vill – och nu landar jag rätt.',
  },
  pet: { name: 'Lilla Gränshopparen', icon: '🦗' }, titleReward: 'Gränsvakten',
};

export const SVERIGERESAN: AreaDef = {
  areaId: 'sverigeresan',
  gameId: 'sverigeresan',
  title: 'Sverigeresan',
  kunskap: { name: 'Sverigekunskap', icon: '🦢', titles: ['Gåsresenären', 'Nils Holgerssons vän'] },
  texts: { cleared: 'Gässen flyger vidare!', notYet: 'Nio rätt av tio behövs för att gässen ska flyga vidare – försök igen!', back: 'Till Sverigeresan' },
  story: 'Från Kompassön flyger en flock vildgäss över Sverige, precis som när Nils Holgersson red på gåsen Mårten. Följ med! Ni flyger över städer, sjöar och berg – hela vägen upp till Kebnekaise.',
  lessons: [
    { id: 'norden', title: 'Norden', icon: '🦢', desc: 'Sverige och grannarna', nodes: ['norden', 'granshopparen', 'sveriges-grannar'], skills: ['geo.sverige.norden'] },
  ],
  eras: [
    { id: 'storstaderna', name: 'Storstäderna', icon: '🏙️', fact: 'Sveriges tre största städer är Stockholm, Göteborg och Malmö. Stockholm är huvudstad.',
      nodes: [
        stage('stora-stader', 'Stora städer', '🏙️', 'Var ligger de?', 'stader', 0, 14000),
        stage('fler-stader', 'Fler städer', '🏘️', 'Från Malmö till Kiruna', 'stader', 1, 14000),
      ] },
    { id: 'sjoar-och-oar', name: 'Sjöar och öar', icon: '🏞️', fact: 'Vänern är Sveriges största sjö och Gotland Sveriges största ö. Högst av allt är Kebnekaise.',
      nodes: [
        stage('sjoarna', 'Sjöarna', '🏞️', 'Vänern, Vättern och Mälaren', 'natur', 0, 14000),
        stage('oar-och-berg', 'Öar och berg', '🏔️', 'Gotland, Öland och Kebnekaise', 'natur', 1, 14000),
      ] },
    { id: 'grannarna', name: 'Grannarna', icon: '🤝', fact: 'Norden är fem länder: Sverige, Norge, Danmark, Finland och Island.',
      nodes: [
        stage('norden', 'Norden', '🌐', 'Fem länder', 'norden', 0, 12000),
        GRANSHOPPAREN,
        stage('sveriges-grannar', 'Sveriges grannar', '🤝', 'Gränser och grannar', 'norden', 1, 12000),
      ] },
    { id: 'landsdelarna', name: 'Landsdelarna', icon: '🧩', fact: 'Sverige har tre landsdelar: Götaland i söder, Svealand i mitten och Norrland i norr – den största.',
      nodes: [
        stage('tre-landsdelar', 'Tre landsdelar', '🧩', 'Götaland, Svealand, Norrland', 'landsdelar', 0, 12000),
        stage('landskapen', 'Landskapen', '🗾', 'Vilket landskap?', 'landskap', 0, 14000),
      ] },
    { id: 'kebnekaise', name: 'Kebnekaise', icon: '🏔️', fact: 'Nu har du flugit över hela Sverige. Uppe på Kebnekaise väntar gässens ledare.',
      nodes: [
        stage('hela-sverige', 'Hela Sverige', '🇸🇪', 'Allt blandat', 'blandat', 1, 14000),
        mastare('akka', 'Akka från Kebnekaise', '🦢', 'Sverigeresans Mästare', 'Akkas reskamrat'),
      ] },
  ],
};

// ---------- Ballongresan ----------

const RAVEN: BossDef = {
  type: 'boss', id: 'forvaxlingsraven', kind: 'monster', name: 'Förväxlingsräven', icon: '🦊', title: 'Blandar ihop länder med liknande namn',
  hp: 8, trap: 'liknande-namn', pool: [{ mode: 'europa', level: 0 }, { mode: 'ost', level: 0 }],
  lines: {
    entrance: 'Hehe, jag är Förväxlingsräven! Österrike, Australien – låter likadant! Slovakien, Slovenien – samma sak! Jag byter plats på länderna när ingen tittar.',
    phase2: 'Nu byter jag snabbare – Lettland, Litauen, Lettland!',
    onHeroMiss: ['Hehe, förväxlat!', 'Nästan samma namn!', 'Lurad!'],
    onBossHit: ['Du läste noga!', 'Aj, du såg skillnaden!', 'Inte lurad!'],
    defeat: 'Du ser skillnad på namnen, hur lika de än är! Får jag följa med? Jag lovar att aldrig byta plats på något igen.',
  },
  pet: { name: 'Lilla Förväxlingsräven', icon: '🦊' }, titleReward: 'Namnkollaren',
};

export const BALLONGRESAN: AreaDef = {
  areaId: 'ballongresan',
  gameId: 'ballongresan',
  title: 'Ballongresan',
  kunskap: { name: 'Länderna', icon: '🎈', titles: ['Ballongfararen', 'Landletaren'] },
  texts: { cleared: 'Ballongen landar mjukt!', notYet: 'Nio rätt av tio behövs för att ballongen ska hitta rätt – försök igen!', back: 'Till Ballongresan' },
  story: 'Vid observatoriet står en stor luftballong. Kliv i korgen! Ni seglar över Norden, genom hela Europa och sedan jorden runt. Kan du peka ut länderna ni flyger över?',
  eras: [
    { id: 'norden-runt', name: 'Norden runt', icon: '🌲', fact: 'Ballongen startar i Norden: Sverige, Norge, Danmark, Finland och Island.',
      nodes: [
        stage('ballong-norden', 'Norden', '🌲', 'Peka ut länderna', 'norden', 0, 12000),
        stage('nordens-grannar', 'Nordens grannar', '🤝', 'Grannar och väderstreck', 'norden', 1, 14000),
      ] },
    { id: 'vasteuropa', name: 'Västeuropa', icon: '🗼', fact: 'I Västeuropa ligger Frankrike, Tyskland, Storbritannien och många fler.',
      nodes: [
        stage('vasteuropa', 'Västeuropa', '🗼', 'Peka ut länderna', 'vast', 0, 12000),
        stage('vast-granne', 'Grannar i väst', '🧀', 'Vem gränsar till vem?', 'vast', 1, 14000),
      ] },
    { id: 'syd-och-ost', name: 'Söder och öster', icon: '🏛️', fact: 'I söder ligger Italien som en stövel. I öster ligger Polen, Ukraina och Ryssland.',
      nodes: [
        stage('sydeuropa', 'Sydeuropa', '🏛️', 'Medelhavets länder', 'syd', 0, 14000),
        stage('osteuropa', 'Östeuropa', '🏰', 'Från Baltikum till Svarta havet', 'ost', 0, 14000),
        RAVEN,
      ] },
    { id: 'hela-europa', name: 'Hela Europa', icon: '🇪🇺', fact: 'Europa har många länder, och de flesta har flera grannar.',
      nodes: [
        stage('hela-europa', 'Hela Europa', '🗺️', 'Alla stora länder', 'europa', 0, 14000),
        stage('europas-grannar', 'Europas grannar', '🧭', 'Grannar och väderstreck', 'europa', 1, 15000),
      ] },
    { id: 'jorden-runt', name: 'Jorden runt', icon: '🌎', fact: 'Nu seglar ballongen ut över haven, till alla världsdelar.',
      nodes: [
        stage('nordamerika', 'Nordamerika', '🗽', 'USA, Kanada, Mexiko …', 'nordamerika', 0, 14000),
        stage('sydamerika', 'Sydamerika', '🦜', 'Brasilien, Argentina …', 'sydamerika', 0, 14000),
        stage('afrika', 'Afrika', '🦒', 'Egypten, Kenya …', 'afrika', 0, 14000),
        stage('asien', 'Asien', '🐼', 'Kina, Japan, Indien …', 'asien', 0, 14000),
        stage('oceanien', 'Australien och öarna', '🦘', 'Australien, Nya Zeeland …', 'oceanien', 0, 14000),
      ] },
    { id: 'ballongens-topp', name: 'Högt över molnen', icon: '☁️', fact: 'Nu har du seglat jorden runt. Ballongkaptenen väntar högt över molnen.',
      nodes: [
        stage('varlden-runt', 'Världen runt', '🎈', 'Allt blandat', 'blandat', 1, 15000),
        mastare('ballongkaptenen', 'Ballongkaptenen', '🎈', 'Ballongresans Mästare', 'Ballongens hjälte'),
      ] },
  ],
};

// ---------- Huvudstadsexpressen ----------

const RATTAN: BossDef = {
  type: 'boss', id: 'storstadsrattan', kind: 'monster', name: 'Storstadsråttan', icon: '🐀', title: 'Tror att största staden alltid är huvudstad',
  hp: 8, trap: 'storsta-staden', pool: [{ mode: 'europa', level: 0 }, { mode: 'europa', level: 1 }],
  lines: {
    entrance: 'Pip pip! Jag är Storstadsråttan, och jag bor bara i de största städerna. Zürich, Istanbul, New York – det är väl huvudstäderna? De är ju störst!',
    phase2: 'Nu åker vi tåg jorden runt – Sydney, Toronto, Lagos!',
    onHeroMiss: ['Pip, störst vinner!', 'Storstad är huvudstad!', 'Pip pip!'],
    onBossHit: ['Huvudstad är inte alltid störst?!', 'Aj, du vet var regeringen sitter!', 'Rätt station!'],
    defeat: 'Så huvudstaden är där regeringen sitter – inte alltid den största staden! Får jag följa med på tåget? Jag kan alla storstäder.',
  },
  pet: { name: 'Lilla Storstadsråttan', icon: '🐀' }, titleReward: 'Huvudstadsdetektiven',
};

export const HUVUDSTADSEXPRESSEN: AreaDef = {
  areaId: 'huvudstadsexpressen',
  gameId: 'huvudstadsexpressen',
  title: 'Huvudstadsexpressen',
  kunskap: { name: 'Huvudstäder', icon: '🚂', titles: ['Huvudstadsexperten', 'Konduktörens favorit'] },
  texts: { cleared: 'Tåget kom fram i tid!', notYet: 'Nio rätt av tio behövs för att tåget ska komma fram – försök igen!', back: 'Till Huvudstadsexpressen' },
  story: 'Från Kompassöns station går ett magiskt tåg som stannar i världens huvudstäder. Konduktören ropar ut stationerna – men bara om du vet vad de heter!',
  lessons: [
    { id: 'storstad-huvudstad', title: 'Storstad är inte alltid huvudstad', icon: '🏙️', desc: 'Huvudstaden är där regeringen sitter', nodes: ['nordens-huvudstader', 'storstadsrattan', 'vilket-land'], skills: ['geo.huvudstad.'] },
  ],
  eras: [
    { id: 'nordens-stationer', name: 'Första stationerna', icon: '🚉', fact: 'Huvudstaden är staden där landets regering sitter. Sveriges huvudstad är Stockholm.',
      nodes: [
        stage('nordens-huvudstader', 'Nordens huvudstäder', '🚉', 'Stockholm, Oslo …', 'norden', 0, 12000),
        stage('europa-vast', 'Västeuropa', '🗼', 'Paris, Berlin, London …', 'vast', 0, 12000),
      ] },
    { id: 'europa-runt', name: 'Europa runt', icon: '🚃', fact: 'Huvudstaden är inte alltid den största staden. I Schweiz är Zürich störst, men huvudstaden är Bern.',
      nodes: [
        stage('europa-syd', 'Sydeuropa', '🏛️', 'Rom, Madrid, Aten …', 'syd', 0, 12000),
        stage('europa-ost', 'Östeuropa', '🏰', 'Warszawa, Prag, Riga …', 'ost', 0, 12000),
        RATTAN,
      ] },
    { id: 'stad-eller-land', name: 'Stad eller land?', icon: '🔁', fact: 'Nu vänder vi på det: vilket land har huvudstaden? Och kan du skriva namnet själv?',
      nodes: [
        stage('vilket-land', 'Vilket land?', '🔁', 'Huvudstad → land', 'europa', 1, 12000),
        stage('skriv-huvudstaden', 'Skriv huvudstaden', '✍️', 'Skriv själv', 'europa', 2, 18000),
      ] },
    { id: 'varldsexpressen', name: 'Världsexpressen', icon: '🌍', fact: 'Tåget åker vidare över haven. I USA är New York störst, men huvudstaden är Washington.',
      nodes: [
        stage('nordamerika-huvudstader', 'Nordamerika', '🗽', 'Washington, Ottawa …', 'nordamerika', 0, 12000),
        stage('sydamerika-huvudstader', 'Sydamerika', '🦜', 'Brasília, Buenos Aires …', 'sydamerika', 0, 12000),
        stage('afrika-huvudstader', 'Afrika', '🦁', 'Kairo, Nairobi …', 'afrika', 0, 12000),
        stage('asien-huvudstader', 'Asien', '🏯', 'Peking, Tokyo …', 'asien', 0, 12000),
      ] },
    { id: 'slutstationen', name: 'Slutstationen', icon: '🏁', fact: 'Nu har du åkt till huvudstäder över hela jorden. Konduktören väntar vid slutstationen.',
      nodes: [
        stage('hela-varlden', 'Hela världen', '🌐', 'Allt blandat', 'blandat', 1, 14000),
        mastare('konduktoren', 'Konduktören', '🚂', 'Huvudstadsexpressens Mästare', 'Expressens hjälte'),
      ] },
  ],
};

// ---------- Flaggmasten ----------

const RITA: BossDef = {
  type: 'boss', id: 'randiga-rita', kind: 'monster', name: 'Randiga Rita', icon: '🦓', title: 'Blandar ihop flaggor som liknar varandra',
  hp: 8, trap: 'liknande-flagga', pool: [{ mode: 'lika', level: 0 }, { mode: 'lika', level: 1 }],
  lines: {
    entrance: 'Ränder, ränder, överallt! Jag är Randiga Rita, och jag älskar flaggor med ränder. Röd och vit, vit och röd – det är väl samma sak?',
    phase2: 'Nu vänder jag på ränderna – lodrätt, vågrätt, hihi!',
    onHeroMiss: ['Hihi, fel ränder!', 'Samma färger!', 'Lurad av ränderna!'],
    onBossHit: ['Du såg skillnaden!', 'Aj, du kollade ordningen!', 'Rätt flagga!'],
    defeat: 'Färgernas ordning spelar roll … och åt vilket håll ränderna går! Får jag följa med? Mina ränder passar till alla flaggor.',
  },
  pet: { name: 'Lilla Randiga Rita', icon: '🦓' }, titleReward: 'Flaggkännaren',
};

export const FLAGGMASTEN: AreaDef = {
  areaId: 'flaggmasten',
  gameId: 'flaggmasten',
  title: 'Flaggmasten',
  kunskap: { name: 'Flaggor', icon: '🚩', titles: ['Flaggspanaren', 'Fanans mästare'] },
  texts: { cleared: 'Flaggorna vajar stolt!', notYet: 'Nio rätt av tio behövs för att flaggorna ska hissas – försök igen!', back: 'Till Flaggmasten' },
  story: 'Vid hamnen på Kompassön står en hög flaggmast med flaggor från hela världen. Fanbäraren hissar en ny flagga varje morgon. Vet du vilket land den hör till?',
  eras: [
    { id: 'nordens-flaggor', name: 'Nordens flaggor', icon: '✝️', fact: 'Alla länder i Norden har ett kors på flaggan. Korset sitter lite till vänster.',
      nodes: [
        stage('nordens-kors', 'Nordens kors', '✝️', 'Fem flaggor med kors', 'norden', 0, 10000),
        stage('flagga-till-land', 'Välj flaggan', '🏳️', 'Vilken flagga har landet?', 'norden', 1, 10000),
      ] },
    { id: 'europas-flaggor', name: 'Europas flaggor', icon: '🇪🇺', fact: 'Många flaggor i Europa har tre ränder. Titta på färgerna och åt vilket håll ränderna går.',
      nodes: [
        stage('europas-flaggor', 'Europas flaggor', '🚩', 'Ränder och färger', 'europa', 0, 10000),
        stage('valj-europas-flagga', 'Välj rätt flagga', '🏁', 'Land → flagga', 'europa', 1, 10000),
      ] },
    { id: 'varldens-flaggor', name: 'Världens flaggor', icon: '🌏', fact: 'Japans flagga har en röd sol. Brasiliens har en gul romb och en blå jordglob.',
      nodes: [
        stage('varldens-flaggor', 'Världens flaggor', '🌏', 'Stjärnor, solar och ränder', 'varlden', 0, 10000),
        stage('lika-flaggor', 'Lika flaggor', '👯', 'Flaggor som liknar varandra', 'lika', 0, 12000),
        RITA,
      ] },
    { id: 'flaggstangen', name: 'Flaggstången', icon: '🎌', fact: 'Nu känner du igen flaggor från hela världen. Fanbäraren väntar högst upp i masten.',
      nodes: [
        stage('alla-flaggor', 'Alla flaggor', '🚩', 'Allt blandat', 'blandat', 1, 12000),
        mastare('fanbararen', 'Fanbäraren', '🚩', 'Flaggmastens Mästare', 'Flaggmastens hjälte'),
      ] },
  ],
};
