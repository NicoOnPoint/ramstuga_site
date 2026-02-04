# Copilot / AI agent instructions — RAMSTUGA site

Short, actionable guidance so an AI can be immediately productive in this codebase.

## Big picture
- Static multi-page site under ramstuga_site/ (no build tooling). Each page is standalone HTML; shared behavior is wired by a single JS bundle and global CSS.
- Cross-page cart state is stored in localStorage and reflected via the global cart badge.

## Key files (start here)
- [ramstuga_site/index.html](ramstuga_site/index.html) — homepage; header/footer structure is mirrored across pages.
- [ramstuga_site/shop.html](ramstuga_site/shop.html) — shop UI (product grid, cart, PayPal CTA, contact actions).
- [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js) — single JS bundle: nav toggle, year, cart, shop rendering, payment reference, lightbox.
- [ramstuga_site/assets/style.css](ramstuga_site/assets/style.css) — global styles and layout tokens.
- [ramstuga_site/images/](ramstuga_site/images/) — product and UI imagery referenced by HTML/JS.

## Architecture notes / why things are structured this way
- Intentional simplicity: HTML files + one JS IIFE (`assets/script.js`) + static assets. No bundler, no server runtime.
- Page-scoped behavior is guarded by body classes (e.g. `body.page-shop`) to avoid running shop logic on other pages.
- Cart badge updates across tabs using the `storage` event.

## Project-specific conventions & patterns (with examples)
- Cart storage key: `ramstuga_cart` (with migration from `ramhuset_cart`) in `getCart()` / `setCart()` in [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js).
- Payment reference keys: `ramstuga_payref` and `ramstuga_payref_date` (migrated from `ramhuset_*`). Generated in `getOrCreatePaymentRef()`.
- Shop configuration lives inside `if (isShopPage) { ... }`: edit `PRODUCTS`, `SHIPPING_COST`, and `PAYPAL_URL` there.
- PayPal link is built as `${PAYPAL_URL}/${amount}` for PayPal.me in `paypalLink` setup.
- Lightbox runs after DOMContentLoaded and targets `.gallery img`, `.product-media img`, etc.; missing lightbox HTML should not crash the page.

## Integration points
- PayPal: `PAYPAL_URL` in [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js) is the only external payment entry point.
- Email: order mail uses `mailto:info@ramstuga.se` in the `paidMailBtn` handler.
- Contact links are direct `tel:`, `sms:`, `wa.me` URLs in [ramstuga_site/shop.html](ramstuga_site/shop.html).

## Developer workflows (local preview)
- From repo root:
	- `cd ramstuga_site`
	- `python3 -m http.server 8000`
	- Open http://localhost:8000
- Test shop flow on `shop.html`: add products, verify `#cartCount`, and ensure PayPal link reflects the cart total.

## Common edits and exact locations
- Add/change products: edit `PRODUCTS` in [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js).
- Update PayPal link: set `PAYPAL_URL` in the same block.
- Edit copy/layout: update the relevant HTML files in ramstuga_site/ (e.g. `about.html`, `maatwerk.html`, `portfolio.html`, `shop.html`).

## What not to change without confirmation
- Don’t introduce a bundler/module system or split `assets/script.js` unless explicitly requested.
- Don’t change PayPal or email addresses without owner confirmation.
