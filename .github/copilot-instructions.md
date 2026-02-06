---
# Copilot / AI agent instructions — RAMSTUGA static site

Concise, actionable guidance for AI agents to be productive in this codebase.

## Big picture
- Static, multi-page, no-build site. Each page is a standalone HTML file, using a single JS bundle (`assets/script.js`) and shared CSS (`assets/style.css`).
- Root is Swedish; English and Dutch are mirrored under `/en/` and `/nl/`. Language preference is stored as `ramstuga_lang` in localStorage. First-visit redirect from root index is based on browser language.
- Cart state is stored in localStorage (`ramstuga_cart`), surfaced via the global `#cartCount` badge, and synchronized with the `storage` event.

## Key files and structure
- `ramstuga_site/index.html` — base shell (header/footer), mirrored in `/en/` and `/nl/`.
- `ramstuga_site/shop.html` — shop UI (product grid, cart, PayPal, contact actions).
- `ramstuga_site/assets/script.js` — single JS bundle: language switch, nav toggle, cart, shop rendering, payment reference, floating contact, lightbox, and all business logic.
- `ramstuga_site/assets/style.css` — global layout and component styles.
- `ramstuga_site/en/` and `ramstuga_site/nl/` — localized HTML mirrors of root pages.

## Architecture & conventions
- No build tooling, no server runtime. All logic is client-side and static.
- Page-specific JS is guarded by body classes (e.g., `body.page-shop`), so shop logic only runs on shop pages.
- Widgets (lightbox, floating contact, hero effects) are safe-initialized and no-op if required DOM nodes are missing.
- Cart storage key: `ramstuga_cart` (migrates from `ramhuset_cart` in `getCart()`/`setCart()`).
- Payment reference keys: `ramstuga_payref`, `ramstuga_payref_date` (migrate from `ramhuset_*`), created in `getOrCreatePaymentRef()` as `RAM-YYYYMMDD-####`.
- Shop config: edit `PRODUCTS`, `SHIPPING_COST_EUR`, `PAYPAL_URL`, `SWISH_INSTRUCTION`, and `SEK_PER_EUR` inside `if (isShopPage) { ... }` in `assets/script.js`.
- Currency: derived from `<html lang>` (SV → SEK, EN/NL → EUR), conversion via `SEK_PER_EUR` in `convertAmount()`.
- Totals add fixed shipping when product items exist; PayPal amount is shown in `#payAmount`.

## Integration points
- PayPal: `PAYPAL_URL` in `assets/script.js` (PayPal NCP payment link).
- Swish: `SWISH_INSTRUCTION` string near the shop config block.
- Email order: `mailto:info@ramstuga.se` built in the `paidMailBtn` handler with cart line items.
- Contact: direct `tel:`, `sms:`, `wa.me`, and `mailto:` URLs in `shop.html` and other pages.

## Developer workflow (local preview)
- From repo root:
  - `cd ramstuga_site`
  - `python3 -m http.server 8000`
  - Open http://localhost:8000
- Test shop flow: add products, verify `#cartCount`, and ensure totals + `#payAmount` update.


## Common edits & exact locations
- Add/change products: edit `PRODUCTS` in `assets/script.js` (inside `if (isShopPage) { ... }`).
- Update payment/shipping: set `PAYPAL_URL` and `SHIPPING_COST_EUR` in the same block.
- Update Swish copy: edit `SWISH_INSTRUCTION` near the shop config block.
- Update language routing: adjust `ramstuga_lang` logic near the top of `assets/script.js`.
- Edit copy/layout: update the relevant HTML files under `ramstuga_site/` and mirrored copies under `/en/` and `/nl/`.


## Do NOT change without confirmation
- Do NOT introduce a bundler/module system or split `assets/script.js` unless explicitly requested.
- Do NOT change PayPal or email addresses without owner confirmation.
