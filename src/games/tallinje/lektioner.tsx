import type { Lesson } from '../../platform/rpg/types';
import { Tallinje, Tavla, Text } from '../../engines/lektion/bilder';
import { NumberLine } from './index';

// Tallinjebrons klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

export const LEKTIONER: Record<string, Lesson> = {
  'las-tallinjen': { pages: [
    {
      title: 'Vad är ett streck värt?',
      text: 'På en tallinje står inte alla tal utskrivna. Innan du läser av måste du ta reda på vad varje streck är värt.\n\nHär står det 0 och 10. Mellan dem finns 5 mellanrum. 10 delat i 5 delar blir 2. Varje streck är alltså värt 2!',
      pic: <NumberLine line={{ min: 0, max: 20, tick: 2, label: 10, mark: 14 }} showMark={false} />,
      steps: ['Räkna mellanrummen mellan 0 och 10: fem stycken.', '10 / 5 = 2. Varje streck är värt 2.', 'Pilen står två streck efter 10.', '10 + 2 = 12, och 12 + 2 = 14.', 'Pilen pekar på 14.'],
    },
    {
      title: 'Börja från närmaste siffra',
      text: 'Hitta siffran som står närmast pilen. Räkna sedan strecken därifrån – framåt eller bakåt.',
      pic: <NumberLine line={{ min: 0, max: 1000, tick: 50, label: 500, mark: 850 }} showMark={false} />,
      steps: ['Mellan 0 och 500 finns 10 mellanrum.', '500 / 10 = 50. Varje streck är värt 50.', 'Närmast pilen står 1000. Pilen är tre streck före.', '1000 − 50 − 50 − 50 = 850.'],
      tips: 'Vanligt fel: att räkna strecken som ettor fast de är värda mer. Kolla alltid värdet först!',
      prova: { mode: 'las', level: 1 },
    },
  ] },

  avrunda: { pages: [
    {
      title: 'Vilket tiotal är närmast?',
      text: 'Att avrunda betyder att välja det närmaste hela tiotalet (eller hundratalet). 43 ligger mellan 40 och 50. Det är närmare 40.',
      pic: <Tallinje fran={40} till={50} hopp={[{ fran: 43, till: 40, text: '3 steg' }, { fran: 43, till: 50, text: '7 steg', b: true }]} mark={[43]} />,
      steps: ['43 är 3 steg från 40.', '43 är 7 steg från 50.', '40 är närmast. 43 ≈ 40.'],
    },
    {
      title: 'Femman avrundas uppåt',
      text: '45 ligger precis mitt emellan 40 och 50. Då har man bestämt att man avrundar uppåt: 45 ≈ 50.\n\nVelpaddan glömmer det och säger 40. Kom ihåg: 5, 6, 7, 8 och 9 går uppåt. 1, 2, 3 och 4 går nedåt.',
      pic: <Tavla rader={['41 42 43 44 → 40', ['45 46 47 48 49 → 50', 'hi']]} />,
    },
    {
      title: 'Hundratal och heltal',
      text: 'Samma regel fungerar överallt. Till hundratal tittar du på tiotalssiffran: 349 ≈ 300, men 350 ≈ 400.\n\nTill heltal tittar du på tiondelen: 6,4 ≈ 6, men 6,5 ≈ 7.',
      tips: 'Fråga dig: vilka två tal ligger det mellan? Vilket är närmast? Mitt emellan – uppåt!',
      prova: { mode: 'avrunda', level: 0 },
    },
  ] },

  negativa: { pages: [
    {
      title: 'Tal under noll',
      text: 'Tallinjen slutar inte vid noll. Till vänster fortsätter den: −1, −2, −3. Talen med minustecken kallas negativa tal.\n\nPå en termometer betyder −5 att det är fem grader kallt.',
      pic: <Tallinje fran={-5} till={5} mark={[0]} />,
      tips: 'Ju längre åt vänster, desto mindre tal (och desto kallare). −5 är mindre än −2!',
    },
    {
      title: 'Förbi noll i två steg',
      text: 'Termometern visar −3 grader. Det blir 7 grader varmare. Varmare = uppåt (åt höger). Gå först till noll, och sedan resten.',
      pic: <Tallinje fran={-5} till={5} hopp={[{ fran: -3, till: 0, text: '+3' }, { fran: 0, till: 4, text: '+4', b: true }]} mark={[4]} />,
      steps: ['Från −3 upp till 0: 3 grader.', '7 = 3 + 4. Det är 4 grader kvar.', 'Från 0 upp 4: 4 grader.', 'Det är 4 grader varmt nu.'],
    },
    {
      title: 'Kallare förbi noll',
      text: 'Det är 2 grader varmt och blir 6 grader kallare. Kallare = nedåt (åt vänster).',
      pic: <Tallinje fran={-5} till={5} hopp={[{ fran: 2, till: 0, text: '−2' }, { fran: 0, till: -4, text: '−4', b: true }]} mark={[-4]} />,
      steps: ['Från 2 ner till 0: 2 grader.', '6 = 2 + 4. Det är 4 kvar.', 'Från 0 ner 4: −4.', 'Svaret är −4 grader. Glöm inte minustecknet!'],
      tips: 'Isbjörnen Minus glömmer tecknet. 4 grader varmt och 4 grader kallt är väldigt olika!',
      prova: { mode: 'negativa', level: 1 },
    },
  ] },

  tiondelar: { pages: [
    {
      title: 'Tiondelar',
      text: 'Mellan 0 och 1 kan man dela upp i tio lika delar. Varje del är en tiondel och skrivs 0,1.\n\nTio tiondelar blir en hel: 0,1 0,2 0,3 … 0,9 och sedan 1.',
      pic: <Tallinje fran={0} till={1} steg={0.1} siffror={[0, 0.5, 1]} mark={[0.5]} />,
    },
    {
      title: 'Läsa av tiondelar',
      text: 'Mellan 2 och 3 finns också tio tiondelar. Pilen här står 7 streck efter 2. Då är det 2 hela och 7 tiondelar: 2,7.',
      pic: <NumberLine line={{ min: 2, max: 3, tick: 0.1, label: 1, mark: 2.7 }} showMark={false} />,
      tips: 'Talet före kommat är hela. Siffran efter kommat är tiondelar.',
      prova: { mode: 'las', level: 3 },
    },
  ] },

  'decimal-rakning': { pages: [
    {
      title: 'Räkna i tiondelar',
      text: 'Tänk på tiondelar som saker du räknar, som kakbitar. 0,3 + 0,4 är 3 tiondelar + 4 tiondelar = 7 tiondelar = 0,7.',
      pic: <Tavla rader={['0,3 + 0,4', '3 + 4 = 7 tiondelar', ['= 0,7', 'hi']]} />,
    },
    {
      title: 'När det blir en hel',
      text: '0,7 + 0,5: 7 tiondelar + 5 tiondelar = 12 tiondelar. Tio tiondelar är en hel – så 12 tiondelar är 1 hel och 2 tiondelar.',
      pic: <><Tallinje fran={0} till={1.5} steg={0.1} siffror={[0, 0.5, 1, 1.5]} hopp={[{ fran: 0.7, till: 1, text: '+0,3' }, { fran: 1, till: 1.2, text: '+0,2', b: true }]} mark={[1.2]} /><Text>0,7 + 0,5 = 1,2</Text></>,
      steps: ['7 + 5 = 12 tiondelar.', '10 tiondelar = 1 hel.', '12 tiondelar = 1,2.'],
      tips: 'Vanligt fel: att skriva 0,12. Men 0,12 är mindre än 0,7 – det kan inte vara rätt!',
    },
    {
      title: 'Minus med tiondelar',
      text: '1,3 − 0,5: gör om till tiondelar. 1,3 är 13 tiondelar. 13 − 5 = 8 tiondelar = 0,8.',
      prova: { mode: 'decimal', level: 1 },
    },
  ] },
};
