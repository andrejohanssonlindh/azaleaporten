import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Diagramdalens områden: Fågeltornet och Skördemarknaden. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const mastare = (id: string, name: string, icon: string, title: string, titleReward: string, hp = 12): BossDef => ({
  type: 'boss', id, kind: 'mastare', name, icon, title, hp, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }],
  // Repliker hämtas från personan – se content/bosses.ts, id '<område>.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward,
});

// ---------- Fågeltornet ----------

const STRECKTROLLET: BossDef = {
  type: 'boss', id: 'strecktrollet', kind: 'monster', name: 'Strecktrollet', icon: '🧌', title: 'Räknar femgruppen som fyra',
  hp: 8, trap: 'femgrupp', pool: [{ mode: 'streck', level: 0 }, { mode: 'streck', level: 1 }],
  lines: {
    entrance: 'Ett, två, tre, fyra – och ett snett streck, det räknas inte! Jag är Strecktrollet, och mina knippen är bara fyra. Eller sex. Hö hö!',
    phase2: 'Nu ritar jag långa strecklistor – räkna om du kan!',
    onHeroMiss: ['Hö hö, fyra!', 'Det sneda räknas inte!', 'Räkna knippet igen!'],
    onBossHit: ['Fem?! Hela knippet?', 'Du räknade det sneda!', 'Aj, femgruppen!'],
    defeat: 'Fyra streck och ett snett över … blir fem. Hela tiden! Får jag följa med? Jag kan föra strecklista åt dig.',
  },
  pet: { name: 'Lilla Strecktrollet', icon: '🧌' }, titleReward: 'Femgruppsräknaren',
};

export const FAGELTORNET: AreaDef = {
  areaId: 'fageltornet',
  gameId: 'fageltornet',
  title: 'Fågeltornet',
  kunskap: { name: 'Strecklistor och tabeller', icon: '🐦', titles: ['Strecklistaren', 'Tornets fågelräknare'] },
  texts: { cleared: 'Varenda fågel räknad!', notYet: 'Nio rätt av tio behövs för att Fågelvakten ska bli nöjd – försök igen!', back: 'Till tornet' },
  story: 'Uppe i Fågeltornet sitter Fågelvakten och räknar alla fåglar som flyger förbi. Hen ritar ett streck för varje fågel och gör tabeller av strecken. Men det är så många fåglar! Hjälp till att räkna, läsa och jämföra.',
  lessons: [
    { id: 'streck-i-femgrupper', title: 'Streck i femgrupper', icon: '🧮', desc: 'Fyra streck och ett snett över är fem', nodes: ['forsta-strecken', 'femgruppen', 'strecktrollet', 'rita-strecken', 'fran-bild-till-streck'], skills: ['ma.stat.streck', 'ma.stat.streck-rita'] },
    { id: 'tabellen', title: 'Tabellen', icon: '📋', desc: 'Läs tabellen och jämför', nodes: ['tabellen', 'flest-och-farst', 'storre-tabeller', 'hur-manga-fler', 'streck-och-jamfor'], skills: ['ma.stat.tabell', 'ma.stat.tabell-jamfor'] },
  ],
  eras: [
    { id: 'strecklistan', name: 'Strecklistan', icon: '✏️', fact: 'Ett streck för varje sak man räknar. Det femte strecket dras snett över de fyra – då blir det lätt att räkna i femmor.',
      nodes: [
        stage('forsta-strecken', 'Första strecken', '✏️', 'Räkna strecken', 'streck', 0, 10000),
        stage('femgruppen', 'Femgruppen', '🖐️', 'Räkna i femmor', 'streck', 1, 12000),
      ] },
    { id: 'fagelboken', name: 'Fågelboken', icon: '📖', fact: 'En tabell visar samma sak som strecken, men med siffror. Den är lätt att läsa – och lätt att jämföra.',
      nodes: [
        stage('tabellen', 'Tabellen', '📋', 'Läs av tabellen', 'tabell', 0, 9000),
        stage('flest-och-farst', 'Flest och färst', '⚖️', 'Vilken är flest?', 'jamfor', 0, 9000),
        STRECKTROLLET,
      ] },
    { id: 'rakna-och-rita', name: 'Räkna och rita', icon: '🖍️', fact: 'När man räknar många saker är det lätt att tappa bort sig. Ett streck för varje sak – sedan räknar man strecken.',
      nodes: [
        stage('rita-strecken', 'Rita strecken', '🖍️', 'Från tabell till streck', 'rita', 0, 25000),
        stage('fran-bild-till-streck', 'Från bild till streck', '🔭', 'Räkna fåglarna i kikaren', 'rita', 1, 35000),
        stage('storre-tabeller', 'Större tabeller', '📋', 'Fler rader, större tal', 'tabell', 1, 10000),
      ] },
    { id: 'jamforelsen', name: 'Jämförelsen', icon: '⚖️', fact: 'Hur många fler? Då räknar man skillnaden: det större talet minus det mindre.',
      nodes: [
        stage('hur-manga-fler', 'Hur många fler?', '➖', 'Fler och sammanlagt', 'jamfor', 1, 14000),
        stage('streck-och-jamfor', 'Streck och jämför', '🧮', 'Jämför strecken', 'jamfor', 2, 16000),
      ] },
    { id: 'tornets-topp', name: 'Tornets topp', icon: '🔭', fact: 'Nu kan du räkna, läsa och jämföra. Klarar du Fågeltornets Mästare?',
      nodes: [
        stage('hela-tornet', 'Hela tornet', '🐦', 'Allt blandat', 'blandat', 1, 18000),
        mastare('tornmastaren', 'Tornmästaren', '🦉', 'Fågeltornets Mästare', 'Fågelräknaren'),
      ] },
  ],
};

