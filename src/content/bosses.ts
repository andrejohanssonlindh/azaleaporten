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
];

/** Väljer persona för en boss-plats: familjepaketets (matchande årskurs först), annars den allmänna. */
export function personaFor(bossId: string, pack: FamilyPack | null, grade: number): Persona | undefined {
  const fromPack = pack?.personas.filter((p) => p.boss === bossId) ?? [];
  const byGrade = fromPack.find((p) => p.grades && grade >= p.grades[0] && grade <= p.grades[1]);
  return byGrade ?? fromPack.find((p) => !p.grades) ?? GENERIC_PERSONAS.find((p) => p.boss === bossId);
}
