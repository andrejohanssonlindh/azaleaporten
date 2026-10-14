// Berättelsebiblioteket: texterna och frågorna. Skrivet för åk 2–4; behöver en förälders korrläsning.
// band 1 = åk 2–3 (40–80 ord), band 2 = åk 4+ (100–200 ord). Nya texter läggs till i slutet.
//
// Varje fråga har rätt svar och två fel, och varje fel bär sin felkod:
//   inte-i-texten = låter rimligt men står inte i texten, fel-detalj = står i texten men svarar inte på frågan,
//   bara-ytan = missar ledtråden mellan raderna, fel-ordbetydelse = fel betydelse av ordet,
//   bara-en-del = en detalj i stället för vad hela texten handlar om.

export type Texttyp = 'berattelse' | 'fakta' | 'instruktion' | 'brev' | 'dikt' | 'annons';
export type Fragetyp = 'raden' | 'mellan' | 'ord' | 'huvud';

export interface Fraga { typ: Fragetyp; q: string; svar: string; fel: [string, string][] }
export interface Text { titel: string; band: 1 | 2; typ: Texttyp; text: string; fragor: Fraga[] }

const raden = (q: string, svar: string, ...fel: [string, string][]): Fraga => ({ typ: 'raden', q, svar, fel });
const mellan = (q: string, svar: string, ...fel: [string, string][]): Fraga => ({ typ: 'mellan', q, svar, fel });
const ord = (q: string, svar: string, ...fel: [string, string][]): Fraga => ({ typ: 'ord', q, svar, fel });
const huvud = (q: string, svar: string, ...fel: [string, string][]): Fraga => ({ typ: 'huvud', q, svar, fel });

