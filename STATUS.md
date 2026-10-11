# Status – Azaleaporten

*Updated 2026-10-11 after Phase 4 (the learning loop) and Phase 5a (Tiokompisbron + Tabellgruvan). Live: https://andrejohanssonlindh.github.io/azaleaporten/*

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

- **Phase 4, the learning loop** (`src/platform/learning/`):
  - `skills.ts`: a Leitner schedule per skill id (`h:<id>:skills`). Boxes 0–5 = 1, 1, 2, 4, 8, 16 days. Right when due = one box up (at most once a day), wrong = two boxes down and back tomorrow (not today: the child just corrected it). Fed by every first answer in runs, bosses, reviews and free practice. Heroes from before the schedule get it built from the event log; the v0.1 import makes old mistakes due at once.
  - **Glömskans dimma**: on the island map (per region, with a count), on region cards, on the area page (banner with "Jaga bort den"), and on the hero sheet.
  - **Review runs** (`#/repetera/<area>`): 5 questions on that area's due skills, most important first. A game says which specs produce a skill (`GameModule.specsForSkill`), and `questionForSkill` samples until it hits exactly that skill. Övningsängen now lists the areas with mist.
  - `quests.ts`, **Uppdragstavlan** (`#/uppdrag`): 3 quests a day per hero (clear the mist / practise last mistake / next step, with fallbacks). All three = the daily chest (📜, saved before it is shown) and a streak day; one frysdag a week saves a missed day. 🔥 shows in the top bar.
  - **Mästare Kastanj** (`src/shell/Kastanj.tsx`) says how the last run went and what the mist covers, with [Ja, kör!] and [Visa uppdragen]. Skill names live in `src/content/skills.ts`.
  - The event log moved to `src/platform/learning/events.ts`.

Tests: `npm test` (Vitest, 100 tests) and `npm run e2e` (Playwright, run them with `--global-timeout=180000` so a stuck test can't hang the terminal).

## Next mission

Two good options; pick with the user:
1. **Ordskogen + Västerön via a wordpack engine** (Phase 5b): Stavningsträsket (hear and spell, diagnosis of dubbelteckning, sj/tj-ljud, ng/gn) and Glosviken (English words with picture and sound). Needs text answers and read-aloud (`speak()` in `src/platform/device.ts`; check sv-SE/en-GB voices on iPad), and content as JSON. This brings the first subjects outside maths, which matters before the kids start.
2. **Vuxenläge, Phase 6**: the skills map (green/yellow/red per skill from `h:<id>:skills`, the most common error tags from the event log), time per day, quests done. Most of the data is already there.

Smaller things left from Phase 4:
- The kunskap level has no mastery component yet (skills in high boxes); it is still XP only.
- Consumables in PLAN §9.5 (Sköldamulett protects the streak) are not built.
- Biblioteket (the child's own statistics) is still "Snart" in Azaleabyn.

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

- Games are bundled into the main chunk (65 KB gzipped in total). Lazy-load them per area when the bundle nears the 150 KB budget.
- Read-aloud of drill questions isn't there yet (the 🔊 button exists only on mentor text).
- `e2e/loot.spec.ts` failed once (2 "Ta av" buttons after one "Använd"), then passed 3/3 reruns. Possibly a double render in Azaleagården; worth a look if it recurs.

- The map art is drawn in SVG by hand; Ordskogen's trees slightly overlap Azaleabyn.
- Emoji look different on different platforms (Windows is flatter).
- The Malmö skatepark names are in the public code (see the privacy section in PLAN.md if they should move into the family pack).
