import type { Lesson } from '../../platform/rpg/types';
import { Rad, Stor, Tallrikar, Tavla, Text } from '../../engines/lektion/bilder';
import { Bar, Pie } from './index';

// Bråkbageriets klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

export const LEKTIONER: Record<string, Lesson> = {
  'vad-ar-ett-brak': { pages: [
    {
      title: 'Vad betyder 3/4?',
      text: 'Ett bråk har två tal. Talet under strecket heter nämnare. Det säger hur många lika stora bitar det hela är delat i.\n\nTalet över strecket heter täljare. Det säger hur många av bitarna vi har.',
      pic: <><Pie f={{ n: 3, d: 4 }} /><Text>Delad i 4 bitar, och 3 är färgade: 3/4</Text></>,
      tips: 'Nämnaren står nere – som ett "namn" på bitarna: fjärdedelar, femtedelar, åttondelar.',
    },
    {
      title: 'Räkna bitarna',
      text: 'Så här tar du reda på bråket:',
      pic: <Bar f={{ n: 2, d: 5 }} width={250} />,
      steps: ['Räkna ALLA bitar: 5. Det är nämnaren.', 'Räkna de FÄRGADE bitarna: 2. Det är täljaren.', 'Bråket är 2/5 – två femtedelar.'],
      tips: 'Räkna inte bara de tomma bitarna, och glöm inte att nämnaren är alla bitar.',
      prova: { mode: 'namnge', level: 1 },
    },
  ] },

  'jamfor-brak': { pages: [
    {
      title: 'Samma sorts bitar',
      text: 'När nämnaren är samma är bitarna lika stora. Då är det bara att räkna: 3/8 är mer än 2/8, för 3 bitar är fler än 2.',
      pic: <Rad><Pie f={{ n: 3, d: 8 }} size={100} /><Stor>&gt;</Stor><Pie f={{ n: 2, d: 8 }} size={100} /></Rad>,
    },
    {
      title: 'Fler bitar = mindre bitar',
      text: 'Glufsgrisen tror att 1/8 är större än 1/4, för 8 är större än 4. Men tänk på en paj! Delar du den i 8 bitar blir varje bit mindre än om du delar den i 4.',
      pic: <Rad><Pie f={{ n: 1, d: 4 }} size={100} /><Stor>&gt;</Stor><Pie f={{ n: 1, d: 8 }} size={100} /></Rad>,
      tips: 'Ju större nämnare, desto mindre bitar. Fråga dig: vill jag dela kalaspajen med 4 eller med 8 kompisar?',
    },
    {
      title: 'Mer eller mindre än en halv?',
      text: 'En halv är hälften av bitarna. 4/8 är precis en halv, för 4 är hälften av 8. Då är 5/8 mer än en halv och 3/8 mindre.',
      prova: { mode: 'jamfor', level: 1 },
    },
  ] },

  'del-av': { pages: [
    {
      title: 'En fjärdedel av 12',
      text: '1/4 av 12 bullar betyder: dela bullarna i 4 lika stora högar. Hur många är det i en hög?',
      pic: <><Tallrikar tallrikar={4} per={3} sak="🥯" /><Text>12 bullar i 4 högar</Text></>,
      steps: ['Dela 12 i 4 högar: 12 / 4 = 3.', 'En hög är en fjärdedel.', '1/4 av 12 = 3.'],
    },
    {
      title: 'Tre fjärdedelar av 12',
      text: 'Om du ska ha 3/4 tar du tre av högarna. Först delar du (nämnaren), sedan tar du så många högar som täljaren säger.',
      steps: ['12 / 4 = 3 i varje hög.', 'Tre högar: 3 · 3 = 9.', '3/4 av 12 = 9.'],
      tips: 'Dela med nämnaren, gånger med täljaren. Glöm inte täljaren – en hög räcker inte när det står 3!',
      prova: { mode: 'delav', level: 2 },
    },
  ] },

  'lika-stora': { pages: [
    {
      title: 'Samma mängd, olika bitar',
      text: '1/2 och 2/4 är lika mycket kaka. Den ena är bara delad i fler bitar.',
      pic: <><Bar f={{ n: 1, d: 2 }} width={240} /><Bar f={{ n: 2, d: 4 }} width={240} /><Bar f={{ n: 4, d: 8 }} width={240} /><Text>1/2 = 2/4 = 4/8</Text></>,
    },
    {
      title: 'Förläng och förkorta',
      text: 'Gångra täljaren och nämnaren med samma tal, så får du ett lika stort bråk. Det kallas att förlänga.\n\nDela båda med samma tal kallas att förkorta.',
      pic: <Tavla rader={['1/4: gånger 3 uppe och nere', ['1/4 = 3/12', 'hi'], '6/8: dela med 2 uppe och nere', ['6/8 = 3/4', 'hi']]} />,
      tips: 'Det du gör med nämnaren måste du göra med täljaren också.',
      prova: { mode: 'lika', level: 1 },
    },
  ] },

  'plus-med-brak': { pages: [
    {
      title: 'Lägg ihop bitarna',
      text: '2/8 + 3/8: två åttondelar och tre åttondelar. Det blir fem åttondelar, 5/8.\n\nNämnaren visar bara hur stora bitarna är. Den ändras inte när du lägger ihop!',
      pic: <><Bar f={{ n: 2, d: 8 }} width={240} /><Bar f={{ n: 3, d: 8 }} width={240} /><Bar f={{ n: 5, d: 8 }} width={240} /></>,
    },
    {
      title: 'Tårtmusens fel',
      text: 'Tårtmusen lägger ihop nämnarna också: 2/8 + 3/8 = 5/16. Men då blir bitarna mindre, fast du har fått mer tårta! Det kan inte stämma.',
      pic: <Tavla rader={[['2/8 + 3/8 ≠ 5/16', 'dim'], ['2/8 + 3/8 = 5/8', 'hi'], '7/8 − 3/8 = 4/8']} />,
      tips: 'Säg nämnaren som ett ord: "två åttondelar plus tre åttondelar är fem åttondelar".',
      prova: { mode: 'addera', level: 1 },
    },
  ] },
};
