# New Tracker: Progress and Handoff

**Status:** Phase 3 is complete. Paused at the owner's request to fix display issues before Phase 4.
**Branch:** `new-tracker`, 7 commits ahead of `master` when this file was written. It has not been pushed.
**Last updated:** 31 October 2026.

Start here when picking the work up. Nothing on this branch is deployed, because `deploy.yml` only deploys `master`.

## Next step

1. Plan the owner's 31 October layout brief: one page with `title` and `mode` URL parameters, a rank control in the top bar, a new default Game View tab, Production changes, and links moved to Settings. The plan needs approval before any code. Their screenshots show how the game presents information. They are not a request to copy the game's visual style.
2. Build it, then wait for the owner's go-ahead before starting Phase 4.

## Ground rules from the owner

- All work stays on `new-tracker`. Nothing goes to `master` yet.
- The plan comes before the code. Phase reviews are the owner's call.
- The frontend is React and Vite. Do not reopen that decision.
- Only two legacy behaviours are strictly preserved: mission order, and clicking a mission to move it between incomplete and completed, in both directions.
- Avoid modal-heavy layouts. The page should look like 2026 without confusing players. The future-mission confirmation is a modal the owner asked for.
- All storage keys start with `adcom-mission-tracker:`.
- When a lot of code is being written, Opus may hand it to Sonnet subagents to save usage.
- No test may depend on a previous commit's code once development is done. Pinning the comparison tests to an old commit is not acceptable. See Phase 6.

## Phases

| Phase | Work | Status |
|---|---|---|
| 0. Setup | Branch, Vite, tooling, golden traces | Done |
| 1. Core | Domain logic, storage, mission logic | Done |
| 2. Missions | Design system, shell, Missions tab, settings | Done and reviewed, with changes below |
| 3. Calculators | Engine, calculator on mission pages, Production tab | Done. Owner found display issues still to fix |
| 4. Parity | Events and Reference tabs, Docker build, remove legacy `public/` files | Not started. Owner review afterwards |
| 5. PDF features | See the list under Phase 5 | Not started. Each group reviewed separately |
| 6. Test independence | Remove every test's dependency on legacy code | Not started. Must finish before any merge to `master` |

### Phase 4 scope

- **Events tab:** schedule, all events, balance information. Their current placeholder is `client/src/features/events/EventsPage.tsx`.
- **Reference tab:** airdrops, capsules, scripted capsules, avatar unlocks, help, keyboard shortcuts. Its placeholder is `client/src/features/reference/ReferencePage.tsx`.
- **Build:** change `app.js` to serve `dist`, add a Node build stage to the `Dockerfile`, and move `admin.html`, `admin.js` and the CSS they need into `client/public/` unchanged.
- **Cleanup:** remove the legacy files in `public/`, but only after every feature has moved over. `npm run golden` reads legacy code from `master`, not from `public/`.

### Phase 5 scope

Custom propaganda value, Store section, airdrops in the result, trade calculator (treat Trade missions as Collect), event common and rare card icons, updated help, capsule table redesign, full-page avatars, segmented offline calculator, and Spend/Collect by capsules and airdrops.

The Motherland capsule table stays out until the evergreen capsule formula is known.

### Phase 6 scope

Legacy comparisons stay in use through Phases 4 and 5, because they prove the ports are right. They end with development. Two things depend on legacy code today:

- `tests/legacy/` reads `public/` from `master` through `git show` every time it runs, so these tests break when the new tracker reaches `master`.
- `tests/golden/mission-traces.json` is already a stored file, but `npm run golden` recaptures it from `master`, and `tests/golden/missions.test.ts` tells you to do that when a balance changes.

The work:

1. Do one last full run against legacy, and explain any difference.
2. Replace the comparisons with tests that hold their own inputs and expected values. Keep representative and edge cases, not the millions of generated ones.
3. Freeze the Missions and Ranks data the mission traces need into the repo, so a balance update in `adcom-assets` cannot fail them.
4. Add rule-based mission tests that run over the live balances, so new events are still checked without any capture step.
5. Delete `tests/legacy/`, `scripts/capture-golden.mjs` and the `golden` script in `package.json`.
6. Confirm the suite passes on a checkout with no `master` branch and no legacy files in history, such as a fresh copy of the tree.

## Decisions from reviews

