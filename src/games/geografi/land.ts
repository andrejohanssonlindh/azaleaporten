// Länderna som Kompassön frågar om, med svenska namn. Nyckeln är ISO 3166-1-numret (samma som kartdatan),
// id:t är permanent (det kan hamna i felkoder och sparad statistik). Världsdel och grannar kommer från
// kartdatan (kartdata/lander.json, räknade ur gemensamma gränser), inte härifrån.
// Behöver en vuxens korrläsning: huvudstäderna och de "kända städerna".
//
// stad = huvudstaden; stadAlias = andra godkända namn (stavningar, eller fler huvudstäder som i Sydafrika).
// stader = stora, kända städer som INTE är huvudstad (den första är oftast störst) – Storstadsråttans fälla.
// band 1 = välkända länder (åk 2–3 och början), band 2 = resten.
// tvaDelar = landet ligger i två världsdelar och frågas aldrig med ett enda svar om världsdel.

export type Del = 'europa' | 'asien' | 'afrika' | 'nordamerika' | 'sydamerika' | 'oceanien' | 'antarktis';

export interface LandInfo {
  iso: string;
  id: string;
  namn: string;
  alias?: string[];
  stad: string;
  stadAlias?: string[];
  stader?: string[];
  band: 1 | 2;
  tvaDelar?: [Del, Del];
  /** Litet land: får en ring att trycka på. */
  liten?: boolean;
}

const L = (iso: string, id: string, namn: string, stad: string, band: 1 | 2, extra: Partial<LandInfo> = {}): LandInfo => ({ iso, id, namn, stad, band, ...extra });

