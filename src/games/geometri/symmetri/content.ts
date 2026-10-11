import type { AreaDef, BossDef, StageDef } from '../../../platform/rpg/types';
import type { Mode } from './logic';

// Svampen: skejtparken under den stora svampen. Symmetri och mönster. Bana- och boss-id:n är permanenta.

const stage = (id: string, name: string, icon: string, desc: string, mode: Mode | 'blandat', level: number, thrMs: number): StageDef =>
  ({ type: 'stage', id, name, icon, desc, spec: { mode, level }, thrMs });

const KATTEN: BossDef = {
  type: 'boss', id: 'kopiekatten', kind: 'monster', name: 'Kopiekatten', icon: '🐱', title: 'Kopierar i stället för att spegla',
  hp: 8, trap: 'flyttade', pool: [{ mode: 'spegla', level: 0 }, { mode: 'spegla', level: 1 }],
  lines: {
    entrance: 'Mjau! Spegla? Pff, jag kopierar bara och flyttar bilden till andra sidan. Det är väl samma sak? Alla speglar i parken visar nu MINA kopior!',
    phase2: 'Mjaaau! Nu kopierar jag större bilder!',
    onHeroMiss: ['Mjau! En kopia, precis som jag vill!', 'Hihi, flyttad är väl speglad?', 'Spinn spinn!'],
    onBossHit: ['Fräs! Du vände den rätt!', 'Aj, min morrhår!', 'Närmast spegeln… närmast spegeln?'],
    defeat: 'Det som är närmast spegeln är närmast spegeln på andra sidan också… Mjau, nu ser jag det! Får jag följa med dig? Jag spinner när du speglar rätt.',
  },
  pet: { name: 'Lilla Kopiekatten', icon: '🐱' }, titleReward: 'Spegelkännaren',
};

const FLAMINGON: BossDef = {
  type: 'boss', id: 'flamingon-snedvik', kind: 'monster', name: 'Flamingon Snedvik', icon: '🦩', title: 'Viker allt på snedden',
  hp: 8, trap: 'diagonal', pool: [{ mode: 'linjer', level: 1 }, { mode: 'linjer', level: 2 }],
  lines: {
    entrance: 'Kraa! Jag står på ett ben och viker allt på snedden! En rektangel har fyra symmetrilinjer, det vet ju alla – två raka och två sneda!',
    phase2: 'Kraaa! Nu viker jag parallellogrammer också!',
    onHeroMiss: ['Kraa! Snett är fint!', 'Hihi, ett ben, fyra linjer!', 'Vik, vik!'],
    onBossHit: ['Kraa?! Hörnen hamnade inte på varandra?', 'Aj, jag tappade balansen!', 'Rakt vikt…'],
    defeat: 'Halvorna måste täcka varandra helt… Rektangelns diagonal är ingen symmetrilinje! Får jag bo hos dig? Jag står still på ett ben hela natten.',
  },
  pet: { name: 'Lilla Flamingon', icon: '🦩' }, titleReward: 'Vikmästaren',
};

const MASTARE: BossDef = {
  type: 'boss', id: 'spegelmastaren', kind: 'mastare', name: 'Spegelmästaren', icon: '🍄', title: 'Svampens Mästare',
  hp: 12, pool: [{ mode: 'spegla', level: 2 }, { mode: 'linjer', level: 2 }, { mode: 'upprepa', level: 2 }, { mode: 'vaxa', level: 2 }, { mode: 'koordinat', level: 2 }],
  // Repliker hämtas från personan – se content/bosses.ts, id 'svampen.mastare'.
  lines: { entrance: '', defeat: '' },
  titleReward: 'Mönsterskejtaren',
};

