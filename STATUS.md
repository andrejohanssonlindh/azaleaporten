# Status – Azaleaporten

*Updated 2026-10-11 after Phase 5a (Talbergen: Tiokompisbron + Tabellgruvan). Live: https://andrejohanssonlindh.github.io/azaleaporten/*

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
  - **Tabellgruvan** (`src/games/tabeller/`): tables 2/5/10 → 3/4 → 6–9 → all, division, the hidden factor, 0/1 rules, and a mixed race against the clock. 12 stages, monsters Plusråttan (`plus`), Nollfladdermusen (`noll-ett`) and Gångerspindeln (`granntabell`), Mästare Gruvmästarinnan. A dot array as hint.
  - Explanations after a mistake explain the method but never state the answer (tested), so the child really fixes it.
  - Platform: `GameModule.errLabel`, `AreaDef.texts` (result-screen words per area), a generic "Öva fritt" for every non-klocka area (`#/labb/<area>`), and the map's "Fortsätt" button follows the last area played (else the first one fitting the hero's årskurs).

Tests: `npm test` (Vitest, 86 tests) and `npm run e2e` (Playwright, run them with `--global-timeout=180000` so a stuck test can't hang the terminal).

## Next mission: Phase 4, the learning loop

Now there are three areas and real skill ids in the event log (`k` in `h:<id>:events`), so the scheduler has something to work with.
- A Leitner schedule (boxes 0, 1, 2, 4, 8, 16 days) built from the event log per skill id; a new `h:<id>:skills` record (versioned, with a fixture test).
- **Glömskans dimma** on the map and on area pages where skills are due.
- **Övningsängen** picks the due skills: a 5-question review run with `spec` per skill. Needs a way to make a question *for a skill*: add an optional `GameModule.specForSkill(skill)` (drill games can map `ma.mult.7` → tables spec with that table; klocka maps `ma.tid.i-halv` → a words/choice spec).
- **Uppdragstavlan** (3 daily quests), streak with one freeze day a week.
- Mästare Kastanj's greeting names what needs repeating.

## Then: more of Talbergen

How to add a drill area (Tiokompisbron/Tabellgruvan are the templates):
1. `src/games/<game>/logic.ts`: seeded `makeQ(spec, rng)` returning a `DrillQ` (`parts` with `null` for the answer box, `answer`, `skill`), plus `diagnose`, `explain` (never state the answer), `solution`, `hint` and `ERR` labels. Boss traps: `makeQ` must produce a question that can trigger `spec.trap`.
2. `index.tsx`: `drillModule({ id, make, diagnose, explain, solution, hint, Visual?, errLabels })`.
3. `content.ts`: an `AreaDef` with `texts`, eras, stages, monster bosses (trap + pet) and a final `mastare`; a generic persona in `src/content/bosses.ts` under `<area>.mastare`; the trap's pet stat in `PET_STAT` (`inventory.ts`).
4. Register in `src/content/areas.ts`, set `status: 'open'` in `world.ts`. `tests/talbergen.test.ts` already plays every registered area through.

Remaining Talbergen areas:
- **Myntmarknaden:** Swedish coins and notes, adding up a price, giving change. Needs a coin Visual; answers are still integers (kronor).
- **Bråkbageriet** (åk 3–6): fractions as pizza pieces, comparing, equivalent fractions, adding with the same denominator. Answers aren't single integers – extend the drill engine with a choice mode or a fraction input.
- **Tallinjebron:** placing numbers on a number line, rounding, decimals, negative numbers.

## Next after that (in PLAN.md order)

- Betongbukten (geometri, the Malmö skateparks): Fluffy → … → Stapelbäddsparken.
- Ordskogen (svenska) and Västerön (engelska), via a wordpack engine with JSON content.
- Biblioteket: the child's own statistics (common mistakes per skill).
- Teacher personas in the family pack (`../privat/familjepaket/`, `npm run pack:encrypt`).

## Known minor things

- Games are bundled into the main chunk (60 KB gzipped in total). Lazy-load them per area when the bundle nears the 150 KB budget.
- Read-aloud of drill questions isn't there yet (the 🔊 button exists only on mentor text).
- Mästare Kastanj's first greeting still points every new hero to Tidstornet; the åk 2 hero might be better sent to Tiokompisbron.

- The map art is drawn in SVG by hand; Ordskogen's trees slightly overlap Azaleabyn.
- Emoji look different on different platforms (Windows is flatter).
- The Malmö skatepark names are in the public code (see the privacy section in PLAN.md if they should move into the family pack).
