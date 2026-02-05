# Copilot / AI agent instructions — RAMSTUGA site

Short, actionable guidance so an AI can be immediately productive in this codebase.

## Big picture
- Static multi‑page site (no build tooling). Each page is a standalone HTML file wired to one JS IIFE and shared CSS.
- Root is Swedish; English and Dutch are mirrored under /en/ and /nl/. Language preference is saved as `ramstuga_lang` in localStorage, with a first‑visit redirect from the root index based on browser language.
- Cross‑page cart state is stored in localStorage and surfaced via the global `#cartCount` badge with `storage` event sync.

## Key files (start here)
- [ramstuga_site/index.html](ramstuga_site/index.html) — base shell (header/footer) mirrored across pages.
- [ramstuga_site/shop.html](ramstuga_site/shop.html) — shop UI (product grid, cart, PayPal CTA, contact actions).
- [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js) — single JS bundle: language switch, nav toggle, cart, shop rendering, payment reference, floating contact, lightbox.
- [ramstuga_site/assets/style.css](ramstuga_site/assets/style.css) — global layout tokens and component styles.
- [ramstuga_site/en/](ramstuga_site/en/) and [ramstuga_site/nl/](ramstuga_site/nl/) — localized HTML mirrors of root pages.

## Architecture notes / why things are structured this way
- Intentional simplicity: HTML + one JS bundle + static assets. No bundler or server runtime.
- Page‑scoped behavior is guarded by body classes (e.g., `body.page-shop`) so shop logic only runs on shop pages.
- Widgets (lightbox, floating contact, hero effects) are safe‑initialized and no‑op if required DOM nodes are missing.

## Project‑specific conventions & patterns (examples)
- Cart storage key: `ramstuga_cart` with migration from `ramhuset_cart` in `getCart()`/`setCart()` in [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js).
- Payment reference keys: `ramstuga_payref` and `ramstuga_payref_date` (migrate from `ramhuset_*`) created in `getOrCreatePaymentRef()` as `RAM-YYYYMMDD-####`.
- Shop configuration lives inside `if (isShopPage) { ... }`: edit `PRODUCTS`, `SHIPPING_COST_EUR`, `PAYPAL_URL`, `SWISH_INSTRUCTION`, and `SEK_PER_EUR` there.
- Currency: derived from `<html lang>` (SV → SEK, EN/NL → EUR) with conversion via `SEK_PER_EUR` in `convertAmount()`.
- Totals add fixed shipping when product items exist; PayPal amount is shown in `#payAmount`.

## Integration points
- PayPal checkout: `PAYPAL_URL` in [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js) (currently a PayPal NCP payment link).
- Swish instructions: `SWISH_INSTRUCTION` string near the shop config block.
- Email order flow: `mailto:info@ramstuga.se` built in the `paidMailBtn` handler with cart line items.
- Contact links are direct `tel:`, `sms:`, `wa.me`, and `mailto:` URLs in [ramstuga_site/shop.html](ramstuga_site/shop.html).

## Developer workflows (local preview)
- From repo root:
  - `cd ramstuga_site`
  - `python3 -m http.server 8000`
  - Open http://localhost:8000
- Test shop flow on shop page: add products, verify `#cartCount`, and ensure totals + `#payAmount` update.

## Common edits and exact locations
- Add/change products: edit `PRODUCTS` in [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js).
- Update payment/shipping: set `PAYPAL_URL` and `SHIPPING_COST_EUR` in the same block.
- Update Swish copy: edit `SWISH_INSTRUCTION` near the shop config block.
- Update language routing: adjust `ramstuga_lang` logic near the top of [ramstuga_site/assets/script.js](ramstuga_site/assets/script.js).
- Edit copy/layout: update the relevant HTML files under ramstuga_site/ and mirrored copies under /en/ and /nl/.

## What not to change without confirmation
- Don’t introduce a bundler/module system or split `assets/script.js` unless explicitly requested.
- Don’t change PayPal or email addresses without owner confirmation.
