# New Tracker: Progress and Handoff

**Status:** A beta is live from this branch. Beta feedback rounds 1–3 and the Leaderboard rework are built and committed locally. Phase 4 has not started.
**Branch:** `new-tracker`. `origin/new-tracker` is at `632458a`, which is what the beta runs. Every commit after it, from the density pass on, is local only. The owner said "not yet" to pushing each time; ask before pushing.
**Beta:** https://azimuth.idlegametools.com/adcom-mission-tracker/, run from a separate VPS folder (see Beta deployment). The live tracker on `master` is untouched.
**Last updated:** 8 November 2026.

Start here when picking the work up. The plan history is in `~/.claude/plans/rosy-plotting-flute.md`; the newest section is at the top. `deploy.yml` only deploys `master`.

## Next step

1. The owner checks the reworked Leaderboard tab locally with their real PlayFab ID against the old leaderboard page: place, marker bracket, Shortboard avatars, rank distribution totals. Locally it needs only `npm run dev`, with the Docker container rebuilt from this branch (see Running it).
2. The owner decides when to push, then redeploys the beta.
3. More owner feedback is expected. Plan each batch before coding.
4. Phase 4 waits for the owner's go-ahead.

**Waiting on the owner:** manual calculation test cases (see Calculation tests below), the in-game calendar icon, and restoring the removed help text by hand.

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
- **Build:** done 5 November for the beta. `app.js` serves `dist`, the Dockerfile builds the app in its own stage, and `admin.html`, `admin.js` and `missions_base.css` moved unchanged to `client/public/`. The legacy page is no longer served.
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
- The green generator box opens the generator's details panel, with an (i) after the name (8 November; it was a plain label before, and had a separate (i) button).
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
- The tracker's Express app proxies Hyper Hippo's leaderboard API (`server/leaderboard/`), with the archiver's rate limits. Events are cached 10 minutes and the full board 1 minute per event. Player results are never cached (owner, 8 November).
- `GET /api/leaderboard/events` always answers 200; without a token it returns no events, so pages load cleanly. `npm run dev` uses the Docker app's real routes. The browser tests set `LEADERBOARD_STUB=1`, so Vite answers the event list with "none" and live events never reach them.
- The tab appears only for a started AdCom event the API knows. Rewards come from the schedule's `LteLeaderboards` and `LteShortLeaderboards`; events missing from the schedule show no rewards.
- The PlayFab ID is saved as `PlayerId` and copied once from the old site's `playerId`.
- Not verified live: fixtures are synthetic. The per-player call uses `topCount=25`; if Shortboards come back truncated, set `LEADERBOARD_PLAYER_TOP_COUNT=9999999`. The full-board call has a 30 second timeout.

**Schedule and events**
- Events come from the schedule file and the leaderboard API, matched by theme with starts within 24 hours. Either source can add an event. Cycle events now carry leaderboard ids too.
- The mode menu has Motherland, the live event, Schedule (react-day-picker calendar with an event list) and All Events (every balance by name, opened as a preview). The Events tab is gone.
- AdCom has no calendar icon in its assets; a plain icon stands in until the owner adds one. Event accent colours do not exist in the data; researcher card backgrounds wait for them.

**Density pass (7 November, after beta feedback)**
- Controls use a size token: 44px on touch screens, 32px with a mouse (`h-control`, `size-control` and so on in `styles.css`).
- Explanations and details live in small anchored popovers (`client/src/ui/HelpTip.tsx`, `InfoPopover.tsx`). There are no new modals.
- On wide screens the tabs share the header row. The rank controls open in a popover.
- Tab moves straight between number fields: steppers, help, info and card buttons have `tabIndex={-1}`.
- Measured at 1280×800:
  - Calculator Researchers tab: 1,917px to 500px.
  - Generators tab: 1,274px to 216px.
  - Calculator start: 406px to 207px.
  - Game View: 2,197px to 1,067px.
  - Pinned bar: 101px to 56px.
- Height limits and Tab order are checked by `tests/e2e/density*.spec.ts`.
- Small compromises:
  - Game View industry buttons are 36px wide on phones, so five fit at 320px.
  - Mission progress and reward buttons on Game View still take Tab focus, but none sits between the number fields.

