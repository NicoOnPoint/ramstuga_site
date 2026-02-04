# Copilot / AI agent instructions — RAMSTUGA site

Short, actionable guidance so an AI can be immediately productive in this codebase.

## Big picture
- Static multi-page site (no build tooling). Each page is a standalone HTML file wired to a single JS IIFE and shared CSS.
- Multi-language routing: root is Swedish, English and Dutch are under /en/ and /nl/; language preference stored in localStorage.
- Cross-page cart state is kept in localStorage and reflected via the global cart badge.

## Key files (start here)
- [ramstuga_site/index.html](ramstuga_site/index.html) — base header/footer structure mirrored across pages.
- [ramstuga_site/shop.html](ramstuga_site/shop.html) — shop UI (product grid, cart, PayPal CTA, contact actions).
- [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js) — single JS bundle: language switch, nav toggle, cart, shop rendering, payment reference, lightbox.
- [ramstuga_site/assets/style.css](ramstuga_site/assets/style.css) — global layout tokens and component styles.
- [ramstuga_site/en/](ramstuga_site/en/) and [ramstuga_site/nl/](ramstuga_site/nl/) — localized pages that mirror the root structure.

## Architecture notes / why things are structured this way
- Intentional simplicity: HTML + one JS bundle + static assets. No bundler or server runtime.
- Page-scoped behavior is guarded by body classes (e.g., `body.page-shop`) so shop logic only runs on shop pages.
- Cart badge updates across tabs using the `storage` event.
- Language redirect happens on first visit (no stored language) via `ramstuga_lang` in localStorage.

## Project-specific conventions & patterns (with examples)
- Cart storage key: `ramstuga_cart` with migration from `ramhuset_cart` in `getCart()`/`setCart()` in [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js).
- Payment reference keys: `ramstuga_payref` and `ramstuga_payref_date` (migrate from `ramhuset_*`) created in `getOrCreatePaymentRef()`.
- Shop configuration lives inside `if (isShopPage) { ... }`: edit `PRODUCTS`, `SHIPPING_COST_EUR`, `PAYPAL_URL`, and `SEK_PER_EUR` there.
- Currency: locale and currency switch based on `<html lang>` (SV → SEK, EN/NL → EUR). Conversion uses `SEK_PER_EUR`.
- Lightbox expects the global HTML shell (see the lightbox block in [ramstuga_site/index.html](ramstuga_site/index.html)); script guards are null-safe.

## Integration points
- PayPal: `PAYPAL_URL` in [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js).
- Email: order mail uses `mailto:info@ramstuga.se` in the `paidMailBtn` handler.
- Contact links are direct `tel:`, `sms:`, and `wa.me` URLs in [ramstuga_site/shop.html](ramstuga_site/shop.html).

## Developer workflows (local preview)
- From repo root:
  - `cd ramstuga_site`
  - `python3 -m http.server 8000`
  - Open http://localhost:8000
- Test shop flow on `shop.html`: add products, verify `#cartCount`, and ensure PayPal link reflects the cart total.

## Common edits and exact locations
- Add/change products: edit `PRODUCTS` in [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js).
- Update payment or shipping: set `PAYPAL_URL` and `SHIPPING_COST_EUR` in the same block.
- Update language routing: adjust `ramstuga_lang` logic near the top of [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js).
- Edit copy/layout: update the relevant HTML files under ramstuga_site/ and mirrored copies under /en/ and /nl/.

## What not to change without confirmation
- Don’t introduce a bundler/module system or split `assets/script.js` unless explicitly requested.
- Don’t change PayPal or email addresses without owner confirmation.
