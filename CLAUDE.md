# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Azaleaporten: a free, adventure/RPG-themed practice app (matematik, svenska, engelska) for school kids, hosted on GitHub Pages at `https://andrejohanssonlindh.github.io/azaleaporten/`. No backend: all progress lives in the browser's `localStorage` on each device. UI text, comments and many identifiers are **Swedish**; keep new user-facing text Swedish and child-friendly.

The full roadmap is `../PLAN.md` (outside the repo, because it mentions private details). Phase 1 (platform skeleton) is done; next is Phase 2 (Tidstornet: port the old clock game from `../klocka/Klockövning.html` into `src/games/klocka`).

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
- **State:** UI state lives in signals in `src/state.ts`. Persisted data is read synchronously from storage on render; call `touch()` after writing so views re-render. `src/session.ts` handles selecting or leaving a hero (`enterHero` returns the previous visit, which drives Mästare Kastanj's greeting in `src/platform/greeting.ts`).
- **Storage layout** (see `src/platform/profiles.ts`):
  - `meta` (hero ids, last hero)
  - `h:<uuid>:profile` (name, animal, color, heroClass, grade, settings)
  - `h:<uuid>:hero` (xp, level, kastanjer, blad…)
  - `gate` (unlock key; excluded from backups and exports)
  - `backup:<iso>` (automatic snapshots, the last 3 are kept)

  Hero ids are UUIDs, never names.
- **Gate:** `src/platform/gate/gate.ts` fetches `packs/familj.enc`. If it is missing, the gate is just a button, and generic personas are used. Otherwise the password is needed once per device; the derived key is stored, and the salt is kept stable by the tool so pack updates don't re-lock devices. A boss = public mechanics + a swappable persona: `personaFor()` in `src/content/bosses.ts` picks the pack persona (grade-specific first), else the generic one.
- **Content:** `src/content/world.ts` (regions/areas with recommended grade ranges, never locks) and `src/content/heroes.ts` (animals, colours, classes).
- **PWA:** `vite-plugin-pwa` with `registerType: 'prompt'`. `UpdateBanner` is shown only on calm screens (map, picker), never mid-exercise.
- **Tests:**
  - `tests/helpers.ts#freshStorage()` swaps in a `MemoryBackend`
  - e2e serves a test pack via `page.route` (service workers are blocked in the Playwright config)
  - set `SHOTS=<dir>` to save screenshots
