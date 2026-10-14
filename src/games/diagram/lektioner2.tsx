import type { Lesson } from '../../platform/rpg/types';
import { ChartView } from '../../engines/diagram/ChartView';
import { EXEMPEL_CIRKEL, EXEMPEL_PROCENT } from './rost';
import { EXEMPEL_LINJE, EXEMPEL_TVA } from './vader';

// Diagramdalens klassrum, del två: Väderstationen och Omröstningstorget.
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