**Beta feedback round 2 (7 November)**
- The event banner fills the top of every page under the navbar (`shell/PageBanner.tsx`), with the balance name in Oswald (`@fontsource/oswald`). It costs about 300px of height on every page, by the owner's choice.
- Game View: stock titles ("Comrades • x/sec"), an Active Missions heading, the active resource grouped with its amount, and generators always in one column.
- Amount fields accept scientific notation and full digits, read KKK as KFC, and settle into game format on leaving the field. All fields share `ui/inputStyles.ts`.
- Researcher portraits are 2x tall in a 3:4 shape. Borders are solid, coloured by rarity. The generator info panel shows the automator's level and effect. Mission cards are 32% shorter.
- Schedule: Today button, event icons in day cells, the chosen event's range highlighted (click selects, Open navigates), two source dots per event, and `at=` uses the exact start.
- Settings shows the leaderboard connection status and "© 2026 Idle Game Tools". An MIT LICENSE now exists, keeping the original 2019-2022 authors' notice.

**Fields (7 November)**
- Body text is Barlow; every typed field is Inconsolata (Geist Mono until 8 November). Invalid fields turn red with no visible warning text.
- Negative numbers are invalid everywhere except typed mission progress (the calculator's Mission Progress field and Game View's progress for non-Own missions). Players use negative progress to stand in for another goal; remove this exception once custom objectives exist.

**Round 3 (7 November)**
- Up/Down steps by magnitude: 1 below 100, then 10^(digits − 2), with the smaller step down from an exact power of ten and snapping onto the grid (`stepAmount` in `client/src/domain/inputSteps.ts`). Researcher levels and trade costs keep their own steps.
- Infinity and NaN are never valid; generator counts must be whole below 2^53.
- Calculator fields are one column under Generators, Resources and Comrades, inside a form, so Enter calculates.
- Researcher pictures fill their 3:4 box with `object-cover`.
- Game View: larger stock titles, count box under each generator picture (fits "999.99 AAAAA"), ms/μs cycle times, and a manual cycle whose timer counts down and resets.
- The calculation time search now reaches 1e300 seconds, so "cannot finish" only means nothing produces.

**Leaderboard rework (7 November)**
- The server adds `avatarId` and `lteRank` for the player and each Shortboard entry, from upstream `resolvedPlayers` `customData`.
- A new `GET /api/leaderboard/:guid/stats?player=<id>` returns the rank distribution, average rank and trophy sum, built from the cached full board with no extra upstream calls. Its `players` count covers only players reporting an event rank.
- Page order: PlayFab ID box; a card grid (avatar and name spanning three rows; Global Position and Shortboard; Trophies and Player Rank; Joined and Last updated across both); Global and Shortboard tables side by side on wide screens; then Rank Distribution with "Cumulative trophies" and a Chart.js 4.6.1 bar chart.
- The marker sits in its own column beside the global table, positioned from measured row positions (`markerPlacement` in `leaderboardView.ts`). It doesn't use fixed pixel constants; the old site broke when commit `b8d7bed` restyled its rows. The global table never scrolls inside itself.
- Shortboard rows highlight on hover and show avatars, via the `common` balance's `Avatars` `VisualKey` mapped to `shared/avatars/<key>.png`.
- Not yet checked against a real PlayFab ID.

**Leaderboard freshness (8 November)**
- Show results always asks again, even for the saved ID. The previous results stay on screen until the new ones arrive, and the button is disabled meanwhile.
- The server sends `fetchedAt` and `boardFetchedAt` (stats send `boardFetchedAt`). The details card shows "Fetched at … · global positions as of …", with seconds.
- "Last updated" is still the time the game last reported the player's score, which the tracker cannot speed up.

