# Anands OS for desktop

The whole OS runs on your computer (a private server on 127.0.0.1 inside the app), so it opens with no internet.

- **This PC** drive in Files: your Documents, Downloads, Desktop, Pictures, Music and Videos by default. Menu → *Add a folder from this computer…* / *Remove a folder*.
- **Same account, offline**: once connected, the app copies your owner account from the web version (files, mail, calendar, contacts, app data and saved connection settings) into the PC and keeps it current: on start, every 15 minutes (files), and from Menu → *Sync with Anands Web now*. It then works offline with the same data. The web version is the source: a file you edited on the PC since the last sync is kept, not overwritten. Sign-in secrets (sessions, tokens, team members) are never copied.
- **Anands Web** drive in Files: your online Anands OS (its files, Drive, Google Drive), shown whenever the PC is online. Menu → *Connect to Anands Web…* (address + your website password, kept encrypted by the system).
- Copy or drag files between the two drives in Files.
- Data lives in the app's data folder (Menu → *Open data folder*).

## Build

Actions → **desktop** → *Run workflow* builds the Windows installer (.exe) and Mac disk images (.dmg, Apple silicon and Intel). Push a tag `desktop-v1.0.0` to publish them as a release.
The builds are not code-signed: on Windows choose *More info → Run anyway*; on Mac right-click the app → *Open* the first time.

Locally: `bash suite/build.sh /tmp/up /tmp/suite && cd desktop && npm ci && SUITE_DIST=/tmp/suite npm run dist`.
