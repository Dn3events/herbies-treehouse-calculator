# Herbie’s Treehouse Calculator

A static, installable till app for a Christmas drinks stall. It has no framework or build step, and the current order lives only in memory so a refresh always starts at £0.00. Product amounts are stored as integer pence. The running total includes an item-group breakdown, and the celebration bells are synthesized locally after the total is tapped.

## Run locally

Service workers require HTTPS or a local development origin such as `localhost`. With Python 3 installed, run this from the project folder:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000> in a browser. For local iPhone or iPad testing, put the computer and device on the same Wi-Fi and serve on your LAN (for example `python3 -m http.server 8000 --bind 0.0.0.0`), then open the computer’s local IP address in Safari. Some networks block device-to-device connections; an HTTPS preview or deployed link is another option.

## Publish a shareable link

**GitHub Pages** is a suitable free static host: push these files to a GitHub repository, then open **Settings → Pages**, choose **Deploy from a branch**, select the main branch and root folder, and save. GitHub Pages serves the app over HTTPS, which enables the service worker and offline cache. A project-page URL works because asset and service-worker paths are relative. Public repositories are free on GitHub Free; private-repository Pages availability depends on the account plan. Other static hosts such as Cloudflare Pages or Netlify also have free tiers, subject to their current account and usage limits.

Once the HTTPS link is live, share it with stall staff. The first successful load caches the app shell for offline reopening. A browser refresh or app reopen creates a new empty order; no order data is written to storage.

## Install on iPhone or iPad

1. Open the HTTPS app link in **Safari**.
2. Tap **Share** (the square with the up arrow).
3. Choose **Add to Home Screen**. If needed, scroll down in the share sheet to find it.
4. Name it if desired, then tap **Add**. Open the new Home Screen icon to use the app full-screen.

## Logo and sound

The supplied transparent wordmark is at `treehouse-logo.png`. To replace it, update the image source in `index.html`; the header plaque keeps dark artwork legible on the green background and scales for landscape. The transparent elf artwork used on the celebration screen is `dancing-elves.png`; its gentle dance is animated with CSS. PWA icons are in the project root so they can be uploaded using GitHub’s browser uploader. The sound is an original jingle-bells-style melody synthesized in `app.js` with Web Audio after the tap. No sound file or external audio service is required; if you prefer a recording, add it as a local asset and play it in the same total-button click handler.

## App files

- `index.html`, `styles.css`, `app.js`: screen markup, responsive layout, and order behavior.
- `manifest.webmanifest`: Home Screen app identity, launch mode, and icons.
- `service-worker.js`: offline app-shell cache; it never caches order data.
- `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`: app and Apple touch icons.
- `dancing-elves.png`: transparent illustration shown on the celebration screen.
