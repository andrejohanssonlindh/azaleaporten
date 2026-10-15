import type { Lesson } from '../../platform/rpg/types';
import { honest } from '../../engines/diagram/chart';
import { ChartView } from '../../engines/diagram/ChartView';
import { EXEMPEL_MEDEL, EXEMPEL_MEDIAN } from './lage';
import { EXEMPEL_CIRKEL, EXEMPEL_PROCENT } from './rost';
import { EXEMPEL_AXEL, EXEMPEL_YTA } from './spegel';
import { EXEMPEL_LINJE, EXEMPEL_TVA } from './vader';

// Diagramdalens klassrum, del två: Väderstationen, Omröstningstorget, Vågmästarens bod, Spegelsalen och Skvallerpressen.
// Lektionernas id:n är permanenta (se lessons i content.ts).

export const VADERSTATIONEN: Record<string, Lesson> = {
  'linjen-visar-forandring': { pages: [
    {
      title: 'Läs en punkt',
      text: 'I ett linjediagram står tiden längst ner. Gå rakt upp från tiden till punkten, och sedan rakt åt sidan till axeln. Där står värdet.',
      pic: <ChartView chart={EXEMPEL_LINJE} />,
      steps: ['Leta upp Kl 10 längst ner.', 'Gå rakt upp till punkten, och sedan åt sidan till axeln: 14.', 'Det var 14 grader klockan 10.'],
      prova: { mode: 'las', level: 0 },
    },
    {
      title: 'Upp och ner',
      text: 'När linjen går uppåt ökar det: temperaturen stiger. När linjen går nedåt minskar det: temperaturen sjunker.',
      pic: <ChartView chart={EXEMPEL_LINJE} />,
      steps: ['Från kl 12 till kl 14 går linjen nedåt.', 'Den går från 16 till 12.', 'Temperaturen sjönk 4 grader.'],
      prova: { mode: 'forandring', level: 1 },
    },
    {
      title: 'Toppjägarens fälla',
      text: 'När ökade det mest? Toppjägaren pekar alltid på toppen. Men titta i stället på hur brant linjen går uppåt mellan två punkter bredvid varandra.',
      pic: <ChartView chart={EXEMPEL_LINJE} />,
      steps: ['Kl 6 till kl 8: från 4 till 8. Det är 4 grader.', 'Kl 8 till kl 10: från 8 till 14. Det är 6 grader – brantast!', 'Kl 10 till kl 12: från 14 till 16. Bara 2 grader, fast toppen är där.'],
      tips: 'Brantast uppåt = mest ökning. Högst upp = varmast. Det är två olika frågor!',
      prova: { mode: 'forandring', level: 0 },
    },
  ] },

  'tva-linjer': { pages: [
    {
      title: 'Två linjer',
      text: 'Ibland finns två linjer i samma diagram. Teckenförklaringen ovanför säger vilken som är vilken.',
      pic: <ChartView chart={EXEMPEL_TVA} />,
      steps: ['Linjen med runda prickar är dalen.', 'Den streckade linjen med fyrkanter är berget.', 'Kl 12: dalen 16 grader, berget 12 grader. Det var 4 grader varmare i dalen.'],
      prova: { mode: 'tva', level: 0 },
    },
    {
      title: 'Sätt ut punkter',
      text: 'När du ritar ett linjediagram sätter du en punkt för varje tid. Läs talet i tabellen, och sätt punkten lika högt som talet vid axeln. Linjen dras mellan punkterna.',
      prova: { mode: 'rita', level: 0 },
    },
    {
      title: 'Vilket diagram passar?',
      text: 'Något som ändras över tid – som temperaturen eller hur lång en blomma är – passar i ett linjediagram.\n\nDelar av en helhet – som hur stor del av klassen som cyklar – passar i ett cirkeldiagram.\n\nHur många det finns av olika saker passar i ett stapeldiagram.',
      prova: { mode: 'valj', level: 0 },
    },
  ] },
};