// ---------- Skördemarknaden ----------

const RUTSPINDELN: BossDef = {
  type: 'boss', id: 'rutspindeln', kind: 'monster', name: 'Rutspindeln', icon: '🕷️', title: 'Räknar rutor i stället för att läsa skalan',
  hp: 8, trap: 'rutor-inte-varde', pool: [{ mode: 'stapel', level: 1 }, { mode: 'stapel', level: 2 }],
  lines: {
    entrance: 'Ett, två, tre, fyra rutor! Jag är Rutspindeln, och i mitt nät är varje ruta värd en. Vad står det vid axeln? Det läser jag aldrig!',
    phase2: 'Nu spinner jag rutor som är värda ännu mer – eller?',
    onHeroMiss: ['Fyra rutor, fyra!', 'Räkna rutorna!', 'Skalan? Vilken skala?'],
    onBossHit: ['Du läste skalan!', 'Mitt nät går sönder!', 'Aj, talen vid axeln!'],
    defeat: 'Varje ruta är värd det som står vid axeln … Får jag följa med? Jag spinner rutnät åt dina diagram.',
  },
  pet: { name: 'Lilla Rutspindeln', icon: '🕷️' }, titleReward: 'Skalläsaren',
};

const NYCKELPIGAN: BossDef = {
  type: 'boss', id: 'nyckelpigan-glomsk', kind: 'monster', name: 'Nyckelpigan Glömsk', icon: '🐞', title: 'Glömmer alltid nyckeln',
  hp: 8, trap: 'nyckel-glomd', pool: [{ mode: 'bild', level: 0 }, { mode: 'bild', level: 1 }],
  lines: {
    entrance: 'Hej hej! Jag är Nyckelpigan Glömsk. Tre äpplen i diagrammet – då är det tre äpplen! Nyckel? Vilken nyckel? Det har jag glömt.',
    phase2: 'Nu är varje bild värd tio – eller var det fem? Jag minns inte!',
    onHeroMiss: ['Tre bilder, tre!', 'Nyckeln? Glömd!', 'Hihi, glömsk!'],
    onBossHit: ['Du kom ihåg nyckeln!', 'Oj, varje bild är värd mer!', 'Du läste nyckeln!'],
    defeat: 'Nyckeln! Den har jag glömt hela tiden. Får jag följa med? Du kan påminna mig, och jag håller reda på dina nycklar.',
  },
  pet: { name: 'Lilla Nyckelpigan', icon: '🐞' }, titleReward: 'Nyckelbäraren',
};

