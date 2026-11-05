# New Tracker: Progress and Handoff

**Status:** The 4 November brief (Leaderboard, Schedule, polish) is built and waiting for the owner's review. Phase 4 has not started.
**Branch:** `new-tracker`. It has not been pushed.
**Last updated:** 4 November 2026.

Start here when picking the work up. Nothing on this branch is deployed, because `deploy.yml` only deploys `master`.

## Next step

1. The owner adds `API_URL_LEADERBOARD` and `API_GCLOUD_TOKEN` to the tracker's `.env` (same values as adcom-leaderboard). Then check one real PlayFab ID against the old leaderboard page, and confirm the per-player call returns the whole Shortboard (see Leaderboard notes).
2. The owner reviews the 4 November work.
3. Wait for the owner's go-ahead before starting Phase 4.

## Ground rules from the owner

- All work stays on `new-tracker`. Nothing goes to `master` yet.
- The plan comes before the code. Phase reviews are the owner's call.
- The frontend is React and Vite. Do not reopen that decision.
- Clicking a mission moves it between incomplete and completed, in both directions. Lists always follow the balance's internal mission order.
- Old tracker links are not supported. This is a total revamp, and legacy code should be kept to a minimum.
- The game's screenshots show how it presents information. They are not a request to copy its visual style.
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
| 3b. Layout brief | URL scheme, rank in the top bar, Game View tab, Production rework | Built. Owner review pending |
| 3c. Leaderboard brief | Leaderboard tab, Schedule and All Events pickers, Game View, Production, Trades and calculator polish | Built. Owner review pending |
| 4. Parity | Events and Reference tabs, Docker build, remove legacy `public/` files | Not started. Owner review afterwards |
| 5. PDF features | See the list under Phase 5 | Not started. Each group reviewed separately |
| 6. Test independence | Remove every test's dependency on legacy code | Not started. Must finish before any merge to `master` |

### Phase 4 scope

- **Events tab:** schedule, all events, balance information. Their current placeholder is `client/src/features/events/EventsPage.tsx`.
- **Reference tab:** airdrops, capsules, scripted capsules, avatar unlocks, help. Its placeholder is `client/src/features/reference/ReferencePage.tsx`.
- **Build:** change `app.js` to serve `dist`, add a Node build stage to the `Dockerfile`, and move `admin.html`, `admin.js` and the CSS they need into `client/public/` unchanged.
- **Cleanup:** remove the legacy files in `public/`, but only after every feature has moved over. `npm run golden` reads legacy code from `master`, not from `public/`.

### Phase 5 scope

Custom propaganda value, Store section, airdrops in the result, trade calculator (treat Trade missions as Collect), event common and rare card icons, updated help, capsule table redesign, full-page avatars, segmented offline calculator, and Spend/Collect by capsules and airdrops.

The Motherland capsule table stays out until the evergreen capsule formula is known.

### Phase 6 scope

Legacy comparisons stay in use through Phases 4 and 5, because they prove the ports are right. They end with development. Two things depend on legacy code today:

- `tests/legacy/` reads `public/` from `master` through `git show` every time it runs, so these tests break when the new tracker reaches `master`.
- `tests/golden/mission-traces.json` is already a stored file, but For live leaderboard data in development, run the branch's own server and point Vite at it. The Docker app on 3001 is an older build without the leaderboard routes, and plain `npm run dev` answers the event list with "none".

```bash
npm run api:local
```

```bash
npm run dev:leaderboard
```

`npm run golden` recaptures it from `master`, and `tests/golden/missions.test.ts` tells you to do that when a balance changes.

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
- Rank lives in the centre of the top bar with a progress bar. Tapping it opens the arrows and rank input. On phones the mode selector shrinks to its icon.
- Motherland moves freely between ranks. Events only move forward, and `>` or the input marks earlier missions complete.
- A collapsible "How to use" card sits above Completed with four bullets. Its hidden state is saved. The removed help content will be restored later by the owner, by hand.
- The grid goes up to four columns from the 1536px breakpoint, and the page width is 1440px.

**Behaviour**
- The mission icon toggle and list view are permanently removed.
- Clicking a future mission opens a confirmation to complete everything before it. In Motherland this covers only the rank on screen.
- A calculator badge on the capsule appears only on missions that have a calculator.
- Capsules and A/B switches stay usable on future missions, as in legacy.

**URL**
- `title=adcom|ages` and `mode=evergreen|lte` always show in the URL. `rank`, `view` and `mission` stay.
- `at=<millis>` opens the schedule entry running at that time. `balance=<id>` previews an event with no schedule entry, and its progress is temporary.
- Modes are `evergreen` and `lte` internally. Saved keys and values still say `main` and `event`, so saves keep working.