export const LAND: LandInfo[] = [
  // Norden
  L('752', 'sverige', 'Sverige', 'Stockholm', 1, { stader: ['Göteborg', 'Malmö'] }),
  L('578', 'norge', 'Norge', 'Oslo', 1, { stader: ['Bergen', 'Trondheim'] }),
  L('208', 'danmark', 'Danmark', 'Köpenhamn', 1, { stadAlias: ['København', 'Kopenhamn'], stader: ['Århus', 'Odense'] }),
  L('246', 'finland', 'Finland', 'Helsingfors', 1, { stadAlias: ['Helsinki'], stader: ['Åbo', 'Tammerfors'] }),
  L('352', 'island', 'Island', 'Reykjavik', 1, { stadAlias: ['Reykjavík'] }),
  // Västeuropa
  L('826', 'storbritannien', 'Storbritannien', 'London', 1, { alias: ['Förenade kungariket'], stader: ['Manchester', 'Liverpool'] }),
  L('372', 'irland', 'Irland', 'Dublin', 1, { stader: ['Cork'] }),
  L('250', 'frankrike', 'Frankrike', 'Paris', 1, { stader: ['Marseille', 'Lyon'] }),
  L('056', 'belgien', 'Belgien', 'Bryssel', 2, { stadAlias: ['Bruxelles', 'Brussel'], stader: ['Antwerpen'] }),
  L('528', 'nederlanderna', 'Nederländerna', 'Amsterdam', 1, { alias: ['Holland'], stader: ['Rotterdam'] }),
  L('442', 'luxemburg', 'Luxemburg', 'Luxemburg', 2, { liten: true }),
  L('276', 'tyskland', 'Tyskland', 'Berlin', 1, { stader: ['Hamburg', 'München'] }),
  L('756', 'schweiz', 'Schweiz', 'Bern', 1, { stader: ['Zürich', 'Genève'] }),
  L('040', 'osterrike', 'Österrike', 'Wien', 1, { stader: ['Salzburg'] }),
  L('492', 'monaco', 'Monaco', 'Monaco', 2, { liten: true }),
  // Sydeuropa
  L('724', 'spanien', 'Spanien', 'Madrid', 1, { stader: ['Barcelona', 'Sevilla'] }),
  L('620', 'portugal', 'Portugal', 'Lissabon', 1, { stadAlias: ['Lisboa'], stader: ['Porto'] }),
  L('380', 'italien', 'Italien', 'Rom', 1, { stadAlias: ['Roma'], stader: ['Milano', 'Neapel'] }),
  L('470', 'malta', 'Malta', 'Valletta', 2, { liten: true }),
  L('300', 'grekland', 'Grekland', 'Aten', 1, { stadAlias: ['Athen'], stader: ['Thessaloniki'] }),
  L('191', 'kroatien', 'Kroatien', 'Zagreb', 2, { stader: ['Split'] }),
  L('705', 'slovenien', 'Slovenien', 'Ljubljana', 2),
  L('070', 'bosnien', 'Bosnien och Hercegovina', 'Sarajevo', 2, { alias: ['Bosnien'] }),
  L('688', 'serbien', 'Serbien', 'Belgrad', 2, { stadAlias: ['Beograd'] }),
  L('499', 'montenegro', 'Montenegro', 'Podgorica', 2),
  L('008', 'albanien', 'Albanien', 'Tirana', 2),
  L('807', 'nordmakedonien', 'Nordmakedonien', 'Skopje', 2, { alias: ['Makedonien'] }),
  L('100', 'bulgarien', 'Bulgarien', 'Sofia', 2),
  // Östeuropa
  L('616', 'polen', 'Polen', 'Warszawa', 1, { stadAlias: ['Warsawa', 'Warsaw'], stader: ['Kraków'] }),
  L('203', 'tjeckien', 'Tjeckien', 'Prag', 2, { stadAlias: ['Praha'] }),
  L('703', 'slovakien', 'Slovakien', 'Bratislava', 2),
  L('348', 'ungern', 'Ungern', 'Budapest', 2),
  L('642', 'rumanien', 'Rumänien', 'Bukarest', 2, { stadAlias: ['București', 'Bucuresti'] }),
  L('498', 'moldavien', 'Moldavien', 'Chișinău', 2, { alias: ['Moldova'], stadAlias: ['Chisinau', 'Kisjinjov'] }),
  L('804', 'ukraina', 'Ukraina', 'Kyiv', 1, { stadAlias: ['Kiev', 'Kyjiv'], stader: ['Charkiv', 'Odesa'] }),
  L('112', 'belarus', 'Belarus', 'Minsk', 2, { alias: ['Vitryssland'] }),
  L('643', 'ryssland', 'Ryssland', 'Moskva', 1, { stadAlias: ['Moscow'], stader: ['Sankt Petersburg'], tvaDelar: ['europa', 'asien'] }),
  L('233', 'estland', 'Estland', 'Tallinn', 2),
  L('428', 'lettland', 'Lettland', 'Riga', 2),
  L('440', 'litauen', 'Litauen', 'Vilnius', 2),
  L('792', 'turkiet', 'Turkiet', 'Ankara', 1, { stader: ['Istanbul'], tvaDelar: ['europa', 'asien'] }),
  // Asien
  L('156', 'kina', 'Kina', 'Peking', 1, { stadAlias: ['Beijing'], stader: ['Shanghai', 'Hongkong'] }),
  L('392', 'japan', 'Japan', 'Tokyo', 1, { stadAlias: ['Tokio'], stader: ['Osaka', 'Kyoto'] }),
  L('356', 'indien', 'Indien', 'New Delhi', 1, { stadAlias: ['Delhi', 'Ny Delhi'], stader: ['Mumbai', 'Kolkata'] }),
  L('764', 'thailand', 'Thailand', 'Bangkok', 1, { stader: ['Chiang Mai'] }),
  L('410', 'sydkorea', 'Sydkorea', 'Seoul', 2, { stader: ['Busan'] }),
  L('408', 'nordkorea', 'Nordkorea', 'Pyongyang', 2, { stadAlias: ['Pjongjang'] }),
  L('704', 'vietnam', 'Vietnam', 'Hanoi', 2, { stader: ['Ho Chi Minh-staden'] }),
  L('360', 'indonesien', 'Indonesien', 'Jakarta', 1, { stader: ['Surabaya'] }),
  L('608', 'filippinerna', 'Filippinerna', 'Manila', 2),
  L('496', 'mongoliet', 'Mongoliet', 'Ulaanbaatar', 2, { stadAlias: ['Ulan Bator'] }),
  L('398', 'kazakstan', 'Kazakstan', 'Astana', 2, { stader: ['Almaty'], tvaDelar: ['europa', 'asien'] }),
  L('586', 'pakistan', 'Pakistan', 'Islamabad', 2, { stader: ['Karachi', 'Lahore'] }),
  L('004', 'afghanistan', 'Afghanistan', 'Kabul', 2),
  L('364', 'iran', 'Iran', 'Teheran', 2, { stadAlias: ['Tehran'] }),
  L('368', 'irak', 'Irak', 'Bagdad', 2, { stadAlias: ['Baghdad'] }),
  L('682', 'saudiarabien', 'Saudiarabien', 'Riyadh', 2, { stadAlias: ['Riyad', 'Riad'], stader: ['Mecka'] }),
  L('760', 'syrien', 'Syrien', 'Damaskus', 2, { stader: ['Aleppo'] }),
  L('524', 'nepal', 'Nepal', 'Katmandu', 2, { stadAlias: ['Kathmandu'] }),
  L('050', 'bangladesh', 'Bangladesh', 'Dhaka', 2),
  L('458', 'malaysia', 'Malaysia', 'Kuala Lumpur', 2),
  L('702', 'singapore', 'Singapore', 'Singapore', 2, { liten: true }),
  L('887', 'jemen', 'Jemen', 'Sanaa', 2),
  // Afrika
  L('818', 'egypten', 'Egypten', 'Kairo', 1, { stadAlias: ['Cairo'], stader: ['Alexandria'], tvaDelar: ['afrika', 'asien'] }),
  L('504', 'marocko', 'Marocko', 'Rabat', 2, { stader: ['Casablanca', 'Marrakech'] }),
  L('012', 'algeriet', 'Algeriet', 'Alger', 2),
  L('788', 'tunisien', 'Tunisien', 'Tunis', 2),
  L('434', 'libyen', 'Libyen', 'Tripoli', 2),
  L('566', 'nigeria', 'Nigeria', 'Abuja', 2, { stader: ['Lagos'] }),
  L('288', 'ghana', 'Ghana', 'Accra', 2),
  L('404', 'kenya', 'Kenya', 'Nairobi', 1, { stader: ['Mombasa'] }),
  L('231', 'etiopien', 'Etiopien', 'Addis Abeba', 2, { stadAlias: ['Addis Ababa'] }),
  L('706', 'somalia', 'Somalia', 'Mogadishu', 2, { stadAlias: ['Muqdisho'] }),
  L('710', 'sydafrika', 'Sydafrika', 'Pretoria', 1, { stadAlias: ['Kapstaden', 'Bloemfontein'], stader: ['Johannesburg', 'Durban'] }),
  L('834', 'tanzania', 'Tanzania', 'Dodoma', 2, { stader: ['Dar es Salaam'] }),
  L('450', 'madagaskar', 'Madagaskar', 'Antananarivo', 2),
  L('180', 'kongo', 'Kongo-Kinshasa', 'Kinshasa', 2, { alias: ['Demokratiska republiken Kongo', 'DR Kongo'] }),
  L('466', 'mali', 'Mali', 'Bamako', 2, { stader: ['Timbuktu'] }),
  L('562', 'niger', 'Niger', 'Niamey', 2),
  L('148', 'tchad', 'Tchad', "N'Djamena", 2, { stadAlias: ['Ndjamena'] }),
  L('729', 'sudan', 'Sudan', 'Khartoum', 2),
  L('384', 'elfenbenskusten', 'Elfenbenskusten', 'Yamoussoukro', 2, { stader: ['Abidjan'] }),
  L('686', 'senegal', 'Senegal', 'Dakar', 2),
  L('024', 'angola', 'Angola', 'Luanda', 2),
  L('270', 'gambia', 'Gambia', 'Banjul', 2, { liten: true }),
  L('894', 'zambia', 'Zambia', 'Lusaka', 2),
  L('454', 'malawi', 'Malawi', 'Lilongwe', 2),
  L('324', 'guinea', 'Guinea', 'Conakry', 2),
  L('694', 'sierraleone', 'Sierra Leone', 'Freetown', 2),
  L('266', 'gabon', 'Gabon', 'Libreville', 2),
  L('800', 'uganda', 'Uganda', 'Kampala', 2),
  // Nordamerika
  L('840', 'usa', 'USA', 'Washington', 1, { alias: ['Förenta staterna', 'Amerika'], stadAlias: ['Washington D.C.', 'Washington DC'], stader: ['New York', 'Los Angeles'] }),
  L('124', 'kanada', 'Kanada', 'Ottawa', 1, { stader: ['Toronto', 'Montréal', 'Vancouver'] }),
  L('484', 'mexiko', 'Mexiko', 'Mexico City', 1, { stadAlias: ['Mexiko City', 'Ciudad de México', 'Mexikostaden'], stader: ['Cancún'] }),
  L('192', 'kuba', 'Kuba', 'Havanna', 2, { stadAlias: ['Havana', 'La Habana'] }),
  L('388', 'jamaica', 'Jamaica', 'Kingston', 2),
  L('320', 'guatemala', 'Guatemala', 'Guatemala City', 2, { stadAlias: ['Guatemala', 'Ciudad de Guatemala'] }),
  L('591', 'panama', 'Panama', 'Panama City', 2, { stadAlias: ['Panamá', 'Ciudad de Panamá'] }),
  L('188', 'costarica', 'Costa Rica', 'San José', 2),
  // Sydamerika
  L('076', 'brasilien', 'Brasilien', 'Brasília', 1, { stadAlias: ['Brasilia'], stader: ['São Paulo', 'Rio de Janeiro'] }),
  L('032', 'argentina', 'Argentina', 'Buenos Aires', 1, { stader: ['Córdoba'] }),
  L('152', 'chile', 'Chile', 'Santiago', 2, { stadAlias: ['Santiago de Chile'], stader: ['Valparaíso'] }),
  L('604', 'peru', 'Peru', 'Lima', 2, { stader: ['Cusco'] }),
  L('170', 'colombia', 'Colombia', 'Bogotá', 2, { stader: ['Medellín'] }),
  L('862', 'venezuela', 'Venezuela', 'Caracas', 2),
  L('068', 'bolivia', 'Bolivia', 'Sucre', 2, { stadAlias: ['La Paz'], stader: ['Santa Cruz'] }),
  L('218', 'ecuador', 'Ecuador', 'Quito', 2, { stader: ['Guayaquil'] }),
  L('858', 'uruguay', 'Uruguay', 'Montevideo', 2),
  L('600', 'paraguay', 'Paraguay', 'Asunción', 2),
  // Oceanien
  L('036', 'australien', 'Australien', 'Canberra', 1, { stader: ['Sydney', 'Melbourne'] }),
  L('554', 'nyazeeland', 'Nya Zeeland', 'Wellington', 1, { stader: ['Auckland'] }),
  L('598', 'papuanyaguinea', 'Papua Nya Guinea', 'Port Moresby', 2),
  L('242', 'fiji', 'Fiji', 'Suva', 2, { liten: true }),
];

