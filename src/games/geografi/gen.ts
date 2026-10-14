import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { deckPick } from '../../engines/ord/check';
import type { Alt, Explained, KartaGame, KartaQ } from '../../engines/karta/types';
import { LAND_BY_ID } from './land';

// Kompassöns gemensamma delar: felkoder, förklaringar (som aldrig säger svaret) och hjälp att bygga frågor.
// Felkoderna är permanenta.

export interface GQ extends KartaQ {
  /** Det frågan handlar om (ett land, en stad, en plats), för förklaringarna. */
  om?: string;
}

export const ERR: Record<string, string> = {
  granne: 'Väljer ett grannland',
  'fel-land': 'Väljer ett annat land',
  'fel-varldsdel': 'Väljer fel världsdel',
  'liknande-namn': 'Blandar ihop länder med nästan samma namn',
  'storsta-staden': 'Tar en stor, känd stad i stället för huvudstaden',
  'granne-huvudstad': 'Tar grannlandets huvudstad',
  'fel-stad': 'Väljer en annan stad',
  'ar-huvudstad': 'Tror att en huvudstad inte är huvudstad',
  politisk: 'Tror att Grönland ligger i Europa (det hör till Danmark)',
  'nord-syd-amerika': 'Blandar ihop Nordamerika och Sydamerika',
  'oceanien-asien': 'Blandar ihop Asien och Australien (Oceanien)',
  'ost-vast': 'Blandar ihop öster och väster',
  'fel-vaderstreck': 'Läser fel på kompassrosen',
  'fel-riktning': 'Väljer fel håll',
  'norr-upp': 'Tror att norr alltid är uppåt på kartan',
  'skala-bakvand': 'Delar i stället för att gånga med skalan',
  'skala-glomd': 'Glömmer skalan och svarar med kartans mått',
  'skala-plus': 'Lägger ihop i stället för att gånga med skalan',
  'fel-symbol': 'Blandar ihop kartsymbolerna',
  'fel-hojd': 'Läser fel på höjdfärgerna',
  'fel-hav': 'Väljer fel hav',
  'norr-soder': 'Blandar ihop norr och söder om ekvatorn',
  'liknande-flagga': 'Blandar ihop flaggor som liknar varandra',
  'fel-landsdel': 'Väljer fel landsdel',
  'fel-landskap': 'Väljer fel landskap',
  'fel-plats': 'Väljer en annan plats',
};

const namnPa = (given: string) => LAND_BY_ID[given]?.namn ?? given;

