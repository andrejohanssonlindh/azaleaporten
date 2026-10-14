import type { FlaggData } from '../../engines/karta/Flagga';

// Flaggorna i Flaggmasten, efter landets id. Förenklade (vapensköldar blir en enkel cirkel eller utelämnas),
// men färger, ränder, kors och stjärnor stämmer. Bara länder vars flagga går att rita enkelt är med.
// Behöver en vuxens koll mot riktiga flaggor.

const v = (...f: string[]): FlaggData => ({ bas: { v: f } });
const h = (f: string[], w?: number[]): FlaggData => ({ bas: { h: f, w } });
const kors = (bg: string, k: string, inre?: string): FlaggData => ({ bas: { kors: k, bg, inre } });

export const FLAGGOR: Record<string, FlaggData> = {
  sverige: kors('#006AA7', '#FECC00'),
  norge: kors('#BA0C2F', '#ffffff', '#00205B'),
  danmark: kors('#C8102E', '#ffffff'),
  finland: kors('#ffffff', '#002F6C'),
  island: kors('#02529C', '#ffffff', '#DC1E35'),

  frankrike: v('#0055A4', '#ffffff', '#EF4135'),
  italien: v('#009246', '#ffffff', '#CE2B37'),
  irland: v('#169B62', '#ffffff', '#FF883E'),
  belgien: v('#000000', '#FDDA24', '#EF3340'),
  rumanien: v('#002B7F', '#FCD116', '#CE1126'),
  tchad: v('#002664', '#FECB00', '#C60C30'),
  elfenbenskusten: v('#F77F00', '#ffffff', '#009E60'),
  mali: v('#14B53A', '#FCD116', '#CE1126'),
  guinea: v('#CE1126', '#FCD116', '#009460'),
  nigeria: v('#008751', '#ffffff', '#008751'),
  peru: v('#D91023', '#ffffff', '#D91023'),
  mexiko: { bas: { v: ['#006847', '#ffffff', '#CE1126'] }, extra: [{ cirkel: '#8C5A2B', r: 2.6 }] },

  tyskland: h(['#000000', '#DD0000', '#FFCE00']),
  nederlanderna: h(['#AE1C28', '#ffffff', '#21468B']),
  luxemburg: h(['#EF3340', '#ffffff', '#00A3E0']),
  ryssland: h(['#ffffff', '#0039A6', '#D52B1E']),
  osterrike: h(['#C8102E', '#ffffff', '#C8102E']),
  lettland: h(['#9E3039', '#ffffff', '#9E3039'], [2, 1, 2]),
  ungern: h(['#CE2939', '#ffffff', '#477050']),
  bulgarien: h(['#ffffff', '#00966E', '#D62612']),
  estland: h(['#0072CE', '#000000', '#ffffff']),
  litauen: h(['#FDB913', '#006A44', '#C1272D']),
  polen: h(['#ffffff', '#DC143C']),
  indonesien: h(['#CE1126', '#ffffff']),
  monaco: h(['#CE1126', '#ffffff']),
  ukraina: h(['#0057B7', '#FFD700']),
  spanien: h(['#AA151B', '#F1BF00', '#AA151B'], [1, 2, 1]),
  colombia: h(['#FCD116', '#003893', '#CE1126'], [2, 1, 1]),
  gabon: h(['#009E60', '#FCD116', '#3A75C4']),
  sierraleone: h(['#1EB53A', '#ffffff', '#0072C6']),
  jemen: h(['#CE1126', '#ffffff', '#000000']),
  egypten: { bas: { h: ['#CE1126', '#ffffff', '#000000'] }, extra: [{ cirkel: '#C09300', r: 2.4 }] },
  thailand: h(['#A51931', '#F4F5F8', '#2D2A4A', '#F4F5F8', '#A51931'], [1, 1, 2, 1, 1]),
  ghana: { bas: { h: ['#CE1126', '#FCD116', '#006B3F'] }, extra: [{ stjarna: '#000000', r: 3.3 }] },
  indien: { bas: { h: ['#FF9933', '#ffffff', '#138808'] }, extra: [{ cirkel: '#000080', r: 2.6, ring: true }] },
  argentina: { bas: { h: ['#74ACDF', '#ffffff', '#74ACDF'] }, extra: [{ cirkel: '#F6B40E', r: 2.2 }] },
  tjeckien: { bas: { h: ['#ffffff', '#D7141A'] }, extra: [{ tri: '#11457E', w: 15 }] },
  chile: { bas: { h: ['#ffffff', '#D52B1E'] }, extra: [{ kanton: '#0039A6', w: 10, h: 10 }, { stjarna: '#ffffff', x: 5, y: 5, r: 2.6 }] },

  japan: { bas: { fyll: '#ffffff' }, extra: [{ cirkel: '#BC002D', r: 6 }] },
  bangladesh: { bas: { fyll: '#006A4E' }, extra: [{ cirkel: '#F42A41', x: 13.5, r: 6 }] },
  schweiz: { bas: { fyll: '#DA291C' }, extra: [{ plus: '#ffffff' }] },
  vietnam: { bas: { fyll: '#DA251D' }, extra: [{ stjarna: '#FFFF00', r: 6 }] },
  somalia: { bas: { fyll: '#4189DD' }, extra: [{ stjarna: '#ffffff', r: 5.5 }] },
  marocko: { bas: { fyll: '#C1272D' }, extra: [{ stjarna: '#006233', r: 5 }] },
  kina: { bas: { fyll: '#DE2910' }, extra: [
    { stjarna: '#FFDE00', x: 5, y: 5, r: 3 }, { stjarna: '#FFDE00', x: 10, y: 2, r: 1 }, { stjarna: '#FFDE00', x: 12, y: 4, r: 1 },
    { stjarna: '#FFDE00', x: 12, y: 7, r: 1 }, { stjarna: '#FFDE00', x: 10, y: 9, r: 1 },
  ] },
  turkiet: { bas: { fyll: '#E30A17' }, extra: [{ mane: '#ffffff', bg: '#E30A17' }] },
  brasilien: { bas: { fyll: '#009C3B' }, extra: [{ romb: '#FFDF00' }, { cirkel: '#002776', r: 4.2 }] },
  storbritannien: { bas: { fyll: '#012169' }, extra: [{ uk: true }] },
  usa: { bas: { fyll: '#ffffff' }, extra: [{ usa: true }] },
};

/** Flaggor som är lätta att blanda ihop (Randiga Rita). */
export const LIKNANDE_FLAGGOR: string[][] = [
  ['sverige', 'norge', 'danmark', 'finland', 'island'],
  ['indonesien', 'monaco', 'polen'],
  ['tchad', 'rumanien'],
  ['irland', 'italien', 'elfenbenskusten', 'mexiko'],
  ['nederlanderna', 'luxemburg', 'ryssland', 'frankrike'],
  ['jemen', 'egypten'],
  ['japan', 'bangladesh'],
  ['tyskland', 'belgien'],
  ['osterrike', 'lettland'],
  ['ungern', 'italien', 'bulgarien'],
  ['mali', 'guinea'],
  ['vietnam', 'kina'],
];

/** Flaggor som liknar landets flagga. */
export const liknarFlagga = (id: string) => [...new Set(LIKNANDE_FLAGGOR.filter((g) => g.includes(id)).flat())].filter((x) => x !== id);
