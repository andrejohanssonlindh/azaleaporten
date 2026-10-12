// Piratskeppets innehåll: första engelska grammatiken. Band 1 = åk 2–3, band 2 = åk 4+.
// I meningar står ___ för luckan.

/** a/an: [meningen, rätt (med artikel), band]. Fel: a/an byts, eller artikeln saknas (som på svenska: "Han är lärare"). */
export const ARTIKEL: [sentence: string, right: string, band: 1 | 2][] = [
  ['I have ___.', 'an apple', 1], ['I can see ___.', 'an elephant', 1], ['She has ___.', 'an egg', 1], ['There is ___ in the tree.', 'an owl', 1],
  ['I eat ___ every day.', 'an orange', 1], ['I have ___.', 'an umbrella', 1], ['Look, ___!', 'an ant', 1],
  ['I have ___.', 'a dog', 1], ['I can see ___.', 'a cat', 1], ['She has ___.', 'a banana', 1], ['There is ___ in the garden.', 'a horse', 1],
  ['My dad has ___.', 'a car', 1], ['I am reading ___.', 'a book', 1],
  ['My mum is ___.', 'a doctor', 1], ['My dad is ___.', 'a teacher', 1], ['She wants to be ___.', 'an artist', 2], ['He is ___.', 'an astronaut', 2],
  ['My aunt is ___.', 'a nurse', 2], ['I want to be ___.', 'a pilot', 2], ['His uncle is ___.', 'an engineer', 2],
  ['We waited for ___.', 'an hour', 2], ['There is ___ in the sea.', 'an octopus', 2], ['They live on ___.', 'an island', 2],
  ['I have ___.', 'a uniform', 2], ['I can see ___.', 'a unicorn', 2], ['We live in ___.', 'an old house', 2],
];

/** Ord för yrken: där glömmer svenskar oftast artikeln ("My mum is doctor"). */
export const YRKEN = ['doctor', 'teacher', 'artist', 'astronaut', 'nurse', 'pilot', 'engineer'];

/** am/is/are: [meningen, rätt form, band]. */
export const VARA: [sentence: string, right: 'am' | 'is' | 'are', band: 1 | 2][] = [
  ['I ___ nine years old.', 'am', 1], ['You ___ my best friend.', 'are', 1], ['He ___ tall.', 'is', 1], ['She ___ happy.', 'is', 1],
  ['It ___ cold today.', 'is', 1], ['We ___ in the garden.', 'are', 1], ['They ___ hungry.', 'are', 1], ['My cat ___ black.', 'is', 1],
  ['The dogs ___ big.', 'are', 1], ['I ___ tired.', 'am', 1], ['My sister ___ ten.', 'is', 1], ['Tom and I ___ friends.', 'are', 1],
  ['___ you happy?', 'are', 2], ['___ he your brother?', 'is', 2], ['I ___ not scared.', 'am', 2], ['The children ___ at school.', 'are', 2],
  ['My mum and dad ___ at home.', 'are', 2], ['___ it raining?', 'is', 2], ['Where ___ my shoes?', 'are', 2], ['Where ___ my bag?', 'is', 2],
];

/**
 * Plural: [ett, flera, fel, band]. Felen är [ordet, felkod]:
 * glomt-s = inget plural-s, plural-andelse = fel ändelse (-s, -es eller -ies),
 * regelbunden = -s på ett oregelbundet ord, dubbel-plural = -s på ett ord som redan är plural.
 */