export const OMROSTNINGSTORGET: Record<string, Lesson> = {
  'cirkeln-ar-alla': { pages: [
    {
      title: 'Hela cirkeln är alla',
      text: 'I ett cirkeldiagram är hela cirkeln alla som röstade. Varje bit är de som röstade på samma sak. Ju större bit, desto fler.',
      pic: <ChartView chart={EXEMPEL_CIRKEL} />,
      steps: ['Katt har en halv cirkel: hälften röstade på katt.', 'Hund och kanin har lika stora bitar.', 'Två sådana bitar är en halv cirkel, så var och en är en fjärdedel.'],
      prova: { mode: 'cirkel', level: 0 },
    },
    {
      title: 'Halva, kvarta och tredjedel',
      text: 'Hur stor del är biten? Tänk dig hur många lika stora bitar som skulle fylla cirkeln. Två bitar: hälften. Tre bitar: en tredjedel. Fyra bitar: en fjärdedel.',
      tips: 'En fjärdedel ser ut som ett hörn – som en fjärdedels pizza.',
      prova: { mode: 'cirkel', level: 1 },
    },
    {
      title: 'Från staplar till cirkel',
      text: 'Samma röster kan visas med staplar. Lägg ihop alla staplarna: det är hela cirkeln. Sedan ser du hur stor del varje stapel är.',
      steps: ['Katt 6, hund 3, kanin 3.', 'Alla: 6 + 3 + 3 = 12.', 'Katt har 6 av 12. Det är hälften.'],
      prova: { mode: 'jamfor', level: 0 },
    },
  ] },

  'procent-av-hundra': { pages: [
    {
      title: 'Av hundra',
      text: 'Procent betyder "av hundra". 50 % är hälften, och 25 % är en fjärdedel. Om precis hundra röstade är 30 % samma sak som 30 röster.',
      pic: <ChartView chart={EXEMPEL_PROCENT} />,
      prova: { mode: 'procent', level: 0 },
    },
    {
      title: 'Andelsankans fälla',
      text: 'Andelsankan tror att 30 % alltid är 30 stycken. Men om 200 röstade blir det fler!',
      steps: ['1 % av 200 är 2.', '30 % är då 30 · 2 = 60.', '60 röstade på hund.'],
      tips: 'Kolla alltid hur många som var med innan du räknar om procenten.',
      prova: { mode: 'procent', level: 1 },
    },
    {
      title: 'Baklänges: hur många procent?',
      text: 'Om du vet hur många, kan du räkna ut procenten. Ta reda på hur mycket en procent är, och se hur många sådana som får plats.',
      steps: ['60 av 200 röstade på hund.', '1 % av 200 är 2.', '60 / 2 = 30. Det är 30 %.'],
      prova: { mode: 'procent', level: 2 },
    },
  ] },
};

