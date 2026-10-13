import type { Lesson } from '../../platform/rpg/types';
import { Rad, Tallinje, Tavla, Text } from '../../engines/lektion/bilder';
import { Piece } from './index';

// Myntmarknadens klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

const Pengar = ({ v }: { v: number[] }) => <Rad>{v.map((x, i) => <Piece key={i} v={x} />)}</Rad>;

export const LEKTIONER: Record<string, Lesson> = {
  'rakna-pengar': { pages: [
    {
      title: 'Värdet, inte antalet',
      text: 'Myntskatan räknar mynten: "ett, två, tre – tre kronor!" Men varje mynt är värt det som står på det.\n\nHär är tre mynt. De är inte värda 3 kronor.',
      pic: <><Pengar v={[10, 5, 2]} /><Text>10 + 5 + 2 = 17 kronor</Text></>,
    },
    {
      title: 'Börja med det största',
      text: 'Lägg pengarna i ordning, största först. Räkna sedan uppåt från det största.',
      pic: <Pengar v={[20, 10, 5, 2, 1]} />,
      steps: ['Tjugolappen: 20.', 'Plus tiokronan: 30.', 'Plus femkronan: 35.', 'Plus tvåkronan: 37.', 'Plus enkronan: 38 kronor.'],
      tips: 'Peka på varje mynt när du räknar det, så räknar du inget två gånger och missar inget.',
    },
    {
      title: 'Samla ihop lika',
      text: 'Är det många av samma sort? Räkna dem i steg. Tre femtiolappar: 50, 100, 150.\n\nTvå hundralappar och en femtiolapp: 100, 200, 250.',
      pic: <Pengar v={[100, 100, 50]} />,
      prova: { mode: 'rakna', level: 1 },
    },
  ] },

  'lagg-ihop-priser': { pages: [
    {
      title: 'Vad kostar det tillsammans?',
      text: 'Köper du två saker lägger du ihop priserna. En kringla för 24 kr och en saft för 13 kr:',
      pic: <Tavla rader={['  24 kr', '+ 13 kr', ['  37 kr', 'line']]} />,
      steps: ['Tiotalen: 20 + 10 = 30.', 'Entalen: 4 + 3 = 7.', '30 + 7 = 37 kr.'],
    },
    {
      title: 'Avrunda för att kolla',
      text: 'Ett bra knep för att se om svaret är rimligt: avrunda först. 38 kr + 47 kr är ungefär 40 + 50 = 90 kr. Svaret ska alltså vara nära 90.',
      steps: ['Tiotalen: 30 + 40 = 70.', 'Entalen: 8 + 7 = 15.', '70 + 15 = 85 kr.', 'Nära 90 – rimligt!'],
      tips: 'Tre saker? Lägg ihop två först, och sedan den tredje.',
      prova: { mode: 'pris', level: 1 },
    },
  ] },

  vaxel: { pages: [
    {
      title: 'Växel: räkna uppåt',
      text: 'Du köper en glass för 37 kr och betalar med en femtiolapp. Hur mycket får du tillbaka?\n\nKnepet: räkna uppåt från priset till det du betalade, precis som en kassör gör.',
      pic: <Tallinje fran={35} till={50} hopp={[{ fran: 37, till: 40, text: '+3' }, { fran: 40, till: 50, text: '+10', b: true }]} mark={[37, 50]} />,
      steps: ['Från 37 upp till 40: 3 kr.', 'Från 40 upp till 50: 10 kr.', '3 + 10 = 13 kr tillbaka.'],
    },
    {
      title: 'Akta dig för vändningen',
      text: 'Tvättbjörnen Tvärtom räknar 50 − 37 så här: "7 − 0 = 7, och 5 − 3 = 2. 27!" Han vänder på entalen. Det blir fel!\n\nRäkna uppåt i stället, så slipper du låna.',
      pic: <Tavla rader={[['50 − 37 ≠ 27', 'dim'], '37 → 40 → 50', ['3 + 10 = 13', 'hi']]} />,
      tips: 'Kolla svaret: priset + växeln ska bli det du betalade. 37 + 13 = 50.',
      prova: { mode: 'vaxel', level: 1 },
    },
    {
      title: 'Stora sedlar',
      text: 'Samma knep fungerar med hundralappen: köper du för 64 kr och betalar 100 kr, räknar du 64 → 70 (6 kr) → 100 (30 kr). 6 + 30 = 36 kr tillbaka.',
      prova: { mode: 'vaxel', level: 2 },
    },
  ] },

  styckpris: { pages: [
    {
      title: 'Många av samma',
      text: 'En muffin kostar 15 kr. Vad kostar fyra muffins? Det är fyra femtonkronor: 4 · 15.',
      pic: <Tavla rader={['15 + 15 + 15 + 15', ['4 · 15 = ?', 'hi']]} />,
      steps: ['Dela upp 15 i 10 och 5.', '4 · 10 = 40.', '4 · 5 = 20.', '40 + 20 = 60 kr.'],
      tips: 'Två stycken? Då är det dubbla priset.',
      prova: { mode: 'pris', level: 3 },
    },
  ] },
};
