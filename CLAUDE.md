# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Azaleaporten: a free, adventure/RPG-themed practice app (matematik, svenska, engelska) for school kids, hosted on GitHub Pages at `https://andrejohanssonlindh.github.io/azaleaporten/`. No backend: all progress lives in the browser's `localStorage` on each device. UI text, comments and many identifiers are **Swedish**; keep new user-facing text Swedish and child-friendly.

The full roadmap is `../PLAN.md` (outside the repo, because it mentions private details). Phases 1–4 are done (platform, Tidstornet, loot/gear, the learning loop), plus all of Talbergen (six areas and the region boss), all of Betongbukten (seven skateparks and the region boss) and the village from Phase 5. **Current status and the next mission are in `STATUS.md`. Read it first.**

## Commands

```sh
npm run dev          # dev server (http://localhost:5173/azaleaporten/)
npm test             # unit tests (Vitest, tests/*.test.ts)
npx vitest run tests/storage.test.ts   # one test file; add -t "<name>" for one test
npm run e2e          # Playwright (e2e/*.spec.ts); builds and serves on :4173 (reuses a running server!)
npm run typecheck    # tsc (TypeScript 7)
npm run build        # typecheck + production build to dist/
npm run pack:encrypt # encrypt ../privat/familjepaket → public/packs/familj.enc
npm run icons        # regenerate PWA icons from public/favicon.svg
```

Pushing to `main` runs `.github/workflows/deploy.yml`: test → build → deploy to Pages. Failing tests block the deploy.

## Hard rules

1. **The repo is public. Never commit real names** (kids, teachers, street, school). A pre-commit hook (`.githooks/pre-commit`, enabled by `npm install`/`npm run setup-hooks`) blocks words listed in `../privat/forbjudna-ord.txt`. Test data uses `Hjälte1`, `Hjälte2`. Kids type their own names in the app; names exist only on their device.
2. **Teacher-boss content is only ever committed encrypted** (`public/packs/familj.enc`). Plaintext lives in `../privat/familjepaket/`. A JS password check alone would be readable by anyone, so the gate really decrypts (PBKDF2 + AES-GCM, `src/platform/gate/crypto.ts`).
3. **Progress is sacred.** Every stored record has `v` and goes through `loadRecord`/`saveRecord` (`src/platform/storage/record.ts`):
   - bumping a record's `version` requires a migration `migrations[oldV]` **and** a test with a fixture of the old format
   - migrations run step by step, a backup is taken first, and the result is merged over defaults, so new fields only need a default
   - a failed migration or data from a newer app version makes the record read-only rather than overwriting it
   - never rename or reuse ids (region/area/boss ids, skill ids, item ids, error tags, class/animal ids); retire them instead
   - don't drop a field in the same release that stops using it
4. **Learning integrity:** loot, stats and class perks never change what counts as correct, reveal answers, skip questions, or lower thresholds/stars. They only affect boss-fight feel, rewards and cosmetics.
5. All storage keys go through `kv` (`src/platform/storage/kv.ts`), which prefixes `azaleaporten:`. Every repo on the same github.io account shares one origin, so the prefix matters.

## Architecture

- **Preact + @preact/signals, Vite 8, TS 7.** Preact 11 does **not** add `px` to numeric inline styles; write `${n}px`.
- **Routing:** a hash router in `src/state.ts` (`go('karta')` → `#/karta`), because Pages has no SPA fallback. `src/app.tsx` picks the screen:
  - the gate if not opened or `#/porten`
  - `vuxen`, `ny`, `hjaltar`, `gard`
  - otherwise the map
- **State:** UI state lives in signals in `src/state.ts`. Persisted data is read synchronously from storage on render; call `touch()` after writing so views re-render. Every component that reads storage must itself read `dataRev.value`: `@preact/signals` skips re-rendering a child whose props didn't change, so a child that only gets `hid` would otherwise show stale data. `src/session.ts` handles selecting or leaving a hero (`enterHero` returns the previous visit, which drives Mästare Kastanj's greeting in `src/platform/greeting.ts`).
- **Storage layout** (see `src/platform/profiles.ts`):
  - `meta` (hero ids, last hero)
  - `h:<uuid>:profile` (name, animal, color, heroClass, grade, settings)
  - `h:<uuid>:hero` (xp, level, kastanjer, blad, tips already shown, arena tokens and rank…)
  - `h:<uuid>:inventory` (items, equipped, chests), `h:<uuid>:wardrobe` (cosmetics owned/worn)
  - `gate` (unlock key; excluded from backups and exports)
  - `backup:<iso>` (automatic snapshots, the last 3 are kept)

  Hero ids are UUIDs, never names.
