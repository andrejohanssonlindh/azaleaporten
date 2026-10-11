# Status – Azaleaporten

*Updated 2026-10-11: **Grottdyket**, the second real mini-game (turn-based dungeon dive, push your luck at each staircase). Before that **Dimstormen**, a real mini-game (survivors-style action, gear decides how you fight), plus 2 tokens a day from the daily quests. Before that, Vuxenläge (Phase 6) is done: a per-hero overview, quota and multi-tab guards, a backup reminder. Before that, games became lazy-loaded per area (main chunk 137 → 82 KB gzipped), and the gear round after the user's first playtest: a drawn hero figure, Garderoben/Skräddaren, gear that shows in fights (path monsters, boss intro), Arenan as a mini-game prototype, and a tidier Azaleagården. Betongbukten, Talbergen and the village were done before. Live: https://andrejohanssonlindh.github.io/azaleaporten/*

## Done

- **Phase 1, platform:**
  - Vite + Preact + TS PWA on GitHub Pages
  - versioned storage with migrations and backups
  - the gate (Porten) with an encrypted family pack (only generic boss personas so far)
  - hero creation (name, animal, colour, class, årskurs)
  - Vuxenläge (heroes, backup/restore, lock the gate, import from the old v0.1)
- **Phase 2, the island + Tidstornet:**
  - the island map: Azaleabyn, Övningsängen, regions, fog spots reserved for later
  - Tidstornet: the clock game ported from v0.1, 7 eras, 13 stages, 3 monster bosses + 1 Mästare
  - 10-question runs with star rules, a 5-question repeat on Övningsängen, Tidslabbet (free practice + the time-reading tool)
  - rewards with no currency per answer, and tiredness after 30 minutes
- **Phase 3, loot:**
  - chests (pity after 3 runs without one, none when tired)
  - items with seeded stats, equipment in Azaleagården, the Smedjan (shop / melt / upgrade)
  - tamed bosses → pet items, the Pionjärkista
  - gear affects only boss fights, luck, XP and hints (see the "learning integrity" rule in CLAUDE.md)

- **Phase 5a, Talbergen (matematik):**
  - the **drill engine** (`src/engines/drill/`): a game supplies `make / diagnose / explain / solution / hint` (+ an optional `Visual`), and `drillModule()` turns it into a `GameModule` with a shared View (an equation with an answer box, open → fixing → done). Shared error tags: `omvanda-siffror`, `annat`.
  - **Tiokompisbron** (`src/games/tiokompis/`): ten pairs, hundred pairs, +/− within 20 and to 100, with and without tiotalsövergång, missing terms. 14 stages, monsters Tiotapparen (`glomd-tia`) and Baklängesbävern (`lanade-inte`), Mästare Brovaktaren. Ten-frames as visual support.
  - **Tabellgruvan** (`src/games/tabeller/`): tables 2/5/10 → 3/4 → 6–9 → 11/12 → all (the other factor always goes up to 12), division, the hidden factor, 0/1 rules, and a mixed race against the clock. 14 stages, monsters Plusråttan (`plus`), Nollfladdermusen (`noll-ett`) and Gångerspindeln (`granntabell`), Mästare Gruvmästarinnan. A dot array as hint.
  - Explanations after a mistake explain the method but never state the answer (tested), so the child really fixes it.
  - Platform: `GameModule.errLabel`, `AreaDef.texts` (result-screen words per area), a generic "Öva fritt" for every non-klocka area (`#/labb/<area>`), and the map's "Fortsätt" button follows the last area played (else the first one fitting the hero's årskurs).

- **Talbergen complete:**
  - The drill engine also handles a text prompt, units (`'kr'`), multiple choice (`choices`, e.g. < = >), fractions (`Frac` parts), decimals (comma or point) and negatives (a ± button, `keypad: 'signed'`).
  - **Myntmarknaden** (`src/games/pengar/`): count coins and notes, add prices, change, price × quantity. Myntskatan (`raknade-antal`), Tvättbjörnen Tvärtom (`lanade-inte`), Marknadsmästarinnan.
  - **Tallinjebron** (`src/games/tallinje/`): number lines 0–20/100/1000 and tenths, rounding (5 rounds up), negative numbers and the thermometer, decimal arithmetic. Velpaddan (`fem-regeln`), Isbjörnen Minus (`teckenfel`), Lindansaren.
  - **Bråkbageriet** (`src/games/brak/`): naming fractions from pies/bars, comparing, equivalent fractions, fraction of a number, + and − with the same denominator. Glufsgrisen (`storre-namnare`), Tårtmusen (`adderade-namnare`), Bagarmästarinnan.
  - **Talbergens topp** (`src/games/talbergen.ts`, `src/games/region.tsx`): the region boss (persona slot `talbergen.region`, Professor Pi in the public build) mixes questions from all six games (`mode: '<area>/<mode>'`). It opens on the region page after 3 area Mästare (`regionProgress()` in `src/content/areas.ts`). Mistakes there put mist on the area the question came from (`GameModule.areaOf`).
