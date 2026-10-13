import type { Lesson } from '../../../platform/rpg/types';
import { Rad, Tavla, Text } from '../../../engines/lektion/bilder';
import { Cells, Fig, Poly, Txt, type Pt } from '../draw';

// Svampens klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

const C = 26;
/** En figur till vänster om en spegel och (valfritt) spegelbilden eller en kopia till höger. */
function Spegel({ left, right }: { left: number[][]; right: 'spegel' | 'kopia' | 'tom' }) {
  const rows = left.length, half = left[0].length;
  const r = left.map((row) => (right === 'spegel' ? [...row].reverse() : right === 'kopia' ? row : row.map(() => 0)));
  const cells = left.map((row, i) => [...row, ...r[i]]);
  return (
    <Fig w={half * 2 * C + 4} h={rows * C + 4} label="Spegling i rutnät">
      <Cells cells={cells} x={2} y={2} size={C} />
      <line x1={2 + half * C} y1={0} x2={2 + half * C} y2={rows * C + 4} class="geo-mirror" />
    </Fig>
  );
}
const FIG = [[0, 1, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]];

const Linjer = ({ pts, lines, label }: { pts: Pt[]; lines: [Pt, Pt][]; label: string }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
    <Fig w={120} h={120} label={label}>
      <Poly pts={pts} />
      {lines.map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} class="geo-mirror" />)}
    </Fig>
    <Text>{label}</Text>
  </span>
);

const SYM = ['●', '▲', '■'];
const Monster = ({ unit, n, mark }: { unit: number[]; n: number; mark?: number }) => (
  <Fig w={n * 30 + 4} h={56} label="Mönster">
    {Array.from({ length: n }, (_, i) => (
      <g key={i}>
        <Txt at={[17 + i * 30, 18]} cls="geo-label">{SYM[unit[i % unit.length]]}</Txt>
        <Txt at={[17 + i * 30, 44]} cls={`geo-tiny${mark === i + 1 ? ' geo-label' : ''}`}>{i + 1}</Txt>
      </g>
    ))}
    {Array.from({ length: Math.floor(n / unit.length) }, (_, k) => (
      <rect key={k} x={3 + k * unit.length * 30} y={2} width={unit.length * 30 - 2} height={32} rx={8} class="geo-box" />
    ))}
  </Fig>
);

/** Växande mönster: figur 1–3 med start (grå) + en ny stapel med `step` rutor per figur. */
function Vaxa({ start, step }: { start: number; step: number }) {
  const t = 16;
  return (
    <Rad>
      {[1, 2, 3].map((f) => (
        <span key={f} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
          <Fig w={(f + 1) * t + 4} h={Math.max(start, step) * t + 4} label={`Figur ${f}`}>
            {Array.from({ length: start }, (_, i) => <rect key={`s${i}`} x={2} y={2 + (Math.max(start, step) - 1 - i) * t} width={t} height={t} class="geo-tile start" />)}
            {Array.from({ length: f * step }, (_, i) => <rect key={i} x={2 + (1 + Math.floor(i / step)) * t} y={2 + (Math.max(start, step) - 1 - (i % step)) * t} width={t} height={t} class="geo-tile" />)}
          </Fig>
          <Text>Figur {f}: {start + step * f}</Text>
        </span>
      ))}
    </Rad>
  );
}

