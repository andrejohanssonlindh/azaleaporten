import type { Lesson } from '../../platform/rpg/types';
import { Prickar, Rad, Stor, Tallinje, Tallrikar, Tavla, Text } from '../../engines/lektion/bilder';

// Tabellgruvans klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

export const LEKTIONER: Record<string, Lesson> = {
  'vad-ar-ganger': { pages: [
    {
      title: 'Gånger är grupper',
      text: '3 · 4 läser man "tre gånger fyra". Det betyder: 3 grupper med 4 i varje.\n\nHär är tre rader. Varje rad är en grupp med fyra kristaller.',
      pic: <><Prickar rader={3} per={4} ring /><Text>3 grupper med 4 i varje</Text></>,
      steps: ['Hur många grupper? 3.', 'Hur många i varje grupp? 4.', 'Lägg ihop grupperna: 4 + 4 + 4.', '4 + 4 = 8, och 8 + 4 = 12.', 'Alltså är 3 · 4 = 12.'],
    },
    {
      title: 'Gånger är inte plus',
      text: 'Plusråttan tror att 3 · 4 är 7. Men 3 + 4 betyder bara att man lägger ihop två tal.\n\n3 · 4 betyder tre hela fyror. Det blir mycket mer!',
      pic: <Rad><Tavla rader={['3 + 4 = 7', ['3 fyror:', 'dim'], '4 + 4 + 4 = 12']} /></Rad>,
      tips: 'Säg "grupper" i huvudet: 3 · 4 = "3 grupper med 4".',
    },
    {
      title: 'Hoppa i steg',
      text: 'Man kan också räkna gånger genom att hoppa längs tallinjen. 6 · 5 betyder 6 hopp som är 5 långa.',
      pic: <Tallinje fran={0} till={30} steg={5} hopp={[0, 5, 10, 15, 20, 25].map((a) => ({ fran: a, till: a + 5 }))} mark={[30]} />,
      steps: ['5, 10, 15, 20, 25, 30.', 'Räkna hoppen på fingrarna: sex hopp.', '6 · 5 = 30.'],
    },
    {
      title: 'Tian, femman och tvåan',
      text: 'Gånger 10: sätt en nolla efter talet. 7 · 10 = 70.\n\nGånger 5: det är hälften av gånger 10. 10 · 6 = 60, och hälften av 60 är 30. Så 5 · 6 = 30.\n\nGånger 2: det är dubbla. 2 · 8 = 8 + 8 = 16.',
      pic: <Tavla rader={['7 · 10 = 70', '10 · 6 = 60', ['5 · 6 = hälften = 30', 'hi'], '2 · 8 = 8 + 8 = 16']} />,
    },
    {
      title: 'Byt plats',
      text: 'Det spelar ingen roll vilket tal som står först. 2 · 7 och 7 · 2 blir lika mycket – vänd bara på bilden!\n\nVälj det som är lättast. 7 · 2 är svårt att hoppa, men 2 · 7 är bara dubbla sju.',
      pic: <Rad><Prickar rader={2} per={7} cell={22} /><Stor>=</Stor><Prickar rader={7} per={2} cell={22} /></Rad>,
      prova: { mode: 'ganger', level: 0 },
    },
  ] },

  'vad-ar-delat': { pages: [
    {
      title: 'Två sätt att tänka på delat',
      text: '12 / 3 läser man "tolv delat med tre". Det finns två sätt att tänka – och båda ger samma svar:\n\n1. Dela lika: 12 kakor delas på 3 tallrikar. Hur många på varje?\n\n2. Hur många grupper: hur många treor får plats i 12?',
      pic: <Tavla rader={['12 / 3 = ?', ['dela lika ...', 'dim'], ['... eller hur många 3:or?', 'dim']]} />,
    },
    {
      title: 'Sätt 1: Dela lika',
      text: 'Du har 12 kakor och 3 tallrikar. Lägg en kaka i taget på varje tallrik, runt, runt, tills kakorna är slut.',
      pic: <><Tallrikar tallrikar={3} per={4} /><Text>12 kakor på 3 tallrikar</Text></>,
      steps: ['Första varvet: 1 kaka på varje tallrik. 3 kakor borta.', 'Andra varvet: 2 på varje. 6 kakor borta.', 'Tredje varvet: 3 på varje. 9 kakor borta.', 'Fjärde varvet: 4 på varje. Alla 12 kakor är borta!', 'Varje tallrik fick 4. Alltså är 12 / 3 = 4.'],
    },
    {
      title: 'Sätt 2: Hur många grupper?',
      text: 'Nu tänker vi tvärtom: gör grupper med 3 kristaller i varje, tills alla 12 är slut. Hur många grupper blev det?',
      pic: <><Prickar rader={4} per={3} ring /><Text>12 kristaller i grupper om 3</Text></>,
      steps: ['En grupp: 3.', 'Två grupper: 6.', 'Tre grupper: 9.', 'Fyra grupper: 12. Slut!', '4 grupper. 12 / 3 = 4 igen!'],
      tips: 'Delat med frågar alltid: hur många blir det i varje grupp – eller hur många grupper blir det? Svaret blir samma.',
    },
    {
      title: 'Snabbast: gånger baklänges',
      text: 'När du kan gångertabellen är det snabbaste sättet att tänka baklänges.\n\n12 / 3 = ? är samma fråga som 3 · ? = 12.',
      pic: <Tallinje fran={0} till={12} steg={1} siffror={[0, 3, 6, 9, 12]} hopp={[0, 3, 6, 9].map((a) => ({ fran: a, till: a + 3 }))} mark={[12]} />,
      steps: ['Fråga dig: tre gånger vad blir tolv?', 'Räkna i 3-steg: 3, 6, 9, 12.', 'Det blev fyra steg.', '3 · 4 = 12, så 12 / 3 = 4.'],
    },
    {
      title: 'Delat med 10, 5 och 2',
      text: 'Delat med 10: ta bort nollan. 70 / 10 = 7.\n\nDelat med 2: hälften. 16 / 2 = 8, för 8 + 8 = 16.\n\nDelat med 5: räkna i 5-steg tills du kommer fram. 35 / 5: 5, 10, 15, 20, 25, 30, 35 – sju steg.',
      pic: <Tavla rader={['70 / 10 = 7', '16 / 2 = 8', ['35 / 5: 5, 10, ... 35', 'dim'], '35 / 5 = 7']} />,
      prova: { mode: 'delat', level: 0 },
    },
  ] },

  'gomda-talet': { pages: [
    {
      title: 'Talet som gömmer sig',
      text: 'Ibland är det inte svaret som fattas, utan ett av talen: 3 · ? = 12.\n\nDet betyder: 3 gånger något blir 12. Vad är det där något?',
      pic: <Tavla rader={['3 · ? = 12']} />,
    },
    {
      title: 'Hoppa tills du är framme',
      text: 'Hoppa i 3-steg från noll och räkna hoppen tills du kommer till 12.',
      pic: <Tallinje fran={0} till={12} siffror={[0, 3, 6, 9, 12]} hopp={[0, 3, 6, 9].map((a) => ({ fran: a, till: a + 3 }))} mark={[12]} />,
      steps: ['3 – ett hopp.', '6 – två hopp.', '9 – tre hopp.', '12 – fyra hopp. Framme!', 'Det gömda talet är 4: 3 · 4 = 12.'],
      tips: 'Lägg inte ihop 3 och 12, och dra inte bort heller. Fråga: "hur många gånger?"',
    },
    {
      title: 'Eller dela',
      text: 'Det gömda talet kan du också hitta med delat med: 3 · ? = 12 är samma sak som 12 / 3 = ?.\n\nKolla alltid ditt svar genom att sätta in det: 3 · 4 = 12. Stämmer!',
      prova: { mode: 'saknas', level: 1 },
    },
  ] },

  'noll-och-ett': { pages: [
    {
      title: 'Gånger noll',
      text: '5 · 0 betyder 5 grupper med ingenting i. Och 0 · 5 betyder noll grupper. Hur du än vänder på det blir det ingenting.\n\nAllt gånger 0 blir 0.',
      pic: <><Tallrikar tallrikar={5} per={0} tomma /><Text>5 tomma tallrikar = 0 kakor</Text></>,
    },
    {
      title: 'Gånger ett',
      text: '7 · 1 betyder 7 grupper med en i varje. Det blir 7.\n\nGånger 1 ändrar ingenting: talet blir sig självt.',
      pic: <Tavla rader={['7 · 1 = 7', '1 · 9 = 9', ['0 · 9 = 0', 'hi']]} />,
    },
    {
      title: 'Delat med ett, och noll delat',
      text: 'Delat med 1: en enda person får allt. 8 / 1 = 8.\n\nNoll delat med något: har du inga kakor att dela blir det inga kakor på tallrikarna. 0 / 4 = 0.',
      tips: 'Nollfladdermusen blandar ihop dem. Fråga dig: blir det ingenting, eller blir talet sig självt?',
      prova: { mode: 'ganger', level: 0, trap: 'noll-ett' },
    },
  ] },

  'svara-tabellerna': { pages: [
    {
      title: 'Knep 1: dubbla',
      text: 'Fyrans tabell är dubbla tvåans. Åttans tabell är dubbla fyrans.\n\n4 · 7: först 2 · 7 = 14, sedan dubbla: 14 + 14 = 28.\n\n8 · 6: först 4 · 6 = 24, sedan dubbla: 24 + 24 = 48.',
      pic: <Tavla rader={['2 · 7 = 14', ['4 · 7 = 14 + 14 = 28', 'hi'], '4 · 6 = 24', ['8 · 6 = 24 + 24 = 48', 'hi']]} />,
    },
    {
      title: 'Knep 2: börja från femman',
      text: 'Kan du femmans tabell kan du räkna vidare därifrån. 7 · 6 är fem sexor och två sexor till.',
      pic: <><Prickar rader={7} per={6} cell={20} farg={(r) => (r < 5 ? '' : 'b')} /><Text>5 rader (blå) och 2 rader till (rosa)</Text></>,
      steps: ['5 · 6 = 30 (fem sexor).', '2 · 6 = 12 (två sexor till).', '30 + 12 = 42.', 'Alltså är 7 · 6 = 42.'],
    },
    {
      title: 'Knep 3: nian är tian minus en',
      text: '9 · 7 är nästan 10 · 7. Ta tio sjuor och ta bort en sjua.',
      steps: ['10 · 7 = 70.', 'Ta bort en sjua: 70 − 7 = 63.', '9 · 7 = 63.', 'Kolla: 6 + 3 = 9. I nians tabell blir siffrorna alltid 9 tillsammans!'],
    },
    {
      title: 'Akta dig för grannen',
      text: 'Gångerspindeln lurar dig att hamna ett steg fel i tabellen, till exempel 7 · 8 = 48 eller 64. Det är grannarna!\n\nNär du är osäker: börja från något du vet säkert, och räkna ett steg i taget.',
      pic: <Tavla rader={[['7 · 7 = 49', 'dim'], ['7 · 8 = 49 + 7 = 56', 'hi'], ['7 · 9 = 56 + 7 = 63', 'dim']]} />,
      tips: 'Ramsa som hjälper: 5, 6, 7, 8 → 56 = 7 · 8.',
      prova: { mode: 'ganger', level: 2 },
    },
  ] },

  'elvan-tolvan': { pages: [
    {
      title: 'Elvan: tian plus en',
      text: '11 · 4 är tio fyror och en fyra till.\n\n10 · 4 = 40, och 40 + 4 = 44. Upp till 11 · 9 ser svaret ut som talet två gånger: 44, 55, 66!',
      pic: <Tavla rader={['11 · 4 = 40 + 4 = 44', '11 · 7 = 70 + 7 = 77', ['11 · 12 = 120 + 12 = 132', 'hi']]} />,
    },
    {
      title: 'Tolvan: tian plus tvåan',
      text: '12 · 6 är tio sexor och två sexor till.',
      steps: ['10 · 6 = 60.', '2 · 6 = 12.', '60 + 12 = 72.', '12 · 6 = 72.'],
      tips: 'Delat med 11 eller 12? Tänk baklänges: 12 · ? = 84. Prova 7: 70 + 14 = 84. Stämmer!',
      prova: { mode: 'ganger', level: 3 },
    },
  ] },

  'fyra-fakta': { pages: [
    {
      title: 'Fyra fakta på en gång',
      text: 'Gånger och delat hör ihop som en familj. Kan du en av dem kan du alla fyra:',
      pic: <><Prickar rader={7} per={8} cell={18} /><Tavla rader={['7 · 8 = 56', '8 · 7 = 56', '56 / 7 = 8', '56 / 8 = 7']} /></>,
      tips: 'Tre tal i en familj: 7, 8 och 56. Det största talet är alltid gångersvaret.',
    },
    {
      title: 'Använd familjen',
      text: 'När du ser 63 / 9 = ? kan du fråga dig: vilken familj har 63 och 9 i sig? 7 · 9 = 63! Då är 63 / 9 = 7.',
      prova: { mode: 'blandat', level: 4 },
    },
  ] },
};
