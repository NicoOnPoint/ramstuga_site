RAMSTUGA — Static site

Local development & testing

- From the project root open the site folder and start a simple static server:

```bash
cd ramstuga_site
python3 -m http.server 8000
# open http://localhost:8000 in a browser
```

Shop / payment notes

- The shop is client-side only. Cart state is stored in `localStorage` under the key `ramstuga_cart`.
- Payment link: set your PayPal link in `assets/script.js` inside the `if (isShopPage)` block by editing `PAYPAL_URL`.
- Shipping: fixed shipping costs are defined in `assets/script.js` per currency (`EUR: 20.00`, `SEK: 119.00`). Totals shown in the cart include that amount when product items are present.

Data migration

- The site includes a safe migration: if an earlier `ramhuset_cart` exists in `localStorage`, it will be copied to `ramstuga_cart` automatically so existing carts are preserved.
- Payment reference keys were renamed to `ramstuga_payref` and `ramstuga_payref_date`. Old keys are migrated when possible and cleared by the "Clear cart" action.

Contact

- Visible contact methods are direct links (`tel:`, `sms:`, WhatsApp) and `mailto:info@ramstuga.se`.

Notes for maintainers

- The main JS bundle is `assets/script.js` (IIFE). Be careful when splitting or bundling — initialization order matters.
- To reset local state for testing, clear `localStorage` for `ramstuga_cart`, `ramstuga_payref*` (or open DevTools → Application → Clear Storage).

If you want, I can also add a tiny test script to simulate adding products and verify totals.
