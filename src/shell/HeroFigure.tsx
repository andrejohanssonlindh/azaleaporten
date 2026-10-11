import { dataRev } from '../state';
import { getProfile } from '../platform/profiles';
import { getInv } from '../platform/rpg/inventory';
import { materialTier, RARITIES, type Item, type Slot } from '../platform/rpg/items';
import { wornLook, type Cosmetic, type LookSlot } from '../platform/rpg/wardrobe';
import { animal, color } from '../content/heroes';

// Hjältefiguren: en ritad SVG-kropp med djurets huvud. Utrustningen syns på den (hjälm, rustning, vapen, sköld,
// amulett, husdjur) och utseendet från Garderoben ligger ovanpå (hatt, mantel, skor, bakgrund, glitter).

const METAL = ['#a9744f', '#8d5524', '#cd7f32', '#8f9aa5', '#d0d5db', '#f2c94c', '#b197fc'];
const metal = (it: Item) => METAL[materialTier(it.ilvl)];
const rar = (it: Item) => RARITIES[it.rarity].color;

/** Vilken form ett föremål ritas som. Unika föremål (pionjär, signatur) får en form efter sin plats. */
function shapeOf(it: Item): string {
  if (it.base === 'pionjarmantel') return 'mantel';
  if (it.base.startsWith('signatur:')) return { huvud: 'krona', kropp: 'mantel', vapen: 'stav', skold: 'trollbok', amulett: 'amulett', husdjur: '' }[it.slot];
  return it.base;
}

export interface FigureLook { gear: Partial<Record<Slot, Item>>; look: Partial<Record<LookSlot, Cosmetic>> }

export function figureLook(hid: string, preview?: Cosmetic | null): FigureLook {
  const inv = getInv(hid);
  const gear: Partial<Record<Slot, Item>> = {};
  for (const [slot, id] of Object.entries(inv.equipped) as [Slot, string][]) {
    const it = inv.items.find((x) => x.id === id);
    if (it) gear[slot] = it;
  }
  const look = wornLook(hid);
  if (preview) look[preview.slot] = preview;
  return { gear, look };
}

/** noPet: husdjuret ritas inte (Dimstormen ritar det själv, eftersom det springer omkring). */
export function HeroFigure({ hid, size = 160, preview, pose, label, noPet }: { hid: string; size?: number; preview?: Cosmetic | null; pose?: 'attack' | 'hurt' | null; label?: string; noPet?: boolean }) {
  dataRev.value; // ritas om när utrustning eller utseende ändras
  const p = getProfile(hid);
  if (!p) return null;
  const { gear, look } = figureLook(hid, preview);
  const tunic = color(p.color).hex;
  const body = gear.kropp, head = gear.huvud, weapon = gear.vapen, off = gear.skold, amu = gear.amulett, pet = gear.husdjur;
  const cape = look.mantel ? { c: look.mantel.color, c2: look.mantel.color2 ?? look.mantel.color, id: look.mantel.id }
    : body && shapeOf(body) === 'mantel' ? { c: rar(body), c2: metal(body), id: 'gear' } : null;
  const shoe = look.skor ?? null;
  return (
    <svg class={`hero-figure${pose ? ` pose-${pose}` : ''}`} viewBox="0 0 120 150" width={size} height={Math.round(size * 1.25)} role="img" aria-label={label ?? `${p.name} som ${animal(p.animal).name.toLowerCase()}`}>
      {look.bakgrund && <Backdrop c={look.bakgrund} />}
      {look.aura && <Aura c={look.aura} />}
      <ellipse cx="60" cy="142" rx="30" ry="5" fill="#000" opacity=".15" />
      {cape && <Cape {...cape} />}
      <g class="fig-body">
        {/* ben och skor */}
        <rect x="49" y="114" width="8" height="22" rx="3" fill="#5c4b3b" />
        <rect x="63" y="114" width="8" height="22" rx="3" fill="#5c4b3b" />
        <Shoes c={shoe} />
        {/* tunika */}
        <path d="M44 76 Q60 70 76 76 L80 120 Q60 126 40 120 Z" fill={tunic} stroke="rgba(0,0,0,.18)" stroke-width="1.5" />
        {body && <Armor it={body} />}
        {!body || shapeOf(body) !== 'rustning' ? <rect x="41" y="102" width="38" height="5" rx="2" fill="#5c3a1a" /> : null}
        {amu && <Amulet it={amu} />}
        {/* armar */}
        <rect x="31" y="78" width="11" height="30" rx="5.5" fill={tunic} stroke="rgba(0,0,0,.18)" stroke-width="1.5" />
        <rect x="78" y="78" width="11" height="30" rx="5.5" fill={tunic} stroke="rgba(0,0,0,.18)" stroke-width="1.5" />
        <circle cx="36.5" cy="110" r="5.5" fill="#f1dcc4" stroke="rgba(0,0,0,.2)" />
        <circle cx="83.5" cy="110" r="5.5" fill="#f1dcc4" stroke="rgba(0,0,0,.2)" />
      </g>
      {weapon && <g class="fig-weapon"><Weapon it={weapon} /></g>}
      {off && <OffHand it={off} tunic={tunic} />}
      {/* huvudet är djuret */}
      <circle cx="60" cy="50" r="25" fill={tunic} opacity=".18" />
      <text x="60" y="52" font-size="46" text-anchor="middle" dominant-baseline="central" class="fig-head">{animal(p.animal).emoji}</text>
      {look.hatt ? <Hat c={look.hatt} /> : head && <Headgear it={head} />}
      {pet && !noPet && <text x="102" y="134" font-size="20" text-anchor="middle" dominant-baseline="central">{pet.icon}</text>}
    </svg>
  );
}

