import type { Lesson } from '../../platform/rpg/types';
import { Rad, Tallinje, Tavla, Text } from '../../engines/lektion/bilder';
import { ClockFace } from './ui/ClockFace';

// Tidstornets klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

const Klocka = ({ h, m, ring = false, size = 150, text }: { h: number; m: number; ring?: boolean; size?: number; text?: string }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
    <ClockFace h={h} m={m} ring={ring} size={size} />
    {text && <Text>{text}</Text>}
  </span>
);

export const LEKTIONER: Record<string, Lesson> = {
  visarna: { pages: [
    {
      title: 'Två visare',
      text: 'Klockan har två visare.\n\nDen korta, tjocka visaren är timvisaren. Den visar vilken timme det är.\n\nDen långa visaren är minutvisaren. Den går ett helt varv på en timme.',
      pic: <Klocka h={3} m={0} size={180} text="Kort visare på 3, lång visare på 12: klockan tre" />,
    },
    {
      title: 'Minutvisaren',
      text: 'När den långa visaren pekar rakt upp, på 12, är klockan hel. När den pekar rakt ner, på 6, har det gått en halvtimme.\n\nVarje siffra på klockan betyder 5 minuter för den långa visaren.',
      pic: <Klocka h={3} m={0} ring size={180} text="Minuterna runt tavlan: 00, 05, 10, 15 …" />,
      prova: { mode: 'choice', level: 0 },
    },
  ] },

  'hel-och-halv': { pages: [
    {
      title: 'Klockan är hel',
      text: 'När minutvisaren pekar på 12 säger man bara timmen: "klockan fyra". Med siffror skriver man 4.00.',
      pic: <Klocka h={4} m={0} text="Klockan fyra – 4.00" />,
    },
    {
      title: 'Halv betyder halvvägs TILL',
      text: 'När minutvisaren pekar på 6 har det gått en halvtimme. Då säger man halv – och timmen som kommer HÄRNÄST.\n\nKlockan halv fyra är halvvägs till fyra. Timvisaren står mitt emellan 3 och 4.',
      pic: <Rad><Klocka h={3} m={30} text="Halv fyra = 3.30" /></Rad>,
      steps: ['Minutvisaren på 6: det är halv.', 'Timvisaren är förbi 3 men inte framme vid 4.', 'Vi är på väg TILL fyra: halv fyra.', 'Med siffror: 3.30 – för det har gått 30 minuter sedan tre.'],
      tips: 'Halvsaurus skriver 4.30 för halv fyra. Kom ihåg: halv fyra kommer FÖRE fyra!',
      prova: { mode: 'words', level: 1 },
    },
  ] },

  kvart: { pages: [
    {
      title: 'En kvart är en fjärdedel',
      text: 'En kvart är en fjärdedel av ett varv: 15 minuter.\n\nKvart över fem: minutvisaren har gått en kvart förbi 12. Klockan är 5.15.\n\nKvart i sex: det är en kvart kvar tills klockan blir sex. Klockan är 5.45.',
      pic: <Rad><Klocka h={5} m={15} size={130} text="Kvart över fem" /><Klocka h={5} m={45} size={130} text="Kvart i sex" /></Rad>,
      tips: '"Över" = det har gått. "I" = det är kvar till nästa timme.',
      prova: { mode: 'choice', level: 2 },
    },
  ] },

  'over-och-i': { pages: [
    {
      title: 'Två halvor av klockan',
      text: 'Dela klockan i två halvor med ett streck från 12 till 6.\n\nPå högra halvan säger man ÖVER: tio över två, tjugo över två. Det har gått så många minuter sedan klockan var två.\n\nPå vänstra halvan säger man I: tjugo i tre, fem i tre. Så många minuter är det kvar tills klockan blir tre.',
      pic: <Rad><Klocka h={2} m={20} size={130} ring text="Tjugo över två" /><Klocka h={2} m={40} size={130} ring text="Tjugo i tre" /></Rad>,
    },
    {
      title: 'Räkna minuterna',
      text: 'Klockan visar 7.50. Är det över eller i?',
      pic: <Klocka h={7} m={50} ring size={150} />,
      steps: ['Minutvisaren är på vänstra halvan: det heter "i".', 'Hur långt är det kvar till 12? Från 10 till 12 är två siffror: 10 minuter.', 'Vilken timme är vi på väg till? Åtta.', 'Det är tio i åtta.'],
      tips: 'Mumien blandar ihop i och över. Fråga dig: har minuterna gått, eller är de kvar?',
      prova: { mode: 'words', level: 4 },
    },
  ] },

  kvallen: { pages: [
    {
      title: 'Förmiddag och eftermiddag',
      text: 'Klockan går två varv varje dygn. På morgonen och förmiddagen visar den 1 till 12. Efter tolv på dagen börjar den om – men då skriver man 13, 14, 15 …\n\nKlockan tre på eftermiddagen är 15.00.',
      pic: <Tavla rader={['1 på eftermiddagen = 13', '3 på eftermiddagen = 15', '7 på kvällen = 19', ['10 på kvällen = 22', 'hi']]} />,
    },
    {
      title: 'Lägg till 12',
      text: 'Efter tolv på dagen: lägg till 12 på timmen.',
      pic: <Klocka h={8} m={30} text="Halv nio på kvällen" />,
      steps: ['Halv nio är 8.30.', 'Det är kväll: 8 + 12 = 20.', 'Med siffror: 20.30.'],
      tips: 'Nattkorpen glömmer att det är kväll. Titta efter ord som "eftermiddag" och "kväll"!',
      prova: { mode: 'clock', level: 5 },
    },
  ] },

  'hur-lange': { pages: [
    {
      title: 'Hur lång tid är det emellan?',
      text: 'Bussen går 9.40 och kommer fram 11.15. Hur lång tid tar resan?\n\nKnepet: hoppa först till nästa hela timme, sedan hela timmar, sedan resten.',
      pic: <Tallinje fran={9.5} till={11.5} steg={0.25} siffror={[10, 11]} hopp={[{ fran: 9.667, till: 10, text: '20 min' }, { fran: 10, till: 11, text: '1 tim', b: true }, { fran: 11, till: 11.25, text: '15 min' }]} />,
      steps: ['9.40 → 10.00: 20 minuter.', '10.00 → 11.00: 1 timme.', '11.00 → 11.15: 15 minuter.', 'Allt: 1 timme och 35 minuter.'],
      tips: 'En timme är 60 minuter – inte 100! Därför kan man inte räkna 11.15 − 9.40 som vanliga tal.',
      prova: { mode: 'between', level: 2 },
    },
  ] },

  'fem-i-halv': { pages: [
    {
      title: 'Halv är en ny mittpunkt',
      text: 'När minutvisaren är nära 6 använder man halv som mittpunkt.\n\nFem i halv tre: det är fem minuter kvar till halv tre. Klockan är 2.25.\n\nTio över halv tre: det har gått tio minuter sedan halv tre. Klockan är 2.40.',
      pic: <Rad><Klocka h={2} m={25} size={130} ring text="Fem i halv tre" /><Klocka h={2} m={40} size={130} ring text="Tio över halv tre" /></Rad>,
    },
    {
      title: 'Steg för steg',
      text: 'Vad är klockan när det är fem över halv sju?',
      steps: ['Halv sju är 6.30.', 'Fem över: 6.30 + 5 minuter.', 'Klockan är 6.35.'],
      tips: 'Börja alltid med att hitta halv. Halv sju = 6.30. Sen går du fram eller tillbaka några minuter.',
      prova: { mode: 'choice', level: 6 },
    },
  ] },

  'varje-minut': { pages: [
    {
      title: 'De små strecken',
      text: 'Mellan varje siffra på klockan finns fyra små streck. Varje litet streck är en minut.\n\nHär står minutvisaren två små streck efter 3. Siffran 3 betyder 15 minuter, så det är 17 minuter över.',
      pic: <Klocka h={4} m={17} ring size={180} text="Sjutton över fyra – 4.17" />,
      steps: ['Hitta siffran före minutvisaren: 3, alltså 15 minuter.', 'Räkna de små strecken: 16, 17.', 'Det är 17 minuter över fyra: 4.17.'],
    },
    {
      title: 'Minuter i',
      text: 'På vänstra halvan räknar du hur många minuter det är kvar till 12. 4.43 är 17 minuter i fem, för 43 + 17 = 60.',
      prova: { mode: 'clock', level: 7 },
    },
  ] },
};