export const TEXTER: Text[] = [
  {
    titel: 'Kvacks nya hatt', band: 1, typ: 'berattelse',
    text: `Grodan Kvack hittade en röd hatt vid Stavningsträsket. Den var alldeles för stor. När Kvack satte på sig den syntes bara hans gröna fötter.
– Var är Kvack? ropade fåglarna.
Kvack skrattade så att hatten guppade. Sedan gjorde han en båt av hatten och seglade över träsket hela eftermiddagen.`,
    fragor: [
      raden('Var hittade Kvack hatten?', 'Vid Stavningsträsket', ['I Ordskogen', 'inte-i-texten'], ['Över träsket', 'fel-detalj']),
      raden('Vilken färg hade hatten?', 'Röd', ['Grön', 'fel-detalj'], ['Blå', 'inte-i-texten']),
      mellan('Varför ropade fåglarna "Var är Kvack?"', 'Hatten täckte nästan hela Kvack', ['Kvack hade gått hem', 'inte-i-texten'], ['Hatten var röd', 'bara-ytan']),
      mellan('Hur kände sig Kvack med hatten på?', 'Glad och busig', ['Ledsen och arg', 'inte-i-texten'], ['Han hade en stor hatt', 'bara-ytan']),
      ord('Hatten "guppade". Vad betyder det?', 'Den rörde sig upp och ner', ['Den föll av', 'fel-ordbetydelse'], ['Den blev blöt', 'fel-ordbetydelse']),
      huvud('Vad handlar texten mest om?', 'Kvack som hittar en stor hatt och leker med den', ['Fåglar som letar mat', 'inte-i-texten'], ['Kvacks gröna fötter', 'bara-en-del']),
    ],
  },
  {
    titel: 'Bagaren Bulles snabba kanelbullar', band: 1, typ: 'instruktion',
    text: `Du behöver: en rulle färdig deg, smör, socker och kanel.
1. Rulla ut degen på ett bord.
2. Bred på mjukt smör.
3. Strö över socker och kanel.
4. Rulla ihop degen och skär den i bitar.
5. Grädda bitarna i ugnen i tio minuter.
Be en vuxen om hjälp med ugnen!`,
    fragor: [
      raden('Vad ska du göra direkt efter att du har brett på smör?', 'Strö över socker och kanel', ['Rulla ut degen', 'fel-detalj'], ['Hälla på mjölk', 'inte-i-texten']),
      raden('Vad ska du be en vuxen om hjälp med?', 'Ugnen', ['Degen', 'fel-detalj'], ['Disken', 'inte-i-texten']),
      mellan('Varför har stegen nummer?', 'Man ska göra dem i den ordningen', ['Det blir fem bullar', 'bara-ytan'], ['Bulle gillar siffror', 'inte-i-texten']),
      mellan('Varför går de här bullarna snabbt att baka?', 'Degen är redan färdig', ['Man äter dem snabbt', 'inte-i-texten'], ['Det står snabba i rubriken', 'bara-ytan']),
      ord('Vad betyder "grädda" i texten?', 'Baka i ugnen', ['Vispa grädde', 'fel-ordbetydelse'], ['Rulla ihop', 'fel-ordbetydelse']),
      huvud('Vad är texten till för?', 'Att lära dig baka kanelbullar', ['Att berätta om Bulles bageri', 'inte-i-texten'], ['Att visa hur man skär deg', 'bara-en-del']),
    ],
  },
  {
    titel: 'Ekorren', band: 1, typ: 'fakta',
    text: `Ekorren är ett litet djur som bor i skogen. Den har en lång, yvig svans som hjälper den att hålla balansen när den hoppar mellan träden.
Ekorren äter kottar, nötter och svamp. På hösten gömmer den mat i marken. På vintern gräver den fram maten igen. Ekorren sover inte hela vintern, som björnen gör.`,
    fragor: [
      raden('Vad använder ekorren svansen till?', 'Att hålla balansen', ['Att gräva i marken', 'fel-detalj'], ['Att hålla sig varm', 'inte-i-texten']),
      raden('När gömmer ekorren mat?', 'På hösten', ['På vintern', 'fel-detalj'], ['På sommaren', 'inte-i-texten']),
      mellan('Varför gömmer ekorren mat på hösten?', 'Så att den har mat på vintern', ['Den är rädd för björnen', 'inte-i-texten'], ['Den gillar att gräva', 'bara-ytan']),
      mellan('Vad gör björnen på vintern, enligt texten?', 'Sover hela vintern', ['Gömmer mat i marken', 'fel-detalj'], ['Flyttar söderut', 'inte-i-texten']),
      ord('Ekorren har en "yvig" svans. Vad betyder yvig?', 'Tjock och fluffig', ['Kort och tunn', 'fel-ordbetydelse'], ['Randig', 'fel-ordbetydelse']),
      huvud('Vad handlar texten om?', 'Hur ekorren lever', ['Hur björnen sover', 'bara-en-del'], ['Hur man planterar ett träd', 'inte-i-texten']),
    ],
  },
  {
    titel: 'Ett brev från Västerön', band: 1, typ: 'brev',
    text: `Hej Azaleabyn!
Nu har jag varit på Västerön i tre dagar. Här pratar alla engelska, så jag säger "hello" hela tiden. Igår åkte jag båt till fyren. Vågorna var höga och jag blev lite grön i ansiktet. Men utsikten var fantastisk!
I morgon ska jag lära mig att segla.
Många hälsningar från Brevbäraren Pelle`,
    fragor: [
      raden('Hur länge har Pelle varit på Västerön?', 'I tre dagar', ['I en vecka', 'inte-i-texten'], ['Sedan igår', 'fel-detalj']),
      raden('Vad ska Pelle göra i morgon?', 'Lära sig att segla', ['Åka båt till fyren', 'fel-detalj'], ['Åka hem', 'inte-i-texten']),
      mellan('Hur mådde Pelle på båten?', 'Han mådde lite illa', ['Han var hungrig', 'inte-i-texten'], ['Han fick grön färg på sig', 'bara-ytan']),
      mellan('Varför säger Pelle "hello" hela tiden?', 'Alla på ön pratar engelska', ['Han har glömt svenska', 'inte-i-texten'], ['Han tycker om fyren', 'fel-detalj']),
      ord('Vad betyder "utsikten" i brevet?', 'Det man kan se därifrån', ['Vägen ut', 'fel-ordbetydelse'], ['Vädret', 'fel-ordbetydelse']),
      huvud('Varför skrev Pelle brevet?', 'För att berätta om sin resa', ['För att beställa en båt', 'inte-i-texten'], ['För att berätta om vågorna', 'bara-en-del']),
    ],
  },
  {
    titel: 'Snögubben', band: 1, typ: 'dikt',
    text: `Snögubben står på gården
med hatt och morotsnäsa.
Han vaktar huset dag och natt,
han behöver aldrig vila.
När solen kommer i april
blir snögubben liten och tunn.
Till sist finns bara hatten kvar
i en pöl som är blank och rund.`,
    fragor: [
      raden('Vad har snögubben för näsa?', 'En morot', ['En kvist', 'inte-i-texten'], ['En hatt', 'fel-detalj']),
      raden('När blir snögubben liten och tunn?', 'När solen kommer i april', ['På natten', 'fel-detalj'], ['När det snöar', 'inte-i-texten']),
      mellan('Vad har hänt med snögubben i slutet?', 'Han har smält', ['Han har gått hem', 'inte-i-texten'], ['Han har fått en ny hatt', 'bara-ytan']),
      mellan('Varför finns det en pöl på marken?', 'Snön har blivit vatten', ['Det har regnat', 'inte-i-texten'], ['Hatten ligger där', 'bara-ytan']),
      ord('Vad betyder "vaktar" i dikten?', 'Passar på', ['Väcker', 'fel-ordbetydelse'], ['Bygger', 'fel-ordbetydelse']),
      huvud('Vad handlar dikten om?', 'En snögubbe som smälter när våren kommer', ['En hatt som blåser bort', 'inte-i-texten'], ['En morotsnäsa', 'bara-en-del']),
    ],
  },
  {
    titel: 'Sixten och rampen', band: 1, typ: 'berattelse',
    text: `Skejtaren Sixten ville åka nerför den stora rampen i Betongbukten. Han stod länge högst upp. Benen darrade.
– Du klarar det, sa hans kompis Mira.
Sixten tog ett djupt andetag och åkte. Det gick jättefort! Längst ner ramlade han nästan, men han höll balansen. Sixten jublade och ville genast åka igen.`,
    fragor: [
      raden('Var fanns den stora rampen?', 'I Betongbukten', ['I Azaleabyn', 'inte-i-texten'], ['Längst ner', 'fel-detalj']),
      raden('Vad sa Mira?', 'Du klarar det', ['Akta dig', 'inte-i-texten'], ['Det gick jättefort', 'fel-detalj']),
      mellan('Hur kände sig Sixten högst upp på rampen?', 'Rädd och nervös', ['Trött och sömnig', 'inte-i-texten'], ['Han stod länge', 'bara-ytan']),
      mellan('Hur kände sig Sixten efteråt?', 'Glad och stolt', ['Arg på Mira', 'inte-i-texten'], ['Han höll balansen', 'bara-ytan']),
      ord('Vad betyder "jublade"?', 'Ropade av glädje', ['Grät', 'fel-ordbetydelse'], ['Ramlade', 'fel-ordbetydelse']),
      huvud('Vad handlar texten mest om?', 'Sixten som vågar åka nerför en stor ramp', ['Hur man bygger en ramp', 'inte-i-texten'], ['Att Sixten nästan ramlade', 'bara-en-del']),
    ],
  },
  {
    titel: 'Byfest i Azaleabyn!', band: 1, typ: 'annons',
    text: `BYFEST I AZALEABYN!
Lördag 14 juni klockan 12–16
Var: Torget vid brunnen
Det finns: tipspromenad, ansiktsmålning och Bagaren Bulles bullar.
Poeten Rimfrida sjunger klockan 14.
Ta med en filt att sitta på!
Alla är välkomna – det är gratis!`,
    fragor: [
      raden('Vilken veckodag är byfesten?', 'Lördag', ['Söndag', 'inte-i-texten'], ['Juni', 'fel-detalj']),
      raden('Vad ska man ta med sig?', 'En filt', ['Pengar', 'inte-i-texten'], ['Bullar', 'fel-detalj']),
      mellan('Ungefär hur länge håller festen på?', 'I fyra timmar', ['En hel vecka', 'inte-i-texten'], ['I fjorton timmar', 'bara-ytan']),
      mellan('Vem är texten skriven till?', 'Alla som vill komma på festen', ['Bara Bagaren Bulle', 'fel-detalj'], ['Bara de som har en filt', 'bara-ytan']),
      ord('Vad är en "tipspromenad"?', 'En promenad med frågor att svara på', ['En snabb löptur', 'fel-ordbetydelse'], ['En promenad till brunnen', 'fel-ordbetydelse']),
      huvud('Vad är texten till för?', 'Att bjuda in till en fest', ['Att sälja bullar', 'bara-en-del'], ['Att berätta om brunnen', 'inte-i-texten']),
    ],
  },
  {
    titel: 'Roboten Pip', band: 1, typ: 'berattelse',
    text: `Uppfinnaren Ugo byggde en liten robot som hette Pip. Pip kunde bara gå framåt. När Pip kom till en vägg gick den rakt in i den. Bonk!
– Du behöver kunna svänga, sa Ugo.
Han skrev ett nytt program. Nu kunde Pip svänga åt höger. Pip gick runt hela verkstaden och pep av lycka.`,
    fragor: [
      raden('Vad kunde Pip först?', 'Bara gå framåt', ['Svänga åt höger', 'fel-detalj'], ['Flyga', 'inte-i-texten']),
      raden('Vad gjorde Ugo för att hjälpa Pip?', 'Skrev ett nytt program', ['Byggde en ny vägg', 'inte-i-texten'], ['Sa bonk', 'fel-detalj']),
      mellan('Varför gick Pip in i väggen?', 'Pip kunde inte svänga', ['Pip var trött', 'inte-i-texten'], ['Väggen stod i vägen', 'bara-ytan']),
      mellan('Hur kändes det för Pip i slutet?', 'Pip var glad', ['Pip var rädd', 'inte-i-texten'], ['Pip gick runt verkstaden', 'bara-ytan']),
      ord('Vad är en "verkstad"?', 'Ett rum där man bygger och lagar saker', ['En sorts robot', 'fel-ordbetydelse'], ['En stor vägg', 'fel-ordbetydelse']),
      huvud('Vad handlar texten om?', 'En robot som lär sig att svänga', ['Hur man bygger en vägg', 'inte-i-texten'], ['Ljudet när Pip krockar', 'bara-en-del']),
    ],
  },
  {
    titel: 'Från ägg till groda', band: 1, typ: 'fakta',
    text: `Grodan börjar sitt liv som ett litet ägg i vattnet. Ur ägget kommer ett grodyngel. Grodynglet har inga ben, men en lång svans som det simmar med.
Efter några veckor växer det ut ben, och svansen blir mindre och mindre. Till sist kan den lilla grodan hoppa upp på land.
Grodor äter flugor och myggor som de fångar med sin klibbiga tunga.`,
    fragor: [
      raden('Vad äter grodor?', 'Flugor och myggor', ['Gräs och blommor', 'inte-i-texten'], ['Ägg', 'fel-detalj']),
      raden('Vad simmar grodynglet med?', 'Svansen', ['Benen', 'fel-detalj'], ['Fenorna', 'inte-i-texten']),
      mellan('Varför är det bra att tungan är klibbig?', 'Flugorna fastnar på den', ['Den blir inte smutsig', 'inte-i-texten'], ['Grodan bor i vatten', 'bara-ytan']),
      mellan('Var bor ett grodyngel?', 'I vattnet', ['På land', 'fel-detalj'], ['I ett träd', 'inte-i-texten']),
      ord('Vad är ett "grodyngel"?', 'En grodunge som inte har ben än', ['En sorts fluga', 'fel-ordbetydelse'], ['Ett grodägg', 'fel-ordbetydelse']),
      huvud('Vad handlar texten om?', 'Hur ett ägg blir en groda', ['Vad flugor äter', 'inte-i-texten'], ['Grodans klibbiga tunga', 'bara-en-del']),
    ],
  },
  {
    titel: 'Murklas korg', band: 1, typ: 'berattelse',
    text: `Svampplockaren Murkla gick ut i skogen med en tom korg. Hon letade under granarna och bakom stenarna. Efter en lång stund var korgen full av gula kantareller.
På vägen hem började det regna. Murkla sprang in under en stor gran och väntade. Där satt en igelkott som också väntade.
– Vi delar på skyddet, sa Murkla och log.`,
    fragor: [
      raden('Vilka svampar hittade Murkla?', 'Gula kantareller', ['Röda flugsvampar', 'inte-i-texten'], ['Granar', 'fel-detalj']),
      raden('Vart sprang Murkla när det började regna?', 'In under en stor gran', ['Hem till byn', 'inte-i-texten'], ['Bakom stenarna', 'fel-detalj']),
      mellan('Varför satt igelkotten under granen?', 'Den ville inte bli blöt', ['Den letade svamp', 'inte-i-texten'], ['Granen var stor', 'bara-ytan']),
      mellan('Hur länge letade Murkla svamp?', 'Ganska länge', ['Bara en minut', 'inte-i-texten'], ['Tills det började regna', 'fel-detalj']),
      ord('Vad betyder "skyddet" i texten?', 'Platsen där man inte blir blöt', ['Korgen', 'fel-ordbetydelse'], ['Svampen', 'fel-ordbetydelse']),
      huvud('Vad handlar texten om?', 'Murkla som plockar svamp och delar skydd med en igelkott', ['Hur man lagar svampsoppa', 'inte-i-texten'], ['Regnet', 'bara-en-del']),
    ],
  },
  {
    titel: 'Klockan som stannade', band: 2, typ: 'berattelse',
    text: `Klockmakaren Tick vaknade av att det var alldeles tyst. Tidstornets stora klocka, som hade slagit varje timme i hundra år, hade stannat. Hela Azaleabyn var förvirrad. Bagaren Bulle visste inte när bullarna var klara, och barnen kom för sent till skolan.
Tick klättrade upp för de tvåhundra trappstegen. Uppe i tornet luktade det damm och gammal olja. Han lyste med ficklampan och hittade felet: en liten kugge hade gått sönder. Men Tick hade ingen ny kugge.
Då kom han på en idé. Han gick ner till Smeden Hamra och berättade vad som hade hänt. Hamra smidde en ny kugge medan Tick väntade. Den var fortfarande varm när han fick den.
Samma kväll slog klockan åtta slag igen. Hela byn jublade, och Tick somnade gott.`,
    fragor: [
      raden('Vad hade gått sönder i klockan?', 'En liten kugge', ['Ficklampan', 'fel-detalj'], ['Den stora visaren', 'inte-i-texten']),
      raden('Vem gjorde den nya kuggen?', 'Smeden Hamra', ['Bagaren Bulle', 'fel-detalj'], ['Klockmakarens lärling', 'inte-i-texten']),
      mellan('Varför var kuggen varm?', 'Den var nyss smidd i elden', ['Tick hade hållit den länge', 'inte-i-texten'], ['Det luktade olja i tornet', 'bara-ytan']),
      mellan('Varför kom barnen för sent till skolan?', 'De visste inte vad klockan var', ['De hade sovit dåligt', 'inte-i-texten'], ['Bulle bakade bullar', 'bara-ytan']),
      ord('Vad betyder "förvirrad"?', 'Osäker och lite rörig', ['Glad och lugn', 'fel-ordbetydelse'], ['Sömnig', 'fel-ordbetydelse']),
      huvud('Vad handlar texten mest om?', 'Hur Tick och Hamra lagar den stora klockan', ['Hur man bakar bullar', 'inte-i-texten'], ['De tvåhundra trappstegen', 'bara-en-del']),
    ],
  },
  {
    titel: 'Fyrar', band: 2, typ: 'fakta',
    text: `En fyr är ett högt torn vid havet med en stark lampa högst upp. Fyren hjälper båtar att hitta rätt i mörker och dimma. Varje fyr blinkar på sitt eget sätt. En fyr kan till exempel blinka två gånger och sedan vara mörk en stund. På så sätt kan sjömännen veta vilken fyr de ser, och var de är.
Förr i tiden bodde en fyrvaktare i eller bredvid fyren. Fyrvaktaren skulle se till att lampan lyste hela natten. Det var ett ensamt jobb, särskilt på vintern när stormarna kom.
I dag sköter sig de flesta fyrar själva. Lamporna tänds automatiskt när det blir mörkt. Men många gamla fyrar finns kvar, och en del av dem kan man besöka på sommaren.`,
    fragor: [
      raden('Varför blinkar varje fyr på sitt eget sätt?', 'Så att sjömännen vet vilken fyr de ser', ['För att spara ström', 'inte-i-texten'], ['För att det är dimma', 'fel-detalj']),
      raden('Vem skötte fyren förr i tiden?', 'En fyrvaktare', ['Sjömännen', 'fel-detalj'], ['Kaptenen på båten', 'inte-i-texten']),
      mellan('Varför var fyrvaktarens jobb ensamt?', 'Fyren låg långt bort från andra människor', ['Fyrvaktaren hade inga vänner', 'inte-i-texten'], ['Lampan lyste hela natten', 'bara-ytan']),
      mellan('Varför behövs inga fyrvaktare i dag?', 'Lamporna tänds av sig själva', ['Det finns inga båtar längre', 'inte-i-texten'], ['Fyrarna är gamla', 'bara-ytan']),
      ord('Vad betyder "automatiskt"?', 'Av sig själv', ['Väldigt starkt', 'fel-ordbetydelse'], ['Med en bil', 'fel-ordbetydelse']),
      huvud('Vad handlar texten om?', 'Vad fyrar är och hur de används', ['Hur man seglar i storm', 'inte-i-texten'], ['Fyrvaktarens vinter', 'bara-en-del']),
    ],
  },
  {
    titel: 'Rimfridas visa', band: 2, typ: 'berattelse',
    text: `Poeten Rimfrida skulle sjunga en ny visa på byfesten. Hela veckan satt hon vid Rimbäcken och skrev. Men på festdagen, när hon stod på scenen, var lappen med visan borta! Hon letade i alla fickor. Publiken väntade tyst.
Rimfrida kände hur kinderna blev varma. Hon ville helst springa därifrån. Då hörde hon bäcken porla i närheten, och hon kom på något.
– Jag hittar på en ny visa, här och nu, sa hon. Ni får hjälpa mig med rimmen!
– Sol! ropade ett barn.
– Stol! ropade ett annat.
Rimfrida sjöng om en sol som satte sig på en stol, och alla skrattade. Efteråt sa många att det var den bästa visan någonsin.
Lappen hittade hon senare. Den låg i hennes hatt.`,
    fragor: [
      raden('Var hittade Rimfrida lappen till slut?', 'I hatten', ['I fickan', 'fel-detalj'], ['I väskan', 'inte-i-texten']),
      raden('Vilka rim ropade barnen?', 'Sol och stol', ['Hatt och katt', 'inte-i-texten'], ['Bäck och scen', 'fel-detalj']),
      mellan('Hur kände sig Rimfrida när lappen var borta?', 'Nervös och generad', ['Arg på publiken', 'inte-i-texten'], ['Hon letade i fickorna', 'bara-ytan']),
      mellan('Varför skrattade alla?', 'Visan var rolig', ['Rimfrida ramlade', 'inte-i-texten'], ['Barnen ropade', 'bara-ytan']),
      ord('Vad betyder "publiken"?', 'De som tittar och lyssnar', ['Scenen', 'fel-ordbetydelse'], ['De som sjunger', 'fel-ordbetydelse']),
      huvud('Vad handlar texten mest om?', 'Hur Rimfrida klarar sig fast lappen med visan är borta', ['Hur man skriver en visa vid en bäck', 'bara-en-del'], ['Ett barn som vinner en tävling', 'inte-i-texten']),
    ],
  },
  {
    titel: 'Så bygger du en fågelholk', band: 2, typ: 'instruktion',
    text: `En fågelholk är ett litet hus där fåglar kan bygga bo. Bygg den gärna tillsammans med en vuxen.
Du behöver: sex brädor, spik, en hammare, en borr och en pensel med färg.
1. Spika ihop fyra brädor till en låda.
2. Spika fast botten.
3. Borra ett runt hål på framsidan. Hålet ska vara ungefär lika stort som en tvåkrona, så att små fåglar kommer in men inte katter och kråkor.
4. Spika fast taket. Låt taket sticka ut lite framåt, så att det inte regnar in i hålet.
5. Måla holken utanpå, men inte inuti. Färgen kan vara farlig för fågelungarna.
6. Häng upp holken på ett träd, två till tre meter upp. Gör det på hösten eller vintern, så att den är klar när fåglarna börjar bygga bo på våren.`,
    fragor: [
      raden('Hur stort ska hålet vara?', 'Ungefär lika stort som en tvåkrona', ['Lika stort som en kråka', 'fel-detalj'], ['Så stort som möjligt', 'inte-i-texten']),
      raden('När ska man hänga upp holken?', 'På hösten eller vintern', ['På våren', 'fel-detalj'], ['På sommarlovet', 'inte-i-texten']),
      mellan('Varför ska holken vara klar före våren?', 'Fåglarna letar plats för sina bon på våren', ['Det är svårt att spika på våren', 'inte-i-texten'], ['Färgen måste torka', 'bara-ytan']),
      mellan('Vem är texten skriven för?', 'Någon som vill bygga en fågelholk', ['Fåglar som letar bo', 'bara-ytan'], ['Någon som säljer brädor', 'inte-i-texten']),
      ord('Vad betyder "bo" i texten?', 'Ett hem för fåglar och deras ungar', ['En sorts bräda', 'fel-ordbetydelse'], ['Ett hål i taket', 'fel-ordbetydelse']),
      huvud('Vad är texten till för?', 'Att visa hur man bygger en fågelholk', ['Att berätta om fågelungar', 'bara-en-del'], ['Att sälja verktyg', 'inte-i-texten']),
    ],
  },
  {
    titel: 'Ett brev till Mästare Kastanj', band: 2, typ: 'brev',
    text: `Kära Mästare Kastanj!
Jag heter Smeden Hamra och jag har ett problem. I min smedja ska jag smida meningar till byns nya skylt. Men varje gång jag hamrar ihop en mening hamnar orden i fel ordning. Igår stod det på skylten: "Välkomna till är byn alla". Folk stod och kliade sig i huvudet.
Jag har provat att hamra hårdare, men det hjälper inte. Jag har provat att hamra mjukare, men då håller inte meningen ihop alls.
Du som är så klok – vet du vad jag gör för fel? Jag tror att det har något med verbet att göra. Det verkar alltid hamna på konstiga ställen.
Skriv gärna tillbaka snart. Byfesten är om en vecka, och då måste skylten vara klar.
Med vänliga hälsningar
Hamra`,
    fragor: [
      raden('Vad ska Hamra smida meningar till?', 'Byns nya skylt', ['Byfesten', 'fel-detalj'], ['En bok', 'inte-i-texten']),
      raden('När är byfesten?', 'Om en vecka', ['Igår', 'fel-detalj'], ['I morgon', 'inte-i-texten']),
      mellan('Varför kliade sig folk i huvudet?', 'De förstod inte vad skylten betydde', ['De hade myggbett', 'inte-i-texten'], ['Hamra hamrade hårt', 'bara-ytan']),
      mellan('Varför skriver Hamra till just Mästare Kastanj?', 'Hon tror att Kastanj kan hjälpa henne', ['Kastanj har gjort skylten', 'inte-i-texten'], ['Kastanj ska gå på byfesten', 'inte-i-texten']),
      ord('Vad är en "smedja"?', 'Ett rum där man smider', ['En sorts hammare', 'fel-ordbetydelse'], ['En skylt', 'fel-ordbetydelse']),
      huvud('Varför skrev Hamra brevet?', 'För att be om hjälp med meningarna på skylten', ['För att berätta när byfesten är', 'bara-en-del'], ['För att sälja en hammare', 'inte-i-texten']),
    ],
  },
  {
    titel: 'Hösten i Ordskogen', band: 2, typ: 'dikt',
    text: `Nu faller löven, gula och röda,
som brev från träden till marken som väntar.
Ekorren springer med kinderna fulla,
och bäcken sjunger en sång om regn.
Dimman kryper in mellan stammarna,
den viskar och lägger sig tätt över stigen.
Men under mossan, där ingen ser,
ligger en kastanj och drömmer om våren.`,
    fragor: [
      raden('Vilka färger har löven?', 'Gula och röda', ['Gröna och blå', 'inte-i-texten'], ['Grå som dimman', 'fel-detalj']),
      raden('Var ligger kastanjen?', 'Under mossan', ['Över stigen', 'fel-detalj'], ['I ekorrens bo', 'inte-i-texten']),
      mellan('Varför har ekorren kinderna fulla?', 'Den samlar mat inför vintern', ['Den har ont i tänderna', 'inte-i-texten'], ['Den springer fort', 'bara-ytan']),
      mellan('Vad menar dikten med att kastanjen drömmer om våren?', 'Den ska börja växa när det blir vår', ['Kastanjen sover i en säng', 'inte-i-texten'], ['Kastanjen ligger under mossan', 'bara-ytan']),
      ord('Dimman "kryper" in mellan stammarna. Vad betyder det här?', 'Rör sig sakta och tyst', ['Går på alla fyra', 'fel-ordbetydelse'], ['Försvinner', 'fel-ordbetydelse']),
      huvud('Vad handlar dikten om?', 'Hur det är i skogen på hösten', ['Hur man plockar kastanjer', 'inte-i-texten'], ['En bäck som sjunger', 'bara-en-del']),
    ],
  },
  {
    titel: 'Kompassen', band: 2, typ: 'fakta',
    text: `En kompass är ett verktyg som visar väderstrecken: norr, söder, öster och väster. Inuti kompassen finns en tunn nål som kan snurra fritt. Nålen är en magnet. Jorden fungerar också som en jättestor magnet, och därför vänder sig nålen alltid så att ena änden pekar mot norr.
Med en kompass kan man hitta rätt även när man inte ser solen eller några vägskyltar, till exempel i en tät skog eller ute på havet. Sjömän har använt kompassen i nästan tusen år.
Men akta dig! Om du håller kompassen nära något av järn, som en stekpanna eller en cykel, kan nålen peka åt fel håll. Järnet stör magneten.`,
    fragor: [
      raden('Vad är nålen i kompassen?', 'En magnet', ['En pil av guld', 'inte-i-texten'], ['En vägskylt', 'fel-detalj']),
      raden('Hur länge har sjömän använt kompassen?', 'I nästan tusen år', ['I hundra år', 'inte-i-texten'], ['Sedan de första cyklarna', 'inte-i-texten']),
      mellan('Varför är en kompass bra i en tät skog?', 'Där är det svårt att se vart man ska', ['Där finns många magneter', 'inte-i-texten'], ['Skogen ligger i norr', 'bara-ytan']),
      mellan('Vad kan hända om du läser kompassen när du står bredvid en järnräls?', 'Den kan visa fel', ['Den pekar alltid rätt', 'inte-i-texten'], ['Den börjar peka mot solen', 'inte-i-texten']),
      ord('Vad är "väderstrecken"?', 'Norr, söder, öster och väster', ['Olika sorters väder', 'fel-ordbetydelse'], ['Streck på en karta', 'fel-ordbetydelse']),
      huvud('Vad handlar texten om?', 'Hur en kompass fungerar', ['Sjömän på havet', 'bara-en-del'], ['Hur man lagar en cykel', 'inte-i-texten']),
    ],
  },
  {
    titel: 'Hjälpreda sökes!', band: 2, typ: 'annons',
    text: `HJÄLPREDA SÖKES!
Uppfinnaren Ugo söker en hjälpreda till sin verkstad på Robotön.
Du ska:
– hjälpa till att skriva program till robotarna
– leta efter buggar
– sortera skruvar efter storlek
Vi tror att du:
– tycker om att lösa kluriga problem
– inte ger upp när något blir fel
– kan läsa en karta med rutor
Lön: tre kastanjer om dagen och fri lunch (robotsoppa).
Arbetstid: måndag till fredag efter skolan.
Vill du jobba hos oss? Skicka ett brev till Ugo senast den 1 maj. Berätta om en gång när du löste ett svårt problem!`,
    fragor: [
      raden('Vad får man i lön?', 'Tre kastanjer om dagen och fri lunch', ['En egen robot', 'inte-i-texten'], ['Sorterade skruvar', 'fel-detalj']),
      raden('När ska man skicka sitt brev senast?', 'Den 1 maj', ['På fredag', 'fel-detalj'], ['I juni', 'inte-i-texten']),
      mellan('Varför vill Ugo höra om en gång när du löste ett svårt problem?', 'Han vill ha någon som inte ger upp', ['Han behöver hjälp med läxorna', 'inte-i-texten'], ['Han tycker om att få brev', 'bara-ytan']),
      mellan('Kan man jobba hos Ugo en tisdag förmiddag?', 'Nej, bara efter skolan', ['Ja, hela dagen', 'inte-i-texten'], ['Ja, för tisdag är en vardag', 'bara-ytan']),
      ord('Vad betyder "hjälpreda"?', 'Någon som hjälper till', ['En sorts skruv', 'fel-ordbetydelse'], ['En robot', 'fel-ordbetydelse']),
      huvud('Vad är texten till för?', 'Att hitta någon som vill jobba hos Ugo', ['Att berätta om robotsoppa', 'bara-en-del'], ['Att berätta hur en robot byggs', 'inte-i-texten']),
    ],
  },
];
