// Meningssmedjans meningar. Nivå (band) 1 passar från åk 1–2, nivå 2 från åk 3–4.
// Namn (personer, djur, platser) är det enda som har stor bokstav mitt i en mening.
// Testerna kontrollerar att meningarna är rätt skrivna och att varje fråga bara har ett rätt svar.

/** Rätt skrivna meningar (stor bokstav och punkt). Felen räknas ut av logiken. */
export const PUNKT: string[] = [
  'Vi åker till stranden.',
  'Katten sover i solen.',
  'Maja har en röd cykel.',
  'Hunden heter Bamse.',
  'I dag ska vi baka bullar.',
  'Mormor bor i Lund.',
  'Min bror spelar fotboll.',
  'Det regnar ute.',
  'Pappa lagar pannkakor.',
  'Vi har gympa på måndag.',
  'Ali och Sara leker i parken.',
  'Fåglarna flyger söderut.',
  'Jag läser en bok om dinosaurier.',
  'Ugglan sitter i ett träd.',
  'Vi ska åka till Göteborg i juli.',
  'Lisa fyller år i maj.',
  'Bussen kommer snart.',
  'Min katt heter Sixten.',
  'Snön smälter i solen.',
  'Hästen springer över ängen.',
  'Vi badade i sjön i går.',
  'Elefanter har långa snablar.',
  'Vi firar jul i december.',
  'Farfar har en båt.',
];

/** Två meningar som skrivs ihop utan punkt: var slutar den första? */
export const PAR: [string, string][] = [
  ['Vi har en hund.', 'Den heter Bamse.'],
  ['Det snöar ute.', 'Vi bygger en snögubbe.'],
  ['Maja tappade sin mössa.', 'Hon letade överallt.'],
  ['Klockan är åtta.', 'Filmen börjar snart.'],
  ['Solen skiner.', 'Alla barnen badar.'],
  ['Pappa bakar en tårta.', 'Den ska vara till mormor.'],
  ['Katten jagar en mus.', 'Musen springer in i ett hål.'],
  ['Jag har ont i magen.', 'Jag åt för mycket godis.'],
  ['Ali spelar fiol.', 'Han övar varje dag.'],
  ['Vi gick till biblioteket.', 'Där lånade jag tre böcker.'],
  ['Bussen var sen.', 'Vi fick vänta länge.'],
  ['Min syster är fyra år.', 'Hon går på förskolan.'],
  ['Fåglarna bygger ett bo.', 'Det är gjort av kvistar.'],
  ['Det var mörkt i skogen.', 'Vi tände ficklampan.'],
  ['Sara vann loppet.', 'Hon fick en medalj.'],
  ['Mamma köpte en ny cykel.', 'Den är blå.'],
  ['Grodan hoppade i dammen.', 'Det blev ett stort plask.'],
  ['Jag kan inte hitta mina skor.', 'Har du sett dem?'],
  ['Vi åkte tåg till Malmö.', 'Resan tog två timmar.'],
  ['Hunden skällde högt.', 'Någon knackade på dörren.'],
];

/** Meningar utan sluttecken, och tecknet som ska stå där. Nivå 2 = kluriga (frågeord som inte frågar). */
export const TECKEN: [text: string, mark: '.' | '?' | '!', band: 1 | 2][] = [
  ['Vi ska åka buss till skolan', '.', 1],
  ['Min katt tycker om fisk', '.', 1],
  ['Det ligger en bok på bordet', '.', 1],
  ['Fönstret står öppet', '.', 1],
  ['Vi äter middag klockan fem', '.', 1],
  ['Lejonet sover under ett träd', '.', 1],
  ['Jag vet vad du heter', '.', 2],
  ['Hon frågade vem som kom', '.', 2],
  ['Pappa undrar var nycklarna är', '.', 2],
  ['Mamma vet när tåget går', '.', 2],
  ['Vad heter din katt', '?', 1],
  ['Vill du följa med till parken', '?', 1],
  ['Var bor du', '?', 1],
  ['Hur gammal är din syster', '?', 1],
  ['När börjar skolan', '?', 1],
  ['Har du sett min mössa', '?', 1],
  ['Vem har ätit upp kakan', '?', 1],
  ['Varför är himlen blå', '?', 1],
  ['Kan du hjälpa mig', '?', 1],
  ['Vilken färg tycker du bäst om', '?', 2],
  ['Aj, det gör ont', '!', 1],
  ['Hjälp, jag ramlar', '!', 1],
  ['Hurra, vi vann', '!', 1],
  ['Grattis på födelsedagen', '!', 1],
  ['Titta, en regnbåge', '!', 1],
  ['Stopp, vänta på mig', '!', 1],
  ['Akta dig för bilen', '!', 2],
  ['Oj, vad stor du har blivit', '!', 2],
  ['Usch, vad äckligt', '!', 2],
];

