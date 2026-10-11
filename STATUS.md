# Status – Azaleaporten

*Updated 2026-10-11 after Phase 3. Live: https://andrejohanssonlindh.github.io/azaleaporten/*

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

Tests: `npm test` (Vitest, ~72 tests) and `npm run e2e` (Playwright, run them with `--global-timeout=180000` so a stuck test can't hang the terminal).

## Next mission: fill Talbergen (matematik)

Make the math areas in `src/content/world.ts` playable. The heroes are in **åk 2** and **åk 4**, so each area needs good difficulty levels for both.

How to add an area (Tidstornet is the template):
1. **The game:** create `src/games/<game>/`.
   - `logic/` holds the pure generation, checking and **diagnosis of mistakes** (an error tag + an explanation in Swedish for the child), with tests.
   - `index.ts` exports a `GameModule` (`makeQuestion(spec, rng)`, `skillOf(q)`, `View`).
   - The View follows the same flow as `games/klocka/ui/QuestionView.tsx`: open → fixing (the child must fix a mistake; after 3 tries the answer is shown) → done. `onAnswer` is called only for the first answer.
2. **Content:** `content.ts` with an `AreaDef` holding eras/sections, stages (`spec: {mode, level}`, `thrMs`) and bosses.
   - Monster bosses are named after a typical misconception, with a `trap` matching an error tag and a `pet`.
   - The area's final boss is a `kind: 'mastare'`, with a persona in `src/content/bosses.ts` under the id `<area>.mastare`.
3. **Register** the area in `src/content/areas.ts` (`PLAYABLE`) and set `status: 'open'` in `world.ts`.
4. **Ids are permanent:** stage, boss and skill ids (`ma.<area>.<skill>`) and error tags.
5. **Tests:** logic (all generation is seeded), plus at least one full run in `tests/progress.test.ts` style.

Suggested order and content:
- **Tiokompisbron** (åk 1–3, the åk 2 hero's focus):
  - number pairs to 10/100
  - +/− without and then with tiotalsövergång
  - missing addend (3 + _ = 10)
  - typical mistakes: forgets the carry, subtracts the wrong way round (smaller from larger in every column)
- **Tabellgruvan** (åk 2–6, the åk 4 hero's focus):
  - tables 2/5/10 → 3/4 → 6–9
  - division as reversed multiplication
  - mixed and against the clock
  - typical mistakes: neighbouring table (7·8 → 54/63), adding instead of multiplying, 0/1 rules
- **Myntmarknaden:** Swedish coins and notes, adding up a price, giving change.
- **Bråkbageriet** (åk 3–6): fractions as pizza pieces, comparing, equivalent fractions, adding with the same denominator.
- **Tallinjebron:** placing numbers on a number line, rounding, decimals, negative numbers.

A shared "drill engine" (generate / check / diagnose / explain + an input-number View) is worth extracting from the first new game, so the following ones go quickly.

## Next after that (in PLAN.md order)

- Phase 4, the learning loop:
  - a Leitner schedule over `h:<id>:events`
  - Glömskans dimma on the map
  - Övningsängen choosing from what's due
  - Uppdragstavlan (daily quests)
  - Mästare Kastanj's greeting saying what needs repeating
- Betongbukten (geometri, the Malmö skateparks): Fluffy → … → Stapelbäddsparken.
- Ordskogen (svenska) and Västerön (engelska), via a wordpack engine with JSON content.
- Biblioteket: the child's own statistics (common mistakes per skill).
- Teacher personas in the family pack (`../privat/familjepaket/`, `npm run pack:encrypt`).

## Known minor things

- The map art is drawn in SVG by hand; Ordskogen's trees slightly overlap Azaleabyn.
- Emoji look different on different platforms (Windows is flatter).
- The Malmö skatepark names are in the public code (see the privacy section in PLAN.md if they should move into the family pack).
