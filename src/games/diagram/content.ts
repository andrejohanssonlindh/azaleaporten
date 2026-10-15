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

// ---------- Vågmästarens bod ----------

const DELAGLOMMAREN: BossDef = {
  type: 'boss', id: 'delaglommaren', kind: 'monster', name: 'Delaglömmaren', icon: '🐹', title: 'Lägger ihop men glömmer att dela',
  hp: 8, trap: 'medel-glomt-dela', pool: [{ mode: 'medel', level: 0 }],
  lines: {
    entrance: 'Mums! Jag är Delaglömmaren. Jag lägger ihop alla nötterna i en stor hög – och sedan äter jag upp allihop. Dela lika? Vad är det?',
    phase2: 'Nu blir högarna större! Och det finns nollor också – mums!',
    onHeroMiss: ['Hela högen är min!', 'Dela? Glömde det!', 'Mums mums!'],
    onBossHit: ['Du delade lika!', 'Aj, min hög!', 'Var och en får lika?!'],
    defeat: 'Om alla delar lika får alla lika mycket … Det var ju rättvist! Får jag följa med? Jag delar med mig av mina nötter.',
  },
  pet: { name: 'Lilla Delaglömmaren', icon: '🐹' }, titleReward: 'Rättvisedelaren',
};

const MITTENMUSEN: BossDef = {
  type: 'boss', id: 'mittenmusen', kind: 'monster', name: 'Mittenmusen', icon: '🐭', title: 'Tar mitten utan att sortera',
  hp: 8, trap: 'median-osorterad', pool: [{ mode: 'median', level: 0 }],
  lines: {
    entrance: 'Pip! Jag är Mittenmusen, och jag springer alltid rakt till mitten av raden. Sortera först? Det tar ju så lång tid!',
    phase2: 'Pip pip! Längre rader – och jag springer ännu fortare!',
    onHeroMiss: ['Mitten, pip!', 'Ingen sortering!', 'Snabbt till mitten!'],
    onBossHit: ['Du sorterade!', 'Pip … aj!', 'I ordning först?!'],
    defeat: 'Först i ordning, sedan mitten. Pip! Får jag följa med? Jag håller ordning i din ryggsäck.',
  },
  pet: { name: 'Lilla Mittenmusen', icon: '🐭' }, titleReward: 'Mittenfinnaren',
};