export const PLURAL: [one: string, many: string, wrong: [string, string][], band: 1 | 2][] = [
  ['cat', 'cats', [['cat', 'glomt-s'], ['cates', 'plural-andelse']], 1], ['dog', 'dogs', [['dog', 'glomt-s'], ['doges', 'plural-andelse']], 1],
  ['book', 'books', [['book', 'glomt-s'], ['bookes', 'plural-andelse']], 1], ['bird', 'birds', [['bird', 'glomt-s'], ['birdes', 'plural-andelse']], 1],
  ['girl', 'girls', [['girl', 'glomt-s'], ['girles', 'plural-andelse']], 1], ['egg', 'eggs', [['egg', 'glomt-s'], ['egges', 'plural-andelse']], 1],
  ['bag', 'bags', [['bag', 'glomt-s'], ['bages', 'plural-andelse']], 1], ['duck', 'ducks', [['duck', 'glomt-s'], ['duckes', 'plural-andelse']], 1],
  ['frog', 'frogs', [['frog', 'glomt-s'], ['froges', 'plural-andelse']], 1], ['pig', 'pigs', [['pig', 'glomt-s'], ['piges', 'plural-andelse']], 1],
  ['box', 'boxes', [['boxs', 'plural-andelse'], ['box', 'glomt-s']], 1], ['bus', 'buses', [['buss', 'plural-andelse'], ['bus', 'glomt-s']], 1],
  ['fox', 'foxes', [['foxs', 'plural-andelse'], ['fox', 'glomt-s']], 1], ['brush', 'brushes', [['brushs', 'plural-andelse'], ['brush', 'glomt-s']], 1],
  ['dish', 'dishes', [['dishs', 'plural-andelse'], ['dish', 'glomt-s']], 2], ['watch', 'watches', [['watchs', 'plural-andelse'], ['watch', 'glomt-s']], 2],
  ['baby', 'babies', [['babys', 'plural-andelse'], ['baby', 'glomt-s']], 2], ['story', 'stories', [['storys', 'plural-andelse'], ['story', 'glomt-s']], 2],
  ['city', 'cities', [['citys', 'plural-andelse'], ['city', 'glomt-s']], 2], ['party', 'parties', [['partys', 'plural-andelse'], ['party', 'glomt-s']], 2],
  ['child', 'children', [['childs', 'regelbunden'], ['childrens', 'dubbel-plural']], 2], ['man', 'men', [['mans', 'regelbunden'], ['mens', 'dubbel-plural']], 2],
  ['woman', 'women', [['womans', 'regelbunden'], ['womens', 'dubbel-plural']], 2], ['mouse', 'mice', [['mouses', 'regelbunden'], ['mices', 'dubbel-plural']], 2],
  ['foot', 'feet', [['foots', 'regelbunden'], ['feets', 'dubbel-plural']], 2], ['tooth', 'teeth', [['tooths', 'regelbunden'], ['teeths', 'dubbel-plural']], 2],
  ['goose', 'geese', [['gooses', 'regelbunden'], ['geeses', 'dubbel-plural']], 2],
];

/** Talen i "one cat – two ___". */
export const TAL = ['two', 'three', 'four', 'five', 'six'];

/** Presens: [verbet, med -s, ett objekt, band]. */
export const VERB: [base: string, s: string, rest: string, band: 1 | 2][] = [
  ['play', 'plays', 'football', 1], ['like', 'likes', 'ice cream', 1], ['eat', 'eats', 'apples', 1], ['read', 'reads', 'books', 1],
  ['drink', 'drinks', 'milk', 1], ['swim', 'swims', 'every day', 1], ['run', 'runs', 'fast', 1], ['want', 'wants', 'a cake', 1],
  ['live', 'lives', 'in Sweden', 1], ['sing', 'sings', 'songs', 1],
  ['watch', 'watches', 'TV', 2], ['go', 'goes', 'to school', 2], ['have', 'has', 'a dog', 2], ['do', 'does', 'homework', 2],
  ['fly', 'flies', 'kites', 2], ['wash', 'washes', 'the car', 2], ['try', 'tries', 'again', 2], ['catch', 'catches', 'the ball', 2],
];

/** Subjekt: [ordet, tredje person singular?, band]. */
export const SUBJEKT: [string, boolean, 1 | 2][] = [
  ['I', false, 1], ['You', false, 1], ['He', true, 1], ['She', true, 1], ['We', false, 1], ['They', false, 1],
  ['My brother', true, 1], ['Lisa', true, 1], ['My friends', false, 2], ['The boy', true, 2], ['Tom and Lisa', false, 2], ['My dad', true, 2],
];

/** Frågeord: [frågan med lucka, svaret efter tankstrecket, rätt frågeord, band]. */
export const FRAGORD: [q: string, reply: string, right: string, band: 1 | 2][] = [
  ['___ is your name?', 'Sam.', 'What', 1], ['___ do you live?', 'In Sweden.', 'Where', 1], ['___ is your teacher?', 'Mr Brown.', 'Who', 1],
  ['___ is your birthday?', 'In June.', 'When', 1], ['___ are you?', "I'm fine, thanks.", 'How', 1], ['___ old are you?', "I'm ten.", 'How', 1],
  ['___ is my bag?', 'Under the table.', 'Where', 1], ['___ colour is your bike?', 'Red.', 'What', 1], ['___ is at the door?', "It's Grandma.", 'Who', 1],
  ['___ is this?', "It's a pen.", 'What', 1],
  ['___ many cats do you have?', 'Two.', 'How', 2], ['___ are you sad?', 'Because I lost my ball.', 'Why', 2], ['___ do you get up?', 'At seven.', 'When', 2],
  ['___ do you go to school?', 'By bike.', 'How', 2], ['___ is your favourite food?', 'Pizza.', 'What', 2], ['___ is the cat?', 'On the sofa.', 'Where', 2],
  ['___ is crying?', 'The baby.', 'Who', 2], ['___ do you like summer?', "Because it's warm.", 'Why', 2], ['___ does the film start?', 'At six.', 'When', 2],
  ['___ much is the ice cream?', 'Two pounds.', 'How', 2],
];
export const FRAGEORD = ['What', 'Where', 'Who', 'When', 'How', 'Why'];
export const FRAGEORD_SV: Record<string, string> = { What: 'vad', Where: 'var', Who: 'vem', When: 'när', How: 'hur', Why: 'varför' };

