# Anands OS

A personal OS in one container: a branded shell around the open-source Puter apps, your Immich photos, Coolify insights ("Anand Cloud Insights") and an assistant that knows what is connected.

- **Suite**: the 48 apps from [HeyPuter/everything](https://github.com/HeyPuter/everything) (MIT), built at image-build time and served from this container. A small local shim replaces the Puter SDK, so sign-in, key-value storage, files and AI all run against this server. Nothing calls puter.com: the apps' CSP only allows this origin, and the build strips analytics and SDK URLs. (Verified in a browser run: zero requests to puter hosts.)
- **Photos**: Immich over its API (timeline, albums, favourites, smart search, upload, original/video streaming). The API key stays on the server.
- **Cloud Insights**: Coolify API (read-only token): resources, health, projects, recent deployments.
- **Assistant** (bottom right): any OpenAI-compatible endpoint, such as your FreeLLMAPI. It is given photos, insights, the app list and files saved by the apps, only the ones you switch on.
- **Mobile**: installable PWA (Add to Home Screen). Under 700 px the layout switches to a bottom tab bar.

## Deploy on Coolify

1. New resource, Docker Compose from this repo. The volume `anands-os-data` is mounted at `/data`.
2. Set a domain for port 8080, and `PUBLIC_URL` to the same HTTPS address.
3. Sign-in: set `APP_PASSWORD`, or OIDC (`OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ALLOWED`; redirect URI `<PUBLIC_URL>/auth/callback`). With neither, a random password is written to `/data/initial-password`.
4. Optional: `IMMICH_URL`/`IMMICH_API_KEY`, `COOLIFY_URL`/`COOLIFY_TOKEN`, `LLM_BASE_URL`/`LLM_API_KEY`/`LLM_MODEL`. Each can also be entered in the app under Settings; values saved there live in `/data/settings.json` (mode 0600) and override the environment.

The first build takes several minutes (it compiles every app). A GitHub Action also publishes `ghcr.io/<owner>/anands-os` if you prefer pulling an image.

## Drive (Cloudreve over WebDAV)

In Cloudreve open Settings > WebDAV, create an account and copy its address (ends in `/dav`), account name and password. Enter them in the OS under Settings > Drive, or set `DAV_URL`, `DAV_USER`, `DAV_PASSWORD`. Your files then appear as a `/Drive` folder: the Drive screen, the Open/Save dialogs of the apps and the assistant all use it. The password is write-only and never sent back to the browser.

Open with: Spreadsheet (csv/xlsx), Documents (.docx only), PDF, Presentation, Video/Audio Studio, Vector Studio, CAD, Circuits and Parametric receive the file at launch. Photo Studio gets the file through its file input. Notes has no launch hand-off; use its Open dialog. Text files open in a built-in editor.

Limits: tested against a mock WebDAV server only; uploads up to 200 MB are buffered; folders cannot be copied between local storage and Drive.

## Vault (Vaultwarden)

Set the Vaultwarden address (for example `https://pass.example.com`) in Settings, or `VAULT_URL`. The Vault screen asks for your email and master password on each unlock. The key is derived and the vault decrypted in your browser (PBKDF2 or Argon2id, as your account uses). The server only relays Bitwarden's prelogin, token and sync calls as ciphertext; the master password, keys and decrypted items are never stored or logged, and the assistant cannot see them. It auto-locks after 5 minutes idle. Supported: master-password accounts, authenticator or email two-step codes, TOTP codes, folders, favourites, per-item keys. Not supported: shared-organization items are not editable and SSO-only accounts without a master password, security-key two-step, shared organization items, cards and identities (listed as not shown). You can add, edit and delete logins and notes (encrypted in the browser, then sent through the relay; deletes go to the Vault trash). The clipboard is cleared 30 seconds after a copy.

Photo Studio opens images handed over from Drive; its own Open dialog also lists `/Drive`.

## Security model

- Secrets are write-only: the API returns only "is set" flags, and a blank field keeps the stored value.
- Every API and app route needs a session (HttpOnly, SameSite=Lax, Secure on HTTPS). State-changing calls need the `x-aos` header. Password attempts are rate limited (6 per 15 minutes).
- Use a **read-only** Coolify token and a dedicated Immich key.
- Suite apps run same-origin with the OS because they need the session. They are first-party code from a pinned upstream commit, built in your image.

## Known limits

- Apps that need Puter cloud features (workers, hosting, peer, permissions) get a clear "not available" error. The API-client app can only reach this origin plus anything in `CONNECT_SRC_EXTRA`.
- The Coolify response shapes follow the public API docs and are covered by a mock test, not a live server. If a field differs on your version, adjust `server/coolify.js`.
- The service tiles on Home (AI Chat, Pulse, Vault, VPN and so on) are plain links with placeholder addresses. Edit the `SVC` list in `web/os.js`.
- The assistant is non-streaming and answers from a text snapshot of connected data, not live tools.

## Develop

```
npm test             # end-to-end against mock Immich / Coolify / LLM, no network
bash suite/build.sh  # builds the apps into suite/dist (slow)
node server/index.js
```
Server config: `server/config.js`. UI: `web/` (no build step, no inline script). MIT-licensed upstream apps: see `UPSTREAM-LICENSE-MIT.txt`.

## Calendar: booking page, RSVP page and email

The Calendar app normally uses a Puter-hosted service for guest links and emails. Here both run on your own server.

1. Settings > Email (SMTP): host, port, security (STARTTLS, SSL or none), user, password, From address. Press "Send a test email". Or set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURITY`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_FROM_NAME`, `SMTP_DAILY_CAP`.
2. Set "Public address of this site" (or `PUBLIC_URL`). It is put in every emailed link, so it must be the HTTPS address guests can reach.
3. In the Calendar, enable RSVP links and booking pages as usual. Guests open `/rsvp/<token>` and `/book/<page>` without signing in; everything else still needs sign-in.

Safeguards: the guest-facing script runs in a sandbox with no network or file access; public routes are rate limited; there is a daily email cap (default 200); the SMTP password is write-only; links never use the visitor's Host header.

Limits: tested against a mock SMTP server only. Meeting links on booking pages and events now point at this server's `/meet` page (see Meetings).

`node test/calendar.mjs` runs the mock-SMTP tests; set `WORKER_SRC` and `E2E_SUITE` to include the real worker and guest pages.

## Meetings (video calls on your own server)

The Meetings app needs Puter's peer service and room directory. Both now run here:

- **Signalling**: a small relay on this server hands the connection set-up messages between browsers. Audio, video and chat then flow directly between the browsers, never through this server.
- **Meeting links**: `https://<your address>/meet/#/m/abc-defg-hij`. Guests open it with no account. Only the Meetings app's files are served at `/meet/`; everything else still needs sign-in. Calendar events and booking pages use the same links.
- **Other apps that use live sharing** (chess, checkers, backgammon, whiteboard, spreadsheet, team chat) use the same peer service, so they can connect too. Only Meetings has been tested end to end.
- **Relay for strict firewalls (optional)**: most connections work directly. For guests behind strict office or mobile networks, run a TURN server and enter its address and shared secret in Settings > Meetings relay (or `TURN_URLS`, `TURN_SECRET`). Example coturn on Coolify (image `coturn/coturn`): `--use-auth-secret --static-auth-secret=<secret> --realm=turn.example.com --listening-port=3478 --min-port=49160 --max-port=49200 --fingerprint --no-multicast-peers --no-cli`, with UDP 3478 and 49160-49200 open. Relay credentials are handed only to you and to guests of a meeting you host.

Limits: calls are a mesh (everyone connects to everyone), so quality drops beyond about 4 to 6 people. Tested with real Chromium browsers on a fake camera, three people, on one machine: not across real networks, and not with the TURN relay. If the server restarts mid-meeting, the host's connection re-registers on its own but guests who are not yet connected need to reload the link.

`node test/meet.mjs` runs these tests (needs Playwright; set `E2E_SUITE` to include the real Meetings app).

## Browser

Desktop Browser is a full browser built into Anands OS, with tabs, an address bar, back, forward and reload. Nothing else has to be installed or run.

It uses [Scramjet](https://github.com/MercuryWorkshop/scramjet), the engine behind Puter's browser.js. Pages are rewritten inside your own browser by a service worker (scope `/sj/`), and the network leg is a Wisp tunnel that ends in this server (`server/webproxy.js`), so sites see this server's address, not yours. The browser page itself is in `web/sj/`.

- The tunnel is a door to the internet, so it only opens for a short-lived token that a signed-in owner is given by `/api/sj/open`. It refuses private and loopback addresses, so sites cannot reach your internal network.
- For best isolation give the browser its own address, for example `SJ_HOST=browse.example.com` (add that domain to the same app in Coolify). Then the pages you visit run on a different origin from the OS and cannot touch it. Without it the browser runs under `/sj/` on the OS address.
- Google, YouTube, Reddit and similar sites work. Sites that check for a data-centre address may ask for a CAPTCHA. `SJ_OFF=1` turns the engine off and the Desktop falls back to simple tabs.
