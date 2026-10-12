// Hamnens innehåll: det barnet hör (engelska) och vad det betyder. Ordningen i listorna är permanent
// bara inom en version (en pågående runda pekar ut rader med index, men byggs om vid omladdning).
// Band 1 = åk 1–3, band 2 = åk 4+.

export { numWord } from '../engelska/tal';

/** Hur bokstävernas engelska namn låter, skrivet med svenska bokstäver. */
export const LJUD: Record<string, string> = {
  A: 'ej', B: 'bi', C: 'si', D: 'di', E: 'ii', F: 'eff', G: 'dji', H: 'ejtj', I: 'aj', J: 'djej', K: 'kej', L: 'ell', M: 'em',
  N: 'en', O: 'åu', P: 'pi', Q: 'kju', R: 'aa', S: 'ess', T: 'ti', U: 'ju', V: 'vi', W: 'dabbel-ju', X: 'eks', Y: 'waj', Z: 'zedd',
};

/** Bokstaven en svensk öra lätt tror att det är: engelska E låter ju som svenskt i. */
export const FORVAXLAS: Record<string, string> = { A: 'E', E: 'I', I: 'A', G: 'J', J: 'G', R: 'A', U: 'J' };

/**
 * Ord som stavas högt bokstav för bokstav: [ordet, med en bokstav som en svensk hör fel, med en annan bokstav].
 * Den andra varianten är just felet: E hörs som i, A hörs som e, G och J blandas.
 */
export const STAVAS: [word: string, trap: string, other: string][] = [
  ['bed', 'bid', 'bad'], ['pen', 'pin', 'pan'], ['red', 'rid', 'rod'], ['ten', 'tin', 'tan'], ['leg', 'lig', 'log'],
  ['net', 'nit', 'nut'], ['pet', 'pit', 'pot'], ['web', 'wib', 'wob'],
  ['cat', 'cet', 'cut'], ['hat', 'het', 'hut'], ['bag', 'beg', 'bug'], ['map', 'mep', 'mop'], ['cap', 'cep', 'cup'], ['van', 'ven', 'von'],
  ['jet', 'get', 'jot'], ['jog', 'gog', 'jug'], ['gym', 'jym', 'gem'],
];

/** [engelska, svenska, den engelska fras som lätt blandas ihop med den, band] */
export const FRASER: [en: string, sv: string, twin: string, band: 1 | 2][] = [
  ['Good morning', 'God morgon', 'Good night', 1],
  ['Good night', 'God natt', 'Good morning', 1],
  ['Hello', 'Hej', 'Goodbye', 1],
  ['Goodbye', 'Hej då', 'Hello', 1],
  ['Thank you', 'Tack', 'Please', 1],
  ['Please', 'Snälla (när man ber om något)', 'Thank you', 1],
  ['Sorry', 'Förlåt', 'Excuse me', 1],
  ['How are you?', 'Hur mår du?', 'How old are you?', 1],
  ['How old are you?', 'Hur gammal är du?', 'How are you?', 1],
  ["What's your name?", 'Vad heter du?', 'Where do you live?', 1],
  ['Happy birthday', 'Grattis på födelsedagen', 'Merry Christmas', 1],
  ['Merry Christmas', 'God jul', 'Happy birthday', 1],
  ['Good evening', 'God kväll', 'Good night', 2],
  ['Excuse me', 'Ursäkta', 'Sorry', 2],
  ['Where do you live?', 'Var bor du?', "What's your name?", 2],
  ['See you later', 'Vi ses sen', 'Goodbye', 2],
  ['Welcome', 'Välkommen', 'Well done', 2],
  ['Well done', 'Bra gjort', 'Welcome', 2],
  ["I don't know", 'Jag vet inte', "I don't understand", 2],
  ["I don't understand", 'Jag förstår inte', "I don't know", 2],
  ['Can I help you?', 'Kan jag hjälpa dig?', 'Can you help me?', 2],
  ['Can you help me?', 'Kan du hjälpa mig?', 'Can I help you?', 2],
  ['Hurry up!', 'Skynda dig!', 'Wake up!', 2],
  ['Wake up!', 'Vakna!', 'Hurry up!', 2],
  ['Be careful!', 'Var försiktig!', 'Be quiet!', 2],
  ['Be quiet!', 'Var tyst!', 'Be careful!', 2],
  ["Let's go!", 'Nu går vi!', "Let's play!", 2],
  ["Let's play!", 'Kom så leker vi!', "Let's go!", 2],
  ['Nice to meet you', 'Kul att träffas', 'See you later', 2],
  ['Never mind', 'Det gör inget', 'Sorry', 2],
];