/** Prepositioner: [engelska, svenska, band]. Bilden ritas av spelet. */
export const PREP: [string, string, 1 | 2][] = [
  ['in', 'i', 1], ['on', 'på', 1], ['under', 'under', 1], ['next to', 'bredvid', 2], ['behind', 'bakom', 2], ['in front of', 'framför', 2],
];
/** Det som står någonstans: [engelska, emoji]. */
export const SAK: [string, string][] = [['cat', '🐱'], ['dog', '🐶'], ['ball', '⚽'], ['mouse', '🐭'], ['teddy bear', '🧸'], ['bird', '🐦']];

/** don't/doesn't och do/does: [meningen, rätt, band]. */
export const NEKA: [sentence: string, right: string, band: 1 | 2][] = [
  ['I ___ like rain.', "don't", 1], ['She ___ like fish.', "doesn't", 1], ['We ___ have a dog.', "don't", 1], ['He ___ play football.', "doesn't", 1],
  ['They ___ live here.', "don't", 1], ['My cat ___ like water.', "doesn't", 1], ['___ you like cats?', 'Do', 1], ['___ she have a bike?', 'Does', 1],
  ['You ___ know my name.', "don't", 1], ['Lisa ___ eat meat.', "doesn't", 2], ['___ they play tennis?', 'Do', 1], ['___ he speak English?', 'Does', 2],
  ['___ your brother like pizza?', 'Does', 2], ['___ we have school today?', 'Do', 2], ['My friends ___ watch TV.', "don't", 2], ['It ___ snow in summer.', "doesn't", 2],
];

/** Ordföljd: [rätt mening, med svensk ordföljd, en annan fel ordning, band]. */
export const ORDFOLJD: [right: string, svensk: string, annan: string, band: 1 | 2][] = [
  ['Today I go to school.', 'Today go I to school.', 'Today I to school go.', 1],
  ['Do you like dogs?', 'Like you dogs?', 'You like do dogs?', 1],
  ['Now I am hungry.', 'Now am I hungry.', 'Now I hungry am.', 1],
  ['Where do you live?', 'Where live you?', 'Where you do live?', 1],
  ['After school we eat dinner.', 'After school eat we dinner.', 'After school we dinner eat.', 1],
  ['Sometimes we go to the beach.', 'Sometimes go we to the beach.', 'Sometimes we to the beach go.', 1],
  ['I always eat breakfast.', 'I eat always breakfast.', 'I breakfast always eat.', 2],
  ["She doesn't like fish.", 'She likes not fish.', 'She not likes fish.', 2],
  ['Yesterday we played football.', 'Yesterday played we football.', 'We yesterday football played.', 2],
  ['What do you want?', 'What want you?', 'What you do want?', 2],
  ['In the summer we swim a lot.', 'In the summer swim we a lot.', 'In the summer we a lot swim.', 2],
  ['I never drink coffee.', 'I drink never coffee.', 'I coffee never drink.', 2],
  ['My brother often plays games.', 'My brother plays often games.', 'My brother games often plays.', 2],
  ['Does he play football?', 'Plays he football?', 'He does play football?', 2],
  ["I don't know.", 'I know not.', 'I not know.', 2],
];

/**
 * Bygg meningen: [bitarna i rätt ordning, tecknet efter, andra rätta ordningar, svenska ordningar (fel), band].
 * Ordningarna skrivs som bitarna med mellanslag emellan.
 */
export const BYGG: [tiles: string[], end: string, also: string[], svensk: string[], band: 1 | 2][] = [
  [['I', 'have', 'a red bike'], '.', [], [], 1],
  [['Today', 'I', 'play', 'football'], '.', ['I play football today'], ['Today play I football'], 1],
  [['My sister', 'is', 'nine'], '.', [], [], 1],
  [['Do', 'you', 'like', 'pizza'], '?', [], [], 1],
  [['The cat', 'is', 'under', 'the bed'], '.', [], [], 1],
  [['Now', 'we', 'go', 'home'], '.', ['we go home now'], ['Now go we home'], 1],
  [['Can', 'you', 'help', 'me'], '?', [], [], 1],
  [['We', 'always', 'eat', 'lunch'], '.', [], ['We eat always lunch'], 2],
  [['Yesterday', 'I', 'saw', 'a big dog'], '.', ['I saw a big dog yesterday'], ['Yesterday saw I a big dog'], 2],
  [['She', "doesn't", 'like', 'snakes'], '.', [], [], 2],
  [['He', 'never', 'drinks', 'milk'], '.', [], ['He drinks never milk'], 2],
  [['Where', 'do', 'you', 'live'], '?', [], [], 2],
  [['On Saturday', 'we', 'play', 'tennis'], '.', ['we play tennis on Saturday'], ['On Saturday play we tennis'], 2],
  [['My dad', 'often', 'reads', 'the paper'], '.', [], ['My dad reads often the paper'], 2],
];