- **Gate:** `src/platform/gate/gate.ts` fetches `packs/familj.enc`. If it is missing, the gate is just a button, and generic personas are used. Otherwise the password is needed once per device; the derived key is stored, and the salt is kept stable by the tool so pack updates don't re-lock devices. A boss = public mechanics + a swappable persona: `personaFor()` in `src/content/bosses.ts` picks the pack persona (grade-specific first), else the generic one.
- **The island:** the map (`src/shell/IslandMap.tsx`, a hand-drawn SVG) is the start screen. Tapping a place opens its page:
  - Azaleabyn (`#/by`, the village with the buildings, including Azaleagården `#/gard`)
  - Övningsängen (`#/ovning`, review runs where Glömskans dimma lies, else a repeat of the last thing played)
  - Uppdragstavlan (`#/uppdrag`, daily quests, streak) and Biblioteket (`#/biblioteket`, the child's own statistics)
  - regions (`#/region/<id>`)
  - fog spots and the dotted islands are reserved for future subjects

  Regions and areas are defined in `src/content/world.ts`, with recommended grades only (never locks). Betongbukten (geometry) uses Malmö skateparks as levels. `src/content/heroes.ts` has animals, colours and classes.
- **Adventure model** (`src/platform/rpg/`):
  - an area (`AreaDef`) is a list of eras with a path of stage and boss nodes (`types.ts`); each node unlocks when the previous one is done
  - a game is just a question factory, `GameModule` = `makeQuestion(spec, rng)` + `skillOf(q)` + `specsForSkill(skill)` + `errLabel(tag)` + a Preact `View` that runs open → fixing → done and reports only the first answer
  - `AreaDef.texts` holds the area's result-screen words; non-klocka areas get a generic "Öva fritt" (`src/shell/LabbView.tsx`)
  - the platform owns everything else in `progress.ts`:
    - stage runs are exactly 10 questions; 9 right = ★, 10 = ★★, 10 under `thrMs` with no hint = ★★★
    - practice runs are 5 questions; review runs (`kind: 'review'`, `REVIEW_NODE`) are 5 questions on due skills, one skill per question fixed at start
    - boss fights have HP = correct answers needed and hearts = 3 (+1 riddare); every other boss question targets its `trap`
    - XP and kastanjer
    - the event log
  - a run is saved after every answer, and questions are regenerated deterministically from `seed + index`, so a reload resumes the same question
  - all numbers live in `balance.ts`: no currency per answer, and 30 minutes a day after which no more kastanjer
  - `src/content/areas.ts` registers playable areas (`PLAYABLE[id] = { def, load }`). Game code is **lazy-loaded**: only the `def` (data) is in the main chunk, and anything needing the `GameModule` gets it via `loadGame(id)` or the `useGame(id)` hook + `<Loading>` (`src/shell/useGame.tsx`). Never import a game's `index`/`logic` statically from shell or platform code, or it lands back in the main chunk (content files may only `import type` from logic). Tests use `await loadAllGames()`
- **Loot** (`src/platform/rpg/items.ts`, `inventory.ts`):
  - items have a slot, a rarity from 0 (vanlig) to 4 (legendarisk), an item level and seeded stats (kraft, skydd, tur, visdom, snabbhet, klurighet)
  - chests are stored with a seed when found and opened later, so a reload never rerolls them
  - stats only affect boss damage (capped by `minHits`), hearts, crits, loot luck, XP % and hints per day
  - tamed bosses become unique pet items, and a Mästare drops their persona's `signatureItem`
  - the Smedjan (`#/smedjan`) has a shop, melting into azaleablad, and +1–+5 upgrades; items can also be melted (one, or all grey at once) straight from the backpack in Azaleagården
  - Azaleagården (`#/gard`) has tabs: Hjälten (the hero figure, tappable stats with `statExplain()`, equipment slots directly above the backpack, compare vs equipped), Garderoben, Kunskaper
  - **Path monsters** (`RunState.mob`, `MOB` in `balance.ts`, names in `src/content/monsters.ts`): stage runs only. Correct answers hit with gear damage (crit seeded from `seed + index`); a beaten monster gives azaleablad (not when tired) and the next one appears. It never changes run length, clearing or stars.
  - the boss intro shows the real hearts (`bossHearts`) and damage/hits (`bossPreview`)
- **Hero figure and cosmetics:** `src/shell/HeroFigure.tsx` draws an SVG body with the animal emoji as head; equipped gear is drawn by base id (`shapeOf`; colour = material tier from ilvl + rarity) and worn cosmetics on top. Cosmetics are in `src/platform/rpg/wardrobe.ts` (ids permanent; `cost` in kastanjer or an `unlock` from things that never go down: Mästare, level, best streak, arena rank), sold in Skräddaren (`#/skraddaren`, with try-on).
- **Arenan** (`#/arenan`, `src/platform/rpg/arena.ts`): a proof-of-concept timing mini-game played with tokens (🎟️, bought for kastanjer). Stats set damage, life, zone widths and meter speed. It pays azaleablad only, never kastanjer. More mini-games are meant to come later.
- **Introductions:** `HeroState.tips` + `markTip()`; Mästare Kastanj explains gear in Azaleabyn the first time a hero has an item or chest.
- **Tidstornet** (`src/games/klocka/`):
  - `logic/` holds the pure Swedish time-language model, the diagnosis of mistakes and the parser, ported from v0.1 and tested over all 720 times
  - `content.ts` holds the eras, stages, monster bosses (tamed → pets) and the final Mästare (persona via `personaFor`)
  - `V01_STAGE_MAP` maps the old v0.1 stage indexes
- **Learning loop** (`src/platform/learning/`): `events.ts` (the answer log), `skills.ts` (Leitner schedule per skill id, record `h:<id>:skills`; `noteAnswer` is called from `recordAnswer` and the free-practice labs; due skills = Glömskans dimma), `quests.ts` (daily quests, daily chest, streak with a weekly frysdag; `noteRun` is called by `PlayView` after `finishRun`). Skill names for the mentor are in `src/content/skills.ts` – a new skill id needs a label there (a test checks it).
- **Drill engine** (`src/engines/drill/`): for questions whose answer is a number typed into a box in an equation (or picked among choices). A game supplies `make / diagnose / explain / solution / hint` (+ optional `Visual`); `drillModule()` makes the `GameModule`. Explanations after a mistake explain the method and **never state the answer** (`tests/talbergen.test.ts` checks this), so the child fixes it themselves. It supports a prompt, units, multiple choice, fractions, decimals, negatives, an answer tolerance (`tol`) and a toolbox (`tools`: scratch pad, notes, formula card from `DrillGame.notes`, calculator; `Tools.tsx`). Used by all Talbergen areas except Tidstornet (`src/games/tiokompis/`, `tabeller/`, `pengar/`, `tallinje/`, `brak/`) and all Betongbukten parks (`src/games/geometri/<game>/`, shared SVG helpers in `geometri/draw.tsx`). Skill ids are by topic, not area: `ma.add.*`, `ma.sub.*`, `ma.mult.<n>`, `ma.div.<n>`, `ma.pengar.*`, `ma.tallinje.*`, `ma.avrunda.*`, `ma.negativa.*`, `ma.decimal.*`, `ma.brak.*`, `ma.geo.*`.
- **Region bosses:** an `AreaDef` with `region` (not on the map; shown on the region page, locked until `mastareNeeded` area Mästare are beaten) whose game is `regionGame()` (`src/games/region.tsx`) mixing the region's games via `mode: '<area>/<mode>'`. A boss can point at another persona slot with `personaId`.
- **Importing old progress:** `src/platform/legacy/klockaV01.ts` imports the old file's `localStorage` (via a console snippet, `legacy/snippet.ts`, pasted into Vuxenläge). Vuxenläge loads the importer on demand because it pulls in klocka's language model. The fixture is `tests/fixtures/storage/legacy-klocka-v01.json`.
- **PWA:** `vite-plugin-pwa` with `registerType: 'prompt'`. `UpdateBanner` is shown only on calm screens (map, picker), never mid-exercise.
- **Tests:**
  - `tests/helpers.ts#freshStorage()` swaps in a `MemoryBackend`
  - e2e serves a test pack via `page.route` (service workers are blocked in the Playwright config)
  - set `SHOTS=<dir>` to save screenshots
