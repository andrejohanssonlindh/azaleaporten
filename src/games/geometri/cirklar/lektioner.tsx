import type { Lesson } from '../../../platform/rpg/types';
import { Rad, Tavla } from '../../../engines/lektion/bilder';
import { Fig, Txt } from '../draw';

// Stapelbäddsparkens klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

function Cirkel({ visa }: { visa: 'radie' | 'diameter' | 'bada' }) {
  const c = 70, r = 56;
  return (
    <Fig w={140} h={140} label="Cirkel med radie och diameter">
      <circle cx={c} cy={c} r={r} class="geo-shape" />
      <circle cx={c} cy={c} r={4} class="geo-vertex" />
      {visa !== 'radie' && <><line x1={c - r} y1={c} x2={c + r} y2={c} class="geo-height" /><Txt at={[c, c + 14]} cls="geo-small blue">diameter</Txt></>}
      {visa !== 'diameter' && <><line x1={c} y1={c} x2={c + r * 0.7} y2={c - r * 0.7} class="geo-arm" /><Txt at={[c + 6, c - 30]} cls="geo-small">radie</Txt></>}
    </Fig>
  );
}

export const LEKTIONER: Record<string, Lesson> = {
  'radie-diameter': { pages: [
    {
      title: 'Radie och diameter',
      text: 'Radien är avståndet från mittpunkten ut till kanten.\n\nDiametern går tvärs över hela cirkeln, genom mittpunkten. Den är två radier lång.',
      pic: <Rad><Cirkel visa="bada" /></Rad>,
      steps: ['Radien är 4 cm.', 'Diametern är två radier: 4 + 4 = 8 cm.', 'Och tvärtom: diametern 10 cm ger radien 10 / 2 = 5 cm.'],
      tips: 'Diameterduvan blandar ihop dem. Tänk: dia-METERN är den långa, hela vägen över.',
      prova: { mode: 'radie', level: 0 },
    },
  ] },

  'cirkelns-omkrets': { pages: [
    {
      title: 'Varvet runt hjulet',
      text: 'Rulla ett hjul ett varv på marken. Sträckan blir lite mer än tre diametrar – exakt π (pi) gånger diametern. π är ungefär 3,14.',
      pic: <Tavla rader={['O = π · d', ['d = 10 cm', 'dim'], 'O = 3,14 · 10 = 31,4 cm']} />,
      tips: 'Piraten Pi-lös glömmer π och tror att omkretsen är lika med diametern. Den är mer än tre gånger så lång!',
    },
    {
      title: 'Om du bara vet radien',
      text: 'Gör först om radien till diameter (gånger 2). Sedan gånger π.',
      steps: ['Radien är 5 cm.', 'Diametern: 5 · 2 = 10 cm.', 'Omkretsen: 3,14 · 10 = 31,4 cm.'],
      tips: 'Hur långt rullar hjulet på 3 varv? Omkretsen gånger 3.',
      prova: { mode: 'omkrets', level: 1 },
    },
  ] },

  'cirkelns-area': { pages: [
    {
      title: 'Ytan inuti cirkeln',
      text: 'Cirkelns area räknar man med radien: π gånger radien gånger radien.',
      pic: <Tavla rader={['A = π · r · r', ['r = 4 cm', 'dim'], '4 · 4 = 16', 'A = 3,14 · 16 ≈ 50,2 cm²']} />,
      tips: 'Area: radien två gånger. Omkrets: diametern en gång. Blanda inte ihop formlerna!',
    },
    {
      title: 'Halva och kvarts cirklar',
      text: 'En halvcirkel är halva arean. En kvartscirkel är en fjärdedel.\n\nRäkna först hela cirkeln, och dela sedan med 2 eller med 4.',
      steps: ['Hela cirkeln med radien 4: ungefär 50,2 cm².', 'Halva: 50,2 / 2 ≈ 25,1 cm².', 'En kvart: 50,2 / 4 ≈ 12,6 cm².'],
      tips: 'Står diametern i uppgiften? Ta hälften först, så har du radien.',
      prova: { mode: 'area', level: 1 },
    },
  ] },

  skala: { pages: [
    {
      title: 'Skala på en ritning',
      text: 'En ritning är mindre än verkligheten. Skala 1:100 betyder: 1 cm på ritningen är 100 cm i verkligheten.',
      pic: <Tavla rader={['skala 1:100', 'ritningen: 4 cm', ['verkligheten: 4 · 100 = 400 cm = 4 m', 'hi']]} />,
      steps: ['Från ritning till verklighet: gånger 100.', 'Från verklighet till ritning: delat med 100.'],
    },
    {
      title: 'Förstoring',
      text: 'Små saker ritas ibland större än de är. Skala 5:1 betyder: 5 cm på ritningen är bara 1 cm i verkligheten.\n\nEn skruv som är 15 mm på ritningen i skala 5:1 är 15 / 5 = 3 mm i verkligheten.',
      tips: 'Fråga dig: är bilden större eller mindre än verkligheten? Då vet du om det ska vara gånger eller delat.',
      prova: { mode: 'skala', level: 0 },
    },
  ] },
};