export const LEKTIONER: Record<string, Lesson> = {
  spegla: { pages: [
    {
      title: 'En spegelbild vänder håll',
      text: 'När du speglar en figur blir den som i en spegel: det som var närmast spegeln är fortfarande närmast spegeln.\n\nKopiekatten flyttar bara över figuren som den är. Då blir det en kopia, inte en spegelbild!',
      pic: <Rad><span><Spegel left={FIG} right="spegel" /><Text>Spegelbild ✓</Text></span><span><Spegel left={FIG} right="kopia" /><Text>Bara en kopia ✗</Text></span></Rad>,
    },
    {
      title: 'Ruta för ruta',
      text: 'Spegla en ruta i taget. Räkna hur långt rutan är från spegeln, och lägg den lika långt bort på andra sidan.',
      pic: <Spegel left={FIG} right="tom" />,
      steps: ['Rutan längst ner till vänster ligger 4 rutor från spegeln.', 'På andra sidan ska den också ligga 4 rutor från spegeln – alltså längst ut till höger.', 'Rutorna som rör spegeln ska röra spegeln på andra sidan också.', 'Gör likadant med varje ruta.'],
      tips: 'Lägg en riktig spegel (eller en mobil med svart skärm) på linjen och titta!',
      prova: { mode: 'spegla', level: 1 },
    },
  ] },

  symmetrilinjer: { pages: [
    {
      title: 'Vik på mitten',
      text: 'En figur är symmetrisk om du kan vika den så att halvorna hamnar precis på varandra. Vikningen kallas symmetrilinje.\n\nEn kvadrat har fyra symmetrilinjer: två raka och två på snedden.',
      pic: <Linjer pts={[[20, 20], [100, 20], [100, 100], [20, 100]]} lines={[[[60, 8], [60, 112]], [[8, 60], [112, 60]], [[12, 12], [108, 108]], [[108, 12], [12, 108]]]} label="Kvadrat: 4 linjer" />,
    },
    {
      title: 'Diagonalen lurar',
      text: 'Flamingon Snedvik tror att diagonalen alltid är en symmetrilinje. Men vik en rektangel på snedden – då sticker hörnen ut!\n\nEn rektangel har bara två symmetrilinjer.',
      pic: <Rad>
        <Linjer pts={[[10, 35], [110, 35], [110, 85], [10, 85]]} lines={[[[60, 25], [60, 95]], [[2, 60], [118, 60]]]} label="Rektangel: 2 linjer" />
        <Linjer pts={[[10, 35], [110, 35], [110, 85], [10, 85]]} lines={[[[10, 35], [110, 85]]]} label="Inte en symmetrilinje!" />
      </Rad>,
      tips: 'Tänk dig att du viker papperet. Hamnar varje hörn på ett annat hörn? Då är det en symmetrilinje.',
      prova: { mode: 'linjer', level: 1 },
    },
  ] },

  'monster-upprepas': { pages: [
    {
      title: 'Hitta det som upprepas',
      text: 'Ett mönster är en bit som upprepas om och om igen. Leta efter biten: här är den ● ▲ ■, tre former lång.',
      pic: <Monster unit={[0, 1, 2]} n={9} />,
    },
    {
      title: 'Långt fram i mönstret',
      text: 'Vilken form står på plats 20? Du behöver inte rita alla. Biten är 3 lång, så varje bit slutar på 3, 6, 9, 12, 15, 18 … (treans tabell!).',
      steps: ['Närmaste tal i treans tabell före 20 är 18.', 'På plats 18 slutar en bit, med ■.', 'Plats 19 är början på en ny bit: ●.', 'Plats 20 är nästa: ▲.'],
      tips: 'Ta inte bara nästa form i bilden – räkna hela vägen fram till platsen som frågan gäller.',
      prova: { mode: 'upprepa', level: 2 },
    },
  ] },

  'vaxande-monster': { pages: [
    {
      title: 'Ett mönster som växer',
      text: 'Här börjar varje figur med 1 grå ruta, och sedan kommer 3 nya rutor för varje figur.',
      pic: <Vaxa start={1} step={3} />,
      steps: ['Figur 1: 1 + 3 = 4 rutor.', 'Figur 2: 1 + 3 + 3 = 7 rutor.', 'Figur 3: 1 + 3 + 3 + 3 = 10 rutor.'],
    },
    {
      title: 'Figur 10 utan att rita',
      text: 'Figur 10 har den grå rutan och 10 grupper med 3 nya rutor.',
      pic: <Tavla rader={['start + steg · figur', ['1 + 3 · 10 = 31', 'hi'], ['inte 3 · 10 = 30', 'dim'], ['inte 4 · 10 = 40', 'dim']]} />,
      tips: 'Glöm inte rutorna som fanns från början. Och ta inte första figuren gånger 10!',
      prova: { mode: 'vaxa', level: 2 },
    },
  ] },

  'spegla-koordinat': { pages: [
    {
      title: 'Lika långt på andra sidan',
      text: 'Spegla punkten (2, 5) i linjen x = 4. Bara x ändras när linjen står upp och ner.',
      steps: ['Hur långt är det från x = 2 till linjen x = 4? 2 steg.', 'Gå 2 steg till på andra sidan: 4 + 2 = 6.', 'Spegelbilden är (6, 5). y är samma som förut.'],
      pic: <Tavla rader={['från 2 till 4: 2 steg', ['4 + 2 = 6', 'hi'], '(2, 5) → (6, 5)']} />,
      tips: 'Stanna inte på linjen – spegelbilden ligger lika långt bort på andra sidan.',
      prova: { mode: 'koordinat', level: 2 },
    },
  ] },
};