function Backdrop({ c }: { c: Cosmetic }) {
  const [a, b] = [c.color, c.color2 ?? c.color];
  return (
    <g aria-hidden="true">
      <defs><clipPath id="fig-bg"><rect width="120" height="150" rx="14" /></clipPath></defs>
      <g clip-path="url(#fig-bg)">
        <rect width="120" height="150" fill={c.id === 'bg.natt' || c.id === 'bg.tornet' || c.id === 'bg.grotta' ? a : b} />
        {c.id === 'bg.angen' && <><rect y="110" width="120" height="40" fill={a} /><circle cx="98" cy="22" r="10" fill="#ffd43b" />{[12, 30, 90, 108].map((x) => <circle key={x} cx={x} cy="122" r="3" fill="#fff" />)}</>}
        {c.id === 'bg.berg' && <><path d="M0 120 L28 60 L48 92 L74 44 L104 100 L120 80 V150 H0 Z" fill={a} /><path d="M66 58 L74 44 L82 58 Z" fill="#fff" /><rect y="128" width="120" height="22" fill="#69db7c" /></>}
        {c.id === 'bg.hav' && <><rect y="96" width="120" height="54" fill={a} /><path d="M0 100 Q15 94 30 100 T60 100 T90 100 T120 100" fill="none" stroke="#fff" stroke-width="2" opacity=".7" /><rect y="128" width="120" height="22" fill={b} /><circle cx="22" cy="24" r="9" fill="#ffd43b" /></>}
        {c.id === 'bg.betong' && <><rect y="118" width="120" height="32" fill={a} /><path d="M0 118 a26 26 0 0 1 26 -26 v26 z M120 118 a26 26 0 0 0 -26 -26 v26 z" fill="#868e96" /><rect y="0" width="120" height="150" fill={b} opacity=".25" /></>}
        {c.id === 'bg.natt' && <><circle cx="96" cy="22" r="9" fill={b} />{[[14, 18], [34, 40], [70, 14], [104, 56], [20, 70], [50, 26]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#fff" />)}<rect y="128" width="120" height="22" fill="#1b1530" /></>}
        {c.id === 'bg.grotta' && <><path d="M0 0 H120 V10 L112 30 L104 12 L92 26 L84 10 L70 34 L60 12 L48 28 L36 10 L24 30 L12 12 L0 24 Z" fill="#1a1528" /><path d="M14 128 L20 104 L26 128 Z M96 128 L103 98 L110 128 Z" fill={b} opacity=".85" /><path d="M20 104 L23 116 M103 98 L106 112" stroke="#fff" stroke-width="1.5" opacity=".6" /><rect y="128" width="120" height="22" fill="#1a1528" /></>}
        {c.id === 'bg.tornet' && <><rect x="86" y="20" width="26" height="130" fill="#3b2a7a" /><circle cx="99" cy="40" r="9" fill="#fff8e1" stroke={b} stroke-width="2" /><path d="M99 40 V34 M99 40 H104" stroke="#2b2118" stroke-width="1.5" /><rect y="128" width="120" height="22" fill="#2a1f55" /></>}
      </g>
    </g>
  );
}

function Aura({ c }: { c: Cosmetic }) {
  const spots = [[18, 30], [102, 36], [14, 92], [106, 98], [30, 12], [90, 10]];
  return (
    <g class="fig-aura" aria-hidden="true">
      {c.id === 'aura.eld' && <ellipse cx="60" cy="96" rx="44" ry="54" fill={c.color} opacity=".22" />}
      {spots.map(([x, y], i) => (
        <text key={i} x={x} y={y} font-size={i % 2 ? 11 : 14} text-anchor="middle" dominant-baseline="central" style={{ animationDelay: `${i * 0.35}s` }}>
          {c.id === 'aura.hjartan' ? '💖' : c.id === 'aura.eld' ? '🔥' : '✨'}
        </text>
      ))}
    </g>
  );
}

function Cape({ c, c2, id }: { c: string; c2: string; id: string }) {
  return (
    <g aria-hidden="true">
      <path d="M44 76 Q60 72 76 76 L94 134 Q60 142 26 134 Z" fill={c} stroke="rgba(0,0,0,.2)" stroke-width="1.5" />
      {id === 'mantel.natt' && [[40, 110], [58, 126], [78, 112], [66, 98], [48, 94]].map(([x, y]) => <circle key={`${x}`} cx={x} cy={y} r="1.8" fill={c2} />)}
      {id === 'mantel.regnbage' && ['#fab005', '#40c057', '#4dabf7', '#7950f2'].map((col, i) => <path key={col} d={`M${30 + i * 2} ${122 - i * 9} L${90 - i * 2} ${122 - i * 9}`} stroke={col} stroke-width="5" opacity=".9" />)}
      <circle cx="60" cy="76" r="3.5" fill={c2} stroke="rgba(0,0,0,.25)" />
    </g>
  );
}

function Shoes({ c }: { c: Cosmetic | null }) {
  const a = c?.color ?? '#6b4423', b = c?.color2 ?? '#4a2f18';
  return (
    <g>
      {[53, 67].map((x) => (
        <g key={x}>
          <path d={`M${x - 7} 140 Q${x - 7} 132 ${x} 132 Q${x + 8} 132 ${x + 8} 140 Z`} fill={a} stroke="rgba(0,0,0,.3)" />
          <rect x={x - 7} y="138" width="15" height="2.5" fill={b} />
        </g>
      ))}
    </g>
  );
}

function Armor({ it }: { it: Item }) {
  const m = metal(it), r = rar(it), s = shapeOf(it);
  if (s === 'rustning') return (
    <g>
      <path d="M44 78 Q60 73 76 78 L78 112 Q60 118 42 112 Z" fill={m} stroke={r} stroke-width="2.5" />
      <path d="M60 78 V114 M44 94 Q60 99 76 94" stroke="rgba(0,0,0,.2)" stroke-width="1.5" fill="none" />
      {[48, 72].map((x) => <circle key={x} cx={x} cy="84" r="1.6" fill="rgba(0,0,0,.3)" />)}
    </g>
  );
  if (s === 'tunika') return <path d="M40 116 Q60 122 80 116 L80 120 Q60 126 40 120 Z" fill={r} />;
  // mantel: kragen syns framtill, själva manteln ritas bakom kroppen
  return <path d="M46 76 L60 90 L74 76" fill="none" stroke={r} stroke-width="4" stroke-linejoin="round" />;
}

function Amulet({ it }: { it: Item }) {
  const s = shapeOf(it), r = rar(it);
  if (s === 'ring') return <circle cx="36.5" cy="110" r="3" fill="none" stroke={metal(it)} stroke-width="2" />;
  return (
    <g>
      <path d="M50 77 Q60 88 70 77" fill="none" stroke={metal(it)} stroke-width="1.5" />
      <circle cx="60" cy="88" r="4.5" fill={s === 'talisman' ? '#1c7ed6' : r} stroke={metal(it)} stroke-width="2" />
      {s === 'talisman' && <circle cx="60" cy="88" r="1.6" fill="#fff" />}
    </g>
  );
}

function Weapon({ it }: { it: Item }) {
  const m = metal(it), r = rar(it), wood = '#8d5524';
  const glow = it.rarity >= 2 ? r : 'rgba(0,0,0,.35)';
  switch (shapeOf(it)) {
    case 'svard': return <g><path d="M34.5 60 L38.5 60 L38.5 100 L34.5 100 Z M34.5 60 L36.5 54 L38.5 60" fill={m} stroke={glow} stroke-width="1.2" /><rect x="29" y="100" width="15" height="4" rx="2" fill={r} /><rect x="35" y="104" width="3" height="10" fill={wood} /></g>;
    case 'yxa': return <g><rect x="35" y="66" width="3.5" height="56" rx="1.5" fill={wood} /><path d="M38 68 Q52 66 50 82 Q44 78 38 80 Z" fill={m} stroke={glow} stroke-width="1.2" /></g>;
    case 'stav': return <g><rect x="35" y="56" width="3.5" height="76" rx="1.5" fill={wood} /><circle cx="36.8" cy="54" r="6" fill={r} stroke={m} stroke-width="2" /><circle cx="35" cy="52" r="1.8" fill="#fff" opacity=".8" /></g>;
    case 'bage': return <g><path d="M30 78 Q48 110 30 142" fill="none" stroke={wood} stroke-width="3.5" /><path d="M30 78 L30 142" stroke={m} stroke-width="1" /><circle cx="36.5" cy="110" r="2" fill={r} /></g>;
    case 'hammare': return <g><rect x="35" y="72" width="3.5" height="48" rx="1.5" fill={wood} /><rect x="27" y="62" width="20" height="12" rx="2" fill={m} stroke={glow} stroke-width="1.2" /></g>;
    default: return null;
  }
}

function OffHand({ it, tunic }: { it: Item; tunic: string }) {
  const m = metal(it), r = rar(it);
  switch (shapeOf(it)) {
    case 'skold': return <g><path d="M74 94 H96 V108 Q96 122 85 128 Q74 122 74 108 Z" fill={m} stroke={r} stroke-width="2.5" /><path d="M85 100 V120 M78 108 H92" stroke={tunic} stroke-width="3" /></g>;
    case 'trollbok': return <g><rect x="76" y="98" width="18" height="22" rx="2" fill={r} stroke={m} stroke-width="2" transform="rotate(-8 85 109)" /><circle cx="85" cy="109" r="3" fill={m} /></g>;
    case 'lykta': return <g><path d="M85 96 V102" stroke={m} stroke-width="1.5" /><rect x="79" y="102" width="12" height="16" rx="3" fill="#ffe066" stroke={m} stroke-width="2" /><circle cx="85" cy="110" r="3" fill="#fff" opacity=".9" /><rect x="78" y="100" width="14" height="3" rx="1" fill={r} /></g>;
    default: return null;
  }
}

function Headgear({ it }: { it: Item }) {
  const m = metal(it), r = rar(it);
  switch (shapeOf(it)) {
    case 'hjalm': return <g><path d="M38 36 Q38 14 60 14 Q82 14 82 36 Z" fill={m} stroke={r} stroke-width="2.5" /><rect x="38" y="32" width="44" height="4" rx="2" fill={r} /><circle cx="60" cy="14" r="3" fill={r} /></g>;
    case 'hatt': return <g><rect x="38" y="28" width="44" height="5" rx="2.5" fill="#212529" /><rect x="46" y="6" width="28" height="23" rx="2" fill="#212529" /><rect x="46" y="22" width="28" height="5" fill={r} /></g>;
    case 'luva': return <g><path d="M40 32 Q40 14 60 14 Q80 14 80 32 Z" fill={r} /><path d="M60 32 Q78 30 90 34" stroke={r} stroke-width="5" stroke-linecap="round" fill="none" /><circle cx="60" cy="14" r="2.5" fill={m} /></g>;
    case 'krona': return <g><path d="M42 30 L42 14 L50 22 L60 10 L70 22 L78 14 L78 30 Z" fill={m === METAL[0] || m === METAL[1] ? '#f2c94c' : m} stroke="rgba(0,0,0,.25)" /><circle cx="60" cy="24" r="2.5" fill={r} /></g>;
    default: return null;
  }
}

function Hat({ c }: { c: Cosmetic }) {
  const a = c.color, b = c.color2 ?? '#fff';
  switch (c.id) {
    case 'hatt.party': return <g><path d="M48 30 L60 2 L72 30 Z" fill={a} /><circle cx="56" cy="20" r="2" fill={b} /><circle cx="64" cy="14" r="2" fill={b} /><circle cx="61" cy="25" r="2" fill={b} /><circle cx="60" cy="3" r="3" fill={b} /></g>;
    case 'hatt.tofs': return <g><path d="M38 34 Q38 12 60 12 Q82 12 82 34 Z" fill={a} /><rect x="38" y="29" width="44" height="6" rx="3" fill={b} /><circle cx="60" cy="10" r="5" fill={b} /></g>;
    case 'hatt.blomkrans': return <g>{[40, 50, 60, 70, 80].map((x, i) => <g key={x}><circle cx={x} cy={i % 2 ? 26 : 29} r="5" fill={a} /><circle cx={x} cy={i % 2 ? 26 : 29} r="1.8" fill="#ffd43b" /></g>)}<path d="M36 30 Q60 22 84 30" stroke={b} stroke-width="2" fill="none" /></g>;
    case 'hatt.troll': return <g><ellipse cx="60" cy="30" rx="28" ry="5" fill={a} /><path d="M44 30 Q56 18 66 -2 Q68 16 76 30 Z" fill={a} /><text x="58" y="20" font-size="8" text-anchor="middle" fill={b}>★</text><text x="66" y="10" font-size="6" text-anchor="middle" fill={b}>★</text></g>;
    case 'hatt.pirat': return <g><path d="M34 30 Q60 4 86 30 Q60 22 34 30 Z" fill={a} /><circle cx="60" cy="20" r="3.5" fill={b} /><path d="M57 25 L63 25" stroke={b} stroke-width="1.5" /></g>;
    case 'hatt.viking': return <g><path d="M38 38 Q38 16 60 16 Q82 16 82 38 Z" fill={a} /><rect x="38" y="32" width="44" height="5" fill="#5c4b3b" /><path d="M40 28 Q28 22 30 8 Q36 20 44 22 Z M80 28 Q92 22 90 8 Q84 20 76 22 Z" fill={b} stroke="rgba(0,0,0,.25)" /></g>;
    case 'hatt.mastarkrona': return <g><path d="M38 32 L38 12 L48 22 L60 4 L72 22 L82 12 L82 32 Z" fill={a} stroke="rgba(0,0,0,.25)" /><circle cx="60" cy="24" r="3.5" fill={b} /><circle cx="46" cy="26" r="2.5" fill="#4dabf7" /><circle cx="74" cy="26" r="2.5" fill="#4dabf7" /></g>;
    default: return null;
  }
}
