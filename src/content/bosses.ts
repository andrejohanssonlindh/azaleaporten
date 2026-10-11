import type { FamilyPack, Persona } from '../platform/gate/gate';

// Boss-platser och deras allmänna personor (det publika bygget).
// Ett familjepaket kan ersätta personan för vilken boss-plats som helst via samma id.
// Mekaniken (fällor, HP, faser) läggs till i fas 3 och påverkas aldrig av personan.
//
// Id-format: '<område>.mastare' (områdets slutboss) eller '<region>.region' (regionboss). Permanenta.

export const BOSS_SLOTS: { id: string; where: string }[] = [
  { id: 'talbergen.region', where: 'Talbergen – regionboss' },
  { id: 'ordskogen.region', where: 'Ordskogen – regionboss' },
  { id: 'vasteron.region', where: 'Västerön – regionboss' },
  { id: 'tidstornet.mastare', where: 'Tidstornet – slutboss' },
  { id: 'tiokompisbron.mastare', where: 'Tiokompisbron – slutboss' },
  { id: 'tabellgruvan.mastare', where: 'Tabellgruvan – slutboss' },
  { id: 'myntmarknaden.mastare', where: 'Myntmarknaden – slutboss' },
  { id: 'tallinjebron.mastare', where: 'Tallinjebron – slutboss' },
  { id: 'brakbageriet.mastare', where: 'Bråkbageriet – slutboss' },
  { id: 'stavningstrasket.mastare', where: 'Stavningsträsket – slutboss' },
  { id: 'glosviken.mastare', where: 'Glosviken – slutboss' },
];