export const VAGMASTARENS_BOD: AreaDef = {
  areaId: 'vagmastarens-bod',
  gameId: 'vagmastarens-bod',
  title: 'Vågmästarens bod',
  kunskap: { name: 'Lägesmått', icon: '⚖️', titles: ['Medelvärdesmästaren', 'Bodens vågmästare'] },
  texts: { cleared: 'Vågen står i balans!', notYet: 'Nio rätt av tio behövs för att vågen ska stå still – försök igen!', back: 'Till boden' },
  story: 'I Vågmästarens bod väger och mäter man allt som dalen samlat in. Men hur mycket är det "ungefär"? Vågmästarinnan använder tre knep: medelvärde, median och typvärde. Lär dig dem – och se upp för jätten!',
  lessons: [
    { id: 'medelvarde-dela-lika', title: 'Medelvärde = dela lika', icon: '🟰', desc: 'Lägg ihop, och dela med hur många', nodes: ['dela-lika', 'nollan-raknas', 'delaglommaren', 'medel-ur-diagram'], skills: ['ma.stat.medel', 'ma.stat.medel-diagram'] },
    { id: 'median-sortera-forst', title: 'Median: sortera först', icon: '🔢', desc: 'Talet i mitten – när de står i ordning', nodes: ['sortera-forst', 'langa-rader', 'mittenmusen', 'tva-i-mitten'], skills: ['ma.stat.median'] },
    { id: 'typvarde-och-bredd', title: 'Typvärde och variationsbredd', icon: '📏', desc: 'Det vanligaste, och största minus minsta', nodes: ['vanligast', 'storst-minus-minst', 'vilket-matt', 'jatten'], skills: ['ma.stat.typvarde', 'ma.stat.variationsbredd', 'ma.stat.lagesmatt'] },
  ],
  eras: [
    { id: 'dela-lika', name: 'Dela lika', icon: '🟰', fact: 'Medelvärdet är vad var och en får om alla delar lika. Lägg ihop alla talen och dela med hur många de är.',
      nodes: [
        stage('dela-lika', 'Dela lika', '🟰', 'Medelvärdet', 'medel', 0, 16000),
        stage('nollan-raknas', 'Nollan räknas', '0️⃣', 'Medelvärde med större tal', 'medel', 1, 20000),
        DELAGLOMMAREN,
      ] },
    { id: 'mitten', name: 'Mitten', icon: '🔢', fact: 'Medianen är talet i mitten – när talen står i ordning från minst till störst.',
      nodes: [
        stage('sortera-forst', 'Sortera först', '🔢', 'Medianen', 'median', 0, 16000),
        stage('langa-rader', 'Långa rader', '📜', 'Medianen av sju tal', 'median', 1, 20000),
        MITTENMUSEN,
      ] },
    { id: 'vanligast', name: 'Vanligast', icon: '🏆', fact: 'Typvärdet är det tal som finns flest gånger. Variationsbredden är hur långt det är mellan det minsta och det största.',
      nodes: [
        stage('vanligast', 'Vanligast', '🏆', 'Typvärdet', 'typ', 0, 14000),
        stage('storst-minus-minst', 'Störst minus minst', '📏', 'Variationsbredden', 'bredd', 0, 14000),
        stage('tva-i-mitten', 'Två i mitten', '👯', 'Median av ett jämnt antal', 'median', 2, 22000),
      ] },
    { id: 'vagskalen', name: 'Vågskålen', icon: '⚖️', fact: 'Ett jättestort tal drar iväg medelvärdet, men medianen står nästan still.',
      nodes: [
        stage('medel-ur-diagram', 'Medel ur diagram', '📊', 'Medelvärde från staplar', 'medel', 2, 22000),
        stage('vilket-matt', 'Vilket mått?', '🤔', 'Medelvärde, median eller typvärde?', 'valj', 0, 22000),
        stage('jatten', 'Jätten', '🧌', 'Ett jättetal i klassen', 'valj', 1, 15000),
      ] },
    { id: 'boden', name: 'Boden', icon: '🏪', fact: 'Nu kan du alla lägesmåtten. Klarar du Vågmästarens Mästare?',
      nodes: [
        stage('hela-boden', 'Hela boden', '⚖️', 'Allt blandat', 'blandat', 1, 22000),
        mastare('vagmastaren', 'Vågmästaren', '⚖️', 'Vågmästarens Mästare', 'Lägesmåttsmästaren'),
      ] },
  ],
};

// ---------- Spegelsalen ----------

const AXELKLIPPAREN: BossDef = {
  type: 'boss', id: 'axelklipparen', kind: 'monster', name: 'Axelklipparen', icon: '✂️', title: 'Klipper bort början av axeln',
  hp: 8, trap: 'axel-inte-noll', pool: [{ mode: 'axel', level: 0 }],
  lines: {
    entrance: 'Klipp klipp! Jag är Axelklipparen. Jag klipper bort början av axeln, så blir små skillnader JÄTTESTORA. Ser du det?',
    phase2: 'Klipp klipp klipp! Nu klipper jag ännu mer!',
    onHeroMiss: ['Klipp!', 'Jättestor skillnad!', 'Snipp snapp!'],
    onBossHit: ['Du såg att axeln var klippt!', 'Inte min sax!', 'Noll?! Aj!'],
    defeat: 'Axeln ska börja på noll … Okej, okej. Får jag följa med? Jag klipper ut bilder ur tidningen åt dig.',
  },
  pet: { name: 'Lilla Axelklipparen', icon: '✂️' }, titleReward: 'Axelvakten',
};