/** Förklaringen vid fel. Säger hur man tänker – aldrig svaret. */
export function explain(tag: string, q: GQ, given: string): Explained {
  const om = q.om ?? 'det';
  switch (tag) {
    case 'granne':
      return q.kind === 'peka'
        ? { title: 'Ett grannland!', text: `Det du tryckte på ligger precis bredvid. Grannländer är lätta att blanda ihop – titta en gång till på var ${om} ligger.` }
        : { title: 'Ett grannland!', text: `${namnPa(given)} ligger precis bredvid. Titta en gång till på kartan och på namnen.` };
    case 'fel-land':
      return { title: 'Ett annat land', text: `Prova igen. ${q.tips}` };
    case 'fel-varldsdel':
      return { title: 'Fel världsdel', text: 'Tänk på var landet ligger på jordgloben. Vilka andra länder ligger i närheten? I vilken världsdel ligger de?' };
    case 'liknande-namn':
      return { title: 'Nästan samma namn!', text: `${namnPa(given)} och landet du söker har nästan samma namn. Läs namnet en gång till, bokstav för bokstav.` };
    case 'storsta-staden':
      return { title: 'Stor – men inte huvudstad', text: `${given} är en stor och känd stad. Men huvudstaden är staden där landets regering sitter, och den är inte alltid störst.` };
    case 'granne-huvudstad':
      return { title: 'Grannens huvudstad', text: `${given} är huvudstad – men i ett grannland. Vilken stad är huvudstad i just ${om}?` };
    case 'fel-stad':
      return { title: 'En annan stad', text: `${given} är inte rätt stad här. ${q.tips}` };
    case 'ar-huvudstad':
      return { title: 'Det är en huvudstad!', text: `${given} är faktiskt huvudstad i sitt land. Leta efter en stad som är stor och känd, men där regeringen inte sitter.` };
    case 'politisk':
      return { title: 'Grönland lurar!', text: 'Grönland hör till Danmark – men ön ligger långt bort från Danmark, på andra sidan Atlanten. Titta var ön ligger på jordgloben!' };
    case 'nord-syd-amerika':
      return { title: 'Två Amerika', text: 'Amerika är två världsdelar. Gränsen går vid Panama, där landet är som smalast. Ligger landet norr eller söder om den gränsen?' };
    case 'oceanien-asien':
      return { title: 'Öarna lurar', text: 'Öarna mellan Kina och Nya Zeeland är kluriga. Indonesien räknas till samma världsdel som Thailand och Kina. Papua Nya Guinea räknas till samma världsdel som Nya Zeeland och Fiji.' };
    case 'ost-vast':
      return { title: 'Öst och väst', text: 'Du blandade ihop öst och väst! Gå medsols runt kompassrosen från N: först kommer öst, sedan syd och sist väst. Kolla en gång till.' };
    case 'fel-vaderstreck':
      return { title: 'Läs rosen igen', text: 'Börja vid N och gå medsols runt kompassrosen. Mellan två väderstreck ligger ett som har båda namnen.' };
    case 'fel-riktning':
      return { title: 'Åt ett annat håll', text: `Det ligger åt ett annat håll. ${q.tips}` };
    case 'norr-upp':
      return { title: 'Titta på kompassrosen!', text: 'På den här kartan pekar N inte uppåt. Vrid kartan i tanken så att N pekar uppåt – var ligger platserna då?' };
    case 'skala-bakvand':
      return q.om === 'tillbaka'
        ? { title: 'Delat, inte gånger', text: 'På kartan är allt mindre än i verkligheten. Därför blir sträckan på kartan kortare. Dela med skalan.' }
        : { title: 'Gånger, inte delat', text: 'Allt på kartan är mindre än i verkligheten. Därför är sträckan i verkligheten längre än på kartan. Räkna gånger med skalan.' };
    case 'skala-glomd':
      return q.om === 'tillbaka'
        ? { title: 'Glöm inte skalan', text: 'Du svarade med hur långt det är i verkligheten. Men hur långt är det på kartan? Använd skalan.' }
        : { title: 'Glöm inte skalan', text: 'Du svarade med hur långt det är på kartan. Men hur långt är det i verkligheten? Använd skalan.' };
    case 'skala-plus':
      return { title: 'Gånger, inte plus', text: 'Varje centimeter på kartan är lika lång i verkligheten. Räkna gånger: antal centimeter gånger det en centimeter är värd.' };
    case 'fel-symbol':
      return { title: 'Titta på symbolen', text: 'Kartsymbolerna ser ut ungefär som det de visar. Titta på formen och färgen en gång till.' };
    case 'fel-hojd':
      return { title: 'Höjdfärgerna', text: 'På kartan visar färgen hur högt landet är: grönt är lågt, gult och ljusbrunt är högre, och mörkbrunt är högst.' };
    case 'fel-hav':
      return { title: 'Ett annat hav', text: 'Det är ett annat hav. Tänk på vilka världsdelar havet ligger mellan.' };
    case 'norr-soder':
      return { title: 'Ekvatorn', text: 'Ekvatorn är den streckade linjen mitt på jordklotet. Ligger det som är markerat ovanför eller nedanför linjen? Ovanför linjen är norr.' };
    case 'liknande-flagga':
      return { title: 'Nästan likadana!', text: 'De här flaggorna liknar varandra. Titta noga på färgerna, i vilken ordning de kommer och åt vilket håll ränderna går.' };
    case 'fel-landsdel':
      return { title: 'En annan landsdel', text: 'Titta var staden ligger på kartan: långt söderut, i mitten eller långt norrut?' };
    case 'fel-landskap':
      return { title: 'Ett annat landskap', text: `Det är ett annat landskap. ${q.tips}` };
    case 'fel-plats':
      return { title: 'Inte där', text: `Prova igen. ${q.tips}` };
    default:
      return { title: 'Inte riktigt', text: `Prova igen. ${q.tips}` };
  }
}

/* ---------- hjälp att bygga frågor ---------- */

/**
 * Alternativen: rätt svar och n fel. Felen med fällans felkod (och de "bästa" felen i prio) kommer först,
 * sedan slumpas resten. Samma text två gånger tas bort.
 */
export function valj(rng: Rng, right: Alt, wrong: Alt[], n: number, prio: (string | undefined)[] = []): Alt[] {
  const seen = new Set([right.text]);
  const uniq = wrong.filter((a) => (seen.has(a.text) ? false : (seen.add(a.text), true)));
  const first: Alt[] = [];
  for (const tag of prio) {
    const a = tag && uniq.find((x) => x.err === tag && !first.includes(x));
    if (a) first.push(a);
  }
  const rest = rng.shuffle(uniq.filter((a) => !first.includes(a)));
  return rng.shuffle([right, ...[...first, ...rest].slice(0, n)]);
}

/** Ett kort ur rundans kortlek (inget upprepas i en runda). */
export const dra = <T>(pool: readonly T[], rng: Rng, ctx: QuestionCtx | undefined, key: string): T => deckPick(pool, rng, ctx, key);

/** Ett kartspel av en frågegenerator. gen får ge null; då dras en ny fråga. */
export function geoGame(id: string, gen: (spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx, försök?: number) => GQ | null, specsForSkill: (skill: string) => QuestionSpec[]): KartaGame<GQ> {
  return {
    id,
    make(spec, rng, ctx) {
      for (let i = 0; i < 60; i++) {
        // Efter ett misslyckat försök flyttas kortleken ett steg, så att samma kort inte dras igen.
        const q = gen(spec, rng, ctx && i ? { ...ctx, index: ctx.index + i * 7 } : ctx, i);
        if (q) return q;
      }
      throw new Error(`${id}: ingen fråga för ${JSON.stringify(spec)}`);
    },
    explain: (tag, q, given) => explain(tag, q, given),
    specsForSkill,
    errLabels: ERR,
  };
}

/** Lägen och nivåer → färdighet. specsForSkill byggs från samma tabell. */
export function skillTabell(rows: { mode: string; levels: number[]; skill: (level: number) => string }[]) {
  return (skill: string): QuestionSpec[] =>
    rows.flatMap((r) => r.levels.filter((l) => r.skill(l) === skill).map((level) => ({ mode: r.mode, level })));
}
