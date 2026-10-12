import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Hamnen: Västeröns hamn, där alla pratar engelska och man måste lyssna noga. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const PAPEGOJAN: BossDef = {
  type: 'boss', id: 'papegojan-alfa', kind: 'monster', name: 'Papegojan Alfa', icon: '🦜', title: 'Härmar bokstäverna – på svenska',
  hp: 8, trap: 'bokstavsljud', pool: [{ mode: 'bokstaver', level: 0 }, { mode: 'bokstaver', level: 1 }],
  lines: {
    entrance: 'Kraaa! A-B-C! Jag är Papegojan Alfa och jag kan HELA alfabetet! E heter väl e, och I heter i? Kraaa!',
    phase2: 'Nu stavar jag hela ord! Kraaa! B… E… D!',
    onHeroMiss: ['Kraaa! Fel bokstav!', 'Hihi, du lät som jag!', 'Polly vill ha ett kex!'],
    onBossHit: ['Kraa?! Rätt!', 'Fjädrarna rufsas!', 'Aj, du hör ju precis!'],
    defeat: 'Kraaa… Du kan de engelska bokstäverna bättre än jag! Får jag sitta på din axel? Jag lovar att härma rätt nu.',
  },
  pet: { name: 'Lilla Alfa', icon: '🦜' }, titleReward: 'Papegojviskaren',
};

const EKOMASEN: BossDef = {
  type: 'boss', id: 'ekomasen', kind: 'monster', name: 'Ekomåsen', icon: '🕊️', title: 'Skriker tal som ekar',
  hp: 8, trap: 'teen-ty', pool: [{ mode: 'siffror', level: 1 }],
  lines: {
    entrance: 'Skriii! Thirteen! Thirty! Thirteen! Thirty! Jag är Ekomåsen, och mina tal ekar så att ingen hör skillnaden. Skriii!',
    phase2: 'Fourteen-forty-fifteen-fifty! Skriii!',
    onHeroMiss: ['Skriii! Ekot lurade dig!', 'Teen eller ty? Hihi!', 'Skriii, fel tal!'],
    onBossHit: ['Skri?! Du hörde slutet!', 'Aj, rätt tal!', 'Ekot tystnade!'],
    defeat: 'Skri… du hör skillnaden på teen och ty! Får jag flyga med dig? Jag ska bara skrika rätt tal.',
  },
  pet: { name: 'Lilla Ekomåsen', icon: '🕊️' }, titleReward: 'Ekojägaren',
};

const HAMNMASTAREN: BossDef = {
  type: 'boss', id: 'hamnmastaren', kind: 'mastare', name: 'Hamnmästaren', icon: '🚢', title: 'Hamnens Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'hamnen.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Hamnens öra',
};

export const HAMNEN: AreaDef = {
  areaId: 'hamnen',
  gameId: 'hamnen',
  title: 'Hamnen',
  kunskap: { name: 'Hörförståelse', icon: '👂', titles: ['Lyssnarlots', 'Skarpa öron'] },
  texts: { cleared: 'Du hörde varenda ord!', notYet: 'Nio rätt av tio behövs – lyssna en gång till och försök igen!', back: 'Till hamnen' },
  story: 'I Västeröns hamn ropar fiskare, kaptener och måsar – på engelska! Här gäller det att lyssna noga: tal, bokstäver, fraser och frågor. Har du stora öron?',
  eras: [
    { id: 'bryggan', name: 'Bryggan', icon: '⚓', fact: 'Tryck på "Lyssna igen" så många gånger du vill. Hör du inget? Kolla att ljudet är på.',
      nodes: [
        stage('tal-i-vinden', 'Tal i vinden', '🔢', 'Hör talet och välj siffran', 'siffror', 0, 6000),
        stage('abc', 'ABC', '🔤', 'Vilken bokstav hör du?', 'bokstaver', 0, 6000),
        stage('hej-och-hej-da', 'Hej och hej då', '👋', 'Vad betyder frasen?', 'fraser', 0, 8000),
      ] },
    { id: 'fiskmarknaden', name: 'Fiskmarknaden', icon: '🐟', fact: 'Engelska bokstäver heter inte som svenska: E låter som "ii", I som "aj" och A som "ej".',
      nodes: [
        stage('gor-som-jag-sager', 'Gör som jag säger', '🙋', 'Stand up! Sit down!', 'instruktioner', 0, 8000),
        stage('stava-hogt', 'Stava högt', '🗣️', 'Ordet stavas – vilket är det?', 'bokstaver', 1, 9000),
        PAPEGOJAN,
      ] },
    { id: 'fyren', name: 'Fyren', icon: '🗼', fact: 'Thirteen eller thirty? -teen är långt och betonas på slutet, -ty är kort.',
      nodes: [
        stage('tonar-och-tiotal', 'Tonår och tiotal', '🔟', 'Thirteen eller thirty?', 'siffror', 1, 7000),
        stage('fler-fraser', 'Fler fraser', '💬', 'Be careful! Hurry up!', 'fraser', 1, 9000),
        stage('alla-tal', 'Alla tal till hundra', '💯', 'Twenty-one … ninety-nine', 'siffror', 2, 8000),
        EKOMASEN,
      ] },
    { id: 'angbaten', name: 'Ångbåten', icon: '🛳️', fact: 'Frågeorden: what = vad, where = var, who = vem, when = när, how = hur. Lyssna på det första ordet!',
      nodes: [
        stage('fraga-och-svara', 'Fråga och svara', '❓', 'Vilket svar passar?', 'fragor', 0, 10000),
        stage('var-ar-katten', 'Var är katten?', '🐈', 'Lyssna på meningen', 'meningar', 0, 10000),
        stage('fler-instruktioner', 'Fler instruktioner', '🧭', 'Turn left! Line up!', 'instruktioner', 1, 9000),
        stage('langa-meningar', 'Långa meningar', '📜', 'Vem har vad?', 'meningar', 1, 11000),
        stage('kluriga-fragor', 'Kluriga frågor', '🤔', 'When, who, why …', 'fragor', 1, 11000),
      ] },
    { id: 'hamnkontoret', name: 'Hamnkontoret', icon: '🏢', fact: 'Här blandas allt du har hört i hamnen. Lyssna noga – Hamnmästaren pratar fort!',
      nodes: [
        stage('hamnens-brus', 'Hamnens brus', '🌊', 'Allt blandat', 'blandat', 1, 10000),
        HAMNMASTAREN,
      ] },
  ],
};
