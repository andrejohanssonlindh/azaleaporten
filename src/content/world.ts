// Världskartan. Region- och område-ID:n är permanenta (de blir del av sparnycklar och färdighets-ID:n).

export interface Area {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** Rekommenderade årskurser [från, till]. Bara en rekommendation, aldrig ett lås. */
  grades: [number, number];
  status: 'open' | 'soon';
}

export interface Region {
  id: 'talbergen' | 'ordskogen' | 'vasteron';
  name: string;
  subject: string;
  icon: string;
  tagline: string;
  /** Himmelsfärger för regionkortet [topp, botten, mark]. */
  sky: [string, string, string];
  areas: Area[];
}

export const REGIONS: Region[] = [
  {
    id: 'talbergen', name: 'Talbergen', subject: 'Matematik', icon: '⛰️',
    tagline: 'Höga toppar av tal, tid och former.',
    sky: ['#4f9fe0', '#cde9f8', '#6a7f5a'],
    areas: [
      { id: 'tidstornet', name: 'Tidstornet', icon: '🕐', desc: 'Läs klockan och räkna tid.', grades: [1, 5], status: 'soon' },
      { id: 'tiokompisbron', name: 'Tiokompisbron', icon: '🌉', desc: 'Plus och minus med tiotalsövergång.', grades: [1, 3], status: 'soon' },
      { id: 'tabellgruvan', name: 'Tabellgruvan', icon: '⛏️', desc: 'Gångertabeller och division.', grades: [2, 6], status: 'soon' },
      { id: 'myntmarknaden', name: 'Myntmarknaden', icon: '🪙', desc: 'Pengar och växel.', grades: [1, 4], status: 'soon' },
      { id: 'brakbageriet', name: 'Bråkbageriet', icon: '🥧', desc: 'Bråk du kan se och smaka på.', grades: [3, 6], status: 'soon' },
      { id: 'tallinjebron', name: 'Tallinjebron', icon: '📏', desc: 'Tal på tallinjen, decimaler och negativa tal.', grades: [2, 6], status: 'soon' },
    ],
  },
  {
    id: 'ordskogen', name: 'Ordskogen', subject: 'Svenska', icon: '🌲',
    tagline: 'En trolsk skog där orden växer.',
    sky: ['#3b7a57', '#b8e0c2', '#2f5d3a'],
    areas: [
      { id: 'stavningstrasket', name: 'Stavningsträsket', icon: '🐸', desc: 'Hör ordet och stava rätt.', grades: [1, 6], status: 'soon' },
      { id: 'rimbacken', name: 'Rimbäcken', icon: '🎶', desc: 'Rim, motsatser och synonymer.', grades: [1, 4], status: 'soon' },
      { id: 'ordklassernas-tempel', name: 'Ordklassernas tempel', icon: '🏛️', desc: 'Substantiv, verb och adjektiv.', grades: [3, 6], status: 'soon' },
      { id: 'berattelsebiblioteket', name: 'Berättelsebiblioteket', icon: '📚', desc: 'Läs korta berättelser och svara.', grades: [2, 6], status: 'soon' },
    ],
  },
  {
    id: 'vasteron', name: 'Västerön', subject: 'Engelska', icon: '🏝️',
    tagline: 'En ö i väster där alla pratar engelska.',
    sky: ['#2b6cb0', '#ffd8a8', '#c2a878'],
    areas: [
      { id: 'glosviken', name: 'Glosviken', icon: '⚓', desc: 'Engelska ord med bild och ljud.', grades: [1, 6], status: 'soon' },
      { id: 'hamnen', name: 'Hamnen', icon: '🚢', desc: 'Lyssna och välj rätt.', grades: [1, 5], status: 'soon' },
      { id: 'big-ben-tornet', name: 'Big Ben-tornet', icon: '🕰️', desc: 'Klockan på engelska.', grades: [3, 6], status: 'soon' },
    ],
  },
];

export const fitsGrade = (a: Area, grade: number) => grade >= a.grades[0] && grade <= a.grades[1];
