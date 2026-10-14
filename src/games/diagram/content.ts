import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Diagramdalens områden: Fågeltornet, Skördemarknaden, Väderstationen, Omröstningstorget, Vågmästarens bod,
// Spegelsalen och Skvallerpressen. Bana- och boss-id:n är permanenta.

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

// ---------- Väderstationen ----------

const TOPPJAGAREN: BossDef = {
  type: 'boss', id: 'toppjagaren', kind: 'monster', name: 'Toppjägaren', icon: '🏔️', title: 'Väljer alltid toppen',
  hp: 8, trap: 'topp-inte-okning', pool: [{ mode: 'forandring', level: 0 }],
  lines: {
    entrance: 'Högst upp! Alltid högst upp! Jag är Toppjägaren, och där linjen är som högst – där ökade det mest. Eller hur?',
    phase2: 'Nu klättrar mina linjer ännu högre. Hitta den brantaste biten om du kan!',
    onHeroMiss: ['Toppen, toppen!', 'Högst är bäst!', 'Upp på toppen!'],
    onBossHit: ['Du hittade den branta biten!', 'Brantast, inte högst …', 'Aj, backen!'],
    defeat: 'Det brantaste stället är inte alltid toppen … Får jag följa med? Jag klättrar upp och spanar efter väder åt dig.',
  },
  pet: { name: 'Lilla Toppjägaren', icon: '🏔️' }, titleReward: 'Backläsaren',
};

export const VADERSTATIONEN: AreaDef = {
  areaId: 'vaderstationen',
  gameId: 'vaderstationen',
  title: 'Väderstationen',
  kunskap: { name: 'Linjediagram', icon: '🌦️', titles: ['Linjeläsaren', 'Stationens väderspåare'] },
  texts: { cleared: 'Väderrapporten är klar!', notYet: 'Nio rätt av tio behövs för att väderrapporten ska stämma – försök igen!', back: 'Till stationen' },
  story: 'Uppe på kullen står Väderstationen. Här mäter meteorologen temperaturen varje timme, snön varje månad och solrosen varje vecka – och ritar allt som linjer. Hjälp till att läsa linjerna: när var det varmast, och när ökade det mest?',
  lessons: [
    { id: 'linjen-visar-forandring', title: 'Linjen visar förändring', icon: '📈', desc: 'Läs av punkter, och se när det ökar', nodes: ['las-punkten', 'skalan-pa-linjen', 'upp-eller-ner', 'brantast', 'toppjagaren', 'nar-var-det', 'storsta-forandringen'], skills: ['ma.stat.linje', 'ma.stat.linje-forandring'] },
    { id: 'tva-linjer', title: 'Två linjer, och vilket diagram?', icon: '〰️', desc: 'Teckenförklaringen, punkterna och diagramtyperna', nodes: ['dalen-och-berget', 'hur-mycket-varmare', 'satt-ut-punkter', 'punkter-med-skala', 'vilket-diagram'], skills: ['ma.stat.linje-tva', 'ma.stat.linje-rita', 'ma.stat.diagramtyp'] },
  ],
  eras: [
    { id: 'linjen', name: 'Linjen', icon: '📈', fact: 'Ett linjediagram visar hur något ändras över tid. Tiden står längst ner, och värdet läser man av vid axeln till vänster.',
      nodes: [
        stage('las-punkten', 'Läs punkten', '📍', 'Hur varmt var det?', 'las', 0, 12000),
        stage('skalan-pa-linjen', 'Skalan på linjen', '📏', 'Punkter mellan strecken', 'las', 1, 14000),
      ] },
    { id: 'forandringen', name: 'Förändringen', icon: '↗️', fact: 'Där linjen går brant uppåt ökar det mycket. Där den går nedåt minskar det. Högst upp är inte samma sak som mest ökning!',
      nodes: [
        stage('upp-eller-ner', 'Upp eller ner?', '↕️', 'Hur mycket ökade det?', 'forandring', 1, 15000),
        stage('brantast', 'Brantast', '⛰️', 'När ökade det mest?', 'forandring', 0, 14000),
        TOPPJAGAREN,
      ] },
    { id: 'tva-linjer', name: 'Två linjer', icon: '〰️', fact: 'Två linjer i samma diagram kan jämföras. Teckenförklaringen säger vilken linje som är vilken.',
      nodes: [
        stage('dalen-och-berget', 'Dalen och berget', '🏞️', 'Läs rätt linje', 'tva', 0, 14000),
        stage('hur-mycket-varmare', 'Hur mycket varmare?', '🌡️', 'Skillnaden mellan linjerna', 'tva', 1, 16000),
      ] },
    { id: 'ritbordet', name: 'Ritbordet', icon: '✏️', fact: 'Den som ritar ett diagram väljer sort. Något som ändras över tid blir ett linjediagram.',
      nodes: [
        stage('satt-ut-punkter', 'Sätt ut punkter', '✏️', 'Från tabell till linje', 'rita', 0, 25000),
        stage('punkter-med-skala', 'Punkter med skala', '📐', 'Sätt ut punkter med skala', 'rita', 1, 30000),
        stage('vilket-diagram', 'Vilket diagram?', '🤔', 'Linje, stapel eller cirkel?', 'valj', 0, 12000),
      ] },
    { id: 'baklanges', name: 'Baklänges', icon: '🔄', fact: 'Man kan läsa åt andra hållet också: börja vid talet på axeln och leta upp tiden.',
      nodes: [
        stage('nar-var-det', 'När var det?', '🕰️', 'Från värdet till tiden', 'las', 2, 14000),
        stage('storsta-forandringen', 'Största förändringen', '🎢', 'Mest upp och mest ner', 'forandring', 2, 16000),
      ] },
    { id: 'vadertornet', name: 'Vädertornet', icon: '🌦️', fact: 'Nu läser du linjer som en meteorolog. Klarar du Väderstationens Mästare?',
      nodes: [
        stage('hela-stationen', 'Hela stationen', '🌦️', 'Allt blandat', 'blandat', 1, 18000),
        mastare('vadermastaren', 'Vädermästaren', '🌦️', 'Väderstationens Mästare', 'Väderläsaren'),
      ] },
  ],
};

