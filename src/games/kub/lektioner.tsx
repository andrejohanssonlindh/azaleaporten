import { useMemo } from 'preact/hooks';
import type { Lesson } from '../../platform/rpg/types';
import { Rad, Text } from '../../engines/lektion/bilder';
import { BITAR, LOST, PLATSER, inv, paPlats, parse, visaAlg, vrid, type Drag, type Kub } from '../../engines/kub/kub';
import { ALG, delDrag, los, type Del } from '../../engines/kub/losning';
import { Kub3D, KubFilm, KubLek, ToppBild } from '../../engines/kub/Kub3D';
import { rngFrom } from '../../platform/rng';
import { blanda, tillsDetSitter } from './logic';

// Kublabbets klassrum. Varje drag och varje kubprogram visas på en kub i 3D som går att spela upp,
// ett drag i taget. Lektionernas id:n är permanenta (se lessons i content.ts).
// Varje steg lärs ut som en strategi: hitta biten → ställ den rätt → gör knepet → kolla. Varje fall som
// barnet kan råka ut för har en egen film. Filmerna i de senare stegen börjar i riktiga lägen ur en lösning
// (FILM nedan, testas), så att de ser ut som barnets egen kub; de tidiga börjar med ett kubprogram baklänges.

const a = (id: keyof typeof ALG, n = 1) => visaAlg(Array.from({ length: n }, () => ALG[id].drag).flat()).replace(/′/g, "'");
const bak = (alg: string) => inv(parse(alg)).join(' ');

/** Gula toppen som en prick (ett riktigt läge ur en lösning). */
const PRICK: Kub = 'obyoygbrgyyrrrrrrryyobbbbbbwwwwwwwwwyyroooooogybgggggg';

const typ = (t: 'mitt' | 'kant' | 'horn') => BITAR.filter((b) => b.typ === t && (b.pos[1] === 1 || b.pos[0] === 1 || b.pos[2] === 1)).flatMap((b) => b.platser);
export const BLOMMA = vrid(LOST, 'F2 R2 B2 L2');
/** Blommans fyra fall i lektionen (testas: tre kronblad före, fyra efter). */
export const BLOMFALL = ['U F2', 'U R', "F U' R", "F' U' R"];
const kronbladen = BITAR.filter((b) => b.typ === 'kant' && b.pos[1] === 1).flatMap((b) => b.platser).filter((p) => BLOMMA[p] === 'w');
const korset = BITAR.filter((b) => b.typ === 'kant' && b.pos[1] === -1).flatMap((b) => b.platser);

const Bild = ({ kub = LOST, markera, vy, text }: { kub?: Kub; markera?: number[]; vy?: 'upp' | 'ner'; text: string }) => (
  <figure class="kub-figur">
    <Kub3D kub={kub} markera={markera} tona={!!markera} vy={vy} s={30} label={text} />
    <figcaption class="lb-caption">{text}</figcaption>
  </figure>
);


/** Ett riktigt läge ur en lösning: den första delen som passar, från blandningar med fasta frön (samma varje gång). */
export function hitta(ok: (d: Del, i: number, ds: Del[]) => boolean): { del: Del; i: number; delar: Del[] } {
  for (let s = 1; s < 500; s++) {
    const delar = los(vrid(LOST, blanda(rngFrom(s), 25)));
    const i = delar.findIndex((d, j) => ok(d, j, delar));
    if (i >= 0) return { del: delar[i], i, delar };
  }
  throw new Error('Inget läge för lektionen');
}

const UFR = BITAR.find((b) => b.pos.join() === '1,1,1')!;
/** Sidan som det vita på hörnet fram till höger uppe pekar åt (efter förberedelsen). */
const vittPa = (d: Del) => { const k = vrid(d.fore, d.forbered); return PLATSER[UFR.platser.find((i) => k[i] === 'w')!].sida; };
const helaSteget = (d: Del, i: number, ds: Del[]) => ds.slice(i).filter((_, j, r) => r.slice(0, j + 1).every((x) => x.steg === d.steg)).flatMap(delDrag);
const stegStart = (steg: Del['steg']) => (d: Del, i: number, ds: Del[]) => d.steg === steg && (i === 0 || ds[i - 1].steg !== steg);
const antal = (ds: Del[], steg: Del['steg']) => ds.filter((x) => x.steg === steg && x.alg.length).length;

