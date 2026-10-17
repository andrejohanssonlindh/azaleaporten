import type { Lesson } from '../../platform/rpg/types';
import { Rad, Text } from '../../engines/lektion/bilder';
import { BITAR, LOST, inv, parse, visaAlg, vrid, type Kub } from '../../engines/kub/kub';
import { ALG } from '../../engines/kub/losning';
import { Kub3D, KubFilm, KubLek, ToppBild } from '../../engines/kub/Kub3D';

// Kublabbets klassrum. Varje drag och varje kubprogram visas på en kub i 3D som går att spela upp,
// ett drag i taget. Lektionernas id:n är permanenta (se lessons i content.ts).
// Exemplen börjar oftast med kubprogrammet baklänges, så att det slutar med en löst kub.

const a = (id: keyof typeof ALG, n = 1) => visaAlg(Array.from({ length: n }, () => ALG[id].drag).flat()).replace(/′/g, "'");
const bak = (alg: string) => inv(parse(alg)).join(' ');

/** Gula toppen som en prick (ett riktigt läge ur en lösning). */
const PRICK: Kub = 'obyoygbrgyyrrrrrrryyobbbbbbwwwwwwwwwyyroooooogybgggggg';

const typ = (t: 'mitt' | 'kant' | 'horn') => BITAR.filter((b) => b.typ === t && (b.pos[1] === 1 || b.pos[0] === 1 || b.pos[2] === 1)).flatMap((b) => b.platser);
const BLOMMA = vrid(LOST, 'F2 R2 B2 L2');
const kronbladen = BITAR.filter((b) => b.typ === 'kant' && b.pos[1] === 1).flatMap((b) => b.platser).filter((p) => BLOMMA[p] === 'w');
const korset = BITAR.filter((b) => b.typ === 'kant' && b.pos[1] === -1).flatMap((b) => b.platser);