// ---------- Omröstningstorget ----------

const ANDELSANKAN: BossDef = {
  type: 'boss', id: 'andelsankan', kind: 'monster', name: 'Andelsankan', icon: '🦆', title: 'Blandar ihop procent och antal',
  hp: 8, trap: 'andel-antal', pool: [{ mode: 'procent', level: 1 }],
  lines: {
    entrance: 'Kvack! Det står 30 procent vid biten – då röstade 30 stycken! Jag är Andelsankan, och hur många som var med bryr jag mig inte om.',
    phase2: 'Kvack kvack! Nu räknar vi procent baklänges!',
    onHeroMiss: ['Kvack, 30 stycken!', 'Procent är antal!', 'Kvaaack!'],
    onBossHit: ['Av hundra?!', 'Du räknade om procenten!', 'Kvack … aj!'],
    defeat: 'Procent betyder av hundra … och det var inte hundra som röstade! Kvack. Får jag följa med? Jag håller koll på dina procent.',
  },
  pet: { name: 'Lilla Andelsankan', icon: '🦆' }, titleReward: 'Procentkollaren',
};

export const OMROSTNINGSTORGET: AreaDef = {
  areaId: 'omrostningstorget',
  gameId: 'omrostningstorget',
  title: 'Omröstningstorget',
  kunskap: { name: 'Cirkeldiagram och procent', icon: '🗳️', titles: ['Cirkelläsaren', 'Torgets rösträknare'] },
  texts: { cleared: 'Rösterna är räknade!', notYet: 'Nio rätt av tio behövs för att valet ska bli rätt – försök igen!', back: 'Till torget' },
  story: 'På Omröstningstorget röstar dalens invånare om allt: favoritdjur, glass och rastlekar. Valförrättaren ritar resultatet som cirkeldiagram, där hela cirkeln är alla som röstade. Hur stor bit fick var och en?',
  lessons: [
    { id: 'cirkeln-ar-alla', title: 'Cirkeln är alla', icon: '🥧', desc: 'Hälften, en fjärdedel och en tredjedel', nodes: ['storsta-biten', 'halva-och-kvarta', 'stapel-blir-cirkel'], skills: ['ma.stat.cirkel', 'ma.stat.cirkel-jamfor'] },
    { id: 'procent-av-hundra', title: 'Procent betyder av hundra', icon: '💯', desc: 'Från procent till hur många', nodes: ['hundra-roster', 'procent-av-alla', 'andelsankan', 'hur-manga-procent', 'fler-i-procent'], skills: ['ma.stat.cirkel-procent'] },
  ],
  eras: [
    { id: 'bitarna', name: 'Bitarna', icon: '🥧', fact: 'I ett cirkeldiagram är hela cirkeln alla. Ju större bit, desto fler röstade på den.',
      nodes: [
        stage('storsta-biten', 'Största biten', '🥧', 'Vem fick flest röster?', 'cirkel', 0, 9000),
        stage('halva-och-kvarta', 'Halva och kvarta', '🌓', 'Hur stor del av cirkeln?', 'cirkel', 1, 12000),
      ] },
    { id: 'procenten', name: 'Procenten', icon: '💯', fact: 'Procent betyder "av hundra". 30 % är 30 av hundra – men bara om det var hundra som röstade!',
      nodes: [
        stage('hundra-roster', 'Hundra röster', '💯', 'Procent när hundra röstade', 'procent', 0, 12000),
        stage('procent-av-alla', 'Procent av alla', '🧮', 'Procent av fler eller färre än hundra', 'procent', 1, 16000),
        ANDELSANKAN,
      ] },
    { id: 'stapel-och-cirkel', name: 'Stapel och cirkel', icon: '📊', fact: 'Samma röster kan ritas som staplar eller som en cirkel. Staplar visar hur många, cirkeln visar hur stor del.',
      nodes: [
        stage('stapel-blir-cirkel', 'Stapel blir cirkel', '🔄', 'Från staplar till bitar', 'jamfor', 0, 16000),
        stage('hur-manga-procent', 'Hur många procent?', '🔢', 'Från antal till procent', 'procent', 2, 18000),
        stage('fler-i-procent', 'Fler i procent', '➖', 'Hur många fler?', 'jamfor', 1, 18000),
      ] },
    { id: 'valdagen', name: 'Valdagen', icon: '🗳️', fact: 'Nu kan du läsa cirkeldiagram och procent. Klarar du Omröstningstorgets Mästare?',
      nodes: [
        stage('hela-torget', 'Hela torget', '🗳️', 'Allt blandat', 'blandat', 1, 18000),
        mastare('valmastaren', 'Valmästaren', '🗳️', 'Omröstningstorgets Mästare', 'Procentläsaren'),
      ] },
  ],
};
