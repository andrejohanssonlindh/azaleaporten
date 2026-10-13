import type { Lesson } from '../../../platform/rpg/types';
import { Rad, Tavla, Text } from '../../../engines/lektion/bilder';
import { Fig, Poly, Txt, type Pt } from '../draw';

// Sibbarps klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

/** En vinkel med spetsen i (cx, cy): ett ben åt höger och ett vridet deg grader moturs. */
function Vinkel({ deg, len = 70, len2, label, w = 150 }: { deg: number; len?: number; len2?: number; label?: string; w?: number }) {
  const cx = w / 2 - 20, cy = 90, a = (deg * Math.PI) / 180, r = 22, l2 = len2 ?? len;
  const end: Pt = [cx + l2 * Math.cos(a), cy - l2 * Math.sin(a)];
  const arc = deg === 90
    ? <path d={`M${cx + 14} ${cy} L${cx + 14} ${cy - 14} L${cx} ${cy - 14}`} class="geo-arc" />
    : <path d={`M${cx + r} ${cy} A${r} ${r} 0 0 0 ${cx + r * Math.cos(a)} ${cy - r * Math.sin(a)}`} class="geo-arc" />;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Fig w={w} h={110} label={label ?? `Vinkel ${deg} grader`}>
        <line x1={cx} y1={cy} x2={cx + len} y2={cy} class="geo-arm" />
        <line x1={cx} y1={cy} x2={end[0]} y2={end[1]} class="geo-arm" />
        {arc}
        <circle cx={cx} cy={cy} r={4} class="geo-vertex" />
      </Fig>
      {label && <Text>{label}</Text>}
    </span>
  );
}

export const LEKTIONER: Record<string, Lesson> = {
  'vinklarnas-namn': { pages: [
    {
      title: 'Tre sorters vinklar',
      text: 'En vinkel är hur mycket två ben (streck) öppnar sig från samma punkt.\n\nEn rät vinkel är som hörnet på ett papper: 90°. En spetsig vinkel är smalare än det. En trubbig vinkel är bredare.',
      pic: <Rad><Vinkel deg={40} label="Spetsig (mindre än 90°)" /><Vinkel deg={90} label="Rät (90°)" /><Vinkel deg={130} label="Trubbig (mer än 90°)" w={170} /></Rad>,
      tips: 'Spetsig = vass som en spets. Trubbig = trubbig som en gammal penna. Håll ett papper mot vinkeln och jämför med hörnet!',
      prova: { mode: 'sort', level: 0 },
    },
  ] },

  'jamfor-vinklar': { pages: [
    {
      title: 'Benen spelar ingen roll',
      text: 'Bläckfisken Långarm tror att vinkeln blir större när benen är längre. Men vinkeln är bara hur mycket det öppnar sig vid spetsen.\n\nHär är vinkeln till vänster STÖRRE, fast benen är kortare.',
      pic: <Rad><Vinkel deg={70} len={40} label="Korta ben, större vinkel" /><Vinkel deg={35} len={80} label="Långa ben, mindre vinkel" /></Rad>,
      tips: 'Titta bara nära spetsen: hur brett är gapet där?',
      prova: { mode: 'jamfor', level: 1 },
    },
  ] },

  gradskivan: { pages: [
    {
      title: 'Två skalor',
      text: 'En gradskiva har två rader med siffror: en som börjar på 0 till höger och en som börjar på 0 till vänster.\n\nSälen Bakfram läser av fel rad. Knepet: hitta det ben som ligger på 0 – och följ SAMMA rad hela vägen.',
      steps: ['Lägg mitten av gradskivan på vinkelns spets.', 'Lägg ena benet längs nollinjen.', 'Kolla vilken rad som har 0 vid det benet.', 'Följ den raden upp till det andra benet och läs av.'],
      tips: 'Kolla om svaret är rimligt: är vinkeln spetsig ska det bli mindre än 90.',
      prova: { mode: 'gradskiva', level: 1 },
    },
  ] },

  varv: { pages: [
    {
      title: 'Ett helt varv är 360°',
      text: 'Snurrar en skejtare ett helt varv har hon snurrat 360 grader. Det är därför tricken heter 180, 360 och 540!',
      pic: <Tavla rader={['kvarts varv = 90°', 'halvt varv = 180°', ['helt varv = 360°', 'hi'], 'ett och ett halvt varv = 540°', 'två varv = 720°']} />,
      tips: 'Ett varv är inte 100 grader! Kom ihåg 360.',
    },
    {
      title: 'Från grader till varv',
      text: 'Tricket heter 900. Hur många varv är det? Räkna i 360-steg.',
      steps: ['360 – ett varv.', '720 – två varv.', '900 − 720 = 180, ett halvt varv till.', '900° = två och ett halvt varv.'],
      prova: { mode: 'varv', level: 1 },
    },
  ] },

  vinkelsummor: { pages: [
    {
      title: 'Vinklar längs en rak linje',
      text: 'En rak linje är ett halvt varv: 180°. Delas den av ett streck blir de två vinklarna tillsammans 180°.\n\nÄr den ena 130°, är den andra 180 − 130 = 50°.',
      pic: <Fig w={220} h={100} label="Två vinklar på en rak linje"><line x1={10} y1={80} x2={210} y2={80} class="geo-arm" /><line x1={110} y1={80} x2={60} y2={20} class="geo-arm" /><Txt at={[150, 62]}>130°</Txt><Txt at={[72, 66]}>?</Txt></Fig>,
    },
    {
      title: 'Triangelns vinklar',
      text: 'De tre vinklarna i en triangel blir alltid 180° tillsammans – hur triangeln än ser ut.\n\nRiv av hörnen på en papperstriangel och lägg dem bredvid varandra: de bildar en rak linje!',
      pic: <Fig w={220} h={120} label="Triangel"><Poly pts={[[20, 100], [200, 100], [80, 20]]} /><Txt at={[46, 88]}>50°</Txt><Txt at={[172, 90]}>30°</Txt><Txt at={[84, 42]}>?</Txt></Fig>,
      steps: ['Lägg ihop de vinklar du vet: 50 + 30 = 80.', 'Dra bort från 180: 180 − 80 = 100.', 'Den sista vinkeln är 100°.'],
      tips: 'Glöm inte att dra bort från 180! Bara lägga ihop de två du vet ger inte svaret.',
    },
    {
      title: 'Fyrhörningar och runt en punkt',
      text: 'I en fyrhörning blir vinklarna 360° tillsammans (det är två trianglar).\n\nRunt en punkt blir vinklarna också 360° – ett helt varv.\n\nI en likbent triangel är två vinklar lika stora. Är toppvinkeln 40°, är det 140° kvar att dela lika: 70° var.',
      prova: { mode: 'summa', level: 1 },
    },
  ] },
};
