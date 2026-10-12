// Glosvikens ord, tema för tema. Tema-id:n är permanenta (de blir färdighets-id:n 'en.glosor.<tema>').
//
// En glosa är [engelska, svenska, bild, band]:
// - bild = en emoji, en färg ('#e03131') eller '' (inga bildfrågor för ordet)
// - band 1 = åk 1–3, band 2 = åk 4+
// Ord som är likadana på svenska och engelska (hand, arm, pizza) får bara bildfrågor.
// Bilderna är emoji från Emoji 13 eller äldre, så att Windows ritar dem.

export type Glosa = [en: string, sv: string, pic: string, band: 1 | 2];

export interface Tema { id: string; name: string; words: Glosa[] }

export const TEMAN: Tema[] = [
  {
    id: 'farger', name: 'Färger', words: [
      ['red', 'röd', '#e03131', 1], ['blue', 'blå', '#1c7ed6', 1], ['green', 'grön', '#2f9e44', 1], ['yellow', 'gul', '#fcc419', 1],
      ['black', 'svart', '#212529', 1], ['white', 'vit', '#f8f9fa', 1], ['orange', 'orange', '#f76707', 1], ['purple', 'lila', '#7048e8', 1],
      ['brown', 'brun', '#8b5a2b', 1], ['pink', 'rosa', '#f783ac', 1], ['grey', 'grå', '#868e96', 1],
    ],
  },
  {
    id: 'siffror', name: 'Siffror', words: [
      ['zero', 'noll', '0', 1], ['one', 'ett', '1', 1], ['two', 'två', '2', 1], ['three', 'tre', '3', 1], ['four', 'fyra', '4', 1],
      ['five', 'fem', '5', 1], ['six', 'sex', '6', 1], ['seven', 'sju', '7', 1], ['eight', 'åtta', '8', 1], ['nine', 'nio', '9', 1],
      ['ten', 'tio', '10', 1], ['eleven', 'elva', '11', 1], ['twelve', 'tolv', '12', 1],
      ['thirteen', 'tretton', '13', 2], ['fourteen', 'fjorton', '14', 2], ['fifteen', 'femton', '15', 2], ['sixteen', 'sexton', '16', 2],
      ['seventeen', 'sjutton', '17', 2], ['eighteen', 'arton', '18', 2], ['nineteen', 'nitton', '19', 2], ['twenty', 'tjugo', '20', 2],
      ['thirty', 'trettio', '30', 2], ['forty', 'fyrtio', '40', 2], ['fifty', 'femtio', '50', 2], ['hundred', 'hundra', '100', 2],
    ],
  },
  {
    id: 'djur', name: 'Djur', words: [
      ['dog', 'hund', '🐶', 1], ['cat', 'katt', '🐱', 1], ['horse', 'häst', '🐴', 1], ['cow', 'ko', '🐮', 1], ['pig', 'gris', '🐷', 1],
      ['bird', 'fågel', '🐦', 1], ['fish', 'fisk', '🐟', 1], ['mouse', 'mus', '🐭', 1], ['rabbit', 'kanin', '🐰', 1], ['sheep', 'får', '🐑', 1],
      ['duck', 'anka', '🦆', 1], ['frog', 'groda', '🐸', 1], ['bear', 'björn', '🐻', 1], ['lion', 'lejon', '🦁', 1], ['elephant', 'elefant', '🐘', 1],
      ['monkey', 'apa', '🐵', 1], ['snake', 'orm', '🐍', 1],
      ['goat', 'get', '🐐', 2], ['owl', 'uggla', '🦉', 2], ['butterfly', 'fjäril', '🦋', 2], ['spider', 'spindel', '🕷️', 2], ['bee', 'bi', '🐝', 2],
      ['fox', 'räv', '🦊', 2], ['wolf', 'varg', '🐺', 2], ['turtle', 'sköldpadda', '🐢', 2], ['whale', 'val', '🐳', 2], ['chicken', 'höna', '🐔', 2],
      ['giraffe', 'giraff', '🦒', 2], ['squirrel', 'ekorre', '🐿️', 2], ['hedgehog', 'igelkott', '🦔', 2], ['deer', 'rådjur', '🦌', 2],
    ],
  },
  {
    id: 'familj', name: 'Familjen', words: [
      ['mother', 'mamma', '', 1], ['father', 'pappa', '', 1], ['sister', 'syster', '', 1], ['brother', 'bror', '', 1], ['baby', 'bebis', '', 1],
      ['grandmother', 'mormor eller farmor', '', 1], ['grandfather', 'morfar eller farfar', '', 1], ['family', 'familj', '', 1], ['friend', 'kompis', '', 1],
      ['aunt', 'moster eller faster', '', 2], ['uncle', 'morbror eller farbror', '', 2], ['cousin', 'kusin', '', 1], ['daughter', 'dotter', '', 2],
      ['parents', 'föräldrar', '', 2], ['boy', 'pojke', '', 2], ['girl', 'flicka', '', 2], ['twins', 'tvillingar', '', 2],
    ],
  },
  {
    id: 'kroppen', name: 'Kroppen', words: [
      ['head', 'huvud', '', 1], ['eye', 'öga', '👁️', 1], ['ear', 'öra', '👂', 1], ['nose', 'näsa', '👃', 1], ['mouth', 'mun', '👄', 1],
      ['hand', 'hand', '✋', 1], ['foot', 'fot', '🦶', 1], ['leg', 'ben', '🦵', 1], ['arm', 'arm', '💪', 1], ['hair', 'hår', '', 1], ['tooth', 'tand', '🦷', 1],
      ['knee', 'knä', '', 2], ['toe', 'tå', '', 2], ['neck', 'hals', '', 2], ['back', 'rygg', '', 2], ['stomach', 'mage', '', 2],
      ['shoulder', 'axel', '', 2], ['brain', 'hjärna', '🧠', 2], ['heart', 'hjärta', '❤️', 2], ['face', 'ansikte', '', 2],
    ],
  },
  {
    id: 'mat', name: 'Mat och dryck', words: [
      ['apple', 'äpple', '🍎', 1], ['banana', 'banan', '🍌', 1], ['bread', 'bröd', '🍞', 1], ['milk', 'mjölk', '🥛', 1], ['water', 'vatten', '💧', 1],
      ['cheese', 'ost', '🧀', 1], ['egg', 'ägg', '🥚', 1], ['cake', 'tårta', '🍰', 1], ['ice cream', 'glass', '🍦', 1], ['pizza', 'pizza', '🍕', 1],
      ['carrot', 'morot', '🥕', 1], ['strawberry', 'jordgubbe', '🍓', 1],
      ['potato', 'potatis', '🥔', 2], ['tomato', 'tomat', '🍅', 2], ['sandwich', 'smörgås', '🥪', 2], ['soup', 'soppa', '🍲', 2], ['rice', 'ris', '🍚', 2],
      ['meat', 'kött', '🥩', 2], ['pear', 'päron', '🍐', 2], ['lemon', 'citron', '🍋', 2], ['grapes', 'vindruvor', '🍇', 2], ['cookie', 'kaka', '🍪', 2],
      ['sweets', 'godis', '🍬', 2], ['breakfast', 'frukost', '', 2], ['dinner', 'middag', '', 2], ['juice', 'juice', '🧃', 2],
    ],
  },
  {
    id: 'klader', name: 'Kläder', words: [
      ['trousers', 'byxor', '👖', 1], ['dress', 'klänning', '👗', 1], ['shoes', 'skor', '👟', 1], ['cap', 'keps', '🧢', 1], ['sock', 'strumpa', '🧦', 1],
      ['jacket', 'jacka', '🧥', 1], ['gloves', 'vantar', '🧤', 1], ['scarf', 'halsduk', '🧣', 1], ['hat', 'hatt', '🎩', 1],
      ['boots', 'stövlar', '👢', 2], ['glasses', 'glasögon', '👓', 2], ['shorts', 'shorts', '🩳', 2], ['umbrella', 'paraply', '☂️', 2], ['ring', 'ring', '💍', 2],
      ['belt', 'bälte', '', 2], ['pocket', 'ficka', '', 2], ['sweater', 'tröja', '', 2],
    ],
  },
  {
    id: 'skolan', name: 'Skolan', words: [
      ['book', 'bok', '📕', 1], ['pen', 'penna', '🖊️', 1], ['pencil', 'blyertspenna', '✏️', 1], ['ruler', 'linjal', '📏', 1], ['scissors', 'sax', '✂️', 1],
      ['bag', 'väska', '🎒', 1], ['chair', 'stol', '🪑', 1], ['computer', 'dator', '💻', 1], ['clock', 'klocka', '⏰', 1],
      ['rubber', 'suddgummi', '', 2], ['classroom', 'klassrum', '', 2], ['homework', 'läxa', '', 2], ['glue', 'lim', '', 2], ['paper', 'papper', '📄', 2],
      ['board', 'tavla', '', 2], ['teacher', 'lärare', '🧑‍🏫', 2], ['lesson', 'lektion', '', 2],
    ],
  },
  {
    id: 'leksaker', name: 'Leksaker', words: [
      ['ball', 'boll', '⚽', 1], ['bike', 'cykel', '🚲', 1], ['game', 'spel', '🎮', 1], ['kite', 'drake', '🪁', 1], ['teddy bear', 'nalle', '🧸', 1],
      ['balloon', 'ballong', '🎈', 1], ['puzzle', 'pussel', '🧩', 1], ['drum', 'trumma', '🥁', 1], ['guitar', 'gitarr', '🎸', 1],
      ['skateboard', 'skateboard', '🛹', 2], ['swing', 'gunga', '', 2], ['slide', 'rutschkana', '', 2], ['robot', 'robot', '🤖', 2], ['dice', 'tärning', '🎲', 2],
    ],
  },
  {
    id: 'vader', name: 'Väder och årstider', words: [
      ['sun', 'sol', '☀️', 1], ['rain', 'regn', '🌧️', 1], ['snow', 'snö', '❄️', 1], ['wind', 'vind', '💨', 1], ['cloud', 'moln', '☁️', 1], ['rainbow', 'regnbåge', '🌈', 1],
      ['spring', 'vår', '', 2], ['summer', 'sommar', '', 2], ['autumn', 'höst', '🍂', 2], ['winter', 'vinter', '⛄', 2], ['storm', 'storm', '⛈️', 2],
      ['thunder', 'åska', '⚡', 2], ['fog', 'dimma', '🌫️', 2],
    ],
  },
  {
    id: 'hemmet', name: 'Hemma', words: [
      ['house', 'hus', '🏠', 1], ['door', 'dörr', '🚪', 1], ['bed', 'säng', '🛏️', 1], ['window', 'fönster', '🪟', 1],
      ['table', 'bord', '', 2], ['kitchen', 'kök', '', 2], ['bath', 'badkar', '🛁', 2], ['sofa', 'soffa', '🛋️', 2], ['key', 'nyckel', '🔑', 2],
      ['garden', 'trädgård', '', 2], ['toilet', 'toalett', '🚽', 2], ['stairs', 'trappa', '', 2], ['roof', 'tak', '', 2], ['room', 'rum', '', 2], ['floor', 'golv', '', 2],
    ],
  },
  {
    id: 'stan', name: 'Stan och resor', words: [
      ['car', 'bil', '🚗', 1], ['bus', 'buss', '🚌', 1], ['train', 'tåg', '🚆', 1], ['boat', 'båt', '⛵', 1], ['plane', 'flygplan', '✈️', 1], ['ship', 'skepp', '🚢', 1],
      ['shop', 'affär', '🏪', 2], ['street', 'gata', '', 2], ['hospital', 'sjukhus', '🏥', 2], ['school', 'skola', '🏫', 2], ['church', 'kyrka', '⛪', 2],
      ['library', 'bibliotek', '', 2], ['bridge', 'bro', '🌉', 2], ['ambulance', 'ambulans', '🚑', 2], ['tractor', 'traktor', '🚜', 2], ['helicopter', 'helikopter', '🚁', 2],
    ],
  },
  {
    id: 'naturen', name: 'Naturen', words: [
      ['tree', 'träd', '🌳', 1], ['flower', 'blomma', '🌼', 1], ['sea', 'hav', '🌊', 1], ['moon', 'måne', '🌙', 1], ['star', 'stjärna', '⭐', 1],
      ['mountain', 'berg', '⛰️', 2], ['forest', 'skog', '🌲', 2], ['beach', 'strand', '🏖️', 2], ['river', 'flod', '', 2], ['island', 'ö', '🏝️', 2],
      ['sky', 'himmel', '', 2], ['stone', 'sten', '🪨', 2], ['lake', 'sjö', '', 2], ['grass', 'gräs', '', 2], ['leaf', 'löv', '🍃', 2], ['rose', 'ros', '🌹', 2],
    ],
  },
  {
    id: 'verb', name: 'Göra saker', words: [
      ['run', 'springa', '🏃', 1], ['jump', 'hoppa', '', 1], ['swim', 'simma', '🏊', 1], ['eat', 'äta', '', 1], ['drink', 'dricka', '', 1],
      ['sleep', 'sova', '🛌', 1], ['read', 'läsa', '📖', 1], ['write', 'skriva', '✍️', 1], ['sing', 'sjunga', '🎤', 1], ['dance', 'dansa', '💃', 1],
      ['walk', 'gå', '🚶', 2], ['climb', 'klättra', '🧗', 2], ['ride', 'rida', '🏇', 2], ['cry', 'gråta', '😭', 2], ['laugh', 'skratta', '😂', 2],
      ['draw', 'rita', '🖍️', 2], ['listen', 'lyssna', '', 2], ['think', 'tänka', '🤔', 2], ['help', 'hjälpa', '', 2], ['fly', 'flyga', '', 2],
      ['open', 'öppna', '', 2], ['close', 'stänga', '', 2],
    ],
  },
  {
    id: 'kanslor', name: 'Känslor och hur saker är', words: [
      ['happy', 'glad', '😀', 1], ['sad', 'ledsen', '😢', 1], ['angry', 'arg', '😠', 1], ['tired', 'trött', '🥱', 1], ['scared', 'rädd', '😨', 1],
      ['big', 'stor', '', 1], ['small', 'liten', '', 1], ['hot', 'varm', '🥵', 1], ['cold', 'kall', '🥶', 1],
      ['slow', 'långsam', '', 2], ['new', 'ny', '', 2], ['old', 'gammal', '', 2], ['good', 'bra', '', 2], ['long', 'lång', '', 2], ['short', 'kort', '', 2],
      ['funny', 'rolig', '', 2], ['nice', 'trevlig', '', 2], ['hungry', 'hungrig', '', 2], ['surprised', 'förvånad', '😲', 2], ['sick', 'sjuk', '🤒', 2],
      ['brave', 'modig', '', 2], ['beautiful', 'vacker', '', 2],
    ],
  },
  {
    id: 'dagar', name: 'Dagar och månader', words: [
      ['Monday', 'måndag', '', 1], ['Tuesday', 'tisdag', '', 1], ['Wednesday', 'onsdag', '', 1], ['Thursday', 'torsdag', '', 1],
      ['Friday', 'fredag', '', 1], ['Saturday', 'lördag', '', 1], ['Sunday', 'söndag', '', 1],
      ['today', 'idag', '', 2], ['tomorrow', 'imorgon', '', 2], ['yesterday', 'igår', '', 2], ['week', 'vecka', '', 2], ['month', 'månad', '', 2],
      ['year', 'år', '', 2], ['morning', 'morgon', '', 2], ['evening', 'kväll', '', 2], ['night', 'natt', '', 2],
      ['January', 'januari', '', 2], ['February', 'februari', '', 2], ['March', 'mars', '', 2], ['May', 'maj', '', 2], ['June', 'juni', '', 2],
      ['July', 'juli', '', 2], ['August', 'augusti', '', 2], ['October', 'oktober', '', 2],
    ],
  },
  {
    id: 'yrken', name: 'Yrken', words: [
      ['doctor', 'läkare', '🧑‍⚕️', 2], ['police officer', 'polis', '👮', 2], ['farmer', 'bonde', '🧑‍🌾', 2], ['firefighter', 'brandman', '🧑‍🚒', 2],
      ['nurse', 'sjuksköterska', '', 2], ['dentist', 'tandläkare', '', 2], ['vet', 'veterinär', '', 2], ['artist', 'konstnär', '🧑‍🎨', 2],
      ['singer', 'sångare', '🧑‍🎤', 2], ['pilot', 'pilot', '🧑‍✈️', 2], ['astronaut', 'astronaut', '🧑‍🚀', 2], ['scientist', 'forskare', '🧑‍🔬', 2],
    ],
  },
];