const Bild = ({ kub = LOST, markera, vy, text }: { kub?: Kub; markera?: number[]; vy?: 'upp' | 'ner'; text: string }) => (
  <figure class="kub-figur">
    <Kub3D kub={kub} markera={markera} tona={!!markera} vy={vy} s={30} label={text} />
    <figcaption class="lb-caption">{text}</figcaption>
  </figure>
);

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
      tips: 'Dra i kuben med fingret för att titta runt. När du släpper hoppar den tillbaka.',
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
      text: 'Första målet: fyra vita kanter med vitt uppåt, runt den gula mitten. Det ser ut som en gul blomma med vita kronblad!\n\nLeta upp de vita kanterna och flytta upp dem, en i taget.',
      pic: <Bild kub={BLOMMA} markera={kronbladen} text="Blomman: fyra vita kronblad." />,
    },
    {
      title: 'Flytta upp ett kronblad',
      text: 'Kanterna kan sitta på olika ställen. Börja med de lätta!',
      pic: <KubFilm setup="F2 R2 B2" alg="L2" text="Den vit-röda kanten satt nere med vitt nedåt. L2 – och den blev ett kronblad!" />,
      steps: [
        'Hitta en vit kant. Titta också underifrån!',
        'Sitter den nere med vitt nedåt? Vrid den sidan två gånger.',
        'Sitter den i mittenlagret? Vrid sidan bredvid ett kvarts varv, så åker den upp med vitt uppåt.',
        'Pekar det vita åt sidan? Vrid den sidan en gång, så hamnar kanten i mittenlagret. Fortsätt sedan som ovan.',
        'Är platsen ovanför redan upptagen av ett kronblad? Vrid toppen (U) först, så att platsen blir ledig.',
      ],
      tips: 'Kronbladen får flytta runt på toppen. Det viktiga är att de stannar uppe!',
      prova: { mode: 'blomma', level: 0 },
    },
  ] },

  'vita-korset': { pages: [
    {
      title: 'Ner med kronbladen',
      text: 'Nu ska kronbladen ner till den vita mitten – men vid rätt mittbit.\n\nTitta på kronbladets andra färg, den som pekar åt sidan. Vrid toppen (U) tills den färgen står precis ovanför mittbiten med samma färg. Vrid sedan den sidan två gånger!',
      pic: <KubFilm setup={bak('U F2')} alg="U F2" text="U: nu står det gröna ovanför den gröna mitten. F2: ner!" />,
      steps: ['Välj ett kronblad.', 'Vrid U tills sidofärgen står ovanför sin mittbit.', 'Vrid den sidan två gånger, till exempel F2.', 'Gör likadant med de andra tre.'],
      tips: 'Målarmusen tror att det räcker att botten är vit. Men varje kant måste passa mittbiten på sidan också!',
    },
    {
      title: 'Kolla underifrån',
      text: 'När alla fyra kronblad är nere syns ett vitt kors underifrån. Varje kant i korset passar mittbiten på sin sida.',
      pic: <Bild vy="ner" markera={korset} text="Det vita korset, underifrån." />,
      prova: { mode: 'kors', level: 1 },
    },
  ] },

  hogertricket: { pages: [
    {
      title: 'Höger-tricket',
      text: 'Höger-tricket är R U R′ U′. Det är kubens viktigaste kubprogram!\n\nGör det sex gånger i rad, så är kuben precis som förut. Det betyder att tricket inte förstör något – det flyttar bara runt bitar en stund.',
      pic: <KubFilm alg="R U R' U'" etiketter text="R U R′ U′" />,
    },
    {
      title: 'Sätt in ett vitt hörn',
      text: 'Nu ska de vita hörnen ner, så att hela vita sidan blir klar.',
      pic: <KubFilm setup={bak(a('hoger', 3))} alg={a('hoger', 3)} grupp={4} text="Hörnet stod ovanför sin plats. Tre gånger höger-tricket – och det sitter!" />,
      steps: [
        'Hitta ett hörn med vitt i övre lagret.',
        'Vrid U tills hörnet står ovanför sin plats, mellan mittbitarna med samma färger.',
        'Vrid hela kuben så att hörnet står fram till höger.',
        'Gör höger-tricket om och om igen tills hörnet sitter. Det behövs 1, 3 eller 5 gånger.',
      ],
      tips: 'Det övre lagret blandas om när du gör tricket. Det gör inget – det fixar vi sedan!',
    },
    {
      title: 'Ett hörn som har fastnat',
      text: 'Sitter ett vitt hörn nere, men på fel plats eller fel vänt? Vrid hela kuben så att hörnet står nere fram till höger. Gör höger-tricket en gång. Då åker hörnet upp, och du kan sätta in det som vanligt.',
      prova: { mode: 'horn', level: 0 },
    },
  ] },

  mittenlagret: { pages: [
    {
      title: 'Vart ska kanten?',
      text: 'Leta upp en kant i övre lagret som inte har gult. Vrid U tills kantens färg på framsidan står ovanför mittbiten med samma färg.\n\nTitta sedan på färgen som pekar uppåt. Den visar vart kanten ska: åt höger eller åt vänster.',
      pic: <Rad>
        <KubFilm setup={bak(a('mitten-h'))} alg={a('mitten-h')} text="Mitten åt höger: U R U′ R′ U′ F′ U F" />
        <KubFilm setup={bak(a('mitten-v'))} alg={a('mitten-v')} text="Mitten åt vänster: U′ L′ U L U F U′ F′" />
      </Rad>,
      steps: ['Hitta en kant uppe utan gult.', 'Vrid U, och vrid hela kuben, tills kanten står fram ovanför mittbiten med samma färg.', 'Ska den åt höger? Gör mitten åt höger.', 'Ska den åt vänster? Gör mitten åt vänster.'],
      tips: 'Har kanten gult? Då hör den till gula sidan. Låt den vara!',
    },
    {
      title: 'En kant som har fastnat',
      text: 'Sitter en kant i mittenlagret men fel? Vrid hela kuben så att den står fram till höger, och gör mitten åt höger. Då åker den upp, och du kan sätta in den rätt.',
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
      title: 'Från linje till kors',
      text: 'Här är en liggande linje. Ett kubprogram – och korset är klart!',
      pic: <KubFilm setup={bak(a('gulkors'))} alg={a('gulkors')} text="F R U R′ U′ F′" />,
      prova: { mode: 'gulkors', level: 0 },
    },
  ] },

  'gula-kanterna': { pages: [
    {
      title: 'Kanterna mot sina mittbitar',
      text: 'Nu ska de gula kanterna passa mittbitarna på sidorna. Vrid U tills två kanter passar.\n\nSitter de bredvid varandra? Håll dem bak och till höger. Gör R U R′ U R U2 R′ och vrid U till sist.\n\nSitter de mittemot varandra? Gör kubprogrammet en gång var som helst. Då blir det två bredvid varandra.',
      pic: <KubFilm setup={bak(a('gulkant'))} alg={a('gulkant')} text="R U R′ U R U2 R′" />,
      prova: { mode: 'gulkant', level: 0 },
    },
  ] },

  'gula-hornen': { pages: [
    {
      title: 'Hörnen på rätt plats',
      text: 'Ett hörn är på plats när det har samma tre färger som mittbitarna runt det – även om det är vänt fel.\n\nHitta ett hörn som är på plats. Vrid hela kuben så att det står fram till höger, och gör U R U′ L′ U R′ U′ L. Behövs det, gör det en gång till.\n\nÄr inget hörn på plats? Gör kubprogrammet en gång och leta igen.',
      pic: <KubFilm setup={bak(a('gulhorn'))} alg={a('gulhorn')} text="Hörnet fram till höger står still. De andra tre byter plats." />,
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
      text: 'När hörnet är klart vrider du bara toppen (U), så att nästa felvända hörn kommer fram till höger. Vrid inte hela kuben nu!\n\nNär alla hörn har gult uppåt vrider du U tills kuben är löst.',
      steps: ['Felvänt hörn fram till höger uppe.', 'R′ D′ R D tills gult pekar uppåt.', 'Vrid bara U till nästa felvända hörn.', 'Upprepa. Sist: vrid U på plats.'],
      tips: 'Ångra aldrig mitt i ner-tricket. Kuben ser trasig ut tills det sista hörnet är klart.',
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
      tips: 'Vet du inte var du är? Gå igenom stegen i ordning. Det första som inte är klart är ditt steg.',
      prova: { mode: 'steg', level: 0 },
    },
    {
      title: 'Lös en hel kub!',
      text: 'Här är en blandad kub. Lös den med alla åtta stegen! Det tar en stund – riktiga kubare började också så här.\n\nFastnar du? Tryck 💡 Nästa drag.',
      pic: <Text>Tips: lös gärna en riktig kub bredvid!</Text>,
      prova: { mode: 'hela', level: 0 },
    },
  ] },
};