/** Instruktioner i klassrummet och på skolgården: [engelska, svenska, den som lätt blandas ihop med den, band] */
export const INSTRUKTIONER: [en: string, sv: string, twin: string, band: 1 | 2][] = [
  ['Stand up', 'Ställ dig upp', 'Sit down', 1],
  ['Sit down', 'Sätt dig ner', 'Stand up', 1],
  ['Open your book', 'Öppna din bok', 'Close your book', 1],
  ['Close your book', 'Stäng din bok', 'Open your book', 1],
  ['Put up your hand', 'Räck upp handen', 'Clap your hands', 1],
  ['Clap your hands', 'Klappa händerna', 'Wash your hands', 1],
  ['Wash your hands', 'Tvätta händerna', 'Clap your hands', 1],
  ['Touch your nose', 'Ta på näsan', 'Touch your toes', 1],
  ['Touch your toes', 'Ta på tårna', 'Touch your nose', 1],
  ['Listen carefully', 'Lyssna noga', 'Look carefully', 1],
  ['Look carefully', 'Titta noga', 'Listen carefully', 1],
  ['Come here', 'Kom hit', 'Go home', 1],
  ['Turn around', 'Vänd dig om', 'Turn left', 2],
  ['Turn left', 'Sväng vänster', 'Turn right', 2],
  ['Turn right', 'Sväng höger', 'Turn left', 2],
  ['Open the window', 'Öppna fönstret', 'Open the door', 2],
  ['Open the door', 'Öppna dörren', 'Open the window', 2],
  ['Take out a pencil', 'Ta fram en penna', 'Put away your pencil', 2],
  ['Put away your pencil', 'Lägg undan pennan', 'Take out a pencil', 2],
  ['Look at the board', 'Titta på tavlan', 'Write on the board', 2],
  ['Write on the board', 'Skriv på tavlan', 'Look at the board', 2],
  ['Line up', 'Ställ er på led', 'Stand up', 2],
  ['Go home', 'Gå hem', 'Come here', 2],
  ['Work in pairs', 'Jobba två och två', 'Work in groups', 2],
  ['Work in groups', 'Jobba i grupper', 'Work in pairs', 2],
];

/**
 * Frågor och svar: [frågan, ett svar som passar, frågetyp, band].
 * Frågetypen säger vilka andra svar som är "fel frågeord" (Hamnmästarens fälla).
 */
export const FRAGOR: [q: string, a: string, kind: string, band: 1 | 2][] = [
  ['How old are you?', "I'm nine.", 'old', 1],
  ['How are you?', "I'm fine, thank you.", 'are', 1],
  ["What's your name?", 'My name is Sam.', 'name', 1],
  ['Where do you live?', 'I live in Sweden.', 'where', 1],
  ['What colour is your bike?', "It's blue.", 'what', 1],
  ['Do you have a pet?', 'Yes, I have a dog.', 'do', 1],
  ['Do you like football?', 'Yes, I do.', 'do', 1],
  ["What's your favourite animal?", 'A horse.', 'what', 1],
  ["What's this?", "It's a pen.", 'what', 1],
  ['When is your birthday?', 'In May.', 'when', 2],
  ['Who is that?', "That's my brother.", 'who', 2],
  ['How many brothers do you have?', 'I have two.', 'many', 2],
  ['What time is it?', "It's three o'clock.", 'time', 2],
  ['Can you swim?', 'Yes, I can.', 'can', 1],
  ["What's the weather like?", "It's sunny.", 'weather', 2],
  ['Where is the cat?', 'Under the table.', 'where', 2],
  ['What do you like to eat?', 'I like pizza.', 'what', 2],
  ['Are you hungry?', "No, I'm not.", 'are-you', 2],
  ['How do you get to school?', 'By bike.', 'how', 2],
  ['Who is your best friend?', 'Alex is.', 'who', 2],
  ['When do you get up?', 'At seven.', 'when', 2],
  ['Why are you sad?', 'Because I lost my ball.', 'why', 2],
];

/** Frågetyper som lätt blandas ihop (lyssnar man inte på frågeordet passar ett av de här svaren). */
export const FORVAXLA_FRAGA: Record<string, string[]> = {
  old: ['are', 'many'], are: ['old', 'are-you'], name: ['where', 'who'], where: ['when', 'who'], what: ['who', 'where'],
  do: ['can'], when: ['where', 'time'], who: ['where', 'what'], many: ['old'], time: ['when'], can: ['do'],
  weather: ['what', 'are'], 'are-you': ['are'], how: ['where', 'when'], why: ['where', 'what'],
};

/* ---------- meningar: byggs av delar ---------- */

export const VAR = {
  saker: [['cat', 'Katten'], ['dog', 'Hunden'], ['mouse', 'Musen'], ['ball', 'Bollen'], ['book', 'Boken']] as [string, string][],
  prep: [['on', 'på'], ['under', 'under'], ['in', 'i'], ['behind', 'bakom'], ['next to', 'bredvid']] as [string, string][],
  plats: [['table', 'bordet'], ['bed', 'sängen'], ['box', 'lådan'], ['chair', 'stolen'], ['sofa', 'soffan']] as [string, string][],
};

/** Pronomen: [engelska, svenska, "have" eller "has"]. */
export const VEM: [string, string, string][] = [['I', 'Jag', 'have'], ['You', 'Du', 'have'], ['He', 'Han', 'has'], ['She', 'Hon', 'has'], ['We', 'Vi', 'have'], ['They', 'De', 'have']];

/** Saker som är en-ord på svenska (så att färgen böjs likadant): [engelska, svenska]. */
export const SAKER: [string, string][] = [['bike', 'cykel'], ['ball', 'boll'], ['cap', 'keps'], ['car', 'bil'], ['kite', 'drake'], ['bag', 'väska']];
export const FARGER: [string, string][] = [['red', 'röd'], ['blue', 'blå'], ['green', 'grön'], ['yellow', 'gul'], ['black', 'svart'], ['white', 'vit'], ['brown', 'brun']];

/** Djur i plural: [engelska, svenska]. */
export const DJUR: [string, string][] = [['cats', 'katter'], ['dogs', 'hundar'], ['rabbits', 'kaniner'], ['birds', 'fåglar'], ['horses', 'hästar']];
export const ANTAL: [string, string][] = [['two', 'två'], ['three', 'tre'], ['four', 'fyra'], ['five', 'fem'], ['six', 'sex']];