interface FilmSpec { ok: (d: Del, i: number, ds: Del[]) => boolean; drag?: (d: Del, i: number, ds: Del[]) => Drag[] }

/** Filmerna i de senare lektionerna. Varje film visar ett fall, från ett riktigt läge. */
export const FILM: Record<string, FilmSpec> = {
  'kors-direkt': { ok: (d) => d.steg === 'kors' && d.forbered.length === 0 },
  'kors-vrid': { ok: (d) => d.steg === 'kors' && d.forbered.length === 1 && d.forbered[0] !== 'U2' },
  'horn-hitta': { ok: (d) => d.steg === 'horn' && !d.lossnar && d.forbered.some((m) => m[0] === 'U') && d.forbered.some((m) => m[0] === 'y') && d.ganger === 1 },
  'horn-hoger': { ok: (d) => d.steg === 'horn' && !d.lossnar && d.forbered.length === 0 && vittPa(d) === 'R' },
  'horn-upp': { ok: (d) => d.steg === 'horn' && !d.lossnar && d.forbered.length === 0 && vittPa(d) === 'U' },
  'horn-fram': { ok: (d) => d.steg === 'horn' && !d.lossnar && d.forbered.length === 0 && vittPa(d) === 'F' },
  'horn-fast': { ok: (d) => d.steg === 'horn' && !!d.lossnar, drag: (_d, i, ds) => tillsDetSitter(ds, i) },
  'mitten-h': { ok: (d) => d.steg === 'mitten' && !d.lossnar && d.algId === 'mitten-h' && d.forbered.length > 0 },
  'mitten-v': { ok: (d) => d.steg === 'mitten' && !d.lossnar && d.algId === 'mitten-v' && d.forbered.length > 0 },
  'mitten-fast': { ok: (d) => d.steg === 'mitten' && !!d.lossnar, drag: (_d, i, ds) => tillsDetSitter(ds, i) },
  'gulkors-prick': { ok: (d, i, ds) => stegStart('gulkors')(d, i, ds) && antal(ds, 'gulkors') === 3, drag: helaSteget },
  'gulkant-bredvid': { ok: (d, i, ds) => stegStart('gulkant')(d, i, ds) && antal(ds, 'gulkant') === 1 && d.forbered.length > 0, drag: helaSteget },
  'gulkant-mittemot': { ok: (d, i, ds) => stegStart('gulkant')(d, i, ds) && antal(ds, 'gulkant') === 2, drag: helaSteget },
  'gulhorn-ett': { ok: (d, i, ds) => stegStart('gulhorn')(d, i, ds) && antal(ds, 'gulhorn') === 1 && d.forbered.length > 0, drag: helaSteget },
  'gulhorn-inget': { ok: (d, i, ds) => stegStart('gulhorn')(d, i, ds) && antal(ds, 'gulhorn') === 2 && !BITAR.some((b) => b.pos[1] === 1 && b.typ === 'horn' && paPlats(d.fore, b)), drag: helaSteget },
  'vridhorn-alla': { ok: (d, i, ds) => stegStart('vridhorn')(d, i, ds) && antal(ds, 'vridhorn') === 3, drag: helaSteget },
};

/** En film som börjar i ett riktigt läge (räknas ut först när sidan visas). */
function Film({ id, text, vy, grupp }: { id: keyof typeof FILM; text: string; vy?: 'upp' | 'ner'; grupp?: number }) {
  const { fran, alg, bit } = useMemo(() => {
    const f = FILM[id];
    const { del, i, delar } = hitta(f.ok);
    return { fran: del.fore, alg: (f.drag ?? ((d: Del) => delDrag(d)))(del, i, delar).join(' '), bit: del.bit };
  }, [id]);
  return <KubFilm fran={fran} alg={alg} vy={vy} grupp={grupp} text={text} bit={bit} />;
}

