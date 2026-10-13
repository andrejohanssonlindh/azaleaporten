import type { Lesson } from '../../platform/rpg/types';
import { Text } from '../../engines/lektion/bilder';
import { ProgramBild, VarldBild } from '../../engines/robot/RobotView';
import type { World } from '../../engines/robot/types';

// Robotöns klassrum (Kodstigen, Loopverkstaden, Buggjakten). Lektionernas id:n är permanenta (se lessons i content.ts).

const W1: World = { w: 5, h: 3, start: [0, 2], dir: 1, goal: [3, 0], rocks: [[1, 1]], gems: [] };
const W2: World = { w: 4, h: 4, start: [0, 3], dir: 0, goal: [2, 0], rocks: [], gems: [] };
const W3: World = { w: 6, h: 2, start: [0, 1], dir: 1, goal: [5, 1], rocks: [], gems: [] };
const W4: World = { w: 5, h: 5, start: [0, 4], dir: 1, goal: [4, 0], rocks: [], gems: [] };

export const KODSTIGEN: Record<string, Lesson> = {
  'program-och-pilar': { pages: [
    {
      title: 'Ett program är en lista',
      text: 'En robot gör precis det du säger – inte mer och inte mindre. Ett program är en lista med instruktioner som roboten gör i ordning, ett block i taget.\n\nEn pil flyttar roboten ett steg åt det hållet pilen pekar.',
      pic: <><VarldBild world={W1} /><ProgramBild prog={['R', 'R', 'R', 'U', 'U']} label="Program: höger tre gånger, upp två gånger" /><Text>Tre steg åt höger, sedan två upp – fram till batteriet.</Text></>,
    },
    {
      title: 'Räkna rutorna noga',
      text: 'Hoppetossan räknar alltid ett steg fel. Knepet: sätt fingret på roboten och flytta det en ruta för varje pil. Räkna rutorna du flyttar till – inte rutan du står på.',
      steps: ['Fingret på roboten.', 'Första pilen: en ruta. Säg "ett".', 'Nästa pil: en ruta till. Säg "två".', 'Stanna när pilarna är slut. Där står roboten.'],
      tips: 'Testkör och titta! Hamnade roboten fel kan du ändra och köra igen.',
      prova: { mode: 'pilar-vart', level: 0 },
    },
  ] },

  'robotens-hall': { pages: [
    {
      title: 'Fram, vänster och höger',
      text: 'Med svängblocken går roboten dit den tittar. ⬆ Fram betyder ett steg dit näsan pekar. ↰ och ↱ vrider roboten på stället – den flyttar sig inte!',
      pic: <><VarldBild world={W2} /><ProgramBild prog={['F', 'F', 'H', 'F', 'F', 'V', 'F']} label="Program med svängar" /></>,
      steps: ['Roboten tittar uppåt. Fram, fram: två rutor upp.', 'Höger: nu tittar den åt höger.', 'Fram, fram: två rutor åt höger.', 'Vänster: nu tittar den uppåt igen.', 'Fram: en ruta upp – framme!'],
    },
    {
      title: 'Robotens vänster, inte din',
      text: 'Spegeltrollet blandar ihop robotens vänster med din vänster. Om roboten kommer emot dig är dess vänster din höger!\n\nKnepet: vrid huvudet (eller papperet) så att du tittar åt samma håll som roboten. Då blir robotens vänster din vänster.',
      tips: 'Svängen flyttar inte roboten. Den vrider sig bara – sedan behövs Fram.',
      prova: { mode: 'svang-vart', level: 0 },
    },
  ] },
};

export const LOOPVERKSTADEN: Record<string, Lesson> = {
  loopar: { pages: [
    {
      title: 'En loop upprepar',
      text: 'I stället för att skriva samma block många gånger kan du lägga det i en loop. 🔁 5 × ➡ betyder: gör ➡ fem gånger.',
      pic: <><VarldBild world={W3} /><ProgramBild prog={[{ rep: 5, body: ['R'] }]} label="Loop: fem gånger höger" /><Text>Samma sak som ➡ ➡ ➡ ➡ ➡ – fast kortare.</Text></>,
    },
    {
      title: 'Hur många varv?',
      text: 'Räkna hur många gånger det som står i loopen behövs. Ekorren Ett-Till vill alltid ha ett varv till – men då kör roboten för långt.',
      steps: ['Hur långt ska roboten? Räkna rutorna mellan roboten och målet.', 'Varje varv flyttar roboten så långt som det som står i loopen.', 'Antalet varv = rutorna delat med stegen per varv.'],
      tips: 'Räkna rutorna du ska TILL, inte rutan du står på.',
      prova: { mode: 'antal', level: 0 },
    },
  ] },

  'monster-i-loopen': { pages: [
    {
      title: 'Hela mönstret upprepas',
      text: 'Allt som står inne i loopen görs om varje varv – inte bara det första blocket. Snurran upprepar bara det första, och då hamnar roboten fel.\n\nHär är en trappa: ett steg höger, ett steg upp. Det mönstret görs fyra gånger.',
      pic: <><VarldBild world={W4} prog={[{ rep: 4, body: ['R', 'U'] }]} /><ProgramBild prog={[{ rep: 4, body: ['R', 'U'] }]} label="Loop: fyra gånger höger och upp" /></>,
      steps: ['Varv 1: höger, upp.', 'Varv 2: höger, upp.', 'Varv 3: höger, upp.', 'Varv 4: höger, upp. Framme!'],
    },
    {
      title: 'Hitta mönstret',
      text: 'När du ska bygga med loop: titta efter något som upprepas på vägen. Skriv mönstret en gång inne i loopen, och räkna hur många gånger det behövs.',
      prova: { mode: 'loop-vart', level: 1 },
    },
  ] },

  'loop-i-loop': { pages: [
    {
      title: 'En loop i en loop',
      text: 'En loop kan ligga inne i en annan loop. Den inre loopen körs klart varje gång den yttre går ett varv.',
      pic: <ProgramBild prog={[{ rep: 2, body: [{ rep: 3, body: ['R'] }, 'U'] }]} label="Två varv av: tre gånger höger, sedan upp" />,
      steps: ['Yttre varv 1: inre loopen ➡ ➡ ➡, sedan ⬆.', 'Yttre varv 2: inre loopen ➡ ➡ ➡ igen, sedan ⬆.', 'Allt som allt: 6 steg höger och 2 upp.'],
      tips: 'Räkna gånger: 2 yttre varv · 3 inre = 6 gånger ➡.',
      prova: { mode: 'nastlad', level: 0 },
    },
  ] },
};

export const BUGGJAKTEN: Record<string, Lesson> = {
  'hitta-buggen': { pages: [
    {
      title: 'Var sitter buggen?',
      text: 'Ett fel i ett program kallas en bugg. Skyll-på-sista-Buggen tror alltid att felet sitter sist. Men felet sitter där roboten FÖRST går åt fel håll.',
      steps: ['Testkör programmet och titta noga.', 'Följ roboten med fingret, block för block.', 'Stanna vid första blocket där roboten inte går mot målet.', 'Där är buggen! Allt efter den kan vara rätt.'],
      tips: 'Läs programmet och vägen samtidigt: "Nu ska den till höger – gör den det?"',
      prova: { mode: 'pilar', level: 0 },
    },
    {
      title: 'Buggar i loopar',
      text: 'En bugg i en loop görs om varje varv. Därför kan ett litet fel ge en stor krock. Titta på första varvet: går roboten rätt där? Om inte, sitter felet i loopen.',
      prova: { mode: 'loop', level: 0 },
    },
  ] },
};