export const SKORDEMARKNADEN: AreaDef = {
  areaId: 'skordemarknaden',
  gameId: 'skordemarknaden',
  title: 'Skördemarknaden',
  kunskap: { name: 'Stapel- och bilddiagram', icon: '📊', titles: ['Stapelläsaren', 'Marknadens diagramkung'] },
  texts: { cleared: 'Marknadens diagram stämmer!', notYet: 'Nio rätt av tio behövs för att marknaden ska gå ihop – försök igen!', back: 'Till marknaden' },
  story: 'På Skördemarknaden säljer dalens bönder morötter, pumpor och glass. Varje kväll hänger marknadsfogden upp diagram över allt som sålts. Läs staplarna och bilderna – och bygg egna diagram!',
  lessons: [
    { id: 'las-ett-stapeldiagram', title: 'Så läser du ett stapeldiagram', icon: '📊', desc: 'Skalan först, sedan stapeln', nodes: ['las-stapeln', 'hogst-och-lagst', 'hoppa-i-steg', 'mellan-strecken', 'rutspindeln', 'bygg-staplar', 'bygg-med-skala', 'stora-tal'], skills: ['ma.stat.stapel', 'ma.stat.stapel-skala', 'ma.stat.stapel-rita'] },
    { id: 'bildnyckeln', title: 'Bildnyckeln', icon: '🔑', desc: 'En bild kan betyda många', nodes: ['en-bild-flera', 'femmor-och-tior', 'halva-bilder', 'nyckelpigan-glomsk'], skills: ['ma.stat.bild', 'ma.stat.bild-halv'] },
    { id: 'jamfor-staplar', title: 'Jämför staplar', icon: '⚖️', desc: 'Hur många fler, och sammanlagt', nodes: ['hur-mycket-mer', 'mer-med-skala'], skills: ['ma.stat.stapel-jamfor'] },
  ],
  eras: [
    { id: 'forsta-staplarna', name: 'Första staplarna', icon: '📊', fact: 'I ett stapeldiagram är varje sak en stapel. Ju högre stapel, desto fler.',
      nodes: [
        stage('las-stapeln', 'Läs stapeln', '📊', 'Hur hög är stapeln?', 'stapel', 0, 10000),
        stage('hogst-och-lagst', 'Högst och lägst', '🏆', 'Tryck på rätt stapel', 'jamfor', 0, 8000),
      ] },
    { id: 'skalan', name: 'Skalan', icon: '📏', fact: 'Skalan vid axeln säger hur mycket varje streck är värt. Den kan gå i tvåor, femmor eller tior!',
      nodes: [
        stage('hoppa-i-steg', 'Hoppa i steg', '🦘', 'Skalan går i steg', 'stapel', 1, 12000),
        stage('mellan-strecken', 'Mellan strecken', '↕️', 'Staplar mellan två streck', 'stapel', 2, 14000),
        RUTSPINDELN,
      ] },
    { id: 'bildnyckeln', name: 'Bildnyckeln', icon: '🔑', fact: 'I ett bilddiagram kan en bild betyda många. Nyckeln under diagrammet säger hur många.',
      nodes: [
        stage('en-bild-flera', 'En bild, flera', '🍎', 'Varje bild är två', 'bild', 0, 12000),
        stage('femmor-och-tior', 'Femmor och tior', '🧺', 'Bilder som är värda mer', 'bild', 1, 12000),
        stage('halva-bilder', 'Halva bilder', '🌗', 'En halv bild är hälften', 'bild', 2, 15000),
        NYCKELPIGAN,
      ] },
    { id: 'byggplatsen', name: 'Byggplatsen', icon: '🔨', fact: 'Den som gör ett diagram väljer skala. Med en bra skala får alla staplarna plats.',
      nodes: [
        stage('bygg-staplar', 'Bygg staplar', '🔨', 'Från tabell till stapel', 'rita', 0, 25000),
        stage('bygg-med-skala', 'Bygg med skala', '🏗️', 'Bygg med tvåor och femmor', 'rita', 1, 30000),
      ] },
    { id: 'marknadsrakningen', name: 'Marknadsräkningen', icon: '🧮', fact: 'Med ett diagram kan man jämföra snabbt: hur mycket mer såldes av det ena än det andra?',
      nodes: [
        stage('hur-mycket-mer', 'Hur mycket mer?', '➖', 'Skillnad och sammanlagt', 'jamfor', 1, 15000),
        stage('stora-tal', 'Stora tal', '💯', 'Skalor med hundratal', 'stapel', 3, 15000),
        stage('mer-med-skala', 'Mer med skala', '⚖️', 'Jämför med skala', 'jamfor', 2, 18000),
      ] },
    { id: 'torget', name: 'Torget', icon: '🎪', fact: 'Nu läser du staplar, skalor och bildnycklar. Klarar du Skördemarknadens Mästare?',
      nodes: [
        stage('hela-marknaden', 'Hela marknaden', '🌾', 'Allt blandat', 'blandat', 1, 18000),
        mastare('marknadsmastaren', 'Marknadsmästaren', '🧑‍🌾', 'Skördemarknadens Mästare', 'Diagramläsaren'),
      ] },
  ],
};
