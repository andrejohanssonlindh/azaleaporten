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
  const cape = look.mantel ? { c: look.mantel.color, c2: look.mantel.color2 ?? look.mantel.color, id: look.mantel.form ?? look.mantel.id }
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
  const f = c.form ?? c.id;
  return (
    <g aria-hidden="true">
      <defs><clipPath id="fig-bg"><rect width="120" height="150" rx="14" /></clipPath></defs>
      <g clip-path="url(#fig-bg)">
        <rect width="120" height="150" fill={['bg.natt', 'bg.tornet', 'bg.grotta', 'himmel', 'sno', 'oken', 'undervatten', 'godis', 'disco', 'rymd'].includes(f) ? a : b} />
        {f === 'himmel' && <>{[[24, 26], [86, 44], [40, 70]].map(([x, y]) => <g key={x} fill={b}><circle cx={x} cy={y} r="8" /><circle cx={x + 9} cy={y - 3} r="10" /><circle cx={x + 19} cy={y} r="7" /></g>)}<rect y="130" width="120" height="20" fill="#8ce99a" /></>}
        {f === 'sno' && <>{[[12, 20], [40, 12], [70, 30], [100, 16], [24, 60], [92, 70], [56, 52]].map(([x, y]) => <circle key={`${x}`} cx={x} cy={y} r="2" fill="#fff" />)}<path d="M0 122 Q30 112 60 122 T120 120 V150 H0 Z" fill="#fff" /><circle cx="100" cy="114" r="7" fill="#fff" /><circle cx="100" cy="103" r="5" fill="#fff" /></>}
        {f === 'oken' && <><circle cx="92" cy="26" r="12" fill="#fff3bf" /><path d="M0 124 Q30 108 60 122 T120 116 V150 H0 Z" fill={b} /><path d="M18 124 V100 M18 108 h-6 v-6 M18 112 h6 v-8" stroke="#2f9e44" stroke-width="4" stroke-linecap="round" fill="none" /></>}
        {f === 'undervatten' && <>{[[20, 110], [30, 80], [96, 60], [104, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3 + (i % 2)} fill="none" stroke="#fff" opacity=".6" />)}<path d="M10 150 Q14 130 8 116 M16 150 Q22 128 18 110 M104 150 Q100 132 108 118" stroke="#2f9e44" stroke-width="3" fill="none" /><rect y="140" width="120" height="10" fill="#ffd8a8" /><text x="96" y="92" font-size="12" text-anchor="middle">🐠</text></>}
        {f === 'godis' && <>{[[16, 116, '#e64980'], [104, 112, '#4dabf7'], [34, 132, '#fab005']].map(([x, y, col]) => <g key={`${x}`}><path d={`M${x} ${y} V${(y as number) + 30}`} stroke="#fff" stroke-width="3" /><circle cx={x} cy={y} r="9" fill={col as string} stroke="#fff" stroke-width="2" /></g>)}<rect y="136" width="120" height="14" fill={b} /></>}
        {f === 'disco' && <><circle cx="104" cy="14" r="10" fill="#ced4da" stroke="#fff" /><g class="fig-disco">{['#f783ac', '#74c0fc', '#ffe066', '#b2f2bb'].map((col, i) => <path key={col} d={`M104 14 L${i * 36 - 10} 150 L${i * 36 + 14} 150 Z`} fill={col} opacity=".22" />)}</g><rect y="134" width="120" height="16" fill="#1b1030" /></>}
        {f === 'rymd' && <>{[[14, 18], [34, 46], [70, 12], [104, 60], [20, 80], [52, 30], [94, 100], [8, 120]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="#fff" />)}<circle cx="94" cy="30" r="11" fill={b} /><ellipse cx="94" cy="30" rx="18" ry="4" fill="none" stroke="#ffe8cc" stroke-width="2" /></>}
        {f === 'bg.angen' && <><rect y="110" width="120" height="40" fill={a} /><circle cx="98" cy="22" r="10" fill="#ffd43b" />{[12, 30, 90, 108].map((x) => <circle key={x} cx={x} cy="122" r="3" fill="#fff" />)}</>}
        {f === 'bg.berg' && <><path d="M0 120 L28 60 L48 92 L74 44 L104 100 L120 80 V150 H0 Z" fill={a} /><path d="M66 58 L74 44 L82 58 Z" fill="#fff" /><rect y="128" width="120" height="22" fill="#69db7c" /></>}
        {f === 'bg.hav' && <><rect y="96" width="120" height="54" fill={a} /><path d="M0 100 Q15 94 30 100 T60 100 T90 100 T120 100" fill="none" stroke="#fff" stroke-width="2" opacity=".7" /><rect y="128" width="120" height="22" fill={b} /><circle cx="22" cy="24" r="9" fill="#ffd43b" /></>}
        {f === 'bg.betong' && <><rect y="118" width="120" height="32" fill={a} /><path d="M0 118 a26 26 0 0 1 26 -26 v26 z M120 118 a26 26 0 0 0 -26 -26 v26 z" fill="#868e96" /><rect y="0" width="120" height="150" fill={b} opacity=".25" /></>}
        {f === 'bg.natt' && <><circle cx="96" cy="22" r="9" fill={b} />{[[14, 18], [34, 40], [70, 14], [104, 56], [20, 70], [50, 26]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#fff" />)}<rect y="128" width="120" height="22" fill="#1b1530" /></>}
        {f === 'bg.grotta' && <><path d="M0 0 H120 V10 L112 30 L104 12 L92 26 L84 10 L70 34 L60 12 L48 28 L36 10 L24 30 L12 12 L0 24 Z" fill="#1a1528" /><path d="M14 128 L20 104 L26 128 Z M96 128 L103 98 L110 128 Z" fill={b} opacity=".85" /><path d="M20 104 L23 116 M103 98 L106 112" stroke="#fff" stroke-width="1.5" opacity=".6" /><rect y="128" width="120" height="22" fill="#1a1528" /></>}
        {f === 'bg.tornet' && <><rect x="86" y="20" width="26" height="130" fill="#3b2a7a" /><circle cx="99" cy="40" r="9" fill="#fff8e1" stroke={b} stroke-width="2" /><path d="M99 40 V34 M99 40 H104" stroke="#2b2118" stroke-width="1.5" /><rect y="128" width="120" height="22" fill="#2a1f55" /></>}
      </g>
    </g>
  );
}

const AURA_EMOJI: Record<string, string> = { 'aura.hjartan': '💖', 'aura.eld': '🔥', 'aura.visdom': '💡' };

function Aura({ c }: { c: Cosmetic }) {
  const spots = [[18, 30], [102, 36], [14, 92], [106, 98], [30, 12], [90, 10]];
  const f = c.form ?? c.id;
  const ch = c.emoji ?? AURA_EMOJI[c.id] ?? '✨';
  return (
    <g class="fig-aura" aria-hidden="true">
      {c.id === 'aura.eld' && <ellipse cx="60" cy="96" rx="44" ry="54" fill={c.color} opacity=".22" />}
      {f === 'regnbage' && ['#e03131', '#fab005', '#40c057', '#4dabf7', '#7950f2'].map((col, i) => <path key={col} d={`M${8 + i * 4} 120 A${52 - i * 4} ${66 - i * 4} 0 0 1 ${112 - i * 4} 120`} fill="none" stroke={col} stroke-width="3.5" opacity=".55" />)}
      {f === 'blixt' && [[14, 20, 1], [100, 30, -1], [8, 86, 1], [108, 92, -1]].map(([x, y, d], i) => (
        <path key={i} class="fig-bolt" style={{ animationDelay: `${i * 0.5}s` }} d={`M${x} ${y} l${6 * d} 10 l${-4 * d} 2 l${7 * d} 12 l${-12 * d} -14 l${4 * d} -1 z`} fill={c.color} stroke="#fff" stroke-width=".8" />
      ))}
      {f === 'regn' && Array.from({ length: 14 }, (_, i) => (
        <circle key={i} class="fig-fall" cx={8 + ((i * 37) % 104)} cy={6 + ((i * 53) % 138)} r={i % 3 ? 1.6 : 2.4} fill={i % 2 ? c.color : c.color2 ?? '#fff'} style={{ animationDelay: `${(i * 0.23) % 2.2}s` }} />
      ))}
      {f !== 'regn' && spots.map(([x, y], i) => (
        <text key={i} x={x} y={y} font-size={i % 2 ? 11 : 14} text-anchor="middle" dominant-baseline="central" style={{ animationDelay: `${i * 0.35}s` }}>{ch}</text>
      ))}
    </g>
  );
}

function Cape({ c, c2, id }: { c: string; c2: string; id: string }) {
  if (id === 'vingar' || id === 'drakvingar') {
    const drake = id === 'drakvingar';
    const wing = (d: number) => drake
      ? `M60 84 Q${60 + d * 30} 50 ${60 + d * 56} 58 Q${60 + d * 46} 72 ${60 + d * 52} 86 Q${60 + d * 38} 86 ${60 + d * 40} 102 Q${60 + d * 26} 96 60 100 Z`
      : `M60 86 Q${60 + d * 44} 46 ${60 + d * 52} 74 Q${60 + d * 54} 96 60 92 Q${60 + d * 40} 112 ${60 + d * 30} 124 Q${60 + d * 12} 116 60 96 Z`;
    return (
      <g aria-hidden="true" class="fig-wings">
        {[-1, 1].map((d) => <path key={d} d={wing(d)} fill={c} stroke={c2} stroke-width="2" opacity={drake ? 1 : 0.85} />)}
      </g>
    );
  }
  return (
    <g aria-hidden="true">
      <path d="M44 76 Q60 72 76 76 L94 134 Q60 142 26 134 Z" fill={c} stroke="rgba(0,0,0,.2)" stroke-width="1.5" />
      {id === 'mantel.natt' && [[40, 110], [58, 126], [78, 112], [66, 98], [48, 94]].map(([x, y]) => <circle key={`${x}`} cx={x} cy={y} r="1.8" fill={c2} />)}
      {id === 'mantel.regnbage' && ['#fab005', '#40c057', '#4dabf7', '#7950f2'].map((col, i) => <path key={col} d={`M${30 + i * 2} ${122 - i * 9} L${90 - i * 2} ${122 - i * 9}`} stroke={col} stroke-width="5" opacity=".9" />)}
      {id === 'randig' && [86, 98, 110, 122].map((y, i) => <path key={y} d={`M${36 - i * 2.5} ${y} L${84 + i * 2.5} ${y}`} stroke={c2} stroke-width="4" opacity=".85" />)}
      {id === 'prickig' && [[42, 100], [62, 112], [80, 98], [50, 126], [74, 126], [60, 92]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill={c2} />)}
      {id === 'hjartan' && [[44, 104], [70, 98], [58, 124], [82, 122]].map(([x, y]) => <text key={`${x}`} x={x} y={y} font-size="9" text-anchor="middle" fill={c2}>♥</text>)}
      {id === 'glitter' && [[40, 98], [56, 112], [76, 100], [48, 128], [70, 124], [62, 90], [86, 118], [34, 120]].map(([x, y], i) => <circle key={`${x}-${y}`} class="fig-sparkle" style={{ animationDelay: `${i * 0.27}s` }} cx={x} cy={y} r="1.8" fill={c2} />)}
      {id === 'blixt' && <path d="M62 86 L52 108 L60 108 L54 130 L70 102 L62 102 L68 86 Z" fill={c2} />}
      <circle cx="60" cy="76" r="3.5" fill={c2} stroke="rgba(0,0,0,.25)" />
    </g>
  );
}

function Shoes({ c }: { c: Cosmetic | null }) {
  const a = c?.color ?? '#6b4423', b = c?.color2 ?? '#4a2f18', f = c?.form;
  return (
    <g>
      {f === 'raket' && [53, 67].map((x) => <path key={x} class="fig-flame" d={`M${x - 4} 141 Q${x} 152 ${x + 4} 141 Z`} fill={b} />)}
      {[53, 67].map((x) => (
        <g key={x}>
          <path d={`M${x - 7} 140 Q${x - 7} 132 ${x} 132 Q${x + 8} 132 ${x + 8} 140 Z`} fill={a} stroke="rgba(0,0,0,.3)" />
          <rect x={x - 7} y="138" width="15" height="2.5" fill={b} />
          {f === 'glitter' && [[-3, 136], [2, 134], [5, 137]].map(([dx, y], i) => <circle key={i} class="fig-sparkle" style={{ animationDelay: `${i * 0.4}s` }} cx={x + dx} cy={y} r="1.1" fill="#fff" />)}
          {f === 'blixt' && <path d={`M${x + 1} 133 L${x - 2} 137 L${x + 1} 137 L${x - 1} 140 L${x + 4} 135 L${x + 1} 135 Z`} fill={b} />}
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
  switch (c.form ?? c.id) {
    case 'keps': return <g><path d="M40 32 Q40 14 60 14 Q80 14 80 32 Z" fill={a} /><path d="M58 31 Q78 28 92 33 Q78 36 58 34 Z" fill={a} stroke="rgba(0,0,0,.25)" /><circle cx="60" cy="14" r="2.5" fill={b} /><path d="M50 22 Q60 18 70 22" stroke={b} stroke-width="2" fill="none" /></g>;
    case 'mossa': return <g><path d="M39 34 Q39 8 60 8 Q81 8 81 34 Z" fill={a} />{[46, 54, 62, 70].map((x) => <path key={x} d={`M${x} 12 V32`} stroke="rgba(0,0,0,.12)" stroke-width="2" />)}<rect x="38" y="28" width="44" height="7" rx="3.5" fill={b} /></g>;
    case 'oron': return <g>{[48, 72].map((x, i) => <g key={x} transform={`rotate(${i ? 10 : -10} ${x} 30)`}><ellipse cx={x} cy="10" rx="7" ry="20" fill={a} stroke="rgba(0,0,0,.15)" /><ellipse cx={x} cy="12" rx="3.5" ry="14" fill={b} /></g>)}<path d="M40 30 Q60 20 80 30" stroke={a} stroke-width="4" fill="none" /></g>;
    case 'kattoron': return <g>{[44, 76].map((x, i) => <g key={x}><path d={`M${x - 9} 30 L${x + (i ? 4 : -4)} 6 L${x + 9} 30 Z`} fill={a} /><path d={`M${x - 4} 28 L${x + (i ? 2 : -2)} 14 L${x + 4} 28 Z`} fill={b} /></g>)}<path d="M38 30 Q60 22 82 30" stroke={a} stroke-width="4" fill="none" /></g>;
    case 'cowboy': return <g><ellipse cx="60" cy="30" rx="34" ry="6" fill={a} stroke="rgba(0,0,0,.2)" /><path d="M44 30 Q44 8 52 10 Q60 16 68 10 Q76 8 76 30 Z" fill={a} stroke="rgba(0,0,0,.2)" /><rect x="44" y="24" width="32" height="4" fill={b} /></g>;
    case 'kock': return <g><rect x="44" y="20" width="32" height="12" fill={a} stroke={b} /><circle cx="48" cy="14" r="9" fill={a} stroke={b} /><circle cx="60" cy="9" r="10" fill={a} stroke={b} /><circle cx="72" cy="14" r="9" fill={a} stroke={b} /></g>;
    case 'rosett': return <g><path d="M60 20 L40 8 Q34 20 40 32 Z M60 20 L80 8 Q86 20 80 32 Z" fill={a} stroke="rgba(0,0,0,.2)" /><circle cx="60" cy="20" r="5" fill={b} stroke={a} stroke-width="2" /></g>;
    case 'solhatt': return <g><ellipse cx="60" cy="30" rx="36" ry="7" fill={a} stroke="rgba(0,0,0,.15)" /><path d="M42 30 Q42 10 60 10 Q78 10 78 30 Z" fill={a} stroke="rgba(0,0,0,.15)" /><rect x="42" y="23" width="36" height="5" fill={b} /><circle cx="78" cy="25" r="4" fill={b} /></g>;
    case 'tiara': return <g><path d="M40 32 Q60 24 80 32 L76 26 L70 20 L65 24 L60 10 L55 24 L50 20 L44 26 Z" fill={a} stroke="rgba(0,0,0,.25)" /><circle cx="60" cy="16" r="3" fill={b} /><circle cx="50" cy="24" r="1.8" fill={b} /><circle cx="70" cy="24" r="1.8" fill={b} /></g>;
    case 'gloria': return <g class="fig-halo"><ellipse cx="60" cy="8" rx="20" ry="5" fill="none" stroke={a} stroke-width="4" /><ellipse cx="60" cy="8" rx="20" ry="5" fill="none" stroke={b} stroke-width="1.5" /></g>;
    case 'horn': return <g><path d="M54 30 L60 -2 L66 30 Z" fill={a} stroke="rgba(0,0,0,.2)" />{[6, 14, 22].map((y) => <path key={y} d={`M${56 + y / 10} ${y + 4} L${64 - y / 10} ${y}`} stroke={b} stroke-width="1.5" />)}<path d="M40 30 Q60 22 80 30" stroke={b} stroke-width="3" fill="none" /></g>;
    case 'rymdhjalm': return <g><circle cx="60" cy="50" r="31" fill={b} opacity=".22" stroke={a} stroke-width="4" /><path d="M38 30 Q48 22 56 24" stroke="#fff" stroke-width="3" fill="none" opacity=".8" /><rect x="56" y="14" width="8" height="6" rx="2" fill={a} /><circle cx="60" cy="12" r="3" fill="#e03131" /></g>;
    case 'hatt.party': return <g><path d="M48 30 L60 2 L72 30 Z" fill={a} /><circle cx="56" cy="20" r="2" fill={b} /><circle cx="64" cy="14" r="2" fill={b} /><circle cx="61" cy="25" r="2" fill={b} /><circle cx="60" cy="3" r="3" fill={b} /></g>;
    case 'hatt.tofs': return <g><path d="M38 34 Q38 12 60 12 Q82 12 82 34 Z" fill={a} /><rect x="38" y="29" width="44" height="6" rx="3" fill={b} /><circle cx="60" cy="10" r="5" fill={b} /></g>;
    case 'hatt.blomkrans': case 'blomkrans': return <g>{[40, 50, 60, 70, 80].map((x, i) => <g key={x}><circle cx={x} cy={i % 2 ? 26 : 29} r="5" fill={a} /><circle cx={x} cy={i % 2 ? 26 : 29} r="1.8" fill="#ffd43b" /></g>)}<path d="M36 30 Q60 22 84 30" stroke={b} stroke-width="2" fill="none" /></g>;
    case 'hatt.troll': return <g><ellipse cx="60" cy="30" rx="28" ry="5" fill={a} /><path d="M44 30 Q56 18 66 -2 Q68 16 76 30 Z" fill={a} /><text x="58" y="20" font-size="8" text-anchor="middle" fill={b}>★</text><text x="66" y="10" font-size="6" text-anchor="middle" fill={b}>★</text></g>;
    case 'hatt.pirat': return <g><path d="M34 30 Q60 4 86 30 Q60 22 34 30 Z" fill={a} /><circle cx="60" cy="20" r="3.5" fill={b} /><path d="M57 25 L63 25" stroke={b} stroke-width="1.5" /></g>;
    case 'hatt.viking': return <g><path d="M38 38 Q38 16 60 16 Q82 16 82 38 Z" fill={a} /><rect x="38" y="32" width="44" height="5" fill="#5c4b3b" /><path d="M40 28 Q28 22 30 8 Q36 20 44 22 Z M80 28 Q92 22 90 8 Q84 20 76 22 Z" fill={b} stroke="rgba(0,0,0,.25)" /></g>;
    case 'hatt.mastarkrona': return <g><path d="M38 32 L38 12 L48 22 L60 4 L72 22 L82 12 L82 32 Z" fill={a} stroke="rgba(0,0,0,.25)" /><circle cx="60" cy="24" r="3.5" fill={b} /><circle cx="46" cy="26" r="2.5" fill="#4dabf7" /><circle cx="74" cy="26" r="2.5" fill="#4dabf7" /></g>;
    default: return null;
  }
}
