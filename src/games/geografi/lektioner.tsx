import type { Lesson } from '../../platform/rpg/types';
import { KartaView } from '../../engines/karta/KartaView';
import { EXEMPEL_KARTA, EXEMPEL_ROS } from './kartrummet';
import { varldKarta } from './kartor';
import { EXEMPEL_NORDEN } from './sverige';

// Kompassöns klassrum. Lektionernas id:n är permanenta (se lessons i content.ts).

export const KARTRUMMET: Record<string, Lesson> = {
  kompassrosen: { pages: [
    {
      title: 'Fyra väderstreck',
      text: 'Kompassrosen visar åt vilket håll allt ligger. N betyder norr. Gå medsols runt rosen: norr, öster, söder, väster.\n\nEn ramsa att komma ihåg: "Nu Äter Små Valar" – N, Ö, S, V.',
      pic: <KartaView k={EXEMPEL_ROS} />,
      tips: 'Med norr uppåt ligger öster till höger och väster till vänster. Solen går upp i öster och ner i väster.',
      prova: { mode: 'vaderstreck', level: 0 },
    },
    {
      title: 'Mellan väderstrecken',
      text: 'Mittemellan två väderstreck får man sätta ihop namnen. Mellan norr och öster ligger nordost. Mellan söder och väster ligger sydväst.',
      steps: ['Mellan norr och öster: nordost.', 'Mellan söder och öster: sydost.', 'Mellan söder och väster: sydväst.', 'Mellan norr och väster: nordväst.'],
      prova: { mode: 'vaderstreck', level: 1 },
    },
    {
      title: 'Använd kartan',
      text: 'På Kartritarinnans karta är norr uppåt. Vad ligger norr om Azaleabyn? Följ linjen uppåt från byn – där ligger Talbergen.',
      pic: <KartaView k={EXEMPEL_KARTA} />,
      tips: 'Titta alltid på kompassrosen först. Ibland är en karta vriden, och då är norr inte uppåt!',
      prova: { mode: 'riktning', level: 0 },
    },
  ] },

  skalan: { pages: [
    {
      title: 'Kartan är mindre än verkligheten',
      text: 'En karta är en liten bild av något stort. Skalan berättar hur mycket mindre. "1 cm = 5 km" betyder att varje centimeter på kartan är fem kilometer i verkligheten.',
      steps: ['På kartan: 3 cm.', 'Skalan: 1 cm = 5 km.', '3 · 5 = 15. Det är 15 km i verkligheten.'],
      tips: 'I verkligheten är det alltid längre än på kartan. Därför räknar man gånger.',
      prova: { mode: 'skala', level: 0 },
    },
    {
      title: 'Baklänges',
      text: 'Om du vet hur långt det är i verkligheten kan du räkna ut hur långt det är på kartan. Då delar du med skalan.',
      steps: ['I verkligheten: 60 km.', 'Skalan: 1 cm = 20 km.', '60 / 20 = 3. Det är 3 cm på kartan.'],
      prova: { mode: 'skala', level: 1 },
    },
  ] },
};

export const GLOBEN: Record<string, Lesson> = {
  'sju-varldsdelar': { pages: [
    {
      title: 'Sju världsdelar',
      text: 'Jorden har sju världsdelar: Europa, Asien, Afrika, Nordamerika, Sydamerika, Australien och Antarktis.\n\nAustralien kallas också Oceanien, för den världsdelen är landet Australien och många öar i Stilla havet.',
      pic: <KartaView k={varldKarta({ ekvator: true })} />,
      steps: ['Vi bor i Europa.', 'Asien är störst. Europa och Asien sitter ihop.', 'Antarktis ligger runt sydpolen och är täckt av is.'],
      prova: { mode: 'delar', level: 0 },
    },
    {
      title: 'Två Amerika',
      text: 'Amerika är två världsdelar: Nordamerika och Sydamerika. Gränsen går vid Panama, där landet är som smalast. Mexiko ligger norr om gränsen – i Nordamerika.',
      tips: 'Grönland hör till Danmark, men ön ligger i Nordamerika. Att ett land hör ihop med ett annat betyder inte att det ligger i samma världsdel!',
      prova: { mode: 'land', level: 0 },
    },
    {
      title: 'De fem haven',
      text: 'Mellan världsdelarna finns haven. Stilla havet är störst. Atlanten ligger mellan Europa och Amerika, och Indiska oceanen mellan Afrika och Australien. Runt polerna ligger Norra ishavet och Södra ishavet.',
      pic: <KartaView k={varldKarta({ hav: true })} visa={['stilla', 'atlanten', 'indiska', 'norra', 'sodra']} />,
      prova: { mode: 'hav', level: 0 },
    },
  ] },
};

export const SVERIGERESAN: Record<string, Lesson> = {
  norden: { pages: [
    {
      title: 'Fem länder i Norden',
      text: 'Norden är Sverige, Norge, Danmark, Finland och Island. Länderna ligger högst upp i Europa, och språken i Sverige, Norge och Danmark liknar varandra.',
      pic: <KartaView k={EXEMPEL_NORDEN()} visa={['sverige', 'norge', 'danmark', 'finland', 'island']} />,
      prova: { mode: 'norden', level: 0 },
    },
    {
      title: 'Sveriges grannar',
      text: 'Sverige har gräns på land mot Norge i väster och Finland i öster. Till Danmark i söder går en bro över Öresund – men ingen gräns på land.',
      tips: 'Gränshopparen hoppar gärna till grannlandet. Titta noga på var gränsen går!',
      prova: { mode: 'norden', level: 1 },
    },
  ] },
};

export const HUVUDSTADSEXPRESSEN: Record<string, Lesson> = {
  'storstad-huvudstad': { pages: [
    {
      title: 'Vad är en huvudstad?',
      text: 'Huvudstaden är staden där landets regering och riksdag sitter. Sveriges huvudstad är Stockholm, och Norges är Oslo.',
      prova: { mode: 'norden', level: 0 },
    },
    {
      title: 'Störst är inte alltid huvudstad',
      text: 'Ofta är huvudstaden den största staden – men inte alltid! Storstadsråttan tror att största staden alltid är huvudstad. Det stämmer inte.',
      steps: ['Schweiz: Zürich är störst, men huvudstaden är Bern.', 'Turkiet: Istanbul är störst, men huvudstaden är Ankara.', 'USA: New York är störst, men huvudstaden är Washington.', 'Australien: Sydney är störst, men huvudstaden är Canberra.'],
      tips: 'Fråga dig: var sitter regeringen? Det är huvudstaden.',
      prova: { mode: 'europa', level: 0 },
    },
  ] },
};