const BALLONGBLASAREN: BossDef = {
  type: 'boss', id: 'ballongblasaren', kind: 'monster', name: 'Ballongblåsaren', icon: '🎈', title: 'Blåser upp bilderna åt alla håll',
  hp: 8, trap: 'yta-lurar', pool: [{ mode: 'yta', level: 0 }],
  lines: {
    entrance: 'Fffff! Jag är Ballongblåsaren. Dubbelt så mycket? Då blåser jag upp bilden dubbelt så hög OCH dubbelt så bred. Den ser ut som fyra gånger!',
    phase2: 'Fffffff! Ännu större ballonger!',
    onHeroMiss: ['Fyra gånger!', 'Fffff!', 'Titta så stor!'],
    onBossHit: ['Pang! Ballongen sprack!', 'Du läste talen!', 'Fsss …'],
    defeat: 'Det är talen som räknas, inte hur stor ballongen är … Får jag följa med? Jag blåser ballonger till ditt kalas.',
  },
  pet: { name: 'Lilla Ballongblåsaren', icon: '🎈' }, titleReward: 'Ballongsticket',
};

const SKALBYTAREN: BossDef = {
  type: 'boss', id: 'skalbytaren', kind: 'monster', name: 'Skalbytaren', icon: '🦎', title: 'Byter skala mellan två diagram',
  hp: 8, trap: 'olika-skalor', pool: [{ mode: 'olika', level: 0 }],
  lines: {
    entrance: 'Hssss. Jag är Skalbytaren. Två diagram bredvid varandra – men jag byter skalan på det ena när ingen tittar. Vem har mest nu?',
    phase2: 'Hsss! Nu byter jag ännu fortare!',
    onHeroMiss: ['Hsss, högst stapel vinner!', 'Byt, byt!', 'Lurad!'],
    onBossHit: ['Du läste båda axlarna!', 'Hsss … aj!', 'Mina skalor!'],
    defeat: 'Man måste läsa axeln i varje diagram … Hsss. Får jag följa med? Jag byter färg så att ingen ser mig.',
  },
  pet: { name: 'Lilla Skalbytaren', icon: '🦎' }, titleReward: 'Skalgranskaren',
};