export const SVAMPEN: AreaDef = {
  areaId: 'svampen',
  gameId: 'symmetri',
  title: 'Svampen',
  kunskap: { name: 'Spegelkraft', icon: '🪞', titles: ['Spegelspanare', 'Spegelmagiker'] },
  texts: { cleared: 'Spegelblankt!', notYet: 'Minst 9 rätt för att klara rampen – försök igen!', back: 'Till Svampen' },
  story: 'Under den stora svampen ligger en skejtpark där allt är symmetriskt – ramperna, räckena, till och med graffitin. Men Kopiekatten har bytt ut speglarna mot kopior! Hjälp till att få ordning på speglar och mönster. Nio rätt av tio klarar en ramp.',
  eras: [
    { id: 'spegeldammen', name: 'Spegeldammen', icon: '🪞', fact: 'En symmetrilinje delar en figur i två halvor som är varandras spegelbilder. Vik längs linjen – halvorna hamnar precis på varandra.',
      nodes: [
        stage('spegelbilden', 'Spegelbilden', '🪞', 'Vilken bild är speglad?', 'spegla', 0, 8000),
        stage('symmetrisk', 'Symmetrisk?', '🦋', 'Kan figuren vikas på mitten?', 'linjer', 0, 7000),
        stage('monster-som-upprepas', 'Mönster som upprepas', '🔁', 'Vad kommer sedan?', 'upprepa', 0, 7000),
        KATTEN,
      ] },
    { id: 'monstermuren', name: 'Mönstermuren', icon: '🧩', fact: 'I ett växande mönster kommer lika många nya rutor till för varje figur. Hitta hur många!',
      nodes: [
        stage('storre-speglar', 'Större speglar', '🖼️', 'Spegla större figurer', 'spegla', 1, 9000),
        stage('langre-monster', 'Längre mönster', '🔂', 'Vilken form kommer långt fram?', 'upprepa', 1, 10000),
        stage('vaxande-monster', 'Växande mönster', '🌱', 'Hur många rutor har nästa figur?', 'vaxa', 0, 9000),
        stage('symmetrilinjer', 'Symmetrilinjer', '✂️', 'Hur många sätt kan man vika på?', 'linjer', 1, 8000),
      ] },
    { id: 'svamptornet', name: 'Svamptornet', icon: '🍄', fact: 'En kvadrat har fyra symmetrilinjer, men en rektangel bara två. Rektangelns diagonal är ingen symmetrilinje!',
      nodes: [
        FLAMINGON,
        stage('at-alla-hall', 'Åt alla håll', '↕️', 'Spegla åt sidan och uppåt', 'spegla', 2, 10000),
        stage('fler-linjer', 'Fler linjer', '✳️', 'Symmetrilinjer i månghörningar', 'linjer', 2, 9000),
        stage('figur-tio', 'Figur tio', '🔟', 'Långt fram i det växande mönstret', 'vaxa', 2, 12000),
      ] },
    { id: 'rutnatet', name: 'Rutnätet', icon: '📍', fact: 'En punkt och dess spegelbild ligger lika långt från spegellinjen – på var sin sida.',
      nodes: [
        stage('spegla-punkter', 'Spegla punkter', '📍', 'Spegla i ett koordinatsystem', 'koordinat', 2, 10000),
        stage('stora-monster', 'Stora mönster', '🌀', 'Plats 20, 30, 40 …', 'upprepa', 2, 12000),
        stage('langt-fram', 'Långt fram', '🚀', 'Figur 20 – och tvärtom', 'vaxa', 3, 15000),
        stage('upp-och-ner', 'Upp och ner', '🔃', 'Spegla i x- och y-led', 'koordinat', 3, 10000),
        stage('svampfesten', 'Svampfesten', '🎉', 'Allt blandat', 'blandat', 3, 12000),
      ] },
    { id: 'svamphatten', name: 'Svamphatten', icon: '🎩', fact: 'Högst upp under svamphatten väntar Spegelmästaren. Allt där uppe finns två gånger – en gång på var sida.',
      nodes: [MASTARE] },
  ],
};
