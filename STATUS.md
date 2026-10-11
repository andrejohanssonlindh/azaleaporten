# Status – Azaleaporten

*Updated 2026-10-11: Betongbukten (geometri) is complete: seven skateparks + region boss, with a calculator/notes toolbox. Talbergen and the village were done before. Live: https://andrejohanssonlindh.github.io/azaleaporten/*

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

Tests: `npm test` (Vitest, 163 tests; `tests/betongbukten.test.ts` covers the geometry traps, misconceptions and the calculator; `tests/drill-games.test.ts` checks every drill game the same way) and `npm run e2e` (Playwright, run them with `--global-timeout=180000` so a stuck test can't hang the terminal).

## Next mission

Talbergen, Betongbukten and the village are done. Options, to pick with the user:
1. **Lazy-load games per area**: the main JS chunk is now ~126 KB gzipped (budget 150 KB for the app). Do this before adding more content.
2. **Vuxenläge, Phase 6**: the skills map (green/yellow/red per skill from `h:<id>:skills`, the most common error tags from the event log), time per day, quests done, install guides, quota and multi-tab guards. Much of it can reuse `src/shell/Biblioteket.tsx`.
3. Svenska/engelska (wordpack engine) – the user put this on hold.

Smaller things:
- The kunskap level has no mastery component yet (Biblioteket shows "Sitter som berget" per skill instead).
- The teacher personas in the family pack (`../privat/familjepaket/`, `npm run pack:encrypt`), now including `talbergen.region` and the six area Mästare.

## How to add a drill area

Tiokompisbron, Tabellgruvan, Myntmarknaden, Tallinjebron and Bråkbageriet are the templates; the Betongbukten parks (`src/games/geometri/<game>/`) show drawn SVG visuals (shared helpers in `geometri/draw.tsx`), the toolbox and answer tolerance.
1. `src/games/<game>/logic.ts`: seeded `makeQ(spec, rng)` returning a `DrillQ` (`parts` with exactly one `null` box – possibly inside a `Frac` –, `answer`, `skill`, optional `prompt`, `choices`, `keypad`, `tol` for rounded answers, `tools: 'kladd' | 'raknare'` for the toolbox on harder stages only), plus `specsForSkill`, `diagnose`, `explain` (never state the answer), `solution`, `hint` and `ERR` labels. Boss traps: `makeQ` must produce a question that can trigger `spec.trap`.
2. `index.tsx`: `drillModule({ id, make, specsForSkill, diagnose, explain, solution, hint, Visual?, notes?, errLabels })` (`notes(q)` = the formula card).
3. `content.ts`: an `AreaDef` with `texts`, eras, stages, monster bosses (trap + pet) and a final `mastare`; a generic persona in `src/content/bosses.ts` under `<area>.mastare`; the trap's pet stat in `PET_STAT` (`inventory.ts`); skill names in `src/content/skills.ts`.
4. Register in `src/content/areas.ts`, set `status: 'open'` in `world.ts`, and add the game to `GAMES` in `tests/drill-games.test.ts`. The generic tests then cover it (that file, and the playthrough in `tests/talbergen.test.ts`); put game-specific trap/misconception tests in their own file (like `tests/betongbukten.test.ts`).
5. A new region boss: an `AreaDef` with `region` (see `src/games/talbergen.ts`, `src/games/geometri/betongbukten.ts`), registered in `PLAYABLE` with `regionGame(id, gamesOf(id))`, plus a persona under `<region>.region`.

## Next after that (in PLAN.md order)

- Ordskogen (svenska) and Västerön (engelska), via a wordpack engine with JSON content.
- Biblioteket: the child's own statistics (common mistakes per skill).
- Teacher personas in the family pack (`../privat/familjepaket/`, `npm run pack:encrypt`), now also the seven park Mästare and `betongbukten.region`.

## Known minor things

- Games are bundled into the main chunk (about 126 KB gzipped JS + 9 KB CSS). Lazy-load them per area next (see above).
- On a phone the calculator sits below the answer box, so the child scrolls between them. Fine for now; a floating panel could come later.
- Read-aloud of drill questions isn't there yet (the 🔊 button exists only on mentor text).
- `e2e/loot.spec.ts` failed once (2 "Ta av" buttons after one "Använd"), then passed 3/3 reruns. Possibly a double render in Azaleagården; worth a look if it recurs.

- The map art is drawn in SVG by hand; Ordskogen's trees slightly overlap Azaleabyn.
- Emoji look different on different platforms (Windows is flatter).
- The Malmö skatepark names are in the public code (see the privacy section in PLAN.md if they should move into the family pack).