export const SPEGELSALEN: AreaDef = {
  areaId: 'spegelsalen',
  gameId: 'spegelsalen',
  title: 'Spegelsalen',
  kunskap: { name: 'Diagram som lurar', icon: '🪞', titles: ['Spegelgenomskådaren', 'Diagramdetektiven'] },
  texts: { cleared: 'Inga speglar lurar dig!', notYet: 'Nio rätt av tio behövs för att se igenom speglarna – försök igen!', back: 'Till spegelsalen' },
  story: 'Längst in på tivolit ligger Spegelsalen. Här sträcker speglarna ut diagrammen: små skillnader ser jättestora ut, och stora ser små ut. Lär dig se igenom knepen – men kom ihåg att alla diagram inte lurar!',
  lessons: [
    { id: 'kolla-axeln', title: 'Kolla axeln!', icon: '📏', desc: 'Börjar axeln på noll? Är stegen lika?', nodes: ['var-borjar-axeln', 'lite-eller-mycket', 'axelklipparen', 'ojamna-steg', 'gangerna', 'laga-axeln', 'alla-knep'], skills: ['ma.stat.lura.axel', 'ma.stat.lura.skala'] },
    { id: 'ytan-lurar', title: 'Ytan lurar ögat', icon: '🎈', desc: 'Breda staplar och växande bilder', nodes: ['breda-staplar', 'hur-mycket-storre', 'vaxande-bilder', 'ytan-lurar', 'ballongblasaren', 'laga-bredden'], skills: ['ma.stat.lura.bredd', 'ma.stat.lura.yta'] },
    { id: 'tva-diagram', title: 'Två diagram, två skalor', icon: '🪞', desc: 'Läs axeln i varje diagram', nodes: ['tva-diagram', 'talby-och-ekby', 'skalbytaren', 'utan-tal'], skills: ['ma.stat.lura.olika', 'ma.stat.lura.enhet'] },
  ],
  eras: [
    { id: 'axeln', name: 'Axeln', icon: '📏', fact: 'Om axeln inte börjar på noll ser små skillnader jättestora ut. Kolla alltid var axeln börjar!',
      nodes: [
        stage('var-borjar-axeln', 'Var börjar axeln?', '📏', 'Hitta knepet', 'axel', 0, 15000),
        stage('lite-eller-mycket', 'Lite eller mycket?', '🔍', 'Vad visar diagrammet egentligen?', 'axel', 1, 16000),
        AXELKLIPPAREN,
      ] },
    { id: 'stegen', name: 'Stegen', icon: '🪜', fact: 'På en ärlig axel ökar talen lika mycket för varje streck. Om stegen är olika stora går det inte att jämföra höjderna.',
      nodes: [
        stage('ojamna-steg', 'Ojämna steg', '🪜', 'Hitta knepet', 'skala', 0, 15000),
        stage('gangerna', 'Hur många gånger?', '✖️', 'Hur stor är skillnaden på riktigt?', 'skala', 1, 18000),
      ] },
    { id: 'bredden', name: 'Bredden', icon: '↔️', fact: 'Det är höjden på en stapel som visar talet. En bred stapel ser större ut än den är.',
      nodes: [
        stage('breda-staplar', 'Breda staplar', '↔️', 'Hitta knepet', 'bredd', 0, 15000),
        stage('hur-mycket-storre', 'Hur mycket större?', '🔎', 'Bredden lurar', 'bredd', 1, 18000),
      ] },
    { id: 'ballongerna', name: 'Ballongerna', icon: '🎈', fact: 'En bild som är dubbelt så hög och dubbelt så bred ser fyra gånger så stor ut. Läs talen!',
      nodes: [
        stage('vaxande-bilder', 'Växande bilder', '🎈', 'Hitta knepet', 'yta', 0, 15000),
        stage('ytan-lurar', 'Ytan lurar', '🫧', 'Hur många gånger på riktigt?', 'yta', 1, 18000),
        BALLONGBLASAREN,
      ] },
    { id: 'tva-speglar', name: 'Två speglar', icon: '🪞', fact: 'Två diagram bredvid varandra kan ha olika skalor. Läs axeln i båda innan du jämför.',
      nodes: [
        stage('tva-diagram', 'Två diagram', '🪞', 'Hitta knepet', 'olika', 0, 15000),
        stage('talby-och-ekby', 'Talby och Ekby', '🏘️', 'Var såldes mest?', 'olika', 1, 18000),
        SKALBYTAREN,
        stage('utan-tal', 'Utan tal', '❓', 'Diagram utan tal', 'enhet', 0, 12000),
      ] },
    { id: 'verkstaden', name: 'Verkstaden', icon: '🔧', fact: 'Ett ärligt diagram har en axel som börjar på noll, lika stora steg och lika breda staplar.',
      nodes: [
        stage('laga-axeln', 'Laga axeln', '🔧', 'Flytta axeln till noll', 'axel', 2, 25000),
        stage('laga-bredden', 'Laga bredden', '🛠️', 'Gör staplarna lika breda', 'bredd', 2, 25000),
        stage('alla-knep', 'Alla knep', '🃏', 'Knep eller ärligt?', 'skala', 2, 18000),
      ] },
    { id: 'spegelsalens-mitt', name: 'Spegelsalens mitt', icon: '✨', fact: 'Nu ser du igenom alla knepen. Klarar du Spegelsalens Mästare?',
      nodes: [
        stage('hela-salen', 'Hela salen', '🪞', 'Allt blandat', 'blandat', 1, 20000),
        mastare('spegelmastaren', 'Spegelmästaren', '🪞', 'Spegelsalens Mästare', 'Spegelsprängaren'),
      ] },
  ],
};

// ---------- Skvallerpressen ----------

const RUSSINPLOCKAREN: BossDef = {
  type: 'boss', id: 'russinplockaren', kind: 'monster', name: 'Russinplockaren', icon: '🍇', title: 'Visar bara den bit som passar',
  hp: 8, trap: 'utsnitt', pool: [{ mode: 'utsnitt', level: 0 }],
  lines: {
    entrance: 'Mmm, russin! Jag är Russinplockaren. Jag plockar bara de godaste bitarna ur diagrammet – de där det ökar. Resten? Det slänger jag!',
    phase2: 'Nu plockar jag ännu smartare bitar!',
    onHeroMiss: ['Bara de goda bitarna!', 'Det ökar ju!', 'Mmm, russin!'],
    onBossHit: ['Du såg hela året!', 'Mina russin!', 'Aj, resten av kakan!'],
    defeat: 'Man måste titta på hela kakan, inte bara russinen … Får jag följa med? Jag delar mina russin med dig.',
  },
  pet: { name: 'Lilla Russinplockaren', icon: '🍇' }, titleReward: 'Helhetsseraren',
};