/** Ett riktigt läge med ett hörn som är på plats (men kanske fel vänt) markerat. */
function PaPlatsBild() {
  const { kub, markera } = useMemo(() => {
    const { del } = hitta((d, i, ds) => FILM['gulhorn-ett'].ok(d, i, ds));
    const k = vrid(del.fore, del.forbered);
    return { kub: k, markera: UFR.platser };
  }, []);
  return <Bild kub={kub} markera={markera} text="Hörnet som lyser är på plats: samma tre färger som mittbitarna runt det." />;
}

export const KUBLABBET: Record<string, Lesson> = {
  'kubens-delar': { pages: [
    {
      title: 'Tre sorters bitar',
      text: 'En Rubiks kub har sex sidor med nio rutor på varje. Men titta noga: kuben är byggd av små bitar som sitter ihop.\n\nMittbitarna sitter mitt på varje sida. De har bara en färg. Kantbitarna har två färger, och hörnbitarna har tre.',
      pic: <Rad>
        <Bild markera={typ('mitt')} text="Mittbitar: en färg" />
        <Bild markera={typ('kant')} text="Kantbitar: två färger" />
        <Bild markera={typ('horn')} text="Hörnbitar: tre färger" />
      </Rad>,
      tips: 'Dra i kuben med fingret för att titta runt – då kan du trycka på bitarna på baksidan också. Tryck ↺ Rätt vy för att vrida tillbaka.',
      prova: { mode: 'bitar', level: 0 },
    },
    {
      title: 'Mittbitarna flyttar sig aldrig',
      text: 'Hur du än vrider sitter mittbitarna kvar. Därför visar de vilken färg varje sida ska ha.\n\nI Kublabbet håller vi alltid kuben med den gula mitten uppåt och den vita nedåt. Sidan som tittar på dig heter F, fram.',
      pic: <KubLek />,
      tips: 'Prova knapparna! Titta på mittbitarna – de snurrar men stannar på sin plats.',
    },
    {
      title: 'Var hör biten hemma?',
      text: 'Varje kant och hörn har en egen plats. En bit hör hemma mellan mittbitarna som har samma färger som biten.\n\nDen vit-röda kanten hör hemma mellan den vita och den röda mittbiten. Mittbitarna visar vägen!',
      pic: <KubFilm setup="R U" alg="U' R'" text="Två drag – och bitarna hittar hem igen." />,
      steps: ['Vilka färger har biten? Titta på alla dess sidor.', 'Leta upp mittbitarna med samma färger.', 'Platsen där de mittbitarna möts är bitens hem.'],
      tips: 'Hittar du inte en bit? Dra i kuben och titta på baksidan och undersidan också.',
      prova: { mode: 'bitar', level: 2 },
    },
  ] },

  dragen: { pages: [
    {
      title: 'Sex bokstäver',
      text: 'Varje sida har en bokstav. Bokstäverna kommer från engelskan:\n\nR = höger (Right), L = vänster (Left), U = upp (Up), D = ner (Down), F = fram (Front) och B = bak (Back).\n\nEtt drag vrider sidan ett kvarts varv medurs – åt samma håll som klockans visare, när du tittar rakt på den sidan.',
      pic: <KubFilm alg="R" etiketter text="R: höger sida vrids. Framsidan åker uppåt." />,
      tips: 'Tänk dig att du står och tittar rakt på sidan som ska vridas. Då är medurs alltid som klockan.',
    },
    {
      title: 'R och L',
      text: 'R och L vrids åt olika håll, fast båda vrids medurs! Det är för att du tittar på dem från olika håll: R från höger och L från vänster.',
      tips: 'Knep: håll kuben med båda händerna. R = högra handen drar sin sida uppåt. L = vänstra handen drar sin sida neråt.',
      pic: <Rad>
        <KubFilm alg="R" text="R: framsidan åker upp." />
        <KubFilm alg="L" text="L: framsidan åker ner." />
      </Rad>,
    },
    {
      title: 'U och D',
      text: 'U vrider toppen. D vrider botten. Titta uppifrån på U och underifrån på D – båda vrids medurs.',
      pic: <Rad>
        <KubFilm alg="U" text="U: framsidans översta rad går åt vänster." />
        <KubFilm alg="D" text="D: framsidans nedersta rad går åt höger." />
      </Rad>,
    },
    {
      title: 'F och B',
      text: 'F vrider framsidan, den som tittar på dig. B vrider baksidan. B ser ut att gå baklänges, för du tittar på den bakifrån!',
      pic: <Rad>
        <KubFilm alg="F" text="F: framsidan vrids som klockan." />
        <KubFilm alg="B" text="B: baksidan vrids som klockan – sett bakifrån." />
      </Rad>,
      prova: { mode: 'drag', level: 0 },
    },
  ] },

  prim: { pages: [
    {
      title: 'Prim: åt andra hållet',
      text: 'Ett litet streck efter bokstaven heter prim: R′ (säg "R prim"). Det betyder att du vrider åt andra hållet, moturs.\n\nR′ tar tillbaka R. Gör R och sedan R′, så är kuben som förut!',
      pic: <Rad>
        <KubFilm alg="R R'" text="R och sedan R′: tillbaka igen." />
        <KubFilm alg="U'" text="U′: framsidans översta rad går åt höger." />
      </Rad>,
      tips: 'Krabban Bakfram vrider alltid åt fel håll. Titta på strecket!',
    },
    {
      title: 'En tvåa: ett halvt varv',
      text: 'R2 betyder ett halvt varv: vrid R två gånger. Det spelar ingen roll åt vilket håll du vrider – bara du vrider åt samma håll båda gångerna.',
      pic: <KubFilm alg="R2" text="R2: höger sida ett halvt varv." />,
      prova: { mode: 'drag', level: 1 },
    },
  ] },

  kubprogram: { pages: [
    {
      title: 'Ett kubprogram',
      text: 'Ett kubprogram är en lista med drag som du gör i ordning, ett i taget – precis som en robot gör sitt program. Ett finare ord för kubprogram är algoritm.',
      pic: <KubFilm alg="R U R' U'" text="Höger-tricket: R U R′ U′. Det kommer du att använda mycket!" />,
      steps: ['R: höger sida upp.', 'U: toppen åt vänster.', 'R′: höger sida ner igen.', 'U′: toppen tillbaka åt höger.'],
      prova: { mode: 'sekvens', level: 0 },
    },
    {
      title: 'Baklänges',
      text: 'Vill du ta tillbaka ett kubprogram gör du det baklänges: det sista draget först, och varje drag åt andra hållet.\n\nBaklänges för R U blir U′ R′.',
      pic: <KubFilm setup="R U" alg="U' R'" text="Kuben blandades med R U. Baklänges: U′ R′ – löst!" />,
      tips: 'Tänk på strumpor och skor. Du tar på strumporna först och skorna sist – men när du tar av dem börjar du med skorna!',
      prova: { mode: 'baklanges', level: 0 },
    },
  ] },

  blomman: { pages: [
    {
      title: 'En blomma runt den gula mitten',
      text: 'Första målet: fyra vita kanter med vitt uppåt, runt den gula mitten. Det ser ut som en gul blomma med vita kronblad!\n\nDu flyttar upp en vit kant i taget. Hur du gör beror på var kanten sitter och åt vilket håll det vita pekar. Det finns fyra fall – nästa sidor visar dem ett i taget.',
      pic: <Bild kub={BLOMMA} markera={kronbladen} text="Blomman: fyra vita kronblad." />,
      tips: 'Den gyllene regeln: innan du lyfter upp en kant, vrid toppen (U) så att platsen ovanför kanten är tom. Annars knuffar du ner ett kronblad du redan har!',
    },
    {
      title: 'Fall 1: nere, vitt nedåt',
      text: 'Kanten sitter i nedersta raden och det vita pekar rakt ner. Den är lättast!\n\nVrid U tills platsen rakt ovanför kanten är tom. Vrid sedan den sidan två gånger – kanten åker hela vägen upp, med vitt uppåt.',
      pic: <KubFilm fran={BLOMMA} setup={bak('U F2')} alg="U F2" vy="ner" text="Kuben underifrån. U: platsen ovanför blir tom. F2: kanten åker upp till toppen." />,
      steps: ['Titta underifrån: var sitter den vita kanten?', 'Vrid U tills platsen rakt ovanför är tom.', 'Vrid sidan där kanten sitter två gånger.'],
      tips: 'Tryck ⏭ Ett drag för att se ett drag i taget.',
    },
    {
      title: 'Fall 2: i mitten',
      text: 'Kanten sitter i mittenraden, mellan två sidor. Det vita pekar åt en av sidorna.\n\nVrid sidan som INTE har det vita, så att kanten åker uppåt. Då hamnar det vita uppe! Men först: vrid U så att platsen där kanten kommer upp är tom.',
      pic: <KubFilm fran={BLOMMA} setup={bak('U R')} alg="U R" text="Det vita pekar mot dig. U gör platsen tom, och R lyfter kanten uppåt." />,
      steps: ['Vilken sida pekar det vita åt? Den sidan ska du inte vrida.', 'Vrid U så att platsen ovanför den andra sidan är tom.', 'Vrid den andra sidan så att kanten åker uppåt.'],
      tips: 'Åker kanten nedåt i stället? Ångra, och vrid åt andra hållet (med ′).',
    },
    {
      title: 'Fall 3: uppe, vitt åt sidan',
      text: 'Kanten sitter redan uppe, men det vita pekar åt sidan i stället för uppåt. Den måste ner en bit och vända sig.\n\nVrid sidan som det vita pekar åt ett kvarts varv. Då hamnar kanten i mittenraden – och då är det fall 2!',
      pic: <KubFilm fran={BLOMMA} setup={bak("F U' R")} alg="F U' R" text="F: kanten ner i mitten. U′: platsen blir tom. R: upp med vitt uppåt." />,
      steps: ['Vrid sidan som det vita pekar åt ett kvarts varv (här F).', 'Nu sitter kanten i mitten – gör som i fall 2.', 'Vrid U så att platsen är tom, och lyft upp kanten.'],
    },
    {
      title: 'Fall 4: nere, vitt åt sidan',
      text: 'Kanten sitter nere, men det vita pekar åt sidan. Gör som i fall 3: vrid sidan som det vita pekar åt ett kvarts varv, så hamnar kanten i mittenraden. Sedan är det fall 2 igen!',
      pic: <KubFilm fran={BLOMMA} setup={bak("F' U' R")} alg="F' U' R" text="F′: kanten upp i mitten. U′: platsen blir tom. R: upp med vitt uppåt." />,
      steps: ['Vrid sidan som det vita pekar åt ett kvarts varv.', 'Nu sitter kanten i mitten – gör som i fall 2.'],
      tips: 'Alla fall slutar med fall 1 eller fall 2. Lär dig dem först!',
      prova: { mode: 'blomma', level: 0 },
    },
  ] },

  'vita-korset': { pages: [
    {
      title: 'Ner med kronbladen',
      text: 'Nu ska kronbladen ner till den vita mitten – men vid rätt mittbit.\n\nTitta på kronbladets andra färg, den som pekar åt sidan. Den visar vart kronbladet ska. Vrid toppen (U) tills den färgen står precis ovanför mittbiten med samma färg. Vrid sedan den sidan två gånger!',
      pic: <Rad>
        <Film id="kors-direkt" text="Fall A: kronbladet står redan ovanför sin mittbit. Bara två gånger ner!" />
        <Film id="kors-vrid" text="Fall B: vrid U först, tills färgerna står över varandra. Sedan ner." />
      </Rad>,
      steps: ['Välj ett kronblad. Vilken färg pekar åt sidan?', 'Vrid U tills den färgen står ovanför mittbiten med samma färg.', 'Vrid den sidan två gånger (F2, R2, B2 eller L2).', 'Gör likadant med de andra tre.'],
      tips: 'Målarmusen tror att det räcker att botten är vit. Men varje kant måste passa mittbiten på sidan också!',
    },
    {
      title: 'Kolla underifrån',
      text: 'När alla fyra kronblad är nere syns ett vitt kors underifrån. Varje kant i korset passar mittbiten på sin sida.\n\nBlev en kant fel? Vrid samma sida två gånger igen, så åker den upp till toppen. Vrid U rätt och sätt ner den på nytt.',
      pic: <Bild vy="ner" markera={korset} text="Det vita korset, underifrån." />,
      prova: { mode: 'kors', level: 1 },
    },
  ] },

  hogertricket: { pages: [
    {
      title: 'Höger-tricket',
      text: 'Höger-tricket är R U R′ U′. Det är kubens viktigaste kubprogram!\n\nGör det sex gånger i rad, så är kuben precis som förut. Det betyder att tricket inte förstör något – det flyttar bara runt bitar en stund.',
      pic: <KubFilm alg="R U R' U'" etiketter text="R U R′ U′" />,
      tips: 'Säg det högt: "upp, vänster, ner, höger". R lyfter, U vrider toppen, R′ sänker och U′ vrider tillbaka.',
    },
    {
      title: 'Var hör hörnet hemma?',
      text: 'Hitta ett hörn med vitt i övre lagret. Titta på dess två andra färger. Hörnet hör hemma mellan mittbitarna med just de färgerna.\n\nVrid U tills hörnet står rakt ovanför sin plats. Vrid sedan hela kuben så att hörnet står fram till höger.',
      pic: <Film id="horn-hitta" grupp={4} text="U: hörnet ovanför sin plats. Hela kuben: fram till höger. Höger-tricket!" />,
      steps: ['Hitta ett hörn uppe med vitt.', 'Vilka två färger har det mer? De visar platsen.', 'Vrid U tills hörnet står rakt ovanför platsen.', 'Vrid hela kuben (↶ ↷) så att hörnet står fram till höger.'],
    },
    {
      title: 'Hur många gånger?',
      text: 'Gör höger-tricket tills hörnet sitter. Hur många gånger det behövs ser du på det vita:\n\nVitt pekar åt höger: 1 gång. Vitt pekar uppåt: 3 gånger. Vitt pekar mot dig: 5 gånger.',
      pic: <Rad>
        <Film id="horn-hoger" grupp={4} text="Vitt åt höger: 1 gång." />
        <Film id="horn-upp" grupp={4} text="Vitt uppåt: 3 gånger." />
        <Film id="horn-fram" grupp={4} text="Vitt mot dig: 5 gånger." />
      </Rad>,
      tips: 'Det övre lagret blandas om när du gör tricket. Det gör inget – det fixar vi sedan!',
    },
    {
      title: 'Ett hörn som har fastnat',
      text: 'Sitter ett vitt hörn nere, men på fel plats eller fel vänt? Då har det fastnat.\n\nVrid hela kuben så att hörnet står nere fram till höger. Gör höger-tricket en gång. Då åker hörnet upp, och du kan sätta in det som vanligt.',
      pic: <Film id="horn-fast" grupp={4} text="Höger-tricket en gång lossar hörnet. Sedan in som vanligt." />,
      tips: 'Finns det inget vitt hörn uppe, men vita sidan är inte klar? Då har ett hörn fastnat.',
      prova: { mode: 'horn', level: 0 },
    },
  ] },

  mittenlagret: { pages: [
    {
      title: 'Hitta en kant',
      text: 'Nu ska fyra kanter in i mittenraden. Leta i övre lagret efter en kant som inte har gult. Kanter med gult hör till gula sidan – låt dem vara!\n\nTitta på kantens färg som pekar åt sidan. Vrid U tills den står ovanför mittbiten med samma färg. Vrid sedan hela kuben så att kanten står framme.',
      steps: ['Hitta en kant uppe utan gult.', 'Vrid U tills sidofärgen står ovanför sin mittbit.', 'Vrid hela kuben så att kanten står framme.'],
    },
    {
      title: 'Höger eller vänster?',
      text: 'Titta på färgen som pekar uppåt på kanten. Den visar vart kanten ska.\n\nSamma färg som mittbiten till höger? Gör mitten åt höger.\nSamma färg som mittbiten till vänster? Gör mitten åt vänster.',
      pic: <Rad>
        <Film id="mitten-h" text="Toppfärgen passar höger mittbit: U R U′ R′ U′ F′ U F" />
        <Film id="mitten-v" text="Toppfärgen passar vänster mittbit: U′ L′ U L U F U′ F′" />
      </Rad>,
      tips: 'Båda programmen börjar med att vrida U bort från hållet kanten ska – åt höger börjar med U, åt vänster med U′.',
    },
    {
      title: 'En kant som har fastnat',
      text: 'Finns det ingen kant uppe utan gult, men mittenraden är inte klar? Då sitter en kant fel i mittenraden.\n\nVrid hela kuben så att den står fram till höger, och gör mitten åt höger en gång. Då åker den upp, och du kan sätta in den rätt.',
      pic: <Film id="mitten-fast" text="Mitten åt höger lossar kanten. Sedan in åt rätt håll." />,
      tips: 'Bläckfisken Rörallt vrider på måfå och förstör vita sidan. Använd kubprogrammen – de lägger tillbaka allt!',
      prova: { mode: 'mitten', level: 0 },
    },
  ] },

  'gula-korset': { pages: [
    {
      title: 'Prick, L, linje, kors',
      text: 'Titta på gula sidan. Kanterna med gult uppåt bildar en prick, ett L, en linje eller ett kors. Hörnen bryr vi oss inte om än.\n\nKubprogrammet F R U R′ U′ F′ gör pricken till ett L, L:et till en linje och linjen till ett kors.',
      pic: <Rad>
        <ToppBild kub={PRICK} text="Prick" />
        <ToppBild kub={vrid(LOST, bak(a('gulkors', 2)))} text="L bak till vänster" />
        <ToppBild kub={vrid(LOST, bak(a('gulkors')))} text="Liggande linje" />
      </Rad>,
      tips: 'Håll rätt! L:et ska ligga bak till vänster, och linjen ska gå från vänster till höger. Vrid U tills det stämmer.',
    },
    {
      title: 'Från prick till kors',
      text: 'Så här går det från en prick hela vägen till ett kors. Mellan varje gång vrider du U så att formen ligger rätt.',
      pic: <Film id="gulkors-prick" text="Prick → L → linje → kors." />,
      steps: ['Prick: gör kubprogrammet.', 'Nu blev det ett L. Vrid U tills L:et ligger bak till vänster. Gör programmet.', 'Nu blev det en linje. Vrid U så att den ligger ner (vänster–höger). Gör programmet.', 'Kors!'],
      prova: { mode: 'gulkors', level: 0 },
    },
  ] },

  'gula-kanterna': { pages: [
    {
      title: 'Räkna kanterna som passar',
      text: 'Nu ska de gula kanterna passa mittbitarna på sidorna. Vrid U ett varv, ett kvarts varv i taget, och titta efter hur många kanter som passar. Stanna där flest passar – det är alltid minst två.',
      steps: ['Vrid U tills så många kanter som möjligt passar sin mittbit.', 'Passar alla fyra? Klart!', 'Passar två som sitter bredvid varandra? Se nästa sida.', 'Passar två mittemot varandra? Se sidan efter.'],
    },
    {
      title: 'Två bredvid varandra',
      text: 'Vrid hela kuben så att de två kanterna som passar sitter bak och till höger. Gör R U R′ U R U2 R′. Vrid sedan U tills alla fyra passar.',
      pic: <Film id="gulkant-bredvid" text="De som passar bak och till höger, kubprogrammet, och U till sist." />,
    },
    {
      title: 'Två mittemot varandra',
      text: 'Gör kubprogrammet en gång, hur kuben än står. Då blir det två bredvid varandra – och då gör du som på förra sidan.',
      pic: <Film id="gulkant-mittemot" text="En gång var som helst, sedan som vanligt." />,
      prova: { mode: 'gulkant', level: 0 },
    },
  ] },

  'gula-hornen': { pages: [
    {
      title: 'Är hörnet på plats?',
      text: 'Ett hörn är på plats när det har samma tre färger som mittbitarna runt det – även om det är vänt fel. Det gula får peka åt vilket håll som helst nu!\n\nTitta på varje hörn uppe, ett i taget: har det samma färger som de två mittbitarna bredvid (och gult)?',
      pic: <PaPlatsBild />,
    },
    {
      title: 'Ett hörn på plats',
      text: 'Vrid hela kuben så att hörnet som är på plats står fram till höger. Gör U R U′ L′ U R′ U′ L. Det hörnet står still, och de andra tre byter plats med varandra. Är de inte rätt än? Gör programmet en gång till.',
      pic: <Film id="gulhorn-ett" text="Hörnet på plats fram till höger – kubprogrammet – alla på plats!" />,
    },
    {
      title: 'Inget hörn på plats',
      text: 'Är inget hörn på plats? Gör kubprogrammet en gång, hur kuben än står. Då hamnar ett hörn på plats – och då gör du som på förra sidan.',
      pic: <Film id="gulhorn-inget" text="En gång var som helst, sedan med hörnet på plats fram till höger." />,
      prova: { mode: 'gulhorn', level: 0 },
    },
  ] },

  'vrid-hornen': { pages: [
    {
      title: 'Ner-tricket',
      text: 'Sista steget! Håll kuben så att ett hörn som är fel vänt står fram till höger uppe. Gör ner-tricket R′ D′ R D om och om igen tills gult pekar uppåt. Det behövs 2 eller 4 gånger.\n\nKuben ser trasig ut nere. Var inte rädd – den lagar sig själv!',
      pic: <KubFilm setup={bak(a('ner', 2))} alg={a('ner', 2)} grupp={4} text="Två gånger ner-tricket: gult pekar uppåt, och botten lagade sig." />,
    },
    {
      title: 'Nästa hörn',
      text: 'När hörnet är klart vrider du bara toppen (U), så att nästa felvända hörn kommer fram till höger. Vrid inte hela kuben nu – då lagar sig inte botten!\n\nNär alla hörn har gult uppåt vrider du U tills kuben är löst.',
      pic: <Film id="vridhorn-alla" text="Hörn för hörn: ner-tricket, U till nästa, ner-tricket … och U till sist." />,
      steps: ['Felvänt hörn fram till höger uppe.', 'R′ D′ R D tills gult pekar uppåt.', 'Vrid bara U till nästa felvända hörn.', 'Upprepa. Sist: vrid U på plats.'],
      tips: 'Ångra aldrig mitt i ner-tricket, och sluta inte förrän gult pekar uppåt. Kuben ser trasig ut tills det sista hörnet är klart.',
      prova: { mode: 'vridhorn', level: 0 },
    },
  ] },

  'hela-losningen': { pages: [
    {
      title: 'Åtta steg',
      text: 'Nu kan du hela metoden. Gul upp, vit ner – hela tiden.',
      steps: [
        'Blomman: fyra vita kronblad runt den gula mitten.',
        'Vita korset: ner med kronbladen vid rätt mittbit.',
        'Vita hörnen: höger-tricket R U R′ U′.',
        'Mittenlagret: mitten åt höger eller åt vänster.',
        'Gula korset: F R U R′ U′ F′.',
        'Gula kanterna: R U R′ U R U2 R′.',
        'Gula hörnen på plats: U R U′ L′ U R′ U′ L.',
        'Vrid gula hörnen: ner-tricket R′ D′ R D.',
      ],
      prova: { mode: 'steg', level: 0 },
    },
    {
      title: 'Var är jag?',
      text: 'Har du tappat bort dig? Gå igenom listan uppifrån och fråga: är det här klart?\n\nÄr den vita sidan hel underifrån, och passar sidorna? Då är första lagret klart. Är mittenraden hel runt om? Då är två lager klara. Sedan tittar du på gula sidan: kors? kanter? hörn?\n\nDet första som inte är klart är ditt steg.',
      tips: 'Ta det lugnt. Kolla efter varje steg att det förra fortfarande sitter.',
    },
    {
      title: 'Lös en hel kub!',
      text: 'Här är en blandad kub. Lös den med alla åtta stegen! Det tar en stund – riktiga kubare började också så här.\n\nFastnar du? Tryck 💡 Nästa drag.',
      pic: <Text>Tips: lös gärna en riktig kub bredvid!</Text>,
      prova: { mode: 'hela', level: 0 },
    },
  ] },
};