/**
 * Ord som ser ut eller låter nästan likadant. Alla finns i TEMAN.
 * De blir fel alternativ med felkoden 'liknar' (Tvillingkrabbans fälla).
 */
export const LIKNAR: string[][] = [
  ['three', 'tree'], ['sheep', 'ship', 'shop', 'sleep'], ['house', 'mouse', 'mouth'], ['bear', 'pear'], ['boat', 'goat'],
  ['cat', 'cap', 'car'], ['bed', 'red', 'read'], ['rain', 'train'], ['pig', 'big'], ['run', 'sun'], ['bird', 'bread'],
  ['leg', 'egg'], ['chair', 'hair'], ['bike', 'kite'], ['write', 'white'], ['pen', 'ten'], ['ear', 'year'], ['hat', 'hot'],
  ['cake', 'lake'], ['nose', 'rose'],
];

/**
 * Falska vänner: engelska ord som ser ut som ett svenskt ord men betyder något annat.
 * [engelska, rätt betydelse, den falska (svenska) betydelsen]
 */
export const FALSKA: [en: string, sv: string, falsk: string][] = [
  ['barn', 'lada', 'barn'],
  ['kind', 'snäll', 'kind (på ansiktet)'],
  ['gift', 'present', 'gift (som är farligt)'],
  ['spring', 'vår', 'springa'],
  ['glass', 'glas', 'glass (att äta)'],
  ['map', 'karta', 'mapp'],
  ['hat', 'hatt', 'hata'],
  ['dog', 'hund', 'dog (dö)'],
  ['bad', 'dålig', 'bad (att bada)'],
  ['mad', 'arg', 'mat'],
  ['fast', 'snabb', 'fast (sitta fast)'],
  ['chef', 'kock', 'chef (en som bestämmer)'],
  ['hug', 'kram', 'hugg'],
  ['time', 'tid', 'timme'],
  ['brand', 'märke', 'brand (eld)'],
  ['lock', 'lås', 'lock (på en burk)'],
  ['stool', 'pall', 'stol'],
  ['fabric', 'tyg', 'fabrik'],
];
