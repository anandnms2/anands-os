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

Set the Vaultwarden address (for example `https://pass.anands.xyz`) in Settings, or `VAULT_URL`. The Vault screen asks for your email and master password on each unlock. The key is derived and the vault decrypted in your browser (PBKDF2 or Argon2id, as your account uses). The server only relays Bitwarden's prelogin, token and sync calls as ciphertext; the master password, keys and decrypted items are never stored or logged, and the assistant cannot see them. It auto-locks after 5 minutes idle. Supported: master-password accounts, authenticator or email two-step codes, TOTP codes, folders, favourites, per-item keys. Not supported: shared-organization items are not editable and SSO-only accounts without a master password, security-key two-step, shared organization items, cards and identities (listed as not shown). You can add, edit and delete logins and notes (encrypted in the browser, then sent through the relay; deletes go to the Vault trash). The clipboard is cleared 30 seconds after a copy.

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

Limits: tested against a mock SMTP server only. Booking pages created with "add a meeting link" still point at meetings.puter.com; turn that off per page until the Meetings app is supported. The Meetings app itself needs Puter's peer service and is not supported yet.

`node test/calendar.mjs` runs the mock-SMTP tests; set `WORKER_SRC` and `E2E_SUITE` to include the real worker and guest pages.