const FAFRAGAREN: BossDef = {
  type: 'boss', id: 'fafragaren', kind: 'monster', name: 'Fåfrågaren', icon: '🦜', title: 'Frågar bara några få',
  hp: 8, trap: 'fa-svar', pool: [{ mode: 'urval', level: 0 }],
  lines: {
    entrance: 'Kraa! Jag är Fåfrågaren. Jag frågade fyra av mina kompisar, och tre sa ja. Alltså tycker HELA BYN likadant! Kraa!',
    phase2: 'Kraa kraa! Nu frågar jag ännu färre!',
    onHeroMiss: ['Tre av fyra, kraa!', 'Hela byn tycker så!', 'Kraa!'],
    onBossHit: ['För få svar?!', 'Kraa … aj!', 'Du räknade alla!'],
    defeat: 'Man måste fråga fler än sina kompisar … Kraa. Får jag följa med? Jag pratar med alla i byn åt dig.',
  },
  pet: { name: 'Lilla Fåfrågaren', icon: '🦜' }, titleReward: 'Undersökaren',
};

const GLASSMONSTRET: BossDef = {
  type: 'boss', id: 'glassmonstret', kind: 'monster', name: 'Glassmonstret', icon: '🍦', title: 'Tror att glass ger solbränna',
  hp: 8, trap: 'samband-orsak', pool: [{ mode: 'samband', level: 0 }],
  lines: {
    entrance: 'Slurp! Jag är Glassmonstret. När folk äter glass blir de solbrända – det syns i diagrammen! Alltså ger glass solbränna. Slurp!',
    phase2: 'Slurp slurp! Nu har jag ännu fler bevis!',
    onHeroMiss: ['Glass ger solbränna!', 'Slurp!', 'Det syns ju!'],
    onBossHit: ['Det var solen?!', 'Min glass smälter!', 'Slurp … aj!'],
    defeat: 'Det är solen som får folk att både äta glass och bli solbrända … Får jag följa med? Jag bjuder på glass – med solkräm.',
  },
  pet: { name: 'Lilla Glassmonstret', icon: '🍦' }, titleReward: 'Orsaksjägaren',
};

