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

## Design Studio (a Canva alternative)

Built into the OS (Creative Tools > Design Studio, source in `suite/own/design-studio`). 700+ templates (over 220 for Indian and global festivals: Diwali, Holi, Eid, Navratri, Pongal, Onam and more, with Hindi and regional-script greetings) across 16 categories, 65 design types (social, video, cards, print, marketing), text with effects and curves, shapes, drawing, charts, tables, QR codes, brand kit, multi-page designs, magic resize and present mode. Right-click (or use the ⋯ button on) any design for Open, Rename, Make a copy, Move to folder, Download and Delete; folders have their own menu, and you can drag a design onto a folder. Right-click on the canvas gives Copy, Paste, Duplicate, Delete, Arrange, Group and Lock. Designs autosave as `.design` files in `Files > Designs`; opening one from Files launches the studio.

- **Remove background**: runs in the browser with onnxruntime-web (MIT) and the u2netp model (Apache-2.0). The first use makes the server download the runtime and the 4.5 MB model from jsDelivr/unpkg and GitHub into `DATA_DIR/bgdata`; after that it works offline. Set `BG_ORT_BASE` / `BG_MODEL_URL` to mirror them.
- **Animation**: enter, exit and loop effects per layer, page length per page. Export as MP4 (WebM where the browser cannot make MP4) or GIF; Present plays them.
- **Library** (Elements panel): about 200 line icons in 19 categories (searchable, recolourable), 50+ picture frames (drop a photo onto a frame to clip it, like Canva), device and print mockups, and 10 one-tap photo looks beyond the basic filters. 20+ presentation themes with 11 full decks (about 165 slides), and 225 corporate and social designs in 15 colour themes plus real estate, fitness, fashion, travel, education and food flavours. 400 fonts, including 73 handwriting and 70 script fonts (loaded from Google Fonts on demand). The background remover (magic and plain colour) cleans specks and soft edges, and everything you upload is kept in `Files > Designs > Uploads` so it is there when you reopen the studio.
- **More Canva-style tools:** Trash with 30-day restore, starred designs, sort, list view and multi-select on Home. Duotone looks, a colour palette taken from a photo (recolour the whole design with it, or add it to the Brand Kit), and a "colours in this design" list where changing one swatch changes it everywhere. Links on any object (web address or `page:2`) that work in Present mode. Present mode has transitions (fade, slide, push, zoom, wipe), speaker notes (N), a timer, a laser pointer (L) and a pen (D, E to erase). Page grid with drag-to-reorder, version history (automatic snapshots, restore), bleed and safe-area guides, pinned comments that reviewers can add to through a public review link (Comments › Share for review; "Get new comments" pulls their replies in), print-ready PDF (3 mm bleed and crop marks, clickable link areas), collage grids, several saved Brand Kits, smarter template search (understands phrases like "birthday invite for my son"), and Bulk create: one page or design per row of a CSV (use `{{column}}` in any text).
- **Docs, Whiteboards and Websites:** three separate editors (`docs.html`, `board.html`, `site.html`) listed on Home next to designs and saved in your Files under Designs. Docs: rich text, outline, find, page setup, Word/Markdown/HTML/PDF export. Whiteboards: endless canvas with sticky notes, shapes, connectors, pen, images and templates, PNG export. Websites: section-based builder (19 section types, templates, themes, fonts, pages, phone/tablet preview), export as a ZIP or publish a link. Published pages are static and script-free (`/w/<token>/`), and you can take them offline any time. Website contact forms open the visitor's email app; a form that sends by itself needs a form service.
- **Magic Studio** (select a picture, Magic Studio in the inspector): *Magic Eraser* (paint over something to remove it), *Upscale* (2x or 4x, sharpened), *Magic Layers* (subject and background on separate layers, the gap behind the subject filled in) and *Image to video* (zoom, pan, tilt or parallax camera moves, exported as MP4/GIF). These run in the browser and need no AI service. Image to video is camera motion on your photo, not AI-generated motion.
- **AI images** (Magic Edit, BG Generator, Magic Media): Settings > AI images (Design Studio). The default is Pollinations (free, no key) for generating backgrounds and pictures. Magic Edit with a mask needs an OpenAI-compatible image service (`IMAGE_PROVIDER=openai`, `IMAGE_API_URL`, `IMAGE_API_KEY`, `IMAGE_MODEL`); other providers fall back to generate-and-blend. Requests go through the server, the key never reaches the browser, and each user is limited to 40 requests per 10 minutes. The BG Generator also has 10 instant backdrops that need no AI.
- **Home screen**: opens on a Canva-style home (search banner, design-type shortcuts, recent designs, template gallery, Projects and Templates views).
- **Free photos**: Openverse and Wikimedia Commons work with no key. Add free keys in Settings > Stock photos (or `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`, `PIXABAY_API_KEY`) to also search Pexels, Unsplash and Pixabay. Credit and license are shown when you add a photo. Searches and image downloads go through this server, so the keys never reach the browser, and only the photo CDNs of those five services can be fetched.
- **Share links**: Download > Create link stores the export on the server at `/d/<random token>`, public to anyone who has the link, expiring in 7 days to a year, removable under My links. Anyone with the link can view it, so share only what you mean to.
- **Vector export**: SVG keeps text, shapes and plain photos as vectors (effects and filters are embedded as pictures; text uses the font name). "PDF (vector)" opens the print window; choose Save as PDF. The plain "PDF" option is image-based.