**Missions layout**
- Missions sit in three containers, in this order: Completed, Current, Upcoming.
- Events have rank subsections in Completed and Upcoming. Motherland has no subsections.
- Every list displays in the balance's internal mission order, never by completion time. Saves still record completion order, so old saves and rollback are unaffected.
- The mission page has no complete or undo button. Missions are only toggled from the list.
- Advance to rank and the rank arrows live in Current. The rank label matches the "Current" heading size.
- A collapsible "How to use" card sits above Completed with four bullets. Its hidden state is saved. The removed help content will be restored later by the owner, by hand.
- The grid goes up to four columns from the 1536px breakpoint, and the page width is 1440px.

**Behaviour**
- The mission icon toggle and list view are permanently removed.
- Clicking a future mission opens a confirmation to complete everything before it. In Motherland this covers only the rank on screen.
- A calculator badge on the capsule appears only on missions that have a calculator.
- Capsules and A/B switches stay usable on future missions, as in legacy.

**Not wanted yet:** an Undo prompt after completing a mission, and collapsing older Completed ranks. The owner declined both for now.

**Engine rules:** Common speed researchers set cycle time, and other researchers multiply output. Warps use the online calculation. Nothing is bought during an offline period. Tied payouts run deepest first, because the measured effect is negligible.

## Worth knowing

- **Longer offline ETAs:** offline Own missions that cost generators can be much longer than before. Legacy ignored those costs, so its answers were too optimistic.
- **Comparison with legacy:** on sampled missions, online results are within 3% and offline resource goals within 1%. The engine has not been checked against real in-game numbers yet.
- **Legacy bugs not carried over:** the Advance To Rank off-by-one, and Reset All wiping other tools' data.
- **Save compatibility:** old saves are copied under the new prefix and the originals are kept, for rollback. The `IconConfig` and `ListStyleActiveConfig` settings are not carried over.
- **Still open on `master`, outside this work:** the `/api/import` security issue and the unprotected admin page. The leaderboard crash and unauthenticated Discord account writes are also open, in its own repo.
- **First load is still slow.** The API payload is unchanged, because this work is front-end only.

## Open questions

- Should Motherland hide generators a player does not own yet? It shows 11 fields before Calculate.
- Are the researcher cards too dense on a phone?
- Should Online or Offline, Auto-buy, Limited by Comrades and Time left be saved? They reset today.
- Should a future mission be markable as complete on its own? A few survey respondents asked. Today's prompt completes everything before it instead.

## Running it

The local Docker containers must be running: the API on port 3001 and `adcom-assets` on 3002.

```bash
npm run dev
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run test:e2e
```

```bash
npm run build
```

`npm run golden` recaptures mission traces from `master`. Run it only when balance data changes. If the data has changed, the mission tests fail and tell you to run it. This command goes away in Phase 6.

At the last commit, all 1,254 unit tests and 42 browser tests passed.

## Where things are

| Path | Contents |
|---|---|
| `client/src/domain/` | Game rules with no React: missions, schedule, text, assets |
| `client/src/engine/` | Production formula, goals, ranges, Web Worker |
| `client/src/storage/` | Prefixed keys, migration, reset |
| `client/src/state/` | Zustand store and URL navigation |
| `client/src/features/` | Screens: missions, mission, calculator, production, settings, shell |
| `tests/golden/` | Mission traces captured from legacy code |
| `tests/legacy/` | Comparisons against the real legacy functions on `master`. Temporary, removed in Phase 6 |
| `tests/e2e/` | Playwright tests at phone and desktop widths |

**Reference material outside this repo:**
- Approved plan: `~/.claude/plans/rosy-plotting-flute.md`
- Production Mechanics Spec: https://claude.ai/code/artifact/09d4e364-bd15-4157-9023-d22ba02e4897
- Future Plan PDF: `~/Downloads/Mission Tracker Future Plan.pdf`
- 2022 survey: `~/Downloads/Mission Tracker Survey (Responses).xlsx`

## Survey priorities (293 responses, late 2022)

- Events matter most: 257 of 288 players check future event ranks.
- Skipping ahead was among the top requests. Advance to rank and the future-mission prompt now cover it.
- The calculator was underused because of typing effort and low awareness, and it had the weakest rating.
- Common complaints: misclicks that are hard to undo on a phone, and long Completed lists.
- Cross-device sync is wanted: 178 of 267 support optional login.
- Both themes matter: 152 use dark mode and 134 light.
