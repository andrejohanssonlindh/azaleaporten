import type { Lesson } from '../../../platform/rpg/types';
import { Rad, Text } from '../../../engines/lektion/bilder';
import { CornerDots, Fig, Poly, regular, rotate, type Pt } from '../draw';

// Fluffys klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

const Form = ({ pts, dots = false, label, size = 110 }: { pts: Pt[]; dots?: boolean; label: string; size?: number }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
    <Fig w={size} h={size} label={label}><Poly pts={pts} />{dots && <CornerDots pts={pts} numbers />}</Fig>
    <Text>{label}</Text>
  </span>
);

const STJARNA: Pt[] = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 20 : 48;
  return [55 + r * Math.cos(a), 57 + r * Math.sin(a)] as Pt;
});
const PIL: Pt[] = [[10, 40], [60, 40], [60, 18], [100, 55], [60, 92], [60, 70], [10, 70]];

export const LEKTIONER: Record<string, Lesson> = {
  'horn-och-sidor': { pages: [
    {
      title: 'Hörn och sidor',
      text: 'En sida är ett rakt streck i formen. Ett hörn är där två sidor möts.\n\nEn triangel har 3 sidor och 3 hörn. En kvadrat har 4 sidor och 4 hörn. En form har alltid lika många hörn som sidor!',
      pic: <Rad><Form pts={regular(3, 55, 60, 45)} dots label="Triangel: 3 hörn" /><Form pts={regular(4, 55, 55, 48, -Math.PI / 4)} dots label="Kvadrat: 4 hörn" /></Rad>,
    },
    {
      title: 'Räkna utan att räkna dubbelt',
      text: 'Grodan Dubbelhopp börjar på ett hörn, hoppar runt – och räknar starthörnet en gång till när han kommer tillbaka. Då blir det ett för mycket!',
      pic: <Form pts={regular(5, 55, 58, 46)} dots label="Femhörning: 5 hörn" />,
      steps: ['Sätt fingret på ett hörn och säg "ett".', 'Gå runt: två, tre, fyra, fem.', 'Nu är du tillbaka där du började. Stopp – det hörnet är redan räknat!', 'Femhörningen har 5 hörn.'],
      tips: 'En cirkel har inga hörn alls – den är rund hela vägen.',
      prova: { mode: 'horn', level: 0 },
    },
  ] },

  manghorningar: { pages: [
    {
      title: 'Namnet räknar hörnen',
      text: 'Många former har fått namn efter hur många hörn de har. Räkna hörnen, så vet du namnet!',
      pic: <Rad><Form pts={regular(5, 55, 58, 46)} label="Femhörning" /><Form pts={regular(6, 55, 55, 46)} label="Sexhörning" /><Form pts={regular(8, 55, 55, 46, -Math.PI / 8)} label="Åttahörning" /></Rad>,
      tips: 'Tre hörn heter triangel ("tri" betyder tre), fyra hörn heter fyrhörning.',
      prova: { mode: 'namn', level: 1 },
    },
  ] },

  'vridna-former': { pages: [
    {
      title: 'En form byter inte namn när den snurrar',
      text: 'Snurrsnigeln tror att en kvadrat blir något annat när den ställs på ett hörn. Men vrid på papperet – det är samma kvadrat!\n\nFormen heter likadant hur den än ligger. Det är sidorna och hörnen som bestämmer.',
      pic: <Rad><Form pts={regular(4, 55, 55, 48, -Math.PI / 4)} label="Kvadrat" /><Form pts={regular(4, 55, 55, 48, 0)} label="Också kvadrat!" /></Rad>,
      steps: ['Räkna hörnen: 4.', 'Är alla sidor lika långa? Ja.', 'Är hörnen räta (som ett papper)? Ja.', 'Då är det en kvadrat – även när den står på spetsen.'],
    },
    {
      title: 'Trianglar åt alla håll',
      text: 'En triangel kan peka upp, ner eller åt sidan. Den har alltid tre hörn och tre sidor.',
      pic: <Rad><Form pts={regular(3, 55, 60, 45)} label="Triangel" /><Form pts={rotate(regular(3, 55, 50, 45), Math.PI, 55, 55)} label="Triangel" /><Form pts={rotate(regular(3, 55, 55, 45), 1.1, 55, 55)} label="Triangel" /></Rad>,
      prova: { mode: 'ar', level: 2 },
    },
  ] },

  fyrhorningar: { pages: [
    {
      title: 'Fyra sorters fyrhörningar',
      text: 'Alla har fyra hörn, men de är olika. Kolla sidorna och hörnen:\n\nKvadrat: alla sidor lika långa, alla hörn räta.\n\nRektangel: alla hörn räta, men två långa och två korta sidor.\n\nRomb: alla sidor lika långa, men den lutar (hörnen är inte räta).\n\nParallellogram: lutar, och har två långa och två korta sidor. Sidorna mitt emot varandra är parallella (lika sneda).\n\nParallelltrapets: bara två av sidorna är parallella – oftast en lång botten och en kortare topp.',
      pic: <Rad>
        <Form pts={[[20, 20], [90, 20], [90, 90], [20, 90]]} label="Kvadrat" />
        <Form pts={[[8, 32], [102, 32], [102, 80], [8, 80]]} label="Rektangel" />
        <Form pts={[[55, 8], [95, 55], [55, 102], [15, 55]]} label="Romb" />
        <Form pts={[[30, 30], [104, 30], [80, 82], [6, 82]]} label="Parallellogram" />
        <Form pts={[[35, 30], [75, 30], [104, 82], [6, 82]]} label="Parallelltrapets" />
      </Rad>,
      tips: 'Fråga dig två saker: Är hörnen räta? Är alla sidor lika långa?',
      prova: { mode: 'namn', level: 2 },
    },
  ] },

  'inat-horn': { pages: [
    {
      title: 'Hörn som pekar inåt',
      text: 'En stjärna har spetsar som pekar ut – men också hörn som pekar in, mellan spetsarna. De räknas också!',
      pic: <Rad><Form pts={STJARNA.map(([x, y]) => [x * 1.5, y * 1.5] as Pt)} dots size={165} label="Stjärna: 10 hörn" /><Form pts={PIL.map(([x, y]) => [x * 1.5, y * 1.5] as Pt)} dots size={165} label="Pil: 7 hörn" /></Rad>,
      steps: ['Börja på en spets och sätt fingret där.', 'Följ kanten och räkna VARJE ställe där den byter riktning – ut eller in.', 'Stjärnan har 5 spetsar och 5 hörn inåt: 10 hörn.'],
      tips: 'Hörnen och sidorna är lika många. Räkna sidorna om du vill kolla!',
      prova: { mode: 'horn', level: 2 },
    },
  ] },
};
