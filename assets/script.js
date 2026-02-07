(() => {
  /* =========================
     LANGUAGE SWITCH (SV/EN/NL)
  ========================= */
  const langLinks = document.querySelectorAll("[data-lang]");
  if (langLinks.length) {
    langLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const lang = link.getAttribute("data-lang");
        if (lang) localStorage.setItem("ramstuga_lang", lang);
      });
    });
  }

  const storedLang = localStorage.getItem("ramstuga_lang");
  const path = window.location.pathname;
  const isRootIndex = path === "/" || path.endsWith("/index.html");
  const isLangPath = path.includes("/en/") || path.includes("/nl/") || path.includes("/sv/");
  if (!storedLang && isRootIndex && !isLangPath) {
    const browserLang = (navigator.language || "").toLowerCase();
    if (browserLang.startsWith("en")) {
      window.location.replace("/en/index.html");
      return;
    }
    if (browserLang.startsWith("nl")) {
      window.location.replace("/nl/index.html");
      return;
    }
    // default stays on root (SV)
  }

  /* =========================
     NAV TOGGLE (MOBILE)
  ========================= */
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("siteMenu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    menu.addEventListener("click", (e) => {
      if (e.target && e.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", (e) => {
      const isOpen = menu.classList.contains("open");
      if (!isOpen) return;
      const target = e.target;
      const clickInsideMenu = menu.contains(target);
      const clickOnToggle = toggle.contains(target);
      if (!clickInsideMenu && !clickOnToggle) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* =========================
     JAARTAL
  ========================= */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================
     FOOTER CREDIT (GLOBAL)
  ========================= */
  function ensureFooterCredit() {
    const footerInner = document.querySelector(".site-footer .footer-inner");
    if (!footerInner) return;

    // If a credit link already exists, just normalize class for styling.
    const existingLink = footerInner.querySelector('a[href*="nico-on-point-webdesign.com"]');
    if (existingLink) {
      const p = existingLink.closest("p");
      if (p) {
        p.classList.add("footer-credit-webdesign");
        p.innerHTML =
          '&copy; Webdesign by: <a href="https://www.nico-on-point-webdesign.com" target="_blank" rel="noopener">www.nico-on-point-webdesign.com</a>';
      }
      return;
    }

    const credit = document.createElement("p");
    credit.className = "footer-credit footer-credit-webdesign";
    credit.innerHTML =
      '&copy; Webdesign by: <a href="https://www.nico-on-point-webdesign.com" target="_blank" rel="noopener">www.nico-on-point-webdesign.com</a>';

    const footerCopy = footerInner.querySelector(".footer-copy");
    if (footerCopy) {
      footerInner.insertBefore(credit, footerCopy);
    } else {
      footerInner.appendChild(credit);
    }
  }
  ensureFooterCredit();

  /* =========================
     CART BADGE (GLOBAL)
     - primary key renamed to ramstuga_cart with safe migration
  ========================= */
  const CART_KEY = "ramstuga_cart";
  const OLD_CART_KEY = "ramhuset_cart"; // fallback for existing clients

  function safeParseJSON(str, fallback) {
    try {
      const v = JSON.parse(str);
      return v ?? fallback;
    } catch {
      return fallback;
    }
  }

  function migrateCartIfNeeded() {
    // If new key exists, nothing to do.
    if (localStorage.getItem(CART_KEY)) return;
    // If old key exists, copy it to the new key.
    const old = localStorage.getItem(OLD_CART_KEY);
    if (old) {
      localStorage.setItem(CART_KEY, old);
    }
  }

  function getCart() {
    migrateCartIfNeeded();
    const raw = localStorage.getItem(CART_KEY) || "[]";
    const parsed = safeParseJSON(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function setCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadge();
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll('[data-cart-count="true"], #cartCount');
    if (!badges.length) return;
    const items = getCart();
    const count = items.reduce((sum, it) => sum + (Number(it?.qty) || 0), 0);
    badges.forEach((badge) => {
      badge.textContent = String(count);
    });
  }

  updateCartBadge();
  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY || e.key === OLD_CART_KEY) updateCartBadge();
  });

  /* =========================
     SUBTLE HERO PARALLAX
     frames + title (home only)
  ========================= */
  const hero = document.querySelector(".hero-wood");
  const blue = document.querySelector(".frame-blue");
  const grey = document.querySelector(".frame-grey");
  const title = document.querySelector(".hero-wood-title");

  if (hero && blue && grey && title) {
    // respecteer reduced motion
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let rafId = null;

      const tick = () => {
        rafId = null;

        const rect = hero.getBoundingClientRect();
        const vh = window.innerHeight || 800;

        // progress 0..1 terwijl hero door viewport beweegt
        const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));

        // HEEL subtiel: enkele pixels
        const yBlue = (progress - 0.5) * 18;   // -9..+9 px
        const yGrey = (progress - 0.5) * 26;   // -13..+13 px
        const yTitle = (progress - 0.5) * 10;  // -5..+5 px

        blue.style.setProperty("--scrollY", `${yBlue}px`);
        grey.style.setProperty("--scrollY", `${yGrey}px`);
        title.style.setProperty("--titleY", `${yTitle}px`);
      };

      const onScroll = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(tick);
      };

      tick();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }
  }

  /* =========================
     HERO TITLE TYPE-ON (HOME)
  ========================= */
  const typeTitles = document.querySelectorAll(".type-title[data-text]");
  const typeTitlesLate = document.querySelectorAll(".type-title-late[data-text]");
  const typeTitlesLate2 = document.querySelectorAll(".type-title-late2[data-text]");
  const typewriterExtras = document.querySelectorAll(
    ".typewriter[data-text]:not(.type-title):not(.type-title-late):not(.type-title-late2)"
  );
  if (typeTitles.length || typeTitlesLate.length || typeTitlesLate2.length || typewriterExtras.length) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = 70;
    const escapeInline = (str) => String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

    const reserveHeight = (el, text) => {
      const prevHtml = el.innerHTML;
      const prevMin = el.style.minHeight;
      el.innerHTML = (text || "").split("\n").map(escapeInline).join("<br>");
      const measured = Math.ceil(el.scrollHeight);
      el.style.minHeight = `${measured}px`;
      el.innerHTML = prevHtml;
      el.style.minHeight = prevMin || el.style.minHeight;
    };

    const typeElement = (el, startDelay = 0) => {
      const fullText = el.getAttribute("data-text") || "";
      el.setAttribute("dir", "ltr");
      reserveHeight(el, fullText);
      if (prefersReduced || !fullText) {
        el.innerHTML = fullText.split("\n").map(escapeInline).join("<br>");
        return 0;
      }

      let i = 0;
      const chars = fullText.split("");
      const render = () => {
        const current = chars.slice(0, i).join("");
        el.innerHTML = current.split("\n").map(escapeInline).join("<br>");
      };
      const tick = () => {
        i += 1;
        render();
        if (i < chars.length) {
          setTimeout(tick, speed);
        }
      };
      el.innerHTML = "";
      setTimeout(tick, startDelay);
      return startDelay + chars.length * speed;
    };

    let longest = 0;
    typeTitles.forEach((el, idx) => {
      const endAt = typeElement(el, 150 + idx * 60);
      longest = Math.max(longest, endAt);
    });

    const lateDelay = (longest || 0) + 250;
    let longestLate = 0;
    typeTitlesLate.forEach((el, idx) => {
      const endAt = typeElement(el, lateDelay + idx * 60);
      longestLate = Math.max(longestLate, endAt);
    });

    const late2Delay = (longestLate || lateDelay) + 250;
    let longestLate2 = 0;
    typeTitlesLate2.forEach((el, idx) => {
      const endAt = typeElement(el, late2Delay + idx * 60);
      longestLate2 = Math.max(longestLate2, endAt);
    });

    const extrasDelay = (longestLate2 || late2Delay) + 250;
    typewriterExtras.forEach((el, idx) => {
      typeElement(el, extrasDelay + idx * 60);
    });
  }

  /* =========================
     HERO PLAQUE FIT CHECK
     - If title/subtitle doesn't fit inside plaque, enable fallback mode
  ========================= */
  function setupHeroPlaqueFitFallback() {
    const heroInner = document.querySelector(".about-hero-inner");
    if (!heroInner) return;

    const plaque = heroInner.querySelector(".about-plaque, .shop-hero-plaque");
    if (!plaque) return;

    const titleEl = heroInner.querySelector(".about-title");
    const subtitleEl = heroInner.querySelector(".about-subtitle");
    const brandEl = heroInner.querySelector(".plaque-brandline");

    const fitsInside = (plaqueRect, el, inset = 8) => {
      if (!el) return true;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return true;
      const r = el.getBoundingClientRect();
      return (
        r.left >= plaqueRect.left + inset &&
        r.right <= plaqueRect.right - inset &&
        r.top >= plaqueRect.top + inset &&
        r.bottom <= plaqueRect.bottom - inset
      );
    };

    const evaluateFit = () => {
      const plaqueStyle = window.getComputedStyle(plaque);
      if (
        plaqueStyle.display === "none" ||
        plaqueStyle.visibility === "hidden" ||
        plaqueStyle.opacity === "0"
      ) {
        heroInner.classList.remove("hero-plaque-fallback");
        return;
      }

      const pr = plaque.getBoundingClientRect();
      if (pr.width < 80 || pr.height < 50) {
        heroInner.classList.remove("hero-plaque-fallback");
        return;
      }

      const shouldFallback =
        !fitsInside(pr, titleEl, 10) ||
        !fitsInside(pr, subtitleEl, 10) ||
        !fitsInside(pr, brandEl, 6);

      heroInner.classList.toggle("hero-plaque-fallback", shouldFallback);
    };

    const scheduleEvaluate = () => {
      requestAnimationFrame(evaluateFit);
    };

    scheduleEvaluate();
    setTimeout(scheduleEvaluate, 250);
    setTimeout(scheduleEvaluate, 800);
    setTimeout(scheduleEvaluate, 1400);

    window.addEventListener("resize", scheduleEvaluate, { passive: true });
    window.addEventListener("orientationchange", scheduleEvaluate);

    const ro = new ResizeObserver(scheduleEvaluate);
    ro.observe(heroInner);
    ro.observe(plaque);
    if (titleEl) ro.observe(titleEl);
    if (subtitleEl) ro.observe(subtitleEl);
    if (brandEl) ro.observe(brandEl);

    const mo = new MutationObserver(scheduleEvaluate);
    if (titleEl) mo.observe(titleEl, { childList: true, subtree: true, characterData: true });
    if (subtitleEl) mo.observe(subtitleEl, { childList: true, subtree: true, characterData: true });
  }

  setupHeroPlaqueFitFallback();

  /* =========================
     SHOP PAGE (PayPal + Swish QR)
  ========================= */
  const isShopPage = document.body && document.body.classList.contains("page-shop");
  if (isShopPage) {
    const docLang = (document.documentElement?.lang || "").toLowerCase();
    const locale = docLang.startsWith("en") ? "en-GB" : docLang.startsWith("nl") ? "nl-NL" : "sv-SE";
    const currentCurrency = docLang.startsWith("sv") ? "SEK" : "EUR";
    const SEK_PER_EUR = 11.5; // update if needed

    function convertAmount(amount, fromCurrency, toCurrency) {
      const value = Number(amount) || 0;
      if (fromCurrency === toCurrency) return value;
      if (fromCurrency === "EUR" && toCurrency === "SEK") return value * SEK_PER_EUR;
      if (fromCurrency === "SEK" && toCurrency === "EUR") return value / SEK_PER_EUR;
      return value;
    }

    // ====== Vul dit in ======
    const PAYPAL_URL = "https://www.paypal.com/ncp/payment/ZKYKA5JWNBYBJ"; // <-- zet jouw echte PayPal.me link
    const SWISH_INSTRUCTION = "Swish: lägg till din referens i meddelandet:"; // tekstje, optioneel

    // Standaard assortiment (pas aan / breid uit)
    const langKey = docLang.startsWith("en") ? "en" : docLang.startsWith("nl") ? "nl" : "sv";
    const PRODUCT_CATALOG = {
      nl: [
        { id: "std-30x40-licht",   title: "Standaardlijst Licht",   size: "30×40 cm", price: 49.00, img: "/images/shop/lijst-licht.png",   note: "Scandinavisch licht." },
        { id: "std-40x50-naturel", title: "Standaardlijst Naturel", size: "40×50 cm", price: 59.00, img: "/images/shop/lijst-naturel.png", note: "Rustiek naturel." },
        { id: "std-50x70-donker",  title: "Standaardlijst Donker",  size: "50×70 cm", price: 89.00, img: "/images/shop/lijst-donker.png",  note: "Diep donker, luxe." },
        { id: "std-40x40-grijs",   title: "Standaardlijst Grijs",   size: "40×40 cm", price: 64.00, img: "/images/shop/lijst-grijs.png",   note: "Verweerd grijs." }
      ],
      en: [
        { id: "std-30x40-licht",   title: "Standard Frame Light",   size: "30×40 cm", price: 49.00, img: "/images/shop/lijst-licht.png",   note: "Scandinavian light." },
        { id: "std-40x50-naturel", title: "Standard Frame Natural", size: "40×50 cm", price: 59.00, img: "/images/shop/lijst-naturel.png", note: "Rustic natural." },
        { id: "std-50x70-donker",  title: "Standard Frame Dark",    size: "50×70 cm", price: 89.00, img: "/images/shop/lijst-donker.png",  note: "Deep dark, luxury." },
        { id: "std-40x40-grijs",   title: "Standard Frame Grey",    size: "40×40 cm", price: 64.00, img: "/images/shop/lijst-grijs.png",   note: "Weathered grey." }
      ],
      sv: [
        { id: "std-30x40-licht",   title: "Standardram Ljus",     size: "30×40 cm", price: 49.00, img: "/images/shop/lijst-licht.png",   note: "Skandinaviskt ljus." },
        { id: "std-40x50-naturel", title: "Standardram Naturell", size: "40×50 cm", price: 59.00, img: "/images/shop/lijst-naturel.png", note: "Rustikt naturell." },
        { id: "std-50x70-donker",  title: "Standardram Mörk",     size: "50×70 cm", price: 89.00, img: "/images/shop/lijst-donker.png",  note: "Djup mörk, lyx." },
        { id: "std-40x40-grijs",   title: "Standardram Grå",      size: "40×40 cm", price: 64.00, img: "/images/shop/lijst-grijs.png",   note: "Väderbiten grå." }
      ]
    };
    const PRODUCTS = PRODUCT_CATALOG[langKey] || PRODUCT_CATALOG.sv;
    const ADD_LABEL = langKey === "en" ? "Add to cart" : langKey === "nl" ? "Voeg toe" : "Lägg till";

    // Vaste verzendkosten (per bestelling wanneer er standaardproducten in zitten)
    const SHIPPING_COST_EUR = 9.00;

    function moneyEUR(n) {
      const v = Number(n) || 0;
      return v.toLocaleString(locale, { style: "currency", currency: currentCurrency });
    }

    function escapeHtml(str) {
      return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function addToCart(product) {
      const unitPrice = convertAmount(product.price, "EUR", currentCurrency);
      const cart = getCart();
      const idx = cart.findIndex(it => it?.id === product.id);
      if (idx >= 0) {
        cart[idx].qty = (Number(cart[idx].qty) || 0) + 1;
      } else {
        cart.push({
          id: product.id,
          type: "product",
          title: `${product.title} (${product.size})`,
          qty: 1,
          price: unitPrice,
          currency: currentCurrency
        });
      }
      setCart(cart);
      renderCart();
    }

    function updateQty(id, qty) {
      const cart = getCart();
      const idx = cart.findIndex(it => it?.id === id);
      if (idx < 0) return;
      cart[idx].qty = Math.max(1, Number(qty) || 1);
      setCart(cart);
      renderCart();
    }

    function removeItem(id) {
      const cart = getCart().filter(it => it?.id !== id);
      setCart(cart);
      renderCart();
    }

    function itemUnitPrice(it) {
      const itemCurrency = it?.currency || "EUR";
      return convertAmount(Number(it?.price) || 0, itemCurrency, currentCurrency);
    }

    function subtotal(items) {
      return items.reduce((s, it) => s + itemUnitPrice(it) * (Number(it?.qty) || 0), 0);
    }

    function renderProducts() {
      const grid = document.getElementById("productGrid");
      if (!grid) return;

      grid.innerHTML = PRODUCTS.map(p => `
        <article class="card product-card">
          <div class="product-media" aria-hidden="true">
            <img src="${p.img}" alt="" loading="lazy">
          </div>
          <div class="pad">
            <h3>${escapeHtml(p.title)}</h3>
            <div class="subtle">${escapeHtml(p.size)}</div>
            <p style="margin-top:10px;">${escapeHtml(p.note)}</p>
            <div class="product-actions">
              <strong>${moneyEUR(convertAmount(p.price, "EUR", currentCurrency))}</strong>
              <button class="btn primary" type="button" data-add="${escapeHtml(p.id)}">${ADD_LABEL}</button>
            </div>
          </div>
        </article>
      `).join("");
    }

    function renderCart() {
      const items = getCart();
      const listEl = document.getElementById("cartList");
      const emptyEl = document.getElementById("cartEmpty");
      const subEl = document.getElementById("cartSubtotal");
      const shipEl = document.getElementById("cartShipping");
      const totalEl = document.getElementById("cartTotal");
      const payAmountEl = document.getElementById("payAmount");
      if (!listEl || !emptyEl || !subEl) return;

      emptyEl.style.display = items.length ? "none" : "block";

      listEl.innerHTML = items.map(it => `
        <div class="cart-item">
          <div>
            <strong>${escapeHtml(it?.title || "Item")}</strong>
            <div class="subtle">
              ${it?.type === "maatwerk" ? "Maatwerk (offerte)" : moneyEUR(itemUnitPrice(it))} •
              Aantal:
              <input class="cart-qty" type="number" min="1" value="${Number(it?.qty) || 1}" data-qty="${escapeHtml(it?.id)}">
            </div>
          </div>
          <div class="cart-item-end">
            <strong>${moneyEUR(itemUnitPrice(it) * (Number(it?.qty) || 0))}</strong>
            <button class="btn" type="button" data-remove="${escapeHtml(it?.id)}">Verwijder</button>
          </div>
        </div>
      `).join("");

      const subtotalAll = subtotal(items);
      const hasProducts = items.some(it => it?.type === "product");
      const shipping = hasProducts ? convertAmount(SHIPPING_COST_EUR, "EUR", currentCurrency) : 0;
      const total = subtotalAll + shipping;

      subEl.textContent = moneyEUR(subtotalAll);
      if (shipEl) shipEl.textContent = moneyEUR(shipping);
      if (totalEl) totalEl.textContent = moneyEUR(total);
      if (payAmountEl) payAmountEl.textContent = moneyEUR(total);
    }

    // ===== Payment reference (datum + nummer) =====
    function pad4(n){ return String(n).padStart(4, "0"); }
    function yyyymmdd(d = new Date()){
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}${m}${day}`;
    }
    function getOrCreatePaymentRef(){
      const key = "ramstuga_payref";
      const keyDate = "ramstuga_payref_date";
      const oldKey = "ramhuset_payref";
      const oldKeyDate = "ramhuset_payref_date";
      const today = yyyymmdd();

      // migrate old ref if present
      const existingNew = localStorage.getItem(key);
      const existingNewDate = localStorage.getItem(keyDate);
      if (existingNew && existingNewDate === today) return existingNew;

      const existingOld = localStorage.getItem(oldKey);
      const existingOldDate = localStorage.getItem(oldKeyDate);
      if (existingOld && existingOldDate === today) {
        // migrate to new keys
        localStorage.setItem(key, existingOld);
        localStorage.setItem(keyDate, existingOldDate);
        // keep old keys for safety but prefer new ones
        return existingOld;
      }

      const num = pad4(Date.now() % 10000);
      const ref = `RAM-${today}-${num}`;
      localStorage.setItem(key, ref);
      localStorage.setItem(keyDate, today);
      return ref;
    }
    function clearPaymentRef(){
      localStorage.removeItem("ramstuga_payref");
      localStorage.removeItem("ramstuga_payref_date");
      // also remove old keys for cleanliness
      localStorage.removeItem("ramhuset_payref");
      localStorage.removeItem("ramhuset_payref_date");
    }

    const paymentRef = getOrCreatePaymentRef();

    // PayPal direct link (kaart + PayPal in één)
    const paypalLink = document.getElementById("paypalLink");
    if (paypalLink) {
      const prodItems = getCart().filter(it => it?.type === "product");
      const prodSubtotal = subtotal(prodItems);
      const shipping = prodSubtotal > 0 ? convertAmount(SHIPPING_COST_EUR, "EUR", currentCurrency) : 0;
      const amountNum = prodSubtotal + shipping;
      const isPayPalMe = /paypal\.me\/|paypal\.me$/i.test(PAYPAL_URL);
      // PayPal.me ondersteunt een bedrag in de URL: /<bedrag>
      const amount = isPayPalMe && amountNum > 0 ? `/${amountNum.toFixed(2)}` : "";
      paypalLink.href = `${PAYPAL_URL}${amount}`;
      if (langKey === "en") {
        paypalLink.textContent = "Pay securely (card / PayPal)";
      } else if (langKey === "sv") {
        paypalLink.textContent = "Betala säkert (kort / PayPal)";
      } else {
        paypalLink.textContent = "Betaal veilig (kaart / PayPal)";
      }
    }
    // Bestelreferentie hint (optioneel)
    const refHint = document.getElementById("swishHint");
    if (refHint) refHint.textContent = `${PAYPAL_NOTE_TEXT} ${paymentRef}`;

    // Copy reference
    document.getElementById("copyRefBtn")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(paymentRef);
        alert("Bestelreferentie gekopieerd: " + paymentRef);
      } catch {
        alert("Bestelreferentie: " + paymentRef);
      }
    });

    // Mail after payment (standard products only)
    document.getElementById("paidMailBtn")?.addEventListener("click", () => {
      const prodItems = getCart().filter(it => it?.type === "product");
      if (!prodItems.length) return alert("Je winkelwagen is leeg (standaardproducten).");

      const prodSubtotal = subtotal(prodItems);
      const shipping = prodSubtotal > 0 ? convertAmount(SHIPPING_COST_EUR, "EUR", currentCurrency) : 0;
      const total = prodSubtotal + shipping;

      const lines = [];
      lines.push("Bestelling – RAMSTUGA");
      lines.push("");
      lines.push("Betaald via: PayPal (kaart of PayPal)");
      lines.push("Bestelreferentie: " + paymentRef);
      lines.push("");

      prodItems.forEach((it, i) => {
        lines.push(`${i + 1}. ${it.title}`);
        lines.push(`   Aantal: ${it.qty}`);
        lines.push(`   Prijs: ${moneyEUR(itemUnitPrice(it))}`);
        lines.push("");
      });

      lines.push("Subtotaal: " + moneyEUR(prodSubtotal));
      lines.push("Verzending: " + moneyEUR(shipping));
      lines.push("Totaal: " + moneyEUR(total));
      lines.push("");
      lines.push("Naam:");
      lines.push("Adres:");
      lines.push("Telefoon (optioneel):");
      lines.push("Opmerkingen:");

      const subject = encodeURIComponent("Bestelling – RAMSTUGA (" + paymentRef + ")");
      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = `mailto:info@ramstuga.se?subject=${subject}&body=${body}`;
    });

    // Clear cart
    document.getElementById("clearCartBtn")?.addEventListener("click", () => {
      if (confirm("Winkelwagen leegmaken?")) {
        setCart([]);
        clearPaymentRef();
        renderCart();
      }
    });

    // Add/remove/qty
    document.addEventListener("click", (e) => {
      const addId = e.target?.getAttribute?.("data-add");
      if (addId) {
        const p = PRODUCTS.find(x => x.id === addId);
        if (p) addToCart(p);
        return;
      }
      const remId = e.target?.getAttribute?.("data-remove");
      if (remId) removeItem(remId);
    });

    document.addEventListener("input", (e) => {
      const id = e.target?.getAttribute?.("data-qty");
      if (id) updateQty(id, e.target.value);
    });

    // Init
    renderProducts();
    renderCart();
    updateCartBadge();
  }
})();

/* ===== FLOATING CONTACT MENU (TOGGLE) ===== */
document.addEventListener("DOMContentLoaded", () => {
  const floats = document.querySelectorAll(".floating-contact");
  if (!floats.length) return;

  floats.forEach((wrap, idx) => {
    if (wrap.querySelector(".contact-toggle")) return;

    const links = Array.from(wrap.querySelectorAll("a"));
    if (!links.length) return;

    const actions = document.createElement("div");
    actions.className = "contact-actions";
    const actionsId = `contactActions-${idx + 1}`;
    actions.id = actionsId;

    links.forEach((link) => actions.appendChild(link));

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn contact-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", actionsId);
    toggle.setAttribute("aria-label", "Contactmenu");
    toggle.textContent = "Contact";

    wrap.appendChild(actions);
    wrap.appendChild(toggle);

    toggle.addEventListener("click", () => {
      const open = wrap.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
});

/* ===== LIGHTBOX GALLERY (SAFE) ===== */
document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const btnClose = document.querySelector(".lightbox-close");
  const btnNext = document.querySelector(".lightbox-next");
  const btnPrev = document.querySelector(".lightbox-prev");

  // Als de lightbox HTML niet op deze pagina staat: niks doen (geen crash)
  if (!lightbox || !lightboxImg || !btnClose || !btnNext || !btnPrev) return;

  // Kies welke foto's mee doen (NIET logo, NIET decoratieve)
  const images = Array.from(
    document.querySelectorAll(
      ".gallery img, .shop-help-media img, .product-media img, .shop-hero-plaque img, .shop-hero-media img, .about-frame img"
    )
  ).filter(img => img.getAttribute("aria-hidden") !== "true");

  if (!images.length) return;

  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = images[currentIndex].src;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxImg.src = "";
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % images.length;
    lightboxImg.src = images[currentIndex].src;
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    lightboxImg.src = images[currentIndex].src;
  }

  images.forEach((img, i) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => openLightbox(i));
  });

  // Portfolio-tegels (<a.shot>): voorkom navigatie naar jpg en open in lightbox
  document.querySelectorAll(".gallery a.shot").forEach((a) => {
    const img = a.querySelector("img");
    if (!img) return;

    a.style.cursor = "zoom-in";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const i = images.indexOf(img);
      if (i >= 0) openLightbox(i);
    });
  });

  btnClose.addEventListener("click", closeLightbox);
  btnNext.addEventListener("click", showNext);
  btnPrev.addEventListener("click", showPrev);

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });

  // Klik buiten de afbeelding sluit
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
});
