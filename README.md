# AdVenture Communist/AdVenture Ages Mission Tracker
A tool that allows players to calculate missions and view event information in the Hyper Hippo mobile games AdVenture Communist and AdVenture Ages. This tool is NO LONGER available at GitHub Pages as of 1 December 2025 due to architectural changes. Please visit <https://idlegametools.com/adcom-mission-tracker/> for the newest updates!

## How to Use
Click on missions in the "Current" area to mark them as Completed.  Click missions in the "Completed" area to undo that, kicking the newest mission back out.

Each mission has a button of its reward capsule next to it.  Clicking this brings up a pop-up with details on the mission, as well as a calculator.  Click "Details" on the calculator for more info.

Switch between Motherland (main) and Event as well as between AdVenture Communist and AdVenture Ages by clicking on the title's dropdown. Other tools can be accessed by clicking around other icons in the top right.

## Technical Background
The website is mainly a static page built upon a single monolith JS file (`mission-tracker.js`). The server is a simple Node.js/Express instance running on a Docker container. Game data and most game images are served by a dedicated asset server and referenced by title ID.

Assets/images are not provided in the repository as these are copyrighted material. This repository must be run in tandem with [https://github.com/darrenrs/adcom-assets](adcom-assets).

## Build Instructions

### .env File
The `.env` file should be structured as follows (again, replace DEVID with your PlayFab ID). If you don't specify a port, it defaults to 3000:

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Express server port. |
| `ASSET_SERVER` | Yes | Backend-to-backend asset server base URL (Docker service URL in dev, private internal URL in prod). |
| `ASSET_PUBLIC_BASE` | Yes | Browser-facing asset root URL for images/JSON (for example, `http://localhost:3002/assets`). |
| `PLAYFAB_TITLE_ID_ADCOM` | Yes | AdVenture Communist PlayFab Title ID (`6bf5`) |
| `PLAYFAB_TITLE_ID_AGES` | Yes | AdVenture Ages PlayFab Title ID (`dc4bb`) |
| `API_URL_LEADERBOARD` | For the leaderboard | Base URL of Hyper Hippo's leaderboard API. Without it and the token, the Leaderboard tab never appears. |
| `API_GCLOUD_TOKEN` | For the leaderboard | Token for the leaderboard API. Never logged. |

Optional leaderboard settings, with their defaults:

| Variable | Default | Description |
|---|---|---|
| `API_APPLICATION_ID` | `adcom` | Leaderboard API project. |
| `LEADERBOARD_PLAYER_TOP_COUNT` | `25` | Entries requested per player call. Raise it (for example to `9999999`) if Shortboards come back cut short. |
| `LEADERBOARD_BOARD_TIMEOUT_MS` | `30000` | Timeout for the full-board call. |
| `ADCOM_API_MAX_CONCURRENCY` | `4` | Upstream requests in flight at once. |
| `ADCOM_API_REQUESTS_PER_SECOND` | `8` | Upstream request starts per second. |
| `ADCOM_API_TIMEOUT_MS` | `10000` | Timeout for other upstream calls. |
| `ADCOM_API_MAX_RETRIES` | `2` | Retries on 429, 502, 503, 504 and network errors. |
| `ADCOM_API_FALLBACK_RETRY_MS` | `2000` | Wait before a retry when the upstream gives no Retry-After. |
| `ADCOM_API_RETRY_JITTER_MS` | `250` | Random extra wait added to each retry. |

`ASSET_SERVER` is used by backend proxy routes (`/api/data/:title`, `/api/admin/data-file`) and must be reachable from the app container/process.
`ASSET_PUBLIC_BASE` is used by the browser to resolve image assets from the `adcom-assets` repository.

Recommended values:
- Dev (Docker Compose): `ASSET_SERVER=http://assets:3002`, `ASSET_PUBLIC_BASE=http://localhost:3002/assets`
- Prod: `ASSET_SERVER=http://assets:3002` (or equivalent private/internal URL), `ASSET_PUBLIC_BASE=https://idlegametools.com/assets`

The app and asset containers join the shared external Docker network `adcom-sites`. In production, reverse proxy this app to `/adcom-mission-tracker/` and proxy only the asset server's `/assets/` path publicly. Do not expose the asset server's `/` or `/update` paths publicly.

The Git Commit ID is passed in by the build script and exposed as an environment variable by Docker itself.

### Building and launching

The website runs on a Docker container. With Docker Compose installed on a Linux/macOS system, run `build.sh` to start the server. Several directories and files which are not present by default are required. Please contact the developer if you are unsure what should go in here.

Assets/images are not provided in the repository as these are copyrighted material.

Once the website is launched, you can browse to it at http://localhost:3000. To fetch the current data, you'll want to run the following (the versions are the latest as of April 18, 2026, but will likely need updating:
```
# AdCom data
curl -H "Content-Type: application/json" -d '{"title":"6bf5", "version":"6.54", "password":"password"}' http://localhost:8080/api/admin/data-file
# AdAges data
curl -H "Content-Type: application/json" -d '{"title":"dc4bb", "version":"1.34", "password":"password"}' http://localhost:8080/api/admin/data-file
```

### Front-end development

The React app is developed with Vite against the local Docker containers, so start those first (`build.sh` here, and `adcom-assets`). Then run:

```
npm run dev
```

Vite serves the app on http://localhost:5173 and forwards `/api` to the tracker container on the `PORT` set in `.env`. Front-end changes reload instantly. Changes to `app.js` or `server/` need `build.sh` again before they show up.

`npm test` runs the unit tests and `npm run test:e2e` the browser tests. The browser tests answer the leaderboard event list with "none", so live events never affect them.

## Contributors
The primary maintainer of this website is Enigma since 2022 with Catster providing additional support. Zephyron is the original creator of the Mission/Capsule Tracker and FAQ documents.

### Asset Contributors
* AdCom Wiki (Icons at launch).
* Eris (event icons).
* Julian (Emoji selection, development assistance).
* Phil109 (Crusade icons, development assistance).
* The_Random_Guy (Balance data at launch).
* Vdisco (Propaganda boost animations).

### Code Contributors
* EdricChan (Bugfix, suggestions).
* Enigma (Several features and assistance).
* Manifold0 (Some dark mode styling).
* Skylark (Improved input parsing).
* The-Snide-Sniper (Bugfix, suggestions).

Special thanks to anybody else that has submitted issues or written pull requests!

## Contributing
I welcome any feedback, bug reports, or pull requests.

If you have any questions, comments, or suggestions, please visit the #engineering channel in the [unofficial AdCom Discord](https://discord.gg/VPa4WTM). We are always happy to help.

## License
All files in this repository may be modified or redistributed with credit given to the current owner (Darren R. Skidmore / Enigma) or original owner (Zephyron), given that it ascribes to the Hyper Hippo Fan Content Policy and all legal stipulations.

This material is not official and is not endorsed by Hyper Hippo. For more information, see Hyper Hippo’s Fan Content Policy: (https://hyperhippo.com/fan-content-policy/)

Last updated: 8 May 2026.