export const GENERIC_PERSONAS: Persona[] = [
  {
    boss: 'talbergen.region', name: 'Professor Pi', title: 'Talbergens Mästare', portrait: '🧙‍♂️', color: '#1c7ed6',
    entrance: 'Ah, en ny utmanare! Enligt mina beräkningar har du ingen chans. Bevisa att jag räknat fel!',
    phase2: 'Huvudräkning – NU! Ingen miniräknare i världen kan rädda dig.',
    phase3: 'Imponerande… Dags för mitt mästerprov.',
    onHeroMiss: ['Nästan! Men nästan är inte ett tal.', 'Visa din uträkning!'],
    onBossHit: ['Elegant!', 'Där satt den. Exakt.'],
    defeat: 'Fantastiskt räknat! Jag reviderar mina beräkningar – du är en riktig hjälte. Ta min stav.',
    signatureItem: { name: 'Pi-staven', slot: 'vapen', flavor: 'Oändligt lång – nästan.' },
  },
  {
    boss: 'ordskogen.region', name: 'Fru Grammatika', title: 'Ordskogens Mästarinna', portrait: '👩‍🏫', color: '#2f9e44',
    entrance: 'Varje ord på sin plats, varje bokstav rätt. Är du redo för mitt diktamensprov?',
    phase2: 'Rättstavning med röd penna!',
    phase3: 'Nu tar jag fram de svåraste orden i hela skogen.',
    onHeroMiss: ['Titta en gång till på stavningen!', 'Nästan – men en bokstav kan ändra allt.'],
    onBossHit: ['Felfritt!', 'Vackert skrivet.'],
    defeat: 'Felfritt! Du har förtjänat min gyllene reservoarpenna.',
    signatureItem: { name: 'Den gyllene reservoarpennan', slot: 'skold', flavor: 'Skriver bara rätt ord.' },
  },
  {
    boss: 'vasteron.region', name: 'Mr. Wordsworth', title: 'Master of the West Isle', portrait: '🎩', color: '#e8590c',
    entrance: 'Good day, young hero! Let us see if your English is ship-shape!',
    phase2: 'Pop quiz! No peeking!',
    phase3: 'Splendid… but can you handle THIS?',
    onHeroMiss: ['Oh dear! Not quite.', 'Close, but no biscuit!'],
    onBossHit: ['Brilliant!', 'Jolly good!'],
    defeat: 'Splendid! Take my compass – it always points to the right word.',
    signatureItem: { name: 'Mr. Wordsworths kompass', slot: 'amulett', flavor: 'Pekar alltid mot rätt ord.' },
  },
  {
    boss: 'tidstornet.mastare', name: 'Tidens väktare', title: 'Tidstornets Mästare', portrait: '⏳', color: '#7048e8',
    entrance: 'Tick, tack. Ingen passerar Tidstornet utan att kunna läsa tiden.',
    phase2: 'Kvart i eller kvart över? Snabbt nu!',
    phase3: 'Alla minuter. Alla visare. Allt på en gång!',
    onHeroMiss: ['Tiden väntar inte!', 'Titta på visarna igen.'],
    onBossHit: ['Prick rätt!', 'Klockrent.'],
    defeat: 'Du behärskar tiden. Ta mitt timglas – det är ditt nu.',
    signatureItem: { name: 'Väktarens timglas', slot: 'amulett', flavor: 'Sanden rinner uppåt när du tänker.' },
  },
  {
    boss: 'tiokompisbron.mastare', name: 'Brovaktaren Balans', title: 'Tiokompisbrons Mästare', portrait: '🧝', color: '#0ca678',
    entrance: 'Halt! Ingen kliver över min bro utan att kunna sina tiokompisar. Visa vad du går för!',
    phase2: 'Huvudräkning över forsen – nu går det fort!',
    phase3: 'Sista spannet: allt på en gång!',
    onHeroMiss: ['Plankan knakar! Tänk efter.', 'Räkna ental och tiotal för sig.'],
    onBossHit: ['Stadigt!', 'Den plankan håller.'],
    defeat: 'Bron är din, brobyggare! Ta mitt vattenpass – bubblan ligger alltid i mitten när det stämmer.',
    signatureItem: { name: 'Brovaktarens vattenpass', slot: 'skold', flavor: 'Bubblan ligger mitt i när svaret stämmer.' },
  },
  {
    boss: 'tabellgruvan.mastare', name: 'Gruvmästarinnan Kvarts', title: 'Tabellgruvans Mästare', portrait: '👷‍♀️', color: '#f08c00',
    entrance: 'Välkommen till djupet, hjälte. Jag har räknat varenda kristall i den här gruvan. Klarar du mitt tabellprov?',
    phase2: 'Gruvvagnen rullar – svara innan den är förbi!',
    phase3: 'Nu blandar jag ALLA tabeller!',
    onHeroMiss: ['Den kristallen var falsk!', 'Tänk på grannen i tabellen.'],
    onBossHit: ['Äkta diamant!', 'Klockrent – som en kristall.'],
    defeat: 'Du kan tabellerna som en riktig gruvarbetare! Ta min hjälm med lykta – den lyser upp varenda tabell.',
    signatureItem: { name: 'Gruvhjälmen med lykta', slot: 'huvud', flavor: 'Lyser starkare ju fler tabeller du kan.' },
  },
  {
    boss: 'myntmarknaden.mastare', name: 'Marknadsmästarinnan Mynta', title: 'Myntmarknadens Mästare', portrait: '👩‍💼', color: '#e67700',
    entrance: 'Välkommen till rådhuset! Här stämmer varje kassa på öret. Klarar du att handla med mig?',
    phase2: 'Rusning i butiken – snabbt nu, kunderna väntar!',
    phase3: 'Stora affärer! Nu räknar vi med hundralappar.',
    onHeroMiss: ['Kassan stämmer inte!', 'Räkna växeln en gång till.'],
    onBossHit: ['Pang på kronan!', 'En riktig affärshjälte.'],
    defeat: 'Varenda krona rätt! Ta min gyllene pung – den blir aldrig tom på goda idéer.',
    signatureItem: { name: 'Den gyllene pungen', slot: 'amulett', flavor: 'Klirrar glatt när du räknar rätt.' },
  },
  {
    boss: 'tallinjebron.mastare', name: 'Lindansaren Lina', title: 'Tallinjebrons Mästare', portrait: '🤸‍♀️', color: '#1098ad',
    entrance: 'Välkommen upp i tornet! Jag balanserar på tallinjen själv. Vågar du följa med ut på linan?',
    phase2: 'Det blåser! Nu går vi förbi noll!',
    phase3: 'Tiondelar på slak lina – håll balansen!',
    onHeroMiss: ['Oj, det gungade!', 'Titta var talet hör hemma på linjen.'],
    onBossHit: ['Perfekt balans!', 'Mitt på plankan!'],
    defeat: 'Du har tallinjen i blodet, hjälte! Ta min balansstång – den hjälper dig att hitta rätt plats för varje tal.',
    signatureItem: { name: 'Lindansarens balansstång', slot: 'vapen', flavor: 'Lutar alltid mot rätt tal.' },
  },
  {
    boss: 'brakbageriet.mastare', name: 'Bagarmästarinnan Mandel', title: 'Bråkbageriets Mästare', portrait: '👩‍🍳', color: '#c2255c',
    entrance: 'Välkommen in i värmen! I mitt bageri delas varje paj perfekt. Visa att du kan dela lika bra som jag!',
    phase2: 'Ugnen är varm – nu bakar vi snabbt!',
    phase3: 'Festbeställning! Alla bråk på en gång!',
    onHeroMiss: ['Den biten blev sned!', 'Titta på nämnaren – hur stora är bitarna?'],
    onBossHit: ['Perfekt delat!', 'Som en nybakad bulle!'],
    defeat: 'Du delar som en mästerbagare! Ta min kavel – med den blir varje bit precis lika stor.',
    signatureItem: { name: 'Mästerbagarens kavel', slot: 'vapen', flavor: 'Rullar alltid ut lika stora bitar.' },
  },
];

/** Väljer persona för en boss-plats: familjepaketets (matchande årskurs först), annars den allmänna. */
export function personaFor(bossId: string, pack: FamilyPack | null, grade: number): Persona | undefined {
  const fromPack = pack?.personas.filter((p) => p.boss === bossId) ?? [];
  const byGrade = fromPack.find((p) => p.grades && grade >= p.grades[0] && grade <= p.grades[1]);
  return byGrade ?? fromPack.find((p) => !p.grades) ?? GENERIC_PERSONAS.find((p) => p.boss === bossId);
}