**Round 4 (8 November)**
- Short event names (top-left button and mode menu) come from `getBasicLteName` in `domain/schedule.ts`: strip `-bal-N`, apply `themeIdOverrides` (Ages), then the hard-coded `themeIdTitleOverrides` in `domain/titles.ts`, else capitalise the theme id. They do not come from the game's text; full names do (`lte.<theme>.name`). A new event with no entry shows its capitalised theme id. The owner renamed Pet Show, Mini MLG, Mini Potato Factory, State Science, Vehicle Show, First Contact and Monster Hunt; `client/src/domain/eventNames.test.ts` holds the whole approved table, and `tests/legacy/harness.ts` lists the deliberate differences from legacy.
- Schedule: the calendar and the list each take half the width from 1024px. Today sits between the month arrows (a custom day-picker `Nav`). The month name has 12px more left padding. List dates show the year; banner dates don't.
- Banner: 280px tall on desktop (was 352px, from 1024px; phones and tablets unchanged). Title and dates share a top-aligned row; the description spans the full width underneath. It is the shared banner, so every page changed.
- Game View stocks: titles use the mission label style (`text-sm`, medium, normal colour), centred. On phones the icon moves into the title row so each field gets the whole box (98px instead of 70px), and the fields condense Inconsolata to 75% width so "999.99 AAAAA" fits; that needs the font's width axis (`inconsolata/wdth.css`, about 46KB more). On phones the whole comrade title row is the Trades shortcut, to keep a 44px tap target. The third stock uses the game's name for `gold`, so Ages shows "Gems".
- Game View resources keep the game's industry order; the active one widens to hold its amount field.

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
- **Dates** follow each player's browser language and time zone. The owner declined a date-format setting.
- **Saved ETAs** stop beyond about 273,900 years from now, the latest date a browser can represent. The calculator still shows longer durations.
- **Comparison with the 2021 calculator:** its offline Newton method matches the new engine (Stone, all cards maxed, 1 T mammoths: 44 SS = 10d 17h 50m, 74 CCC = 1.06 M years) but fails to converge at 77.7 MMM. The new engine gives 75.1 T years online and 33.9 T years offline for that case.
- **Local development is one command (8 November):** the local tracker container belongs to this folder's compose project and sits on the `adcom-sites` network with `adcom-assets`, so `ASSET_SERVER=http://assets:3002` only works inside Docker. Rebuild it from this branch with `./build.sh`; `npm run dev` then sends all of `/api` to it, on the `PORT` read from the `.env` file itself (a `PORT` in the shell is ignored, because launchers set it to Vite's own port). Rerun `./build.sh` after changing `app.js` or `server/`. The rebuilt container serves the new tracker on 3001, not the legacy page. `api:local`, `dev:leaderboard`, `LEADERBOARD_BACKEND` and `TRACKER_BACKEND` are gone. The `PLAYFAB_DEVICE_ID` and `PLAYFAB_DEVICE_ID_TYPE` entries in the local `.env` are read by nothing.

## Calculation tests

The owner will supply real in-game cases; each becomes a test with its own expected values.
- **Case types:** a short online run with 1–2 tiers and nothing bought; a long offline run (an hour or more); a time warp of known length; and a deep chain of 4+ tiers.
- **Each case needs:** game, event and industry; every generator count; researcher levels (a screenshot is fine); propaganda on or off; comrades and comrades per second; elapsed time; and the amounts before and after.
- Nothing should be bought during a test, and each screenshot should show the time. Crits mean a result should land inside the calculator's range, not match exactly.

## Open questions

- Roadmap: graphs of production and comrade requirements by rank. Not in the Future Plan; plan separately.

- Should Motherland hide generators a player does not own yet? It shows 11 fields before Calculate.
- Are the researcher cards too dense on a phone?
- Should Online or Offline, Auto-buy, Limited by Comrades and Time left be saved? They reset today.
- Should a future mission be markable as complete on its own? A few survey respondents asked. Today's prompt completes everything before it instead.

## Beta deployment

The owner plans a beta on the VPS: a separate directory checked out at `new-tracker`, its own port, and a beta domain proxied to it. The live tracker is untouched.

- The `.env` needs `PORT` (the beta port), `ASSET_SERVER`, `ASSET_PUBLIC_BASE`, the PlayFab settings, `API_URL_LEADERBOARD` and `API_GCLOUD_TOKEN`.
- Build and start with `COMMIT_HASH=$(git rev-parse --short HEAD) docker compose -p adcom-mission-tracker-beta up -d --build`. The project name keeps it apart from the live container.
- A separate beta domain has its own browser storage, so testers start without saves from the live tracker.
- `/api/import` and the admin routes are still unprotected, as on the live tracker.

## Running it

The local Docker containers must be running: the tracker API on the `PORT` from `.env` (3001), built from this branch with `./build.sh`, and `adcom-assets` on 3002. Rerun `./build.sh` after server changes.

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

On 8 November, after round 4, all unit tests and 240 browser tests passed (18 more skip by design at one width), and `npm run build` succeeded. `density.spec.ts`'s rank-popover test is occasionally flaky: it failed once on each of two earlier runs and passed on rerun.

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