**Game View**
- It is the default tab. Only the generator bars move. Numbers change only when typed.
- The green generator box is a label and does nothing when tapped.
- Own missions link to the entered amounts, in both directions. Other missions save typed progress per mission, under `MissionProgress`, and the calculator's Mission Progress field shares it.
- Mission cards stack on phones and sit three across from 640px, because the capsule beside the requirement leaves too little width on a phone.
- Beta placeholders until the owner decides: generators show base output for all owned per cycle, or per second under a 0.5s cycle. Unlock missions use a typed 0/1.

**Production and other**
- Generators show one column per industry from `md` up. Researcher cards are about 75% of their old size, with Max on each card plus Max all and Set all to 0.
- Custom researcher values are gone. Saved custom levels load as 0.
- Propaganda starts on. An explicit off in a save stays off.
- GitHub, Privacy, Terms and the build id are in Settings. The footer keeps only the fan content notice.
- Only plain Up and Down remain as keyboard input.

**Leaderboard (AdCom only)**
- The tracker's Express app proxies Hyper Hippo's leaderboard API (`server/leaderboard/`), with the archiver's rate limits. Events are cached 10 minutes, the full board 5 minutes per event, player results 60 seconds.
- `GET /api/leaderboard/events` always answers 200; without a token it returns no events, so pages load cleanly. In development, Vite answers it the same way unless `LEADERBOARD_BACKEND` points at a local `node app.js`.
- The tab appears only for a started AdCom event the API knows. Rewards come from the schedule's `LteLeaderboards` and `LteShortLeaderboards`; events missing from the schedule show no rewards.
- The PlayFab ID is saved as `PlayerId` and copied once from the old site's `playerId`.
- Not verified live: fixtures are synthetic. The per-player call uses `topCount=25`; if Shortboards come back truncated, set `LEADERBOARD_PLAYER_TOP_COUNT=9999999`. The full-board call has a 30 second timeout.

**Schedule and events**
- Events come from the schedule file and the leaderboard API, matched by theme with starts within 24 hours. Either source can add an event. Cycle events now carry leaderboard ids too.
- The mode menu has Motherland, the live event, Schedule (react-day-picker calendar with an event list) and All Events (every balance by name, opened as a preview). The Events tab is gone.
- AdCom has no calendar icon in its assets; a plain icon stands in until the owner adds one. Event accent colours do not exist in the data; researcher card backgrounds wait for them.

**Auto-buy**
- Fixed: auto-buy rounded up to the end of a 1-second or 1% step, so it read slower than plain online. It also never bought the mission's own generators, and spent them on deeper tiers.
- Kept on purpose (owner, 4 November): for some Own missions, buying the deepest generators spends the shared resource and comrades the mission's generators cost, so auto-buy is genuinely slower (5 of 121 sampled missions, 1% to 2.6x). Auto-buy reports its own strategy's time, not the faster of the two.

**Not wanted yet:** an Undo prompt after completing a mission, and collapsing older Completed ranks. The owner declined both for now.

**Engine rules:** Common speed researchers set cycle time, and other researchers multiply output. Warps use the online calculation. Nothing is bought during an offline period. Tied payouts run deepest first, because the measured effect is negligible.

## Worth knowing

- **Longer offline ETAs:** offline Own missions that cost generators can be much longer than before. Legacy ignored those costs, so its answers were too optimistic.
- **Comparison with legacy:** on sampled missions, online results are within 3% and offline resource goals within 1%. The engine has not been checked against real in-game numbers yet.
- **Legacy bugs not carried over:** the Advance To Rank off-by-one, and Reset All wiping other tools' data.
- **Calculator defaults changed:** with propaganda on by default, new saves calculate with the boost applied.
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

At the last commit, all 1,315 unit tests and 156 browser tests passed, and `npm run build` succeeded.

## Where things are

| Path | Contents |
|---|---|
| `client/src/domain/` | Game rules with no React: missions, schedule, text, assets |
| `client/src/engine/` | Production formula, goals, ranges, Web Worker |
| `client/src/storage/` | Prefixed keys, migration, reset |
| `client/src/state/` | Zustand store and URL navigation |
| `client/src/features/` | Screens: game, missions, mission, calculator, production, leaderboard, schedule, settings, shell |
| `server/leaderboard/` | The leaderboard proxy: rate-limited client, parsing, cached routes |
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