export const VAGMASTARENS_BOD: Record<string, Lesson> = {
  'medelvarde-dela-lika': { pages: [
    {
      title: 'Dela lika',
      text: 'Ekorren har 2 kastanjer, haren 7 och igelkotten 3. Om de delar lika – hur många får var och en? Det är medelvärdet.',
      pic: <ChartView chart={EXEMPEL_MEDEL} />,
      steps: ['Lägg ihop: 2 + 7 + 3 = 12.', 'De är 3 djur. Dela: 12 / 3 = 4.', 'Medelvärdet är 4. Om alla delar lika får var och en 4.'],
      prova: { mode: 'medel', level: 0 },
    },
    {
      title: 'Delaglömmarens fälla',
      text: 'Delaglömmaren lägger ihop alla talen – och glömmer sedan att dela. Men 12 är summan, inte medelvärdet! Dela alltid med hur många tal det är.',
      tips: 'En nolla räknas också. Har någon plockat noll kastanjer är den ändå med när du delar.',
      prova: { mode: 'medel', level: 1 },
    },
    {
      title: 'Medelvärde ur ett diagram',
      text: 'Läs av varje stapel först och skriv upp talen. Sedan gör du som vanligt: lägg ihop och dela med hur många staplar det är.',
      prova: { mode: 'medel', level: 2 },
    },
  ] },

  'median-sortera-forst': { pages: [
    {
      title: 'Talet i mitten',
      text: 'Medianen är talet i mitten – men först måste talen stå i ordning, från minst till störst.',
      pic: <ChartView chart={EXEMPEL_MEDIAN} />,
      steps: ['Talen: 3, 1, 4, 0, 2.', 'I ordning: 0, 1, 2, 3, 4.', 'I mitten står 2. Medianen är 2.'],
      prova: { mode: 'median', level: 0 },
    },
    {
      title: 'Mittenmusens fälla',
      text: 'Mittenmusen springer rakt till mitten av raden och tar 4. Men talen stod inte i ordning! Sortera alltid först.',
      prova: { mode: 'median', level: 1 },
    },
    {
      title: 'Två i mitten',
      text: 'Om det är ett jämnt antal tal står två tal i mitten. Då är medianen mitt emellan dem.',
      steps: ['Talen i ordning: 2, 4, 6, 8.', 'I mitten står 4 och 6.', 'Mitt emellan 4 och 6 är 5. Medianen är 5.'],
      prova: { mode: 'median', level: 2 },
    },
  ] },

  'typvarde-och-bredd': { pages: [
    {
      title: 'Det vanligaste',
      text: 'Typvärdet är det tal som finns flest gånger.',
      steps: ['Talen: 2, 5, 2, 7, 2, 3.', 'Tvåan finns tre gånger. Inget annat tal finns så många gånger.', 'Typvärdet är 2 – inte 7, som bara är störst.'],
      prova: { mode: 'typ', level: 0 },
    },
    {
      title: 'Störst minus minst',
      text: 'Variationsbredden visar hur utspridda talen är: det största talet minus det minsta.',
      steps: ['Talen: 4, 9, 2, 6.', 'Störst är 9, minst är 2.', '9 − 2 = 7. Variationsbredden är 7.'],
      prova: { mode: 'bredd', level: 0 },
    },
    {
      title: 'Jätten i klassen',
      text: 'En jätte börjar i klassen. Han är mycket längre än alla andra. Då blir summan av allas längder mycket större – och medelvärdet växer. Medianen, talet i mitten, flyttar sig nästan inte.',
      prova: { mode: 'valj', level: 1 },
    },
  ] },
};

export const SPEGELSALEN: Record<string, Lesson> = {
  'kolla-axeln': { pages: [
    {
      title: 'Var börjar axeln?',
      text: 'Jordgubbsstapeln ser ut att vara många gånger högre än chokladstapeln. Men titta på axeln: den börjar på 40! Talen är 48 och 42 – nästan lika.',
      pic: <ChartView chart={EXEMPEL_AXEL} />,
      prova: { mode: 'axel', level: 0 },
    },
    {
      title: 'Laga axeln',
      text: 'Ett ärligt stapeldiagram har en axel som börjar på noll. Då syns det hur stora skillnaderna är på riktigt.',
      pic: <ChartView chart={honest(EXEMPEL_AXEL)} showVals />,
      prova: { mode: 'axel', level: 2 },
    },
    {
      title: 'Ojämna steg',
      text: 'Titta på talen vid axeln: 0, 10, 20, 50, 100. Strecken står lika tätt, men stegen är olika stora! Då går det inte att jämföra höjderna. Läs talen i stället.',
      prova: { mode: 'skala', level: 0 },
    },
  ] },

  'ytan-lurar': { pages: [
    {
      title: 'Bilder som växer',
      text: 'Det finns 20 bananer och 10 äpplen – dubbelt så många. Men bananbilden är dubbelt så hög och dubbelt så bred. Då ser den fyra gånger så stor ut!',
      pic: <ChartView chart={EXEMPEL_YTA} />,
      prova: { mode: 'yta', level: 0 },
    },
    {
      title: 'Breda staplar',
      text: 'Det är höjden på en stapel som visar talet. En bredare stapel ser större ut, men den är inte värd mer.',
      prova: { mode: 'bredd', level: 0 },
    },
    {
      title: 'Lita på talen',
      text: 'Hur många gånger fler är det egentligen? Läs talen och räkna: 20 är 2 gånger 10 – hur stort det än ser ut.',
      prova: { mode: 'yta', level: 1 },
    },
  ] },

  'tva-diagram': { pages: [
    {
      title: 'Två skalor',
      text: 'Två diagram bredvid varandra kan ha olika tal på axlarna. En stapel som når högt i ett diagram som går till 10 kan vara mindre än en låg stapel i ett diagram som går till 50. Läs axeln i båda!',
      prova: { mode: 'olika', level: 1 },
    },
    {
      title: 'Inga tal?',
      text: 'Ett diagram utan tal på axeln säger inte hur stora sakerna är. Det kan bara visa vilken som ser störst ut.',
      prova: { mode: 'enhet', level: 0 },
    },
    {
      title: 'Alla diagram lurar inte',
      text: 'Ibland är ett diagram precis som det ska. Kolla: börjar axeln på noll? Är stegen lika stora? Är staplarna lika breda? Finns talen med? Då är det ärligt.',
      prova: { mode: 'skala', level: 2 },
    },
  ] },
};