/**
 * Meningar att bygga, som bitar med roll: S = vem som gör något, V = verbet som böjs, N = inte/aldrig,
 * M = bitar som står kvar i ordning (fler verb), O = vad (kan flyttas först), A = var/när (kan flyttas först
 * och byta plats med varandra i slutet), Q = frågeord. Bitarna står i den vanligaste ordningen.
 */
export const BYGG: [chunks: string, end: '.' | '?', band: 1 | 2][] = [
  ['S:katten|V:sover|A:i soffan', '.', 1],
  ['S:vi|V:äter|O:glass|A:på stranden', '.', 1],
  ['S:hunden|V:springer|A:i parken', '.', 1],
  ['S:mamma|V:läser|O:en bok', '.', 1],
  ['S:jag|V:har|O:en röd cykel', '.', 1],
  ['S:fåglarna|V:sjunger|A:i träden', '.', 1],
  ['S:min bror|V:spelar|O:fotboll|A:varje dag', '.', 1],
  ['S:vi|V:badar|A:i sjön|A:på sommaren', '.', 1],
  ['S:snön|V:faller|A:på taket', '.', 1],
  ['S:pappa|V:lagar|O:mat|A:i köket', '.', 1],
  ['S:barnen|V:leker|A:på skolgården', '.', 1],
  ['S:grodan|V:hoppar|A:i vattnet', '.', 1],
  ['A:i dag|V:ska|S:vi|M:baka|O:bullar', '.', 2],
  ['A:i morgon|V:åker|S:vi|A:till mormor', '.', 2],
  ['S:jag|V:gillar|N:inte|O:fisk', '.', 2],
  ['A:efter skolan|V:spelar|S:jag|O:fotboll', '.', 2],
  ['S:hon|V:kan|N:inte|M:hitta|O:sin väska', '.', 2],
  ['S:ugglan|V:sover|N:inte|A:på natten', '.', 2],
  ['S:vi|V:måste|M:gå hem|A:nu', '.', 2],
  ['Q:vad|V:heter|S:din katt', '?', 2],
  ['V:vill|S:du|M:leka|A:med mig', '?', 2],
  ['Q:var|V:har|S:du|M:lagt|O:mina skor', '?', 2],
  ['Q:när|V:börjar|S:filmen', '?', 2],
  ['V:har|S:du|M:sett|O:min mössa', '?', 2],
  ['Q:vem|V:har|M:ätit upp|O:kakan', '?', 2],
  ['Q:varför|V:skäller|S:hunden', '?', 2],
];

/** Hur två delar hänger ihop – styr förklaringen när barnet väljer fel sambandsord. */
export type Samband = 'motsats' | 'val' | 'foljd' | 'orsak' | 'tid' | 'villkor' | 'tillagg';

