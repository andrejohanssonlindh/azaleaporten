import type { Lesson } from '../../../platform/rpg/types';
import { Tavla, Text } from '../../../engines/lektion/bilder';
import { Fig, Poly, RightMarks, SideLabels, type Pt } from '../draw';

// Oxies klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

/** En linjal 0–10 cm med en penna från s till e (cm). */
function Linjal({ s, e }: { s: number; e: number }) {
  const k = 30, x0 = 14;
  return (
    <Fig w={10 * k + 28} h={96} label={`Linjal, pennan från ${s} till ${e}`}>
      <rect x={x0 - 10} y={44} width={10 * k + 20} height={44} rx={4} class="geo-ruler" />
      {Array.from({ length: 101 }, (_, i) => {
        const x = x0 + (i / 10) * k, big = i % 10 === 0, mid = i % 5 === 0;
        return <line key={i} x1={x} x2={x} y1={44} y2={44 + (big ? 16 : mid ? 11 : 6)} class="geo-tick" />;
      })}
      {Array.from({ length: 11 }, (_, i) => <text key={i} x={x0 + i * k} y={78} text-anchor="middle" class="geo-tiny">{i}</text>)}
      <rect x={x0 + s * k} y={22} width={(e - s) * k} height={14} rx={5} class="geo-thing" />
      <line x1={x0 + s * k} x2={x0 + s * k} y1={20} y2={60} class="geo-guide" />
      <line x1={x0 + e * k} x2={x0 + e * k} y1={20} y2={60} class="geo-guide" />
    </Fig>
  );
}

const Figur = ({ pts, labels, right = [], w = 220, h = 140 }: { pts: Pt[]; labels: (string | null)[]; right?: number[]; w?: number; h?: number }) => (
  <Fig w={w} h={h} label="Figur med mått"><Poly pts={pts} /><RightMarks pts={pts} at={right} /><SideLabels pts={pts} labels={labels} off={14} /></Fig>
);
const REKT: Pt[] = [[30, 30], [190, 30], [190, 105], [30, 105]];
const L: Pt[] = [[30, 20], [100, 20], [100, 70], [190, 70], [190, 120], [30, 120]];

