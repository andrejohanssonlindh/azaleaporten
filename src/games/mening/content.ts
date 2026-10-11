import type { AreaDef, BossDef, StageDef } from '../../platform/rpg/types';

// Meningssmedjan: en smedja i Ordskogen där meningar smids. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: string, level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const PUNKTPIRATEN: BossDef = {
  type: 'boss', id: 'punktpiraten', kind: 'monster', name: 'Punktpiraten', icon: '🏴‍☠️', title: 'Stjäl alla punkter',
  hp: 8, trap: 'punkt', pool: [{ mode: 'punkt', level: 0 }, { mode: 'punkt', level: 1 }],
  lines: {
    entrance: 'Arrr! Jag är Punktpiraten och jag samlar på punkter. Utan punkter blir alla meningar en enda lång och här kommer jag och tar dem alla arrr',
    phase2: 'Arrr! Nu snor jag punkterna mitt i texten också!',
    onHeroMiss: ['Arrr! En punkt till min skattkista!', 'Hehe, meningen rann iväg!', 'Ingen punkt här, kamrat!'],
    onBossHit: ['Arrr! Du satte tillbaka den!', 'Min skattkista blir tom!', 'Fy sjutton, en punkt!'],
    defeat: 'Arrr… du har hittat varenda punkt. Här, ta tillbaka dem. Får jag segla med dig? Jag lovar att bara samla på snäckor.',
  },
  pet: { name: 'Lilla Punktpiraten', icon: '🦜' }, titleReward: 'Punktjägaren',
};

const KOMMAKATTEN: BossDef = {
  type: 'boss', id: 'kommakatten', kind: 'monster', name: 'Kommakatten', icon: '🐈', title: 'Strör komman överallt',
  hp: 8, trap: 'komma-och', pool: [{ mode: 'komma', level: 0 }, { mode: 'komma', level: 1 }],
  lines: {
    entrance: 'Mjau, hej, på, dig! Jag, är, Kommakatten. Jag, tycker, om, komman, och, jag, sätter, dem, överallt – mest, före, och!',
    phase2: 'Mjaaau! Fler, komman, åt, folket!',
    onHeroMiss: ['Mjau, ett, komma, till!', 'Spinn spinn, komma, och!', 'Hihi, mjau!'],
    onBossHit: ['Fräs! Där skulle det inte vara något komma!', 'Mjau… du har rätt.', 'Mina komman tar slut!'],
    defeat: 'Mjau. Ett komma är en liten paus – inte något man strör ut. Får jag bo hos dig? Jag spinner med pauser på rätt ställen.',
  },
  pet: { name: 'Lilla Kommakatten', icon: '🐈' }, titleReward: 'Kommaväktaren',
};

const SMEDMASTAREN: BossDef = {
  type: 'boss', id: 'smedmastaren', kind: 'mastare', name: 'Smedmästaren', icon: '⚒️', title: 'Meningssmedjans Mästare',
  hp: 12, pool: [{ mode: 'blandat', level: 0 }, { mode: 'blandat', level: 1 }, { mode: 'blandat', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'meningssmedjan.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Meningssmed',
};

export const MENINGSSMEDJAN: AreaDef = {
  areaId: 'meningssmedjan',
  gameId: 'mening',
  title: 'Meningssmedjan',
  kunskap: { name: 'Meningsbygge', icon: '⚒️', titles: ['Punktsättare', 'Meningsbyggare'] },
  texts: { cleared: 'Meningen håller – den är smidd!', notYet: 'Nio rätt av tio behövs för att meningen ska hålla – smid igen!', back: 'Till smedjan' },
  story: 'Mitt i Ordskogen står Meningssmedjan. Här hamras orden ihop till meningar som håller: stor bokstav i början, rätt tecken i slutet och orden i rätt ordning. Värm upp vid glöden och arbeta dig fram till Mästarens ässja!',
  eras: [
    { id: 'gloden', name: 'Glöden', icon: '🔥', fact: 'En mening börjar med stor bokstav och slutar med punkt, frågetecken eller utropstecken.',
      nodes: [
        stage('stor-och-punkt', 'Stor bokstav och punkt', '🔠', 'Vilken mening är rätt skriven?', 'punkt', 0, 9000),
        stage('punkt-fraga-utrop', 'Punkt, ? eller !', '❓', 'Vilket tecken ska stå sist?', 'tecken', 0, 8000),
      ] },
    { id: 'stadet', name: 'Städet', icon: '🔨', fact: 'Utan punkter flyter allt ihop till en enda lång orm. Punkten visar var en tanke slutar.',
      nodes: [
        stage('var-slutar-meningen', 'Var slutar meningen?', '🛑', 'Hitta var punkten ska stå', 'punkt', 1, 12000),
        stage('kluriga-tecken', 'Kluriga tecken', '❗', 'Frågeord som inte frågar', 'tecken', 1, 9000),
        PUNKTPIRATEN,
      ] },
    { id: 'verkstaden', name: 'Verkstaden', icon: '⚙️', fact: 'I en svensk mening står verbet nästan alltid på andra plats: "I dag spelar vi" – inte "I dag vi spelar".',
      nodes: [
        stage('bygg-meningen', 'Bygg meningen', '🧱', 'Lägg bitarna i rätt ordning', 'ordfoljd', 0, 15000),
        stage('sambandsord', 'Sambandsord', '🔗', 'Ord som binder ihop', 'samband', 0, 9000),
        stage('bygg-fragor', 'Bygg frågor', '🏗️', 'Längre meningar och frågor', 'ordfoljd', 1, 18000),
        stage('fler-sambandsord', 'Fler sambandsord', '⛓️', 'eftersom, medan, innan …', 'samband', 1, 10000),
      ] },
    { id: 'finsmedjan', name: 'Finsmedjan', icon: '✨', fact: 'Ett komma är en liten paus. Det står mellan sakerna i en uppräkning – men aldrig före det sista "och".',
      nodes: [
        stage('kommatecken', 'Kommatecken', '✒️', 'Var ska kommat stå?', 'komma', 0, 12000),
        stage('fler-kommatecken', 'Fler kommatecken', '🖋️', 'Bisatser och "men"', 'komma', 1, 12000),
        stage('nagon-sager', 'Någon säger något', '💬', 'Talstreck, kolon och citattecken', 'anforing', 0, 14000),
        KOMMAKATTEN,
      ] },
    { id: 'assjan', name: 'Mästarens ässja', icon: '🌋', fact: 'Här blandas allt du har lärt dig i smedjan. Den som klarar sig hela vägen får kalla sig Meningssmed.',
      nodes: [
        stage('allt-i-smedjan', 'Allt i smedjan', '⚒️', 'Allt blandat', 'blandat', 1, 14000),
        stage('mastarprovet', 'Mästarprovet', '🗡️', 'De svåraste meningarna', 'blandat', 2, 14000),
        SMEDMASTAREN,
      ] },
  ],
};
