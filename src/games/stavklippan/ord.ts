// Stavklippans ord, regel för regel. Regel-id:n är permanenta (färdighets-id:n 'en.stav.<regel>').
// Ett ord är [engelska, svenska, bild, band]. tip = regeln utan exempel (exemplen väljs så att de inte är svaret). Svenskan och bilden visas alltid, så att ord som låter
// likadant (sea/see, right/write) går att skilja åt. Band 1 = lättare ord, band 2 = svårare.

export type Rule = 'c-k' | 'y' | 'w' | 'th' | 'ee-ea' | 'sh-ch' | 'lang-i' | 'lang-a' | 'oo-ou' | 'dubbel' | 'tyst' | 'plural';

export type Ord = [en: string, sv: string, pic: string, band: 1 | 2];

export const RULES: Record<Rule, { name: string; tip: string; words: Ord[] }> = {
  'c-k': {
    name: 'c, k och ck',
    tip: 'K-ljudet stavas oftast med c i början av engelska ord, och med ck efter en kort vokal.',
    words: [
      ['cat', 'katt', '🐱', 1], ['cup', 'kopp', '☕', 1], ['car', 'bil', '🚗', 1], ['cold', 'kall', '🥶', 1], ['clock', 'klocka', '⏰', 1],
      ['cow', 'ko', '🐮', 1], ['duck', 'anka', '🦆', 1], ['sock', 'strumpa', '🧦', 1], ['black', 'svart', '⚫', 1], ['cookie', 'kaka', '🍪', 1],
      ['carrot', 'morot', '🥕', 2], ['computer', 'dator', '💻', 2], ['candle', 'ljus', '🕯️', 2], ['rocket', 'raket', '🚀', 2], ['chicken', 'kyckling', '🐥', 2],
    ],
  },
  y: {
    name: 'y i början',
    tip: 'J-ljudet i början av engelska ord stavas nästan alltid med y.',
    words: [
      ['yes', 'ja', '👍', 1], ['you', 'du', '', 1], ['your', 'din', '', 1], ['yellow', 'gul', '#fcc419', 1], ['year', 'år', '📆', 1],
      ['young', 'ung', '👶', 1], ['yell', 'skrika', '🗣️', 1], ['yummy', 'mums', '😋', 1], ['yawn', 'gäspa', '🥱', 1], ['yard', 'gård', '', 1],
      ['yesterday', 'igår', '', 2],
    ],
  },
  w: {
    name: 'w',
    tip: 'Det engelska w-ljudet stavas w – aldrig v.',
    words: [
      ['water', 'vatten', '💧', 1], ['window', 'fönster', '🪟', 1], ['white', 'vit', '#f8f9fa', 1], ['we', 'vi', '', 1], ['wolf', 'varg', '🐺', 1],
      ['wet', 'blöt', '', 1], ['walk', 'gå', '🚶', 1], ['worm', 'mask', '🐛', 1], ['web', 'nät', '🕸️', 1], ['swim', 'simma', '🏊', 1],
      ['wave', 'våg', '🌊', 2], ['sweet', 'söt', '🍬', 2], ['weather', 'väder', '🌦️', 2], ['woman', 'kvinna', '👩', 2], ['wizard', 'trollkarl', '🧙', 2],
    ],
  },
  th: {
    name: 'th',
    tip: 'th är ett eget ljud på engelska: tungan mellan tänderna, och blås. Det stavas alltid th.',
    words: [
      ['three', 'tre', '3', 1], ['thanks', 'tack', '🙏', 1], ['mother', 'mamma', '', 1], ['father', 'pappa', '', 1], ['brother', 'bror', '', 1],
      ['bath', 'badkar', '🛁', 1], ['tooth', 'tand', '🦷', 1], ['mouth', 'mun', '👄', 1], ['think', 'tänka', '🤔', 1], ['birthday', 'födelsedag', '🎂', 1],
      ['thirty', 'trettio', '30', 2], ['earth', 'jorden', '🌍', 2], ['feather', 'fjäder', '🪶', 2], ['thunder', 'åska', '⚡', 2], ['together', 'tillsammans', '', 2],
    ],
  },
  'ee-ea': {
    name: 'ee och ea',
    tip: 'Det långa i-ljudet stavas ofta ee eller ea på engelska – nästan aldrig bara i.',
    words: [
      ['tree', 'träd', '🌳', 1], ['green', 'grön', '#2f9e44', 1], ['sheep', 'får', '🐑', 1], ['see', 'se', '👀', 1], ['bee', 'bi', '🐝', 1],
      ['feet', 'fötter', '🦶', 1], ['eat', 'äta', '', 1], ['read', 'läsa', '📖', 1], ['sea', 'hav', '🌊', 1], ['tea', 'te', '🍵', 1],
      ['queen', 'drottning', '👸', 2], ['sleep', 'sova', '😴', 2], ['week', 'vecka', '', 2], ['meat', 'kött', '🥩', 2], ['teacher', 'lärare', '🧑‍🏫', 2],
      ['clean', 'ren', '', 2], ['dream', 'dröm', '💭', 2], ['peach', 'persika', '🍑', 2], ['leaf', 'löv', '🍃', 2],
    ],
  },
  'sh-ch': {
    name: 'sh och ch',
    tip: 'Sj-ljudet stavas sh och tj-ljudet stavas ch på engelska.',
    words: [
      ['ship', 'skepp', '🚢', 1], ['fish', 'fisk', '🐟', 1], ['shoe', 'sko', '👞', 1], ['shop', 'affär', '🏪', 1], ['shirt', 'skjorta', '👔', 1],
      ['shark', 'haj', '🦈', 1], ['chair', 'stol', '🪑', 1], ['cherry', 'körsbär', '🍒', 1], ['church', 'kyrka', '⛪', 1], ['cheese', 'ost', '🧀', 1],
      ['shell', 'snäcka', '🐚', 2], ['wash', 'tvätta', '', 2], ['brush', 'borste', '🪥', 2], ['kitchen', 'kök', '', 2], ['children', 'barn', '', 2],
      ['watch', 'armbandsur', '⌚', 2], ['sandwich', 'smörgås', '🥪', 2],
    ],
  },
  'lang-i': {
    name: 'långt i-ljud (aj)',
    tip: 'Aj-ljudet stavas med i och ett tyst e på slutet, med igh eller med y.',
    words: [
      ['like', 'gilla', '', 1], ['bike', 'cykel', '🚲', 1], ['five', 'fem', '5', 1], ['nine', 'nio', '9', 1], ['kite', 'drake', '🪁', 1],
      ['time', 'tid', '⏳', 1], ['ice', 'is', '🧊', 1], ['smile', 'le', '😊', 1], ['my', 'min', '', 1], ['fly', 'flyga', '🪰', 1],
      ['night', 'natt', '🌃', 2], ['light', 'ljus', '💡', 2], ['right', 'höger', '👉', 2], ['sky', 'himmel', '', 2], ['cry', 'gråta', '😭', 2],
      ['spider', 'spindel', '🕷️', 2], ['slide', 'rutschkana', '', 2],
    ],
  },
  'lang-a': {
    name: 'långt a-ljud (ej)',
    tip: 'Ej-ljudet stavas med a och ett tyst e på slutet, med ai eller med ay.',
    words: [
      ['cake', 'tårta', '🍰', 1], ['name', 'namn', '', 1], ['game', 'spel', '🎮', 1], ['lake', 'sjö', '', 1], ['snake', 'orm', '🐍', 1],
      ['rain', 'regn', '🌧️', 1], ['train', 'tåg', '🚆', 1], ['day', 'dag', '', 1], ['play', 'leka', '', 1], ['say', 'säga', '', 1],
      ['plane', 'flygplan', '✈️', 2], ['grape', 'vindruva', '🍇', 2], ['face', 'ansikte', '', 2], ['paint', 'måla', '🎨', 2], ['snail', 'snigel', '🐌', 2],
      ['make', 'göra', '', 2], ['baby', 'bebis', '👶', 2], ['table', 'bord', '', 2],
    ],
  },
  'oo-ou': {
    name: 'oo, ou och ow',
    tip: 'U-ljudet stavas ofta oo, och au-ljudet stavas ou eller ow.',
    words: [
      ['book', 'bok', '📕', 1], ['moon', 'måne', '🌙', 1], ['school', 'skola', '🏫', 1], ['spoon', 'sked', '🥄', 1], ['foot', 'fot', '🦶', 1],
      ['house', 'hus', '🏠', 1], ['mouse', 'mus', '🐭', 1], ['out', 'ut', '', 1], ['brown', 'brun', '#8b5a2b', 1], ['now', 'nu', '', 1],
      ['food', 'mat', '', 2], ['look', 'titta', '', 2], ['boot', 'stövel', '👢', 2], ['cloud', 'moln', '☁️', 2], ['round', 'rund', '', 2],
      ['down', 'ner', '👇', 2], ['town', 'stad', '', 2], ['flower', 'blomma', '🌸', 2], ['owl', 'uggla', '🦉', 2],
    ],
  },
  dubbel: {
    name: 'dubbelteckning',
    tip: 'Efter en kort vokal skrivs konsonanten ofta dubbelt på engelska, precis som på svenska.',
    words: [
      ['apple', 'äpple', '🍎', 1], ['happy', 'glad', '😀', 1], ['rabbit', 'kanin', '🐰', 1], ['hello', 'hej', '👋', 1], ['little', 'liten', '', 1],
      ['egg', 'ägg', '🥚', 1], ['ball', 'boll', '⚽', 1], ['bell', 'klocka (som ringer)', '🔔', 1], ['dress', 'klänning', '👗', 1], ['funny', 'rolig', '', 1],
      ['dinner', 'middag', '', 2], ['sunny', 'soligt', '☀️', 2], ['letter', 'brev', '✉️', 2], ['butter', 'smör', '🧈', 2], ['kitten', 'kattunge', '', 2],
      ['summer', 'sommar', '', 2], ['coffee', 'kaffe', '', 2], ['balloon', 'ballong', '🎈', 2], ['bottle', 'flaska', '🍾', 2], ['hammer', 'hammare', '🔨', 2],
    ],
  },
  tyst: {
    name: 'tysta bokstäver',
    tip: 'Många engelska ord har en bokstav som skrivs men inte hörs.',
    words: [
      ['knee', 'knä', '', 1], ['know', 'veta', '', 1], ['knife', 'kniv', '🔪', 1], ['write', 'skriva', '✍️', 1], ['wrong', 'fel', '❌', 1],
      ['climb', 'klättra', '🧗', 1], ['listen', 'lyssna', '👂', 1], ['castle', 'slott', '🏰', 1], ['ghost', 'spöke', '👻', 1], ['half', 'halv', '', 1],
      ['knock', 'knacka', '', 2], ['wrist', 'handled', '', 2], ['comb', 'kam', '', 2], ['thumb', 'tumme', '👍', 2], ['hour', 'timme', '', 2],
      ['talk', 'prata', '🗣️', 2], ['island', 'ö', '🏝️', 2], ['autumn', 'höst', '🍂', 2], ['answer', 'svar', '', 2], ['lamb', 'lamm', '', 2],
    ],
  },
  plural: {
    name: 'plural',
    tip: 'Plural får -s. Efter s, x, sh och ch blir det -es. Efter konsonant + y blir y till -ies, men efter vokal + y räcker -s.',
    words: [
      ['boxes', 'lådor', '📦', 1], ['buses', 'bussar', '🚌', 1], ['foxes', 'rävar', '🦊', 1], ['dishes', 'tallrikar', '🍽️', 1], ['babies', 'bebisar', '👶', 1],
      ['toys', 'leksaker', '🧸', 1], ['keys', 'nycklar', '🔑', 1], ['days', 'dagar', '', 1], ['cherries', 'körsbär (flera)', '🍒', 1], ['puppies', 'valpar', '🐶', 1],
      ['watches', 'armbandsur (flera)', '⌚', 2], ['stories', 'berättelser', '📚', 2], ['ladies', 'damer', '', 2], ['monkeys', 'apor', '🐒', 2], ['glasses', 'glas (flera)', '🥛', 2],
      ['brushes', 'borstar', '', 2], ['parties', 'kalas (flera)', '🎉', 2], ['boys', 'pojkar', '', 2],
    ],
  },
};

export const RULE_IDS = Object.keys(RULES) as Rule[];