export const SKVALLERPRESSEN: Record<string, Lesson> = {
  'stammer-rubriken': { pages: [
    {
      title: 'Läs själv',
      text: 'En rubrik vill att du ska bli förvånad. Läs av diagrammet själv och jämför med rubriken. Är den sann, falsk – eller går det inte att veta?',
      prova: { mode: 'rubrik', level: 0 },
    },
    {
      title: 'Russinplockaren',
      text: 'Russinplockaren visar bara de månader när det ökar. Titta på hela året innan du tror på rubriken: vad hände före och efter?',
      prova: { mode: 'utsnitt', level: 0 },
    },
    {
      title: 'Hur många svarade?',
      text: 'Om tidningen bara frågade fyra personer kan den inte veta vad hela byn tycker. Då går det inte att veta – hur säker rubriken än låter.',
      prova: { mode: 'urval', level: 0 },
    },
  ] },

  raknetricks: { pages: [
    {
      title: 'Totalen',
      text: 'Ett diagram över hur många det blivit totalt går alltid uppåt. Det som såldes en viss månad är skillnaden mot månaden innan.',
      steps: ['Totalt efter januari: 40.', 'Totalt efter februari: 70.', 'I februari såldes 70 − 40 = 30.'],
      prova: { mode: 'summerad', level: 0 },
    },
    {
      title: 'Mer än hela',
      text: 'Hela cirkeln är 100 %. Om procenten vid bitarna blir mer än 100 tillsammans kan diagrammet inte stämma.',
      prova: { mode: 'hundra', level: 0 },
    },
    {
      title: 'Per person',
      text: 'I en stor by blir det mycket av allt. Vill man veta hur mycket varje person äter delar man med hur många som bor där.',
      steps: ['Storby: 2000 glassar och 1000 invånare. Det är 2 per person.', 'Lillby: 250 glassar och 50 invånare. Det är 5 per person.', 'I Lillby äter varje person mest!'],
      prova: { mode: 'perperson', level: 0 },
    },
  ] },

  'samband-ar-inte-orsak': { pages: [
    {
      title: 'Glass och solbränna',
      text: 'På sommaren säljs mycket glass, och många blir solbrända. Båda linjerna går upp samtidigt. Men glassen ger inte solbränna – det är solen som får båda att öka!',
      prova: { mode: 'samband', level: 0 },
    },
    {
      title: 'Leta efter det tredje',
      text: 'När två saker ökar samtidigt: fråga dig om något tredje kan styra båda. Vädret, årstiden eller hur många som bor någonstans är vanliga svar.',
      prova: { mode: 'samband', level: 1 },
    },
  ] },
};
