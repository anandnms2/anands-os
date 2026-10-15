/* The Suite apps are third-party builds with the Puter name baked in (footers, "Powered by Puter", links, generated PDFs).
 * They are rebranded as they are served: visible names become Anands and links to puter.com go to this server. Code names such as
 * puter.kv, window.puter and the puter.work / js.puter.com service addresses are left alone because the apps need them. */
const TEXT = /\.(html|js|mjs|json|webmanifest|css|txt|xml)$/i;
const URLS = /https?:(?:\\?\/){2}(?!(?:js|api)\.puter\.)(?:[a-z0-9-]+\.)*puter\.(?:com|site)(?:(?:\\?\/)(?!relationships)[^"'`\s)<>\\]*)?/gi;
export function rebrandable(file, size) { return TEXT.test(file) && size < 8 * 1024 * 1024; }
export function rebrand(s) {
  if (!/puter/i.test(s)) return s;
  return s
    .replace(URLS, (m) => (m.includes('/relationships/') ? m : (/\\\//.test(m) ? '\\/' : '/')))
    .replace(/Puter Technologies Inc\.?/g, 'Anands')
    .replace(/your @puter\.email address/g, 'your email address')
    .replace(/to any address on Puter or off/g, 'to any address')
    .replace(/in your own Puter account/g, 'on your own Anands server')
    .replace(/Messages delivered to your Puter mailbox/g, 'Messages delivered to your mailbox')
    .replace(/An email client for your Puter account/gi, 'An email client for your own mail')
    .replace(/A fast, private email client for your Puter account/g, 'A fast, private email client for your own mail')
    .replace(/\bPuter (?:Mail|Email)\b/g, 'Anands Email')
    .replace(/\bPuter Meetings\b/g, 'Anands Meeting')
    .replace(/\bPUTER\b(?!_)/g, 'ANANDS')
    .replace(/\b(?!js\.|api\.)(?:[a-z0-9-]+\.)+puter\.com\b(?!\/v2)/gi, 'anands.xyz')
    .replace(/\bPuter\.(com|js)\b/g, 'Anands')
    .replace(/\bPuter\b/g, 'Anands');
}
