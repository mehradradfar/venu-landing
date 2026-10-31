# Venu landing page

Open `index.html` in a browser, or upload this folder to any static host.

- `index.html` - the built page (CSS, JS and icon sprite are inlined; images live in `assets/`).
- `src/` - editable sources. Run `python3 build.py` to rebuild `site.html` / `index.html` from them
  (build.py expects the sources in `src/` and writes next to itself).
- Store links and the QR target are set at the top of the script (`VENU = { appStore, googlePlay, qrUrl }`).
  Until they are set, the badges do nothing and the QR opens the page's own URL.
- External scripts: Lenis 1.1.13 (smooth scroll) and qrcode-generator 1.4.4, both from jsDelivr; Inter from Google Fonts.
- `#business` in the URL opens the For Businesses tab directly.
