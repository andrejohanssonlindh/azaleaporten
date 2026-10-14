import type { Lesson } from '../../platform/rpg/types';
import { Rad, Text } from '../../engines/lektion/bilder';
import { ChartView, Tally } from '../../engines/diagram/ChartView';
import { GRONSAKER } from './data';
import { EXEMPEL } from './fagel';
import { chartOf } from './gen';
import { EXEMPEL_BILD, EXEMPEL_STAPEL } from './skord';

// Diagramdalens klassrum (Fågeltornet och Skördemarknaden). Lektionernas id:n är permanenta (se lessons i content.ts).

const MELLAN = chartOf(GRONSAKER, [0, 1, 3], [15, 30, 25], 'stapel', { min: 0, max: 40, steg: 10 });
const HALVA = chartOf(GRONSAKER, [0, 1, 3], [30, 20, 45], 'bild', { min: 0, max: 50, steg: 10 }, { bild: { per: 10 } });

export const FAGELTORNET: Record<string, Lesson> = {
  'streck-i-femgrupper': { pages: [
    {
      title: 'Ett streck för varje fågel',
      text: 'Fågelvakten ritar ett streck varje gång en fågel flyger förbi. Efter fyra streck dras det femte snett över de fyra. Då blir det ett knippe: en femgrupp.',
      pic: <><Rad><Tally n={3} /><Tally n={4} /><Tally n={5} /></Rad><Text>3 streck, 4 streck och en femgrupp (5 streck)</Text></>,
    },
    {
      title: 'Räkna i femmor',
      text: 'Strecktrollet räknar knippet som fyra – men det är fem streck! Räkna fem för varje knippe, och sedan ett i taget för strecken som är kvar.',
      pic: <Tally n={13} />,
      steps: ['Två knippen: 5, 10.', 'Tre streck till: 11, 12, 13.', 'Det är 13 streck.'],
      prova: { mode: 'streck', level: 1 },
    },
    {
      title: 'Rita själv',
      text: 'När du ritar: fyra streck, och sedan det femte snett över dem. Sedan börjar du på ett nytt knippe.',
      pic: <ChartView chart={EXEMPEL} />,
      tips: 'Räknar du saker på en bild? Peka på varje sak när du räknar den, så räknar du ingen två gånger.',
      prova: { mode: 'rita', level: 0 },
    },
  ] },

  tabellen: { pages: [
    {
      title: 'Samma sak med siffror',
      text: 'En tabell visar samma sak som strecken, men med siffror. Leta upp namnet till vänster. Talet står på samma rad.',
      pic: <ChartView chart={{ ...EXEMPEL, typ: 'tabell' }} />,
      prova: { mode: 'tabell', level: 0 },
    },
    {
      title: 'Flest och färst',
      text: 'Vilken fågel räknade Fågelvakten flest av? Leta upp det största talet. Färst är det minsta talet.',
      pic: <ChartView chart={{ ...EXEMPEL, typ: 'tabell' }} />,
      steps: ['Talen är 7, 12 och 3.', 'Störst är 12: svan.', 'Minst är 3: sparv.'],
    },
    {
      title: 'Hur många fler?',
      text: '"Hur många fler svanar än ankor?" Då räknar du skillnaden: det större talet minus det mindre.\n\n"Sammanlagt" betyder alla tillsammans. Då lägger du ihop.',
      steps: ['Svanar: 12. Ankor: 7.', '12 − 7 = 5. Det var 5 fler svanar.', 'Sammanlagt: 7 + 12 + 3 = 22 fåglar.'],
      tips: 'Akta dig: "hur många fler" betyder inte att man lägger ihop!',
      prova: { mode: 'jamfor', level: 1 },
    },
  ] },
};

export const SKORDEMARKNADEN: Record<string, Lesson> = {
  'las-ett-stapeldiagram': { pages: [
    {
      title: 'Skalan först',
      text: 'Titta först på axeln. Hur mycket ökar talen för varje streck? Här går skalan i femmor: 0, 5, 10, 15 …',
      pic: <ChartView chart={EXEMPEL_STAPEL} />,
      steps: ['Skalan går i femmor.', 'Stapeln för morot slutar vid strecket där det står 15.', 'Det såldes 15 kg morötter.'],
    },
    {
      title: 'Rutspindelns fälla',
      text: 'Rutspindeln räknar rutorna: "tre rutor – tre kilo!" Men här är varje ruta värd fem. Läs talet vid axeln i stället.',
      pic: <ChartView chart={EXEMPEL_STAPEL} />,
      tips: 'Följ toppen av stapeln rakt åt sidan med fingret, så hamnar du på rätt tal.',
      prova: { mode: 'stapel', level: 1 },
    },
    {
      title: 'Mellan två streck',
      text: 'Ibland slutar en stapel mitt emellan två streck. Då är värdet mitt emellan talen. Mellan 10 och 20 ligger 15. Mellan 4 och 6 ligger 5.',
      pic: <ChartView chart={MELLAN} />,
      steps: ['Morotsstapeln slutar mellan 10 och 20.', 'Mitt emellan 10 och 20 är 15.'],
      prova: { mode: 'stapel', level: 2 },
    },
    {
      title: 'Bygg ett stapeldiagram',
      text: 'När du bygger: ta en stapel i taget och gör den lika hög som talet i tabellen. Kolla talet vid axeln innan du går vidare till nästa.',
      prova: { mode: 'rita', level: 0 },
    },
  ] },

  bildnyckeln: { pages: [
    {
      title: 'Vad betyder en bild?',
      text: 'I ett bilddiagram står nyckeln under diagrammet. Här betyder varje bild 5 kg. Nyckelpigan Glömsk räknar bilderna – "tre morötter!" – men tre bilder är 15 kg.',
      pic: <ChartView chart={EXEMPEL_BILD} />,
      steps: ['Morot: 3 bilder.', 'Räkna i femmor: 5, 10, 15.', 'Det såldes 15 kg morötter.'],
      prova: { mode: 'bild', level: 1 },
    },
    {
      title: 'En halv bild',
      text: 'Ibland är den sista bilden bara halv. En halv bild är hälften så mycket som en hel. Om en bild är 10, är en halv bild 5.',
      pic: <ChartView chart={HALVA} />,
      steps: ['Pumpa: 4 hela bilder och en halv.', '4 · 10 = 40.', 'Den halva är 5. 40 + 5 = 45 kg.'],
      prova: { mode: 'bild', level: 2 },
    },
  ] },

  'jamfor-staplar': { pages: [
    {
      title: 'Hur mycket mer?',
      text: '"Hur många kilo mer pumpor än potatis såldes?" Läs av båda staplarna först. Sedan tar du det större minus det mindre.',
      pic: <ChartView chart={EXEMPEL_STAPEL} />,
      steps: ['Pumpa: 20 kg. Potatis: 5 kg.', '20 − 5 = 15.', 'Det såldes 15 kg mer pumpor.'],
      tips: 'Lägg inte ihop! Hur mycket mer är skillnaden.',
      prova: { mode: 'jamfor', level: 1 },
    },
    {
      title: 'Sammanlagt',
      text: 'Sammanlagt betyder allt tillsammans. Läs av varje stapel, en i taget, och lägg ihop.',
      pic: <ChartView chart={EXEMPEL_STAPEL} />,
      steps: ['Morot 15, potatis 5, pumpa 20.', '15 + 5 + 20 = 40 kg.'],
      prova: { mode: 'jamfor', level: 2 },
    },
  ] },
};
