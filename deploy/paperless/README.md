# Paperless-ngx (Anands Documents)

1. Coolify: New resource, Docker Compose, point it at this file. Domain `docs.anands.xyz` on service `web`, port 8000.
2. Environment: `PAPERLESS_DB_PASSWORD`, `PAPERLESS_SECRET_KEY` (long random), `PAPERLESS_ADMIN_PASSWORD`.
3. Authentik: create an OAuth2/OpenID provider, redirect URI `https://docs.anands.xyz/accounts/oidc/authentik/login/callback/`.
   Put the client id/secret and issuer (`https://sso.anands.xyz/application/o/<slug>`) in `PAPERLESS_OIDC_CLIENT_ID`, `PAPERLESS_OIDC_CLIENT_SECRET`, `PAPERLESS_OIDC_ISSUER`.
4. In Paperless, Settings, set the colour to orange (#f68712) and upload the Anands logo as the app logo.
5. Mobile: install the Paperless mobile app (for example Swift Paperless on iPhone, Paperless Mobile on Android).
   Server address `https://docs.anands.xyz`; sign in with your username and password, or create an API token under your profile
   and paste it. Scanning with the phone camera uploads straight into the inbox.
6. In Anands OS, add the address under Settings, Links so it shows as a tile on Home.

## Login says "CSRF verification failed" (403)
Paperless must know the exact address you open it on. Set these in Coolify's environment for the service and redeploy:

- `PAPERLESS_URL=https://<your domain>`
- `PAPERLESS_CSRF_TRUSTED_ORIGINS=https://<your domain>`
- `PAPERLESS_ALLOWED_HOSTS=<your domain>`
- `PAPERLESS_USE_X_FORWARD_HOST=true`, `PAPERLESS_USE_X_FORWARD_PORT=true`
- `PAPERLESS_PROXY_SSL_HEADER=["HTTP_X_FORWARDED_PROTO", "https"]`

Then open it with `https://` and the same domain (not the server IP, not `http://`), and clear the site's cookies once.
