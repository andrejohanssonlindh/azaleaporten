import type { Lesson } from '../../platform/rpg/types';
import { Basblock, Rad, Stor, Tallinje, Tavla, Text, Tiorutor } from '../../engines/lektion/bilder';

// Tiokompisbrons klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

export const LEKTIONER: Record<string, Lesson> = {
  tiokompisar: { pages: [
    {
      title: 'Tiokompisar',
      text: 'Två tal som blir 10 tillsammans kallas tiokompisar. 7 och 3 är tiokompisar: 7 + 3 = 10.\n\nTitta i tiorutan: 7 blå prickar, och då är det 3 tomma rutor kvar.',
      pic: <><Tiorutor a={7} b={3} /><Text>7 blå + 3 rosa = 10</Text></>,
    },
    {
      title: 'Alla tiokompisar',
      text: 'Det finns bara fem par att lära sig. Kan du dem utantill går allt annat på bron mycket lättare!',
      pic: <Tavla rader={['1 + 9', '2 + 8', '3 + 7', '4 + 6', '5 + 5']} />,
      tips: 'Visa med fingrarna: 6 fingrar uppe – hur många är nere? 4. Då är 6 och 4 tiokompisar.',
    },
    {
      title: 'Plus och minus upp till 20',
      text: '13 + 4: tian står still, och bara entalen räknas. 3 + 4 = 7, så 13 + 4 = 17.\n\n18 − 5: samma sak baklänges. 8 − 5 = 3, så 18 − 5 = 13.',
      pic: <Tavla rader={['3 + 4 = 7', ['13 + 4 = 17', 'hi'], '8 − 5 = 3', ['18 − 5 = 13', 'hi']]} />,
      prova: { mode: 'par', level: 0 },
    },
  ] },

  'over-tian': { pages: [
    {
      title: 'Fyll upp tian först',
      text: '8 + 5 går över tian. Knepet: fyll först upp till 10 med en tiokompis, och lägg sedan till resten.',
      pic: <><Tiorutor a={8} b={5} /><Text>8 blå. Två rosa fyller tian, tre hamnar i nästa.</Text></>,
      steps: ['8 behöver 2 för att bli 10 (tiokompisar!).', 'Dela upp 5 i 2 och 3.', '8 + 2 = 10.', '10 + 3 = 13.', '8 + 5 = 13.'],
    },
    {
      title: 'Samma sak på tallinjen',
      text: 'Hoppa först till tian, och sedan resten av vägen.',
      pic: <Tallinje fran={5} till={15} hopp={[{ fran: 8, till: 10, text: '+2' }, { fran: 10, till: 13, text: '+3', b: true }]} mark={[13]} />,
      tips: 'Tiotapparen tappar tian: 8 + 5 blir inte 3. När entalen går över 10 blir det en ny tia!',
      prova: { mode: 'plus', level: 1 },
    },
  ] },

  'minus-over-tian': { pages: [
    {
      title: 'Ta dig ner till tian först',
      text: '13 − 5 går under tian. Ta först bort så att du landar på 10, och sedan resten.',
      pic: <Tallinje fran={5} till={15} hopp={[{ fran: 13, till: 10, text: '−3' }, { fran: 10, till: 8, text: '−2', b: true }]} mark={[8]} />,
      steps: ['Från 13 ner till 10 är det 3.', 'Dela upp 5 i 3 och 2.', '13 − 3 = 10.', '10 − 2 = 8.', '13 − 5 = 8.'],
    },
    {
      title: 'Eller räkna uppåt',
      text: 'Minus är också avståndet mellan talen. Från 5 upp till 13: först 5 till 10 (5 steg), sedan 10 till 13 (3 steg). 5 + 3 = 8.',
      pic: <Tallinje fran={5} till={15} hopp={[{ fran: 5, till: 10, text: '5' }, { fran: 10, till: 13, text: '3', b: true }]} mark={[5, 13]} />,
      tips: 'Räkna uppåt när talen ligger nära varandra, som 13 − 9.',
      prova: { mode: 'minus', level: 1 },
    },
  ] },

  'vad-fattas': { pages: [
    {
      title: 'Talet som fattas',
      text: '7 + ? = 15 betyder: hur mycket behöver 7 för att bli 15?\n\nRäkna uppåt från 7 till 15. Använd tian som mellanstation.',
      pic: <Tallinje fran={5} till={15} hopp={[{ fran: 7, till: 10, text: '3' }, { fran: 10, till: 15, text: '5', b: true }]} mark={[7, 15]} />,
      steps: ['Från 7 till 10: 3 steg.', 'Från 10 till 15: 5 steg.', '3 + 5 = 8.', 'Kolla: 7 + 8 = 15. Det stämmer!'],
    },
    {
      title: 'När det fattas i minus',
      text: '? − 6 = 9 betyder: vad hade du från början, om 6 försvann och 9 blev kvar? Då måste du ha haft mer än 9. Lägg ihop: 9 + 6 = 15.\n\n14 − ? = 8 betyder: hur mycket togs bort? Räkna från 8 upp till 14: 6.',
      tips: 'Sätt alltid in ditt svar och kolla att det stämmer.',
      prova: { mode: 'saknas', level: 1 },
    },
  ] },

  hundrakompisar: { pages: [
    {
      title: 'Hundrakompisar',
      text: 'Hundrakompisar blir 100 tillsammans. Med hela tiotal är det precis som tiokompisar: 3 + 7 = 10, så 30 + 70 = 100.',
      pic: <Tavla rader={['3 + 7 = 10', ['30 + 70 = 100', 'hi'], '6 + 4 = 10', ['60 + 40 = 100', 'hi']]} />,
    },
    {
      title: 'Kluriga hundrakompisar',
      text: 'Vad är hundrakompis till 37? Entalen ska bli en tia, och tiotalen ska bli 9 tiotal (inte 10!), för entalens tia blir den tionde.',
      steps: ['Entalen: 7 behöver 3 för att bli 10.', 'Tiotalen: 30 behöver 60 för att bli 90.', '60 + 3 = 63.', 'Kolla: 37 + 63 = 100.'],
      tips: 'Vanligt fel: 37 + 73. Då blir det en tia för mycket!',
      prova: { mode: 'par', level: 2 },
    },
  ] },

  'stora-kliv': { pages: [
    {
      title: 'Över nästa tiotal',
      text: '47 + 6 fungerar precis som 7 + 6, men högre upp. Fyll upp till nästa hela tiotal (50) först.',
      pic: <Tallinje fran={40} till={60} hopp={[{ fran: 47, till: 50, text: '+3' }, { fran: 50, till: 53, text: '+3', b: true }]} mark={[53]} />,
      steps: ['47 behöver 3 för att bli 50.', 'Dela upp 6 i 3 och 3.', '47 + 3 = 50.', '50 + 3 = 53.'],
    },
    {
      title: 'Tillbaka förbi tiotalet',
      text: '52 − 7: ta dig ner till 50 först, och sedan resten.',
      pic: <Tallinje fran={40} till={60} hopp={[{ fran: 52, till: 50, text: '−2' }, { fran: 50, till: 45, text: '−5', b: true }]} mark={[45]} />,
      steps: ['52 − 2 = 50.', 'Det är 5 kvar att ta bort (7 = 2 + 5).', '50 − 5 = 45.'],
      tips: 'Tänk på din tiokompis: 7 + 6 = 13, alltså är 47 + 6 = 53. Bara tiotalen är större.',
      prova: { mode: 'plus', level: 2 },
    },
  ] },

  'tiotal-och-ental': { pages: [
    {
      title: 'Tiotal för sig, ental för sig',
      text: '34 + 28: dela upp båda talen i tiotal och ental. Räkna tiotalen för sig och entalen för sig, och lägg ihop allt på slutet.',
      pic: <Rad><Basblock tiotal={3} ental={4} /><Stor>+</Stor><Basblock tiotal={2} ental={8} /></Rad>,
      steps: ['Tiotalen: 30 + 20 = 50.', 'Entalen: 4 + 8 = 12.', '50 + 12 = 62.', '34 + 28 = 62.'],
    },
    {
      title: 'Glöm inte den nya tian',
      text: 'När entalen blir 10 eller mer har du fått en ny tia. Den ska läggas till tiotalen. Tiotapparen vill att du skriver 52 – han slänger bort tian!',
      pic: <Tavla rader={['  34', '+ 28', ['  62', 'line'], ['4 + 8 = 12: en ny tia', 'hi']]} />,
      prova: { mode: 'plus', level: 3 },
    },
  ] },

  'lana-en-tia': { pages: [
    {
      title: 'Låna en tia',
      text: '52 − 27: i entalen står det 2 − 7. Det går inte! Baklängesbävern vänder på det och tar 7 − 2 i stället. Det får man inte göra.\n\nI stället lånar man en tia. 52 är 4 tiotal och 12 ental.',
      pic: <Rad><Basblock tiotal={5} ental={2} /><Stor>→</Stor><Basblock tiotal={4} ental={12} /></Rad>,
      steps: ['Låna en tia: 52 = 40 + 12.', 'Entalen: 12 − 7 = 5.', 'Tiotalen: 40 − 20 = 20 (en tia är ju lånad).', '20 + 5 = 25.', '52 − 27 = 25.'],
    },
    {
      title: 'Eller hoppa på tallinjen',
      text: 'Ta bort tiotalen först, och sedan entalen i två hopp förbi ett helt tiotal.',
      pic: <Tallinje fran={20} till={55} steg={5} hopp={[{ fran: 52, till: 32, text: '−20' }, { fran: 32, till: 30, text: '−2', b: true }, { fran: 30, till: 25, text: '−5', b: true }]} mark={[25, 52]} />,
      steps: ['52 − 20 = 32.', '32 − 2 = 30.', '30 − 5 = 25.'],
      tips: 'Kolla med plus: 25 + 27 = 52. Stämmer det, är svaret rätt.',
      prova: { mode: 'minus', level: 3 },
    },
  ] },
};