- **The village is complete:** Azaleagården, Uppdragstavlan, Smedjan (now with the 🧿 Sköldamulett, which saves the streak for a missed day after the weekly frysdag) and **Biblioteket** (`#/biblioteket`: totals, and per area how sure each skill is plus what has been tricky lately).
- **Betongbukten complete (geometri)** (`src/games/geometri/`, shared SVG helpers in `draw.tsx`), one drill game per Malmö skatepark, each with 2 monsters and a Mästare (generic personas in `src/content/bosses.ts`):
  - **Fluffy** (`former/`): name shapes, "is this a …?" for rotated shapes, count corners/sides (incl. inward corners), find all of a kind. Grodan Dubbelhopp (`raknade-start-igen`), Snurrsnigeln (`vriden-form`).
  - **Svampen** (`symmetri/`): mirror a grid figure (A/B/C: mirror, copy, wrong axis), lines of symmetry, repeating and growing patterns, mirroring in a coordinate grid. Kopiekatten (`flyttade`), Flamingon Snedvik (`diagonal`).
  - **Oxie** (`langd/`): read a ruler (cm, half cm, mm; not starting at 0), length units, perimeter (incl. L-shapes), missing side. Mätmasken (`lasta-slutet`), Kantkrabban (`bara-tva-sidor`).
  - **Sibbarp** (`vinklar/`): acute/right/obtuse, compare angles (arm length trap), protractor with two scales, turns ↔ degrees (skate tricks), missing angles (line, triangle, isosceles, around a point, quadrilateral). Bläckfisken Långarm (`langa-ben`), Sälen Bakfram (`fel-skala`).
  - **Bryggeriet** (`area/`): count squares (incl. halves and a triangle on the grid), rectangle/triangle area, missing side, L-shapes. Kantkrypet (`raknade-omkrets`), Dubbeldraken (`glomde-halvera`).
  - **Kroksbäck** (`kroppar/`): name solids (2D-name distractors, everyday objects), faces/edges/vertices with hidden edges dashed, cubes in isometric blocks and stairs, box volume, aquarium litres, l/dl/cl/ml/dm³/cm³. Ugglan Framsida (`bara-synliga`), Plusormen (`adderade`).
  - **Stapelbäddsparken** (`cirklar/`): radius/diameter, circumference and area with π ≈ 3,14 (rounded to one decimal; the calculator's exact π is also accepted via `DrillQ.tol`), half and quarter circles, rolling wheels, circumference → diameter, scale 1:k and k:1. Diameterduvan (`radie-diameter`), Piraten Pi-lös (`glomde-pi`).
  - **Region boss** `src/games/geometri/betongbukten.ts` (persona slot `betongbukten.region`, Coach Kurva in the public build), 3 park Mästare to unlock.
  - **Toolbox** (`src/engines/drill/Tools.tsx`): a question with `tools: 'kladd'` gets ✏️ Rita (a scratch canvas, fresh per question), 📝 Anteckna (text notes kept between questions) and 📒 Formler (`DrillGame.notes(q)`); `tools: 'raknare'` adds 🧮 a calculator (expression with precedence, π, x², parentheses, a tape of the last 4 results; keyboard works when it has focus). The open tab is remembered. Only harder stages get tools (circles always; area/volume/scale/perimeter at higher levels), so arithmetic practice elsewhere isn't bypassed.
  - Engine: `DrillQ.tol` (accepted deviation), `isRight()` in `check.ts`; multiple choice with word labels gets smaller buttons; text parts that aren't operators render as units.
- **Phase 4, the learning loop** (`src/platform/learning/`):
  - `skills.ts`: a Leitner schedule per skill id (`h:<id>:skills`). Boxes 0–5 = 1, 1, 2, 4, 8, 16 days. Right when due = one box up (at most once a day), wrong = two boxes down and back tomorrow (not today: the child just corrected it). Fed by every first answer in runs, bosses, reviews and free practice. Heroes from before the schedule get it built from the event log; the v0.1 import makes old mistakes due at once.
  - **Glömskans dimma**: on the island map (per region, with a count), on region cards, on the area page (banner with "Jaga bort den"), and on the hero sheet.
  - **Review runs** (`#/repetera/<area>`): 5 questions on that area's due skills, most important first. A game says which specs produce a skill (`GameModule.specsForSkill`), and `questionForSkill` samples until it hits exactly that skill. Övningsängen now lists the areas with mist.
  - `quests.ts`, **Uppdragstavlan** (`#/uppdrag`): 3 quests a day per hero (clear the mist / practise last mistake / next step, with fallbacks). All three = the daily chest (📜, saved before it is shown) and a streak day; one frysdag a week saves a missed day. 🔥 shows in the top bar.
  - **Mästare Kastanj** (`src/shell/Kastanj.tsx`) says how the last run went and what the mist covers, with [Ja, kör!] and [Visa uppdragen]. Skill names live in `src/content/skills.ts`.
  - The event log moved to `src/platform/learning/events.ts`.

- **Lazy-loaded games:** `PLAYABLE[id]` is `{ def, load }`. The area definitions (data only) stay in the main chunk, so the map, quests and mentor work at once; the game code is `import()`ed when it is needed (`loadGame()`, cached; `useGame()` / `<Loading>` in `src/shell/useGame.tsx` show 🌸 while it loads and a "Försök igen" if it fails). A region boss loads all its region's games. The area page preloads its game. Klocka's Tidslabb UI and the v0.1 importer (Vuxenläge) are also loaded on demand; the console snippet lives in `src/platform/legacy/snippet.ts`. The service worker still precaches every chunk, so offline play works after the first visit. Tests get all games with `await loadAllGames()`.

- **Vuxenläge, Phase 6:**
  - **Hur går det?** (`src/shell/VuxenOversikt.tsx`, numbers from `src/platform/learning/stats.ts`): per hero, minutes/questions/% right the last 7 days; a 14-day bar chart of active time (per answer, at most a minute each, like tiredness); quests today, all-done days and streak; a skills map per area (green = box 4+, yellow = still practising, red = due); the most common error tags per area (labels from the lazily loaded game); the last 5 sessions (a 20-minute gap starts a new one).
  - Quest history: `QuestState.history` (new field, default `[]`) keeps how many quests were done per past day (max 60), written when a new day's quests are made.
  - **Full storage:** `kv.set` catches the quota error, runs registered pruners (`addPruner`, lowest prio first: moved-aside corrupt records → older backups, keeping the newest → halving each hero's event log, never below 200 → the last backup) and retries. Progress is never pruned. A toast says when something was cleared; if nothing more can go, `StorageFullError` reaches a global handler in `main.tsx` that tells the child to get an adult.
  - **Multi-tab guard** (`src/platform/tabs.ts`): the newest tab announces itself on a `BroadcastChannel`, and older tabs replace the whole app with a "Spela här i stället" screen (which reloads to read fresh data and take over).
  - **Backup reminder:** `Meta.lastExport` (set when the backup is downloaded); after 30 days without one (`backupDue()`), Vuxenläge and the hero picker's Vuxenläge link say so. Vuxenläge also shows whether the app runs installed (`isInstalled()`).

Tests: `npm test` (Vitest, 217 tests; `tests/betongbukten.test.ts` covers the geometry traps, misconceptions and the calculator; `tests/drill-games.test.ts` checks every drill game the same way) and `npm run e2e` (Playwright, run them with `--global-timeout=180000` so a stuck test can't hang the terminal).

- **Gear round (after the user's playtest notes):**
  - Mästare Kastanj introduces gear in Azaleabyn the first time a hero has an item or chest (`HeroState.tips`).
  - Azaleagården has tabs: **Hjälten** (hero figure, stats you tap for an explanation with your own numbers, equipment slots directly above the backpack, compare vs what you wear, melt one item or all grey ones), **Garderoben**, **Kunskaper** (skills, titles, mentors).
  - **Hero figure** (`src/shell/HeroFigure.tsx`): SVG body + animal emoji head; gear is drawn on it (helmet/hat/cap/crown, armour/tunic/cape, five weapons, shield/book/lantern, amulet, pet) and coloured by material tier and rarity.
  - **Skräddaren** (`#/skraddaren`): 28 cosmetics (hats, capes, shoes, backgrounds, glitter) for kastanjer, with try-on; 7 of them are rewards (Mästare, level, best streak, arena rank). Record `h:<id>:wardrobe`.
  - **Gear in fights:** the boss intro shows the hero vs the boss, the real hearts and where they come from, the damage per hit and about how many hits are needed. The boss HUD shows the hero attacking. Every stage run has **path monsters**: correct answers hit them, gear decides how hard, and each beaten monster gives 1 🌸 (not when tired). Run length and stars are unchanged.
  - **Arenan** (`#/arenan`): a prototype timing game played with tokens (15 🌰 each, max 10). Nine opponents; all six stats matter; wins pay azaleablad only. The user found it pointless after one try.

- **Dimstormen** (`#/dimstormen`, after the Arenan playtest):
  - A survivors-style action game: the child steers (drag anywhere = a floating joystick, or arrows/WASD) and the hero attacks by itself. 5 waves × 30 s, then Stormjätten (telegraphs a red charge lane, summons bats). Around 3 minutes per token.
  - **Gear decides how you fight:** the weapon base sets the attack (svärd = arc slash, yxa = spin with knockback, stav = homing bolts, båge = piercing arrows, hammare = stunning shockwave, no weapon = fists); the skold slot adds an ability (sköld blocks a hit every 6 s, trollbok orbits and hits, lykta burns and slows nearby monsters); the pet jumps on monsters. All six stats change the numbers (capped): Skydd = life/armour, Kraft = damage, Snabbhet = attack rate/move speed, Tur = crits/🌸 drops, Klurighet = pickup range and 4 cards instead of 3, Visdom = faster in-run levels. Class perks: riddare +20 life, ranger +5 % crit, trollkarl +10 % crystals, uppfinnare 4 cards.
  - In-run levels: 💠 crystals → pick one of 3–4 power cards (damage, attack speed, reach, an extra slash/arrow/bolt, life, heal, magnet, speed, a petal orbit, lightning, luck).
  - **Steg:** winning the highest open steg opens the next (monsters get +50 % life, +30 % damage and +12 % spawn rate per steg), so better gear always has somewhere to go. Steg 3 unlocks the 🌪️ Stormvirvel cosmetic.
  - Reward: picked-up 🌸 + 1 per wave (max 5) + (1 + steg) for a win. Never kastanjer. Leaving mid-storm still saves what was earned.
  - **Tokens:** all daily quests done now also gives 2 🎟️ (capped at 10), shown on the result screen and the quest board.
  - Balance was set with a headless bot (`tests/dimstorm.test.ts` checks determinism, that better gear lasts longer, that higher steg is harder, and that a lightly geared hero can win steg 1). A child who actually dodges will do better than the bot.

- **Grottdyket** (`#/grottdyket`):
  - A turn-based roguelite: one move at a time on a 9×11 grid, monsters move only after the hero, so there is time to think. Tap a tile to walk there (the hero stops when a new monster shows up, something is found or it gets hurt), tap a monster to hit or shoot; arrows/WASD, space = wait, Q = potion, E = spell.
  - Fog of war: tiles in the light are bright, seen ones dim, the rest black. Rooms + corridors per floor, seeded by dive seed + floor, stairs at the farthest tile.
  - **Gear:** svärd = solid hit, yxa = hits every adjacent monster, stav = magic shot 3 tiles, båge = arrow 4 tiles, hammare = stuns, fists = weak; sköld = 25 % block, trollbok = ⚡ hits every visible monster every 8 turns, lykta = light radius 5 instead of 3; the pet bites adjacent monsters. Skydd = life/armour, Kraft = damage, Tur = crits, Snabbhet = chance monsters lose their move, Klurighet = chance to spot hidden traps, Visdom = potion strength and a starting potion. Class perks: riddare +5 life, ranger crits, trollkarl a starting potion, uppfinnare spots traps.
  - Each floor: 🌸 piles (worth more deeper down), sometimes 🧪 potions, 🗝️ key + 🧰 locked chest, run-only boosts (🪨 +1 damage, 🔩 +1 armour, 💖 +5 life), hidden 🪤 traps (spotted traps are safe). Monsters: rat and bat from floor 1, then spider, snake, scorpion, troll; Grottdraken guards the stairs on every 5th floor.
  - **Push your luck:** at each staircase, "Djupare" (rest +5 life) or "Gå hem" with all the blad. Falling, or leaving mid-floor, keeps half (rounded up). Deepest floor is the record; floor 10 unlocks the 💎 Kristallgrottan background.
  - Lobby parts (purse, buy tokens) shared with Dimstormen in `src/shell/Polletter.tsx`.
