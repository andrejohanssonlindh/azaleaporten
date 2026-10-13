import type { Lesson } from '../../../platform/rpg/types';
import { Rad, Text } from '../../../engines/lektion/bilder';
import { Cells, Fig, Poly, RightMarks, SideLabels, Txt, type Pt } from '../draw';

// Bryggeriets klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

const S = 32;
const Rutor = ({ cells, label }: { cells: number[][]; label: string }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
    <Fig w={cells[0].length * S + 4} h={cells.length * S + 4} label={label}><Cells cells={cells} x={2} y={2} size={S} /></Fig>
    <Text>{label}</Text>
  </span>
);
const full = (r: number, k: number) => Array.from({ length: r }, () => Array(k).fill(1));

const REKT: Pt[] = [[20, 20], [200, 20], [200, 110], [20, 110]];
const TRI: Pt[] = [[20, 110], [200, 110], [20, 20]];

export const LEKTIONER: Record<string, Lesson> = {
  'vad-ar-area': { pages: [
    {
      title: 'Area är hur mycket yta',
      text: 'Arean är hur stor ytan inuti en figur är. Man mäter den i rutor: hur många rutor täcker golvet?\n\nOmkretsen är bara kanten runt. Kantkrypet går runt kanten och räknar den – men arean är allt inuti!',
      pic: <Rutor cells={[[1, 1, 1, 0], [1, 1, 1, 0], [1, 1, 0, 0]]} label="8 rutor: arean är 8" />,
    },
    {
      title: 'Rader gånger kolumner',
      text: 'Är ytan en rektangel behöver du inte räkna varje ruta. Räkna rutorna i en rad, och hur många rader det är. Sedan gånger!',
      pic: <Rutor cells={full(3, 5)} label="3 rader med 5 rutor" />,
      steps: ['En rad har 5 rutor.', 'Det är 3 rader.', '3 · 5 = 15 rutor.'],
      tips: 'Plussa inte sidorna! 3 + 5 = 8 är inte arean.',
      prova: { mode: 'rektangel', level: 0 },
    },
  ] },

  'rektangelns-area': { pages: [
    {
      title: 'Utan rutor',
      text: 'När det inte finns några rutor ritade gör du likadant med måtten: längd gånger bredd.\n\nEn rektangel som är 8 m lång och 5 m bred har arean 8 · 5 = 40 m² (kvadratmeter).',
      pic: <Fig w={220} h={130} label="Rektangel 8 m gånger 5 m"><Poly pts={REKT} /><RightMarks pts={REKT} at={[0, 1, 2, 3]} /><SideLabels pts={REKT} labels={['8 m', '5 m', null, null]} off={12} /></Fig>,
      tips: 'm² betyder rutor som är 1 m åt varje håll.',
    },
    {
      title: 'Sidan som fattas',
      text: 'Arean är 24 m² och ena sidan är 6 m. Hur lång är den andra? Tänk: 6 · ? = 24.',
      steps: ['6 gånger vad blir 24?', '24 / 6 = 4.', 'Den andra sidan är 4 m.', 'Kolla: 6 · 4 = 24.'],
      tips: 'Ta inte minus: 24 − 6 är inte svaret. Det är delat som gäller.',
      prova: { mode: 'saknad', level: 1 },
    },
  ] },

  'halva-rutor': { pages: [
    {
      title: 'Två halva blir en hel',
      text: 'Ibland är rutorna delade på snedden. Två halva rutor blir tillsammans en hel ruta.',
      pic: <Rutor cells={[[1, 1, 3], [1, 1, 1], [1, 2, 0]]} label="6 hela + 2 halva = 7 rutor" />,
      steps: ['Räkna de hela rutorna: 6.', 'Räkna de halva: 2. Två halva = en hel.', '6 + 1 = 7 rutor.'],
      tips: 'Räkna inte en halv ruta som en hel – och glöm dem inte heller!',
      prova: { mode: 'rutor', level: 2 },
    },
  ] },

  'triangelns-area': { pages: [
    {
      title: 'En triangel är en halv rektangel',
      text: 'Rita en rektangel runt triangeln. Triangeln tar precis halva rektangeln!\n\nDärför: triangelns area = bas gånger höjd, delat med två.',
      pic: <Fig w={220} h={130} label="Triangel i en rektangel"><Poly pts={REKT} cls="geo-help" /><Poly pts={TRI} /><SideLabels pts={TRI} labels={['8 cm', null, '5 cm']} off={12} /><RightMarks pts={TRI} at={[0]} /></Fig>,
      steps: ['Rektangeln: 8 · 5 = 40 cm².', 'Triangeln är hälften: 40 / 2 = 20 cm².'],
      tips: 'Dubbeldraken glömmer att dela med två. Då får man hela rektangeln!',
    },
    {
      title: 'Höjden står rakt upp',
      text: 'Höjden är det raka avståndet från basen upp till toppen – inte den sneda sidan. Ofta ritas den som ett streckat streck.',
      pic: <Fig w={220} h={130} label="Triangel med höjd"><Poly pts={[[20, 110], [200, 110], [130, 20]]} /><line x1={130} y1={20} x2={130} y2={110} class="geo-height" /><Txt at={[110, 124]}>bas 10 cm</Txt><Txt at={[150, 70]}>6 cm</Txt><Txt at={[56, 54]}>7 cm</Txt></Fig>,
      steps: ['Basen är 10 cm.', 'Höjden är 6 cm (det streckade).', 'Den sneda sidan, 7 cm, behövs inte!', '10 · 6 / 2 = 30 cm².'],
      prova: { mode: 'triangel', level: 2 },
    },
  ] },

  sammansatt: { pages: [
    {
      title: 'Dela upp i rektanglar',
      text: 'En L-formad yta kan delas upp i två rektanglar. Räkna arean av var och en, och lägg ihop.',
      pic: <Rad><Rutor cells={[[1, 1, 0, 0], [1, 1, 0, 0], [1, 1, 1, 1]]} label="L-form" /></Rad>,
      steps: ['Den höga delen till vänster: 2 · 3 = 6.', 'Biten till höger längst ner: 2 · 1 = 2.', '6 + 2 = 8 rutor.'],
      tips: 'Du kan också räkna den stora rektangeln runt om och ta bort biten som fattas: 4 · 3 − 2 · 2 = 8. Räkna inte någon bit två gånger!',
      prova: { mode: 'sammansatt', level: 3 },
    },
  ] },
};