export const SKVALLERPRESSEN: AreaDef = {
  areaId: 'skvallerpressen',
  gameId: 'skvallerpressen',
  title: 'Skvallerpressen',
  kunskap: { name: 'Rubriker och diagram', icon: '📰', titles: ['Rubrikgranskaren', 'Dalens faktakollare'] },
  texts: { cleared: 'Varje rubrik är granskad!', notYet: 'Nio rätt av tio behövs för att tidningen ska bli sann – försök igen!', back: 'Till tryckeriet' },
  story: 'Skvallerpressen är dalens tidning. Den har alltid en rubrik som låter för bra för att vara sann – och ett diagram som ska bevisa den. Stämmer rubriken? Ibland gör den det. Ibland inte. Och ibland går det inte att veta!',
  lessons: [
    { id: 'stammer-rubriken', title: 'Stämmer rubriken?', icon: '📰', desc: 'Sant, falskt eller går inte att veta', nodes: ['stammer-rubriken', 'tredubblat', 'bara-en-bit', 'hela-aret', 'russinplockaren', 'fa-fragade', 'fafragaren'], skills: ['ma.stat.lura.rubrik', 'ma.stat.lura.utsnitt', 'ma.stat.lura.urval'] },
    { id: 'raknetricks', title: 'Totalt, per person och 100 %', icon: '🧮', desc: 'Tricks med siffrorna', nodes: ['totalt-sedan-januari', 'okar-varje-manad', 'mer-an-hundra', 'rakna-procenten', 'per-person', 'glass-per-person'], skills: ['ma.stat.lura.summerad', 'ma.stat.lura.hundra', 'ma.stat.lura.perperson'] },
    { id: 'samband-ar-inte-orsak', title: 'Samband är inte orsak', icon: '🍦', desc: 'Två saker som ökar samtidigt', nodes: ['glass-och-solbranna', 'glassmonstret', 'forskarna-sager'], skills: ['ma.stat.lura.samband'] },
  ],
  eras: [
    { id: 'forsta-sidan', name: 'Första sidan', icon: '📰', fact: 'En rubrik ska få dig att vilja läsa. Men stämmer den med diagrammet? Läs alltid av diagrammet själv.',
      nodes: [
        stage('stammer-rubriken', 'Stämmer rubriken?', '📰', 'Sant eller falskt?', 'rubrik', 0, 15000),
        stage('tredubblat', 'Tredubblat!', '📈', 'Har det verkligen ökat så mycket?', 'rubrik', 1, 18000),
      ] },
    { id: 'russinen', name: 'Russinen', icon: '🍇', fact: 'Den som bara visar en bit av tiden kan få det att se ut som vad som helst. Fråga: vad hände före och efter?',
      nodes: [
        stage('bara-en-bit', 'Bara en bit', '✂️', 'Stämmer det för hela året?', 'utsnitt', 0, 16000),
        stage('hela-aret', 'Hela året', '📅', 'Varför ser det ut så?', 'utsnitt', 1, 16000),
        RUSSINPLOCKAREN,
      ] },
    { id: 'siffrorna', name: 'Siffrorna', icon: '🧮', fact: 'Ett diagram över totalen går alltid uppåt. Det som kommer till varje månad är skillnaden mot månaden innan.',
      nodes: [
        stage('totalt-sedan-januari', 'Totalt sedan januari', '➕', 'Hur många bara den månaden?', 'summerad', 0, 18000),
        stage('okar-varje-manad', 'Ökar varje månad?', '📈', 'Totalen som lurar', 'summerad', 1, 18000),
        stage('mer-an-hundra', 'Mer än hundra', '🥧', 'Cirklar som inte stämmer', 'hundra', 0, 14000),
        stage('rakna-procenten', 'Räkna procenten', '💯', 'Hur många procent tillsammans?', 'hundra', 1, 16000),
      ] },
    { id: 'enkaten', name: 'Enkäten', icon: '📋', fact: 'Om bara några få har svarat vet man inte vad alla tycker. Och i en stor by blir det mycket av allt – kolla per person!',
      nodes: [
        stage('fa-fragade', 'Få fick frågan', '🗣️', 'Hur många svarade?', 'urval', 0, 15000),
        FAFRAGAREN,
        stage('per-person', 'Per person', '🧍', 'Totalt eller per person?', 'perperson', 0, 18000),
        stage('glass-per-person', 'Glass per person', '🍨', 'Räkna per person', 'perperson', 1, 20000),
      ] },
    { id: 'sambanden', name: 'Sambanden', icon: '🔗', fact: 'Två saker kan öka samtidigt utan att den ena orsakar den andra. Ofta är det något tredje – som vädret – som styr båda.',
      nodes: [
        stage('glass-och-solbranna', 'Glass och solbränna', '☀️', 'Varför ökar båda?', 'samband', 0, 15000),
        GLASSMONSTRET,
        stage('forskarna-sager', 'Forskarna säger …', '🔬', 'Stämmer det?', 'samband', 1, 15000),
      ] },
    { id: 'tryckeriet', name: 'Tryckeriet', icon: '🗞️', fact: 'Nu granskar du rubriker som en riktig reporter. Klarar du Skvallerpressens Mästare?',
      nodes: [
        stage('hela-tidningen', 'Hela tidningen', '📰', 'Allt blandat', 'blandat', 1, 20000),
        mastare('chefredaktoren', 'Chefredaktören', '📰', 'Skvallerpressens Mästare', 'Faktakollaren'),
      ] },
  ],
};