export const LEKTIONER: Record<string, Lesson> = {
  linjalen: { pages: [
    {
      title: 'Börja på noll',
      text: 'Lägg linjalens nolla precis vid sakens ena ände. Då kan du läsa av längden där saken slutar.\n\nSiffrorna är centimeter. De små strecken emellan är millimeter: tio millimeter är en centimeter.',
      pic: <><Linjal s={0} e={6} /><Text>Pennan är 6 cm lång.</Text></>,
    },
    {
      title: 'När saken inte börjar på noll',
      text: 'Mätmasken läser bara av där saken slutar. Men här börjar pennan på 2!',
      pic: <Linjal s={2} e={7} />,
      steps: ['Pennan slutar vid 7.', 'Den börjar vid 2.', 'Längden är steget emellan: 7 − 2 = 5 cm.'],
      tips: 'Räkna stegen mellan siffrorna, inte strecken. Från 2 till 7 är det 5 steg.',
    },
    {
      title: 'Halva och millimeter',
      text: 'Det längre strecket mitt emellan två siffror är en halv centimeter, 5 millimeter.\n\nVill du svara i millimeter: varje centimeter är 10 mm. 4 cm och 3 små streck är 43 mm.',
      pic: <Linjal s={1} e={4.3} />,
      steps: ['Från 1 till 4 är 3 cm = 30 mm.', 'Sedan 3 små streck till: 3 mm.', '30 + 3 = 33 mm.'],
      prova: { mode: 'linjal', level: 1 },
    },
  ] },

  enheter: { pages: [
    {
      title: 'Trappan med enheter',
      text: 'Längdenheterna är som en trappa. Varje steg ner är tio gånger fler:',
      pic: <Tavla rader={['1 m  = 10 dm', '1 dm = 10 cm', '1 cm = 10 mm', ['1 m  = 100 cm = 1000 mm', 'hi'], ['1 km = 1000 m', 'hi']]} />,
    },
    {
      title: 'Till en mindre enhet: gånger',
      text: 'En mindre enhet betyder fler bitar. 3 m i centimeter: varje meter är 100 cm.',
      steps: ['1 m = 100 cm.', '3 m = 3 · 100 cm.', '3 m = 300 cm.'],
    },
    {
      title: 'Till en större enhet: delat',
      text: 'En större enhet betyder färre bitar. 70 mm i centimeter: 10 mm blir en cm.',
      steps: ['10 mm = 1 cm.', '70 / 10 = 7.', '70 mm = 7 cm.'],
      tips: 'Fråga dig: blir det fler eller färre? Mindre enhet → fler (gånger). Större enhet → färre (delat).',
      prova: { mode: 'enheter', level: 1 },
    },
  ] },

  omkrets: { pages: [
    {
      title: 'Gå runt hela figuren',
      text: 'Omkretsen är hur långt det är runt hela figuren – som om en myra går längs kanten tills den är tillbaka där den började.\n\nLägg ihop alla sidor.',
      pic: <Figur pts={[[40, 110], [110, 20], [180, 110]]} labels={['6 m', '6 m', '7 m']} w={220} h={130} />,
      steps: ['6 + 6 = 12.', '12 + 7 = 19.', 'Omkretsen är 19 m.'],
      tips: 'Omkrets är inte area! Arean är ytan inuti. Omkretsen är bara kanten.',
    },
    {
      title: 'Mått som inte står utskrivna',
      text: 'Kantkrabban räknar bara sidorna som har ett mått. Men en rektangel har fyra sidor! Sidan mitt emot är lika lång.',
      pic: <Figur pts={REKT} labels={['8 m', '5 m', null, null]} right={[0, 1, 2, 3]} />,
      steps: ['Två långa sidor: 8 + 8 = 16.', 'Två korta sidor: 5 + 5 = 10.', '16 + 10 = 26 m.'],
      prova: { mode: 'omkrets', level: 1 },
    },
    {
      title: 'L-formen',
      text: 'I en L-form saknas några mått. Men tänk efter: hela den nedre kanten är lika lång som de två övre kanterna tillsammans. Och den vänstra kanten är lika lång som de två högra tillsammans.\n\nEtt knep: L-formens omkrets är lika stor som omkretsen på rektangeln runt den!',
      pic: <Figur pts={L} labels={['3 m', '2 m', '4 m', '2 m', '7 m', '4 m']} right={[0, 1, 2, 3, 4, 5]} />,
      steps: ['Lägg ihop alla sex sidor: 3 + 2 + 4 + 2 + 7 + 4 = 22.', 'Kolla med rektangeln runt om: 7 + 4 + 7 + 4 = 22.', 'Omkretsen är 22 m.'],
      prova: { mode: 'omkrets', level: 3 },
    },
  ] },

  'sidan-som-fattas': { pages: [
    {
      title: 'Räkna baklänges',
      text: 'Omkretsen är 30 cm. Tre sidor är 8, 7 och 9 cm. Hur lång är den sista sidan?',
      steps: ['Lägg ihop de sidor du vet: 8 + 7 + 9 = 24.', 'Resten fattas: 30 − 24 = 6.', 'Den sista sidan är 6 cm.'],
    },
    {
      title: 'Rektanglar och kvadrater',
      text: 'En kvadrat har fyra lika långa sidor. Är omkretsen 36 cm, är varje sida 36 / 4 = 9 cm.\n\nEn rektangel med omkretsen 30 cm och en sida på 10 cm: en lång och en kort sida är halva omkretsen, 15 cm. Den korta sidan är 15 − 10 = 5 cm.',
      tips: 'Dela inte med fyra om det inte är en kvadrat!',
      prova: { mode: 'saknad', level: 1 },
    },
  ] },
};