export const LAND_BY_ID: Record<string, LandInfo> = Object.fromEntries(LAND.map((l) => [l.id, l]));
export const LAND_BY_ISO: Record<string, LandInfo> = Object.fromEntries(LAND.map((l) => [l.iso, l]));
export const land = (id: string) => LAND_BY_ID[id];

/** Länder med nästan samma namn (Förväxlingsräven). */
export const LIKNANDE_NAMN: [string, string][] = [
  ['osterrike', 'australien'], ['sverige', 'schweiz'], ['slovakien', 'slovenien'], ['island', 'irland'], ['niger', 'nigeria'],
  ['iran', 'irak'], ['mali', 'malawi'], ['gambia', 'zambia'], ['lettland', 'litauen'],
];

export const namnTvilling = (id: string) => LIKNANDE_NAMN.find((p) => p.includes(id))?.find((x) => x !== id);

/** Världsdelarna. Knappen säger "Australien"; Mästare och förklaringar nämner en gång att den också heter Oceanien. */
export const DELAR: { id: Del; namn: string }[] = [
  { id: 'europa', namn: 'Europa' }, { id: 'asien', namn: 'Asien' }, { id: 'afrika', namn: 'Afrika' },
  { id: 'nordamerika', namn: 'Nordamerika' }, { id: 'sydamerika', namn: 'Sydamerika' },
  { id: 'oceanien', namn: 'Australien' }, { id: 'antarktis', namn: 'Antarktis' },
];
export const delNamn = (d: Del) => DELAR.find((x) => x.id === d)!.namn;

/** Haven. */
export const HAV: { id: string; namn: string }[] = [
  { id: 'stilla', namn: 'Stilla havet' }, { id: 'atlanten', namn: 'Atlanten' }, { id: 'indiska', namn: 'Indiska oceanen' },
  { id: 'norra', namn: 'Norra ishavet' }, { id: 'sodra', namn: 'Södra ishavet' },
];

export const NORDEN = ['sverige', 'norge', 'danmark', 'finland', 'island'];
