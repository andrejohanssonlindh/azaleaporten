import type { Lesson } from '../../../platform/rpg/types';
import { Rad, Stor, Tavla, Text } from '../../../engines/lektion/bilder';
import { Fig } from '../draw';

// Kroksbäcks klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

/** En kub i snett perspektiv med de dolda kanterna streckade. */
function Kub({ hidden = true }: { hidden?: boolean }) {
  const s = 70, d = 30, x = 20, y = 45;
  return (
    <Fig w={140} h={130} label="Kub">
      <path d={`M${x} ${y} L${x + s} ${y} L${x + s} ${y + s} L${x} ${y + s} Z`} class="geo-solid" />
      <path d={`M${x} ${y} L${x + d} ${y - d} L${x + s + d} ${y - d} L${x + s} ${y} Z`} class="geo-solid top" />
      <path d={`M${x + s} ${y} L${x + s + d} ${y - d} L${x + s + d} ${y + s - d} L${x + s} ${y + s} Z`} class="geo-solid side" />
      {hidden && <path d={`M${x} ${y + s} L${x + d} ${y + s - d} L${x + s + d} ${y + s - d} M${x + d} ${y + s - d} L${x + d} ${y - d}`} class="geo-hidden" />}
    </Fig>
  );
}

/** Ett block av kuber sett snett uppifrån: l × b × h. */
function Block({ l, b, h }: { l: number; b: number; h: number }) {
  const s = 22, dx = 11, dy = 9;
  const cubes: [number, number, number][] = [];
  for (let z = 0; z < h; z++) for (let j = b - 1; j >= 0; j--) for (let i = 0; i < l; i++) cubes.push([i, j, z]);
  const W = l * s + b * dx + 10, H = h * s + b * dy + 10;
  return (
    <Fig w={W} h={H} label={`${l} · ${b} · ${h} kuber`}>
      {cubes.map(([i, j, z], k) => {
        const x = 4 + i * s + j * dx, y = H - 6 - (z + 1) * s - j * dy;
        return (
          <g key={k}>
            <path d={`M${x} ${y} L${x + s} ${y} L${x + s} ${y + s} L${x} ${y + s} Z`} class="geo-cube left" />
            <path d={`M${x} ${y} L${x + dx} ${y - dy} L${x + s + dx} ${y - dy} L${x + s} ${y} Z`} class="geo-cube top" />
            <path d={`M${x + s} ${y} L${x + s + dx} ${y - dy} L${x + s + dx} ${y + s - dy} L${x + s} ${y + s} Z`} class="geo-cube right" />
          </g>
        );
      })}
    </Fig>
  );
}

export const LEKTIONER: Record<string, Lesson> = {
  kropparna: { pages: [
    {
      title: 'Former som man kan ta i',
      text: 'En kropp är en form som inte är platt. Den har längd, bredd och höjd.\n\nKub: som en tärning, alla sidor är kvadrater. Klot: som en boll. Cylinder: som en burk. Kon: som en glasstrut.\n\nRätblock: som en låda eller en mjölkkartong. Pyramid: spetsig topp med trianglar som sidor. Prisma: som en tältduk – samma form i båda ändarna.',
      pic: <Rad><Stor>🎲</Stor><Stor>⚽</Stor><Stor>🥫</Stor><Stor>🍦</Stor><Stor>📦</Stor><Stor>⛺</Stor></Rad>,
      tips: 'En kub är inte en kvadrat – kvadraten är platt! Och en kon har en rund botten, en pyramid har en kantig.',
      prova: { mode: 'namn', level: 1 },
    },
  ] },

  'kubens-delar': { pages: [
    {
      title: 'Sidoytor, kanter och hörn',
      text: 'Sidoytor är de platta ytorna. Kanter är där två ytor möts. Hörn är där kanterna möts.\n\nUgglan Framsida räknar bara det hon ser. Men kuben har en baksida också – de streckade linjerna är kanterna du inte ser.',
      pic: <Kub />,
      steps: ['Sidoytor: fram, bak, upp, ner, vänster, höger = 6.', 'Hörn: 4 där uppe och 4 där nere = 8.', 'Kanter: 4 runt toppen, 4 runt botten och 4 som står upp = 12.'],
      tips: 'Ta en riktig tärning eller ett mjölkpaket i handen och räkna!',
      prova: { mode: 'delar', level: 1 },
    },
  ] },

  'rakna-kuber': { pages: [
    {
      title: 'Kuber du inte ser',
      text: 'När kuber står i ett block gömmer sig några bakom och under de andra. Räkna inte bara framsidan!',
      pic: <><Block l={3} b={2} h={2} /><Text>3 i rad, 2 rader bakåt, 2 lager</Text></>,
      steps: ['Ett lager: 3 kuber i varje rad, 2 rader: 3 · 2 = 6.', 'Det finns 2 lager: 6 · 2 = 12.', 'Blocket har 12 kuber.'],
      tips: 'Räkna lager för lager. Varje lager har lika många kuber.',
      prova: { mode: 'kuber', level: 1 },
    },
  ] },

  volym: { pages: [
    {
      title: 'Längd gånger bredd gånger höjd',
      text: 'Volymen är hur mycket som får plats inuti. Ett rätblock: längd · bredd · höjd.\n\nPlusormen lägger ihop måtten. Men 4 + 3 + 2 = 9 är inte volymen!',
      pic: <Tavla rader={['längd 4 cm, bredd 3 cm, höjd 2 cm', '4 · 3 = 12 (bottenlagret)', ['12 · 2 = 24 cm³', 'hi'], ['inte 4 + 3 + 2', 'dim']]} />,
      tips: 'cm³ betyder kuber som är 1 cm åt alla håll. Glöm inte höjden!',
      prova: { mode: 'volym', level: 1 },
    },
  ] },

  liter: { pages: [
    {
      title: 'Liter, deciliter och milliliter',
      text: 'Volym i vätskor mäter man i liter.',
      pic: <Tavla rader={['1 l  = 10 dl', '1 dl = 10 cl', '1 cl = 10 ml', ['1 l  = 1000 ml', 'hi'], ['1 dm³ = 1 l', 'hi'], '1 cm³ = 1 ml']} />,
      steps: ['3 l i deciliter: 3 · 10 = 30 dl.', '500 ml i liter: 1000 ml är 1 l, så 500 ml är en halv liter: 0,5 l.'],
      tips: 'Till en mindre enhet: gånger. Till en större: delat. Precis som med längd!',
      prova: { mode: 'liter', level: 1 },
    },
  ] },
};