/** [mening med lucka, rätt sambandsord, två som inte passar, sambandet, nivå]. */
export const SAMBAND: [sentence: string, right: string, wrong: [string, string], rel: Samband, band: 1 | 2][] = [
  ['Jag ville gå ut, ___ det regnade.', 'men', ['så', 'eller'], 'motsats', 1],
  ['Vill du ha saft ___ mjölk?', 'eller', ['men', 'så'], 'val', 1],
  ['Jag var hungrig, ___ jag åt en smörgås.', 'så', ['men', 'eller'], 'foljd', 1],
  ['Vi tog på oss jackorna, ___ det var kallt.', 'för', ['men', 'eller'], 'orsak', 1],
  ['Hunden skäller ___ någon ringer på dörren.', 'när', ['men', 'eller'], 'tid', 1],
  ['Lisa har en katt ___ en hund.', 'och', ['men', 'så'], 'tillagg', 1],
  ['Det var mörkt, ___ vi tände en lampa.', 'så', ['men', 'eller'], 'foljd', 1],
  ['Jag är trött, ___ jag vill inte sova.', 'men', ['så', 'eller'], 'motsats', 1],
  ['Ska vi gå till parken ___ till stranden?', 'eller', ['så', 'för'], 'val', 1],
  ['Alla skrattade ___ clownen ramlade.', 'när', ['eller', 'men'], 'tid', 1],
  ['Jag fryser, ___ jag har glömt mössan.', 'för', ['eller', 'men'], 'orsak', 1],
  ['Hon blev glad ___ hon fick ett brev.', 'när', ['fast', 'eller'], 'tid', 1],
  ['Vi stannade inne ___ det stormade.', 'eftersom', ['fast', 'medan'], 'orsak', 2],
  ['Borsta tänderna ___ du går och lägger dig.', 'innan', ['eftersom', 'fast'], 'tid', 2],
  ['Hon läste en bok ___ hon väntade på bussen.', 'medan', ['fast', 'därför'], 'tid', 2],
  ['Vi går till stranden ___ det är soligt i morgon.', 'om', ['fast', 'medan'], 'villkor', 2],
  ['Jag tog ingen jacka, ___ det var kallt.', 'fast', ['eftersom', 'innan'], 'motsats', 2],
  ['Det regnade hela dagen. ___ var gräset blött.', 'Därför', ['Fast', 'Medan'], 'foljd', 2],
  ['Först åt vi middag, ___ tittade vi på film.', 'sedan', ['eftersom', 'medan'], 'tid', 2],
  ['Jag kan inte komma ___ jag är sjuk.', 'eftersom', ['fast', 'medan'], 'orsak', 2],
  ['Vi väntade ___ regnet hade slutat.', 'tills', ['fast', 'eller'], 'tid', 2],
  ['Vi måste skynda oss, ___ missar vi tåget.', 'annars', ['därför', 'medan'], 'villkor', 2],
];

/** Typ av komma: uppräkning, bisats först, tilltal/litet ord först, eller före "men". */
export type Komma = 'lista' | 'bisats' | 'tilltal' | 'men';

/** Meningar med exakt ett komma. */
export const KOMMA: [sentence: string, type: Komma, band: 1 | 2][] = [
  ['Vi köpte mjölk, ägg och bröd.', 'lista', 1],
  ['Jag har en katt, en hund och en kanin.', 'lista', 1],
  ['Hon tycker om att rita, sjunga och dansa.', 'lista', 1],
  ['På bordet låg pennor, suddgummin och linjaler.', 'lista', 1],
  ['I skogen såg vi rådjur, ekorrar och en räv.', 'lista', 1],
  ['Flaggan är röd, vit och blå.', 'lista', 1],
  ['Till lunch fanns soppa, pasta och sallad.', 'lista', 1],
  ['Lisa, kom och titta!', 'tilltal', 1],
  ['Hej, vad heter du?', 'tilltal', 1],
  ['Ja, jag vill gärna ha mer.', 'tilltal', 1],
  ['Tack, det var snällt av dig.', 'tilltal', 1],
  ['Nej, det är inte min jacka.', 'tilltal', 1],
  ['När det regnar, stannar vi inne.', 'bisats', 2],
  ['Om du vill, kan du följa med.', 'bisats', 2],
  ['Eftersom bussen var sen, kom vi för sent till skolan.', 'bisats', 2],
  ['Innan vi äter, tvättar vi händerna.', 'bisats', 2],
  ['Medan mamma lagade mat, dukade jag bordet.', 'bisats', 2],
  ['Jag ville följa med, men jag var sjuk.', 'men', 2],
  ['Det var kallt, men vi badade ändå.', 'men', 2],
];

/** Anföring: [vem, verbet, det som sägs, tecknet efter repliken]. */
export const ANFORING: [who: string, verb: string, quote: string, mark: '.' | '?' | '!'][] = [
  ['pappa', 'sa', 'Vi går nu', '.'],
  ['mamma', 'ropade', 'Kom in och ät', '!'],
  ['läraren', 'frågade', 'Vem vill läsa först', '?'],
  ['Ali', 'sa', 'Jag har tappat min penna', '.'],
  ['farmor', 'undrade', 'Har du ätit frukost', '?'],
  ['tränaren', 'ropade', 'Spring fortare', '!'],
  ['lillasyster', 'viskade', 'Jag är lite rädd', '.'],
  ['Sara', 'sa', 'Det är min tur nu', '.'],
  ['kaninen', 'frågade', 'Var är mina morötter', '?'],
  ['draken', 'vrålade', 'Ingen får komma in i min grotta', '!'],
  ['prinsessan', 'sa', 'Jag kan rädda mig själv', '.'],
  ['grannen', 'frågade', 'Är det er katt', '?'],
  ['morfar', 'berättade', 'När jag var liten fanns det inga mobiler', '.'],
  ['kocken', 'sa', 'Maten är klar', '.'],
];
