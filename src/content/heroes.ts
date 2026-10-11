// Val vid skapande av hjälte. ID:n är permanenta – byt aldrig namn på ett id, lägg till nya i stället.

export const ANIMALS = [
  { id: 'rav', emoji: '🦊', name: 'Räv' },
  { id: 'bjorn', emoji: '🐻', name: 'Björn' },
  { id: 'varg', emoji: '🐺', name: 'Varg' },
  { id: 'uggla', emoji: '🦉', name: 'Uggla' },
  { id: 'katt', emoji: '🐱', name: 'Katt' },
  { id: 'kanin', emoji: '🐰', name: 'Kanin' },
  { id: 'drake', emoji: '🐉', name: 'Drake' },
  { id: 'lejon', emoji: '🦁', name: 'Lejon' },
  { id: 'panda', emoji: '🐼', name: 'Panda' },
  { id: 'enhorning', emoji: '🦄', name: 'Enhörning' },
  { id: 'groda', emoji: '🐸', name: 'Groda' },
  { id: 'pingvin', emoji: '🐧', name: 'Pingvin' },
] as const;

export const COLORS = [
  { id: 'azalea', hex: '#e64980', name: 'Azalearosa' },
  { id: 'kastanj', hex: '#a0522d', name: 'Kastanjebrun' },
  { id: 'skog', hex: '#2f9e44', name: 'Skogsgrön' },
  { id: 'hav', hex: '#1c7ed6', name: 'Havsblå' },
  { id: 'kunglig', hex: '#7048e8', name: 'Kunglig lila' },
  { id: 'sol', hex: '#f59f00', name: 'Solgul' },
  { id: 'glod', hex: '#e03131', name: 'Glödröd' },
  { id: 'is', hex: '#15aabf', name: 'Isblå' },
] as const;

// Klassens perk påverkar aldrig vad som räknas som rätt, trösklar eller stjärnor (lärandets integritet).
export const CLASSES = [
  { id: 'riddare', emoji: '🛡️', name: 'Riddare', perk: '+1 hjärta i bossstrider', flavor: 'Modig och stark. Står kvar när bossen slår till.' },
  { id: 'trollkarl', emoji: '🪄', name: 'Trollkarl', perk: '+10 % XP', flavor: 'Lär sig snabbt och älskar kunskap.' },
  { id: 'ranger', emoji: '🏹', name: 'Ranger', perk: 'Bättre tur med skatter', flavor: 'Hittar alltid de bästa sakerna i kistorna.' },
  { id: 'uppfinnare', emoji: '⚙️', name: 'Uppfinnare', perk: '+1 ledtråd per dag', flavor: 'Klurar ut allt med smarta verktyg.' },
] as const;

/** 0 = förskoleklass. */
export const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const gradeName = (g: number) => (g === 0 ? 'Förskoleklass' : `Årskurs ${g}`);

export type AnimalId = (typeof ANIMALS)[number]['id'];
export type ColorId = (typeof COLORS)[number]['id'];
export type ClassId = (typeof CLASSES)[number]['id'];

export const animal = (id: string) => ANIMALS.find((a) => a.id === id) ?? ANIMALS[0];
export const color = (id: string) => COLORS.find((c) => c.id === id) ?? COLORS[0];
export const heroClass = (id: string) => CLASSES.find((c) => c.id === id) ?? CLASSES[0];