Limits: Magic (AI) uses the assistant model from Settings; Google Fonts load from fonts.googleapis.com, so text falls back to a system font offline; MP4 needs a browser built with H.264 (Chrome and Edge are, Electron builds without it fall back to WebM).

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

### Design Studio additions
- **Website templates**: 108 templates (36 kinds × Classic/Bold/Minimal) chosen from live thumbnails; pictures are generated art that follows each template's colours. Pictures can be replaced by upload, free stock photos or AI.
- **Crop** images in the editor, **Trash** for designs, docs, whiteboards and websites (30-day purge), and the A logo in full-screen mode.
- **Contact forms** on published sites are stored in a server inbox (Messages button) and can optionally be emailed.
- **AI** (Settings → AI for Design Studio): uses your connected AI by default; Gemini (free tier) or the Anthropic API can be selected. Drives Magic Write, doc/site rewriting, AI pictures and caption transcription.
- **Stock photos**: Wikimedia, Openverse, Pexels/Pixabay/Unsplash (keys), Freepik (key); Burst and StockVault open as links.
- **Video editor** (Home ▸ Videos): timeline with video, picture, sound, title and overlay clips (move, trim, split, volume, fades), captions (typed, `.srt` import/export, or automatic using your connected AI's speech-to-text or Gemini), and WebM export recorded in the browser. Media is kept in Files under Designs ▸ Videos. Export runs in real time, so a 2-minute video takes about 2 minutes.
  Also: clip speed, voice-over recording, caption translation and Classic/Bold/Karaoke caption styles.
  Also: Remove silences (cuts quiet stretches and closes the gaps) and a slow zoom for pictures.
- **Site check** (Websites ▸ Download ▸ Check my site): titles, descriptions, headings, picture descriptions, empty links and colour contrast; pages also carry social-share tags. **Version history** in Docs, Whiteboards, Websites and Videos (an automatic snapshot every 5 minutes, 20 kept, restorable).
- **More website sections**: WhatsApp chat button (wa.me link with a first message), QR code, and News/blog list (22 section types).
- **Build a site from a description** (Websites ▸ Templates): describe the business and name it; the closest template is chosen and every section is rewritten by your AI. **Video**: narrate text (needs a text-to-speech model such as tts-1 on your AI gateway) and record the screen.
