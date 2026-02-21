(() => {
  const GA_MEASUREMENT_ID = "G-3PEW6XG51V";
  const GA_DEBUG_ENABLED = new URLSearchParams(window.location.search).get("ga_debug") === "1";
  const CONSENT_STORAGE_KEY = "ramstuga_consent_session_v1";
  const CONSENT_UNKNOWN = "unknown";
  const CONSENT_ACCEPTED = "accepted";
  const CONSENT_REJECTED = "rejected";

  function getDocLang() {
    const lang = (document.documentElement?.lang || "").toLowerCase();
    if (lang.startsWith("en")) return "en";
    if (lang.startsWith("nl")) return "nl";
    return "sv";
  }

  function getConsentChoice() {
    try {
      const stored = sessionStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // Fall through to cookie fallback.
    }
    const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_STORAGE_KEY}=([^;]*)`));
    const cookieValue = cookieMatch ? decodeURIComponent(cookieMatch[1]) : "";
    if (cookieValue === CONSENT_ACCEPTED || cookieValue === CONSENT_REJECTED) return cookieValue;
    return CONSENT_UNKNOWN;
  }

  function setConsentChoice(choice) {
    try {
      sessionStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {
      // Ignore storage failures in restricted browser modes.
    }
    try {
      // Session cookie: cleared when browser session ends.
      document.cookie = `${CONSENT_STORAGE_KEY}=${encodeURIComponent(choice)}; Path=/; SameSite=Lax`;
    } catch {
      // Ignore cookie failures.
    }
  }

  function updateAnalyticsConsent(granted) {
    if (typeof window.gtag !== "function") return;
    window.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
  }

  function sendManualPageView() {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_path: window.location.pathname,
      page_location: window.location.href
    });
  }

  function getConsentUiText() {
    const lang = getDocLang();
    if (lang === "en") {
      return {
        message: "We use analytics cookies to understand site performance. You can accept or decline analytics.",
        accept: "Accept",
        decline: "Decline"
      };
    }
    if (lang === "nl") {
      return {
        message: "We gebruiken analytics-cookies om de siteprestaties te begrijpen. Je kunt analytics accepteren of weigeren.",
        accept: "Accepteren",
        decline: "Weigeren"
      };
    }
    return {
      message: "Vi använder analyscookies för att förstå webbplatsens prestanda. Du kan acceptera eller avvisa analyscookies.",
      accept: "Acceptera",
      decline: "Avvisa"
    };
  }

  function ensureConsentStyles() {
    if (document.getElementById("ramstugaConsentStyles")) return;
    const style = document.createElement("style");
    style.id = "ramstugaConsentStyles";
    style.textContent = `
      .consent-banner {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 16px;
        z-index: 9999;
        max-width: 860px;
        margin: 0 auto;
        background: #f1ece4;
        color: #2f2720;
        border: 1px solid rgba(47,39,32,0.25);
        border-radius: 12px;
        box-shadow: 0 10px 26px rgba(0,0,0,0.18);
        padding: 14px;
      }
      .consent-banner p {
        margin: 0 0 10px 0;
        line-height: 1.45;
      }
      .consent-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .consent-btn {
        border: 1px solid rgba(47,39,32,0.25);
        background: #fff;
        color: #2f2720;
        border-radius: 10px;
        padding: 8px 12px;
        cursor: pointer;
        font: inherit;
      }
      .consent-btn.primary {
        background: #2f2720;
        color: #fff;
      }
      @media (max-width: 680px) {
        .consent-banner {
          left: 10px;
          right: 10px;
          bottom: 10px;
          padding: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function removeConsentBanner() {
    const banner = document.getElementById("ramstugaConsentBanner");
    if (!banner) return;
    banner.style.display = "none";
    banner.remove();
  }

  function applyConsentChoice(choice) {
    const granted = choice === CONSENT_ACCEPTED;
    removeConsentBanner();
    setConsentChoice(choice);
    updateAnalyticsConsent(granted);
    if (granted) sendManualPageView();
  }

  function showConsentBanner() {
    const currentChoice = getConsentChoice();
    if (currentChoice !== CONSENT_UNKNOWN) return;
    if (document.getElementById("ramstugaConsentBanner")) return;

    ensureConsentStyles();
    const txt = getConsentUiText();
    const banner = document.createElement("section");
    banner.id = "ramstugaConsentBanner";
    banner.className = "consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = `
      <p>${txt.message}</p>
      <div class="consent-actions">
        <button type="button" class="consent-btn primary" data-consent-action="accept">${txt.accept}</button>
        <button type="button" class="consent-btn" data-consent-action="decline">${txt.decline}</button>
      </div>
    `;
    const handleConsentAction = (action) => {
      if (!action) return;
      applyConsentChoice(action === "accept" ? CONSENT_ACCEPTED : CONSENT_REJECTED);
    };

    const acceptBtn = banner.querySelector('[data-consent-action="accept"]');
    const declineBtn = banner.querySelector('[data-consent-action="decline"]');
    acceptBtn?.addEventListener("click", () => handleConsentAction("accept"));
    declineBtn?.addEventListener("click", () => handleConsentAction("decline"));
    document.body.appendChild(banner);
  }

  function initConsentManager() {
    const choice = getConsentChoice();
    if (choice === CONSENT_ACCEPTED) {
      removeConsentBanner();
      updateAnalyticsConsent(true);
      return;
    }
    if (choice === CONSENT_REJECTED) {
      removeConsentBanner();
      updateAnalyticsConsent(false);
      return;
    }
    showConsentBanner();
  }

  function enableGaDebugFromQuery() {
    if (!GA_DEBUG_ENABLED) return;
    if (typeof window.gtag !== "function") {
      console.warn("GA debug requested, but gtag is not available on this page.");
      return;
    }

    updateAnalyticsConsent(true);
    window.gtag("config", GA_MEASUREMENT_ID, { debug_mode: true });
    window.gtag("event", "ga_debug_ping", {
      page_path: window.location.pathname,
      page_location: window.location.href
    });
    console.info("GA debug ping sent. Check GA4 DebugView.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initConsentManager, { once: true });
    document.addEventListener("DOMContentLoaded", enableGaDebugFromQuery, { once: true });
  } else {
    initConsentManager();
    enableGaDebugFromQuery();
  }

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
  document.querySelectorAll("body:not(.page-home) .about-hero-inner").forEach((heroInner) => {
    if (heroInner.querySelector(".page-hero-brand")) return;
    const brand = document.createElement("div");
    brand.className = "hero-brand page-hero-brand typewriter";
    brand.setAttribute("data-text", "RAMSTUGA");
    heroInner.insertBefore(brand, heroInner.firstChild);
  });

  const typeTitles = document.querySelectorAll(".type-title[data-text]");
  const typeTitlesLate = document.querySelectorAll(".type-title-late[data-text]");
  const typeTitlesLate2 = document.querySelectorAll(".type-title-late2[data-text]");
  const typewriterExtras = document.querySelectorAll(
    ".typewriter[data-text]:not(.type-title):not(.type-title-late):not(.type-title-late2)"
  );
  if (typeTitles.length || typeTitlesLate.length || typeTitlesLate2.length || typewriterExtras.length) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const TYPE_SPEED = 90; // shared typing tempo for titles and typewriter text
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

    const typeElement = (el, startDelay = 0, speed = TYPE_SPEED) => {
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

    const homeBrandExtras = Array.from(
      document.querySelectorAll(".page-home .hero-brand.typewriter[data-text]")
    );
    const pageHeroBrands = Array.from(
      document.querySelectorAll(".about-hero-inner .page-hero-brand.typewriter[data-text]")
    );
    const aboutTitleEls = Array.from(
      document.querySelectorAll(".about-hero-inner .about-title.type-title[data-text]")
    );
    const homeTitleEls = Array.from(
      document.querySelectorAll(".page-home .hero-wood-title.type-title[data-text]")
    );
    const otherTypeTitles = Array.from(typeTitles).filter(
      (el) => !homeTitleEls.includes(el) && !aboutTitleEls.includes(el)
    );
    const otherExtras = Array.from(typewriterExtras).filter(
      (el) => !homeBrandExtras.includes(el) && !pageHeroBrands.includes(el)
    );

    let longest = 0;

    // Home sequence: first "RAMSTUGA" near logo, then the big hero headline.
    let longestHomeBrand = 0;
    homeBrandExtras.forEach((el, idx) => {
      const endAt = typeElement(el, 120 + idx * 50, TYPE_SPEED);
      longestHomeBrand = Math.max(longestHomeBrand, endAt);
    });
    if (longestHomeBrand) {
      longest = Math.max(longest, longestHomeBrand);
    }

    const homeTitleDelay = (longestHomeBrand || 0) ? longestHomeBrand + 120 : 150;
    homeTitleEls.forEach((el, idx) => {
      const endAt = typeElement(el, homeTitleDelay + idx * 60, TYPE_SPEED);
      longest = Math.max(longest, endAt);
    });

    // Middle pages: first type top centered brand, then page title.
    let longestPageHeroBrand = 0;
    const pageHeroBrandStart = (longest || 0) ? longest + 180 : 360;
    pageHeroBrands.forEach((el, idx) => {
      const endAt = typeElement(el, pageHeroBrandStart + idx * 70, TYPE_SPEED);
      longestPageHeroBrand = Math.max(longestPageHeroBrand, endAt);
    });
    if (longestPageHeroBrand) {
      longest = Math.max(longest, longestPageHeroBrand);
    }

    const aboutTitleDelay = (longestPageHeroBrand || 0) ? longestPageHeroBrand + 120 : ((longest || 0) ? longest + 120 : 150);
    aboutTitleEls.forEach((el, idx) => {
      const endAt = typeElement(el, aboutTitleDelay + idx * 60, TYPE_SPEED);
      longest = Math.max(longest, endAt);
    });

    const otherTitleDelay = (longest || 0) ? longest + 120 : 150;
    otherTypeTitles.forEach((el, idx) => {
      const endAt = typeElement(el, otherTitleDelay + idx * 60, TYPE_SPEED);
      longest = Math.max(longest, endAt);
    });

    const lateDelay = (longest || 0) + 250;
    let longestLate = 0;
    typeTitlesLate.forEach((el, idx) => {
      const endAt = typeElement(el, lateDelay + idx * 60, TYPE_SPEED);
      longestLate = Math.max(longestLate, endAt);
    });

    const late2Delay = (longestLate || lateDelay) + 250;
    let longestLate2 = 0;
    typeTitlesLate2.forEach((el, idx) => {
      const endAt = typeElement(el, late2Delay + idx * 60, TYPE_SPEED);
      longestLate2 = Math.max(longestLate2, endAt);
    });

    const extrasDelay = (longestLate2 || late2Delay) + 250;
    otherExtras.forEach((el, idx) => {
      typeElement(el, extrasDelay + idx * 60, TYPE_SPEED);
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
    window.addEventListener("load", scheduleEvaluate);

    window.addEventListener("resize", scheduleEvaluate, { passive: true });
    window.addEventListener("orientationchange", scheduleEvaluate);

    const ro = new ResizeObserver(scheduleEvaluate);
    ro.observe(heroInner);
    ro.observe(plaque);
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
    const PAYPAL_URL = "https://www.paypal.com/ncp/payment/ZKYKA5JWNBYBJ";
    const PAYPAL_ME_URL = "https://paypal.me/Ramstuga";
    const SWISH_INSTRUCTION = "Swish: lägg till din referens i meddelandet:"; // tekstje, optioneel

    // Standaard assortiment (pas aan / breid uit)
    const langKey = docLang.startsWith("en") ? "en" : docLang.startsWith("nl") ? "nl" : "sv";
    const PRODUCT_CATALOG = {
      nl: [
        { id: "std-30x40-licht",   title: "Standaardlijst Licht",   size: "30×40 cm", price: 49.00, img: "/images/shop/lijst-licht.png",   note: "Scandinavisch licht.", orientationOption: true },
        { id: "std-40x50-naturel", title: "Standaardlijst Naturel", size: "40×50 cm", price: 59.00, img: "/images/shop/lijst-naturel.png", note: "Rustiek naturel.", orientationOption: true },
        { id: "std-50x70-donker",  title: "Standaardlijst Donker",  size: "50×70 cm", price: 89.00, img: "/images/shop/lijst-donker.png",  note: "Diep donker, luxe.", orientationOption: true },
        { id: "std-40x40-grijs",   title: "Standaardlijst Grijs",   size: "40×40 cm", price: 64.00, img: "/images/shop/lijst-grijs.png",   note: "Verweerd grijs." },
        { id: "std-30x40-grenen-custom", title: "Standaardlijst Grenen", size: "30×40 cm", price: 69.00, img: "/images/portfolio/standaard-grenen.png", note: "Kies zelf je kleur. Handgemaakt grenen met rustige nerf.", customColor: true, orientationOption: true },
        { id: "std-40x40-grenen-custom", title: "Standaardlijst Grenen", size: "40×40 cm", price: 79.00, img: "/images/portfolio/standaard-grenen.png", note: "Kies zelf je kleur. Handgemaakt grenen met rustige nerf.", customColor: true },
        { id: "std-40x50-grenen-custom", title: "Standaardlijst Grenen", size: "40×50 cm", price: 89.00, img: "/images/portfolio/standaard-grenen.png", note: "Kies zelf je kleur. Handgemaakt grenen met rustige nerf.", customColor: true, orientationOption: true },
        {
          id: "ring-lijst-custom",
          title: "Ring lijst",
          size: "40×40 cm",
          price: 98.00,
          img: "/images/portfolio/dark-oak-rings.png",
          note: "Ring lijst met kleur opties. Maten: 30×30, 30×40 en 40×40 cm. Afwijkende maat? Gebruik maatwerk.",
          customColor: true,
          colorOptions: ["Naturel", "Licht", "Donker", "Grijs verweerd", "Dark oak"],
          sizeOptions: [
            { value: "30x30", label: "30×30 cm" },
            { value: "30x40", label: "30×40 cm" },
            { value: "40x40", label: "40×40 cm" },
            { value: "__custom__", label: "Afwijkende maat (maatwerk)" }
          ],
          orientationOption: true
        },
        {
          id: "project-hekjes",
          title: "Rustieke projectlijst Donker",
          size: "30×40 cm",
          price: 119.00,
          img: "/images/portfolio/hekjes-lijst-donker.png",
          note: "Handgemaakt uit oud tuinhekje. Duurzaam hergebruik met karakter.",
          customColor: true,
          colorOptions: ["Naturel", "Licht", "Donker", "Grijs verweerd", "Dark oak"]
        }
      ],
      en: [
        { id: "std-30x40-licht",   title: "Standard Frame Light",   size: "30×40 cm", price: 49.00, img: "/images/shop/lijst-licht.png",   note: "Scandinavian light.", orientationOption: true },
        { id: "std-40x50-naturel", title: "Standard Frame Natural", size: "40×50 cm", price: 59.00, img: "/images/shop/lijst-naturel.png", note: "Rustic natural.", orientationOption: true },
        { id: "std-50x70-donker",  title: "Standard Frame Dark",    size: "50×70 cm", price: 89.00, img: "/images/shop/lijst-donker.png",  note: "Deep dark, luxury.", orientationOption: true },
        { id: "std-40x40-grijs",   title: "Standard Frame Grey",    size: "40×40 cm", price: 64.00, img: "/images/shop/lijst-grijs.png",   note: "Weathered grey." },
        { id: "std-30x40-grenen-custom", title: "Standard Pine Frame", size: "30×40 cm", price: 69.00, img: "/images/portfolio/standaard-grenen.png", note: "Choose your own color. Handmade pine with calm grain.", customColor: true, orientationOption: true },
        { id: "std-40x40-grenen-custom", title: "Standard Pine Frame", size: "40×40 cm", price: 79.00, img: "/images/portfolio/standaard-grenen.png", note: "Choose your own color. Handmade pine with calm grain.", customColor: true },
        { id: "std-40x50-grenen-custom", title: "Standard Pine Frame", size: "40×50 cm", price: 89.00, img: "/images/portfolio/standaard-grenen.png", note: "Choose your own color. Handmade pine with calm grain.", customColor: true, orientationOption: true },
        {
          id: "ring-lijst-custom",
          title: "Ring lijst",
          size: "40×40 cm",
          price: 98.00,
          img: "/images/portfolio/dark-oak-rings.png",
          note: "Ring lijst with color options. Sizes: 30×30, 30×40 and 40×40 cm. Need a different size? Use custom.",
          customColor: true,
          colorOptions: ["Natural", "Light", "Dark", "Weathered grey", "Dark oak"],
          sizeOptions: [
            { value: "30x30", label: "30×30 cm" },
            { value: "30x40", label: "30×40 cm" },
            { value: "40x40", label: "40×40 cm" },
            { value: "__custom__", label: "Different size (custom)" }
          ],
          orientationOption: true
        },
        {
          id: "project-hekjes",
          title: "Rustic Project Frame Dark",
          size: "30×40 cm",
          price: 119.00,
          img: "/images/portfolio/hekjes-lijst-donker.png",
          note: "Handmade from an old garden fence. Sustainable reuse with character.",
          customColor: true,
          colorOptions: ["Natural", "Light", "Dark", "Weathered grey", "Dark oak"]
        }
      ],
      sv: [
        { id: "std-30x40-licht",   title: "Standardram Ljus",     size: "30×40 cm", price: 49.00, img: "/images/shop/lijst-licht.png",   note: "Skandinaviskt ljus.", orientationOption: true },
        { id: "std-40x50-naturel", title: "Standardram Naturell", size: "40×50 cm", price: 59.00, img: "/images/shop/lijst-naturel.png", note: "Rustikt naturell.", orientationOption: true },
        { id: "std-50x70-donker",  title: "Standardram Mörk",     size: "50×70 cm", price: 89.00, img: "/images/shop/lijst-donker.png",  note: "Djup mörk, lyx.", orientationOption: true },
        { id: "std-40x40-grijs",   title: "Standardram Grå",      size: "40×40 cm", price: 64.00, img: "/images/shop/lijst-grijs.png",   note: "Väderbiten grå." },
        { id: "std-30x40-grenen-custom", title: "Standardram Furu", size: "30×40 cm", price: 69.00, img: "/images/portfolio/standaard-grenen.png", note: "Välj färg själv. Handgjord furu med lugn ådring.", customColor: true, orientationOption: true },
        { id: "std-40x40-grenen-custom", title: "Standardram Furu", size: "40×40 cm", price: 79.00, img: "/images/portfolio/standaard-grenen.png", note: "Välj färg själv. Handgjord furu med lugn ådring.", customColor: true },
        { id: "std-40x50-grenen-custom", title: "Standardram Furu", size: "40×50 cm", price: 89.00, img: "/images/portfolio/standaard-grenen.png", note: "Välj färg själv. Handgjord furu med lugn ådring.", customColor: true, orientationOption: true },
        {
          id: "ring-lijst-custom",
          title: "Ring lijst",
          size: "40×40 cm",
          price: 98.00,
          img: "/images/portfolio/dark-oak-rings.png",
          note: "Ring lijst med färgalternativ. Storlekar: 30×30, 30×40 och 40×40 cm. Behöver du annan storlek? Använd måttbeställt.",
          customColor: true,
          colorOptions: ["Naturell", "Ljus", "Mörk", "Väderbiten grå", "Mörk ek"],
          sizeOptions: [
            { value: "30x30", label: "30×30 cm" },
            { value: "30x40", label: "30×40 cm" },
            { value: "40x40", label: "40×40 cm" },
            { value: "__custom__", label: "Annan storlek (måttbeställt)" }
          ],
          orientationOption: true
        },
        {
          id: "project-hekjes",
          title: "Rustik projektram Mörk",
          size: "30×40 cm",
          price: 119.00,
          img: "/images/portfolio/hekjes-lijst-donker.png",
          note: "Handgjord av ett gammalt trädgårdsstaket. Hållbart återbruk med karaktär.",
          customColor: true,
          colorOptions: ["Naturell", "Ljus", "Mörk", "Väderbiten grå", "Mörk ek"]
        }
      ]
    };
    const PRODUCTS = PRODUCT_CATALOG[langKey] || PRODUCT_CATALOG.sv;
    const ADD_LABEL = langKey === "en" ? "Add to cart" : langKey === "nl" ? "Voeg toe" : "Lägg till";
    const COLOR_LABEL = langKey === "en" ? "Color" : langKey === "nl" ? "Kleur" : "Färg";
    const SIZE_LABEL = langKey === "en" ? "Size" : langKey === "nl" ? "Maat" : "Storlek";
    const COLOR_PLACEHOLDER = langKey === "en" ? "Enter preferred color" : langKey === "nl" ? "Vul gewenste kleur in" : "Ange önskad färg";
    const COLOR_SELECT_PLACEHOLDER = langKey === "en" ? "Choose a color" : langKey === "nl" ? "Kies een kleur" : "Välj en färg";
    const COLOR_REQUIRED_MSG = langKey === "en" ? "Please enter a color first." : langKey === "nl" ? "Vul eerst een kleur in." : "Ange färg först.";
    const SIZE_CUSTOM_VALUE = "__custom__";
    const CUSTOM_PAGE_URL = langKey === "en" ? "/en/maatwerk.html" : langKey === "nl" ? "/nl/maatwerk.html" : "/sv/maatwerk.html";
    const ORIENTATION_LABEL = langKey === "en" ? "Orientation" : langKey === "nl" ? "Oriëntatie" : "Orientering";
    const ORIENTATION_VERTICAL = langKey === "en" ? "Vertical" : langKey === "nl" ? "Verticaal" : "Vertikal";
    const ORIENTATION_HORIZONTAL = langKey === "en" ? "Horizontal" : langKey === "nl" ? "Horizontaal" : "Horisontell";
    const REMOVE_LABEL = langKey === "en" ? "Remove" : langKey === "nl" ? "Verwijder" : "Ta bort";
    const SHOP_TEXT = {
      nl: {
        qty: "Aantal",
        customQuote: "Maatwerk (offerte)",
        copyRefCopied: "Bestelreferentie gekopieerd: ",
        copyRefFallback: "Bestelreferentie: ",
        emptyCartAlert: "Je winkelwagen is leeg (standaardproducten).",
        orderTitle: "Bestelling – RAMSTUGA",
        paidVia: "Betaald via: PayPal (kaart of PayPal)",
        orderRef: "Bestelreferentie: ",
        price: "Prijs",
        subtotal: "Subtotaal",
        shipping: "Verzending",
        total: "Totaal",
        name: "Naam:",
        address: "Adres:",
        phoneOptional: "Telefoon (optioneel):",
        notes: "Opmerkingen:",
        subjectPrefix: "Bestelling – RAMSTUGA (",
        confirmClearCart: "Winkelwagen leegmaken?"
      },
      en: {
        qty: "Quantity",
        customQuote: "Custom (quote)",
        copyRefCopied: "Order reference copied: ",
        copyRefFallback: "Order reference: ",
        emptyCartAlert: "Your cart is empty (standard products).",
        orderTitle: "Order – RAMSTUGA",
        paidVia: "Paid via: PayPal (card or PayPal)",
        orderRef: "Order reference: ",
        price: "Price",
        subtotal: "Subtotal",
        shipping: "Shipping",
        total: "Total",
        name: "Name:",
        address: "Address:",
        phoneOptional: "Phone (optional):",
        notes: "Notes:",
        subjectPrefix: "Order – RAMSTUGA (",
        confirmClearCart: "Clear cart?"
      },
      sv: {
        qty: "Antal",
        customQuote: "Måttbeställt (offert)",
        copyRefCopied: "Orderreferens kopierad: ",
        copyRefFallback: "Orderreferens: ",
        emptyCartAlert: "Din varukorg är tom (standardprodukter).",
        orderTitle: "Beställning – RAMSTUGA",
        paidVia: "Betald via: PayPal (kort eller PayPal)",
        orderRef: "Orderreferens: ",
        price: "Pris",
        subtotal: "Delsumma",
        shipping: "Frakt",
        total: "Totalt",
        name: "Namn:",
        address: "Adress:",
        phoneOptional: "Telefon (valfritt):",
        notes: "Kommentarer:",
        subjectPrefix: "Beställning – RAMSTUGA (",
        confirmClearCart: "Töm varukorgen?"
      }
    };
    const T = SHOP_TEXT[langKey] || SHOP_TEXT.sv;
    const PROJECT_PRODUCTS = {
      "project-hekjes": {
        nl: { id: "project-hekjes", title: "Rustieke projectlijst Donker", size: "30×40 cm", price: 119.00 },
        en: { id: "project-hekjes", title: "Rustic Project Frame Dark", size: "30×40 cm", price: 119.00 },
        sv: { id: "project-hekjes", title: "Rustik projektram Mörk", size: "30×40 cm", price: 119.00 }
      }
    };

    // Verzendkosten op basis van bestemming (prijzen in EUR-basis)
    const SHIP_REGION_KEY = "ramstuga_ship_region";
    const SHIPPING_COST_BY_REGION_EUR = {
      sweden: 10.35,
      eu: 20.00
    };

    function getSelectedShippingRegion() {
      const select = document.getElementById("shippingRegion");
      const raw = String(select?.value || "eu").toLowerCase();
      return raw === "sweden" ? "sweden" : "eu";
    }

    function shippingCostInCurrentCurrency() {
      const region = getSelectedShippingRegion();
      const baseEur = SHIPPING_COST_BY_REGION_EUR[region] ?? SHIPPING_COST_BY_REGION_EUR.eu;
      return convertAmount(baseEur, "EUR", currentCurrency);
    }

    function initShippingRegion() {
      const select = document.getElementById("shippingRegion");
      if (!select) return;

      const stored = String(localStorage.getItem(SHIP_REGION_KEY) || "").toLowerCase();
      if (stored === "sweden" || stored === "eu") {
        select.value = stored;
      } else {
        select.value = "eu";
      }

      select.addEventListener("change", () => {
        localStorage.setItem(SHIP_REGION_KEY, getSelectedShippingRegion());
        renderCart();
      });
    }

    function moneyEUR(n) {
      const v = Number(n) || 0;
      return v.toLocaleString(locale, { style: "currency", currency: currentCurrency });
    }

    function round2(n) {
      return Number((Number(n) || 0).toFixed(2));
    }

    function buildCustomPageUrl(product, opts = {}) {
      const url = new URL(CUSTOM_PAGE_URL, window.location.origin);
      const name = String(product?.title || "").trim();
      const image = String(product?.img || "").trim();
      const size = String(opts?.sizeLabel || "").trim();
      const color = String(opts?.color || "").trim();
      const orientation = String(opts?.orientation || "").trim();
      if (name) url.searchParams.set("from_shop_name", name);
      if (image) url.searchParams.set("from_shop_img", image);
      if (size) url.searchParams.set("from_shop_size", size);
      if (color) url.searchParams.set("from_shop_color", color);
      if (orientation) url.searchParams.set("from_shop_orientation", orientation);
      return `${url.pathname}${url.search}`;
    }

    function trackGaEvent(name, params = {}) {
      if (typeof window.gtag !== "function") return;
      window.gtag("event", name, params);
    }

    function gaItemFromProduct(product, qty = 1, variant = "") {
      return {
        item_id: product.id,
        item_name: product.title,
        item_variant: variant || product.size,
        item_category: "frame",
        price: round2(convertAmount(product.price, "EUR", currentCurrency)),
        quantity: Math.max(1, Number(qty) || 1)
      };
    }

    function gaItemsFromCart(items) {
      return (items || [])
        .filter((it) => it?.type === "product")
        .map((it) => ({
          item_id: it?.id || "unknown_item",
          item_name: it?.title || "Item",
          item_category: "frame",
          price: round2(itemUnitPrice(it)),
          quantity: Math.max(1, Number(it?.qty) || 1)
        }));
    }

    let viewCartTracked = false;
    let beginCheckoutTracked = false;

    function escapeHtml(str) {
      return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function addToCart(product, opts = {}) {
      const unitPrice = convertAmount(product.price, "EUR", currentCurrency);
      const cart = getCart();
      const colorValue = String(opts?.color || "").trim();
      const colorKey = colorValue.toLowerCase();
      const selectedSizeValue = String(opts?.size || "").trim();
      const selectedSizeLabel = String(opts?.sizeLabel || "").trim() || product.size;
      const sizeKey = selectedSizeValue.toLowerCase() || selectedSizeLabel.toLowerCase();
      const orientationValue = String(opts?.orientation || "").trim();
      const orientationKey = orientationValue.toLowerCase();
      const sizeSuffix = selectedSizeLabel ? ` (${selectedSizeLabel})` : "";
      const colorSuffix = colorValue ? ` • ${COLOR_LABEL}: ${colorValue}` : "";
      const orientationSuffix = orientationValue ? ` • ${ORIENTATION_LABEL}: ${orientationValue}` : "";
      const lineId = `${product.id}::${sizeKey || "-"}::${colorKey || "-"}::${orientationKey || "-"}`;
      const idx = cart.findIndex(it => (it?.lineId || it?.id) === lineId);
      if (idx >= 0) {
        cart[idx].qty = (Number(cart[idx].qty) || 0) + 1;
      } else {
        cart.push({
          id: product.id,
          lineId,
          type: "product",
          title: `${product.title}${sizeSuffix}${colorSuffix}${orientationSuffix}`,
          qty: 1,
          price: unitPrice,
          currency: currentCurrency
        });
      }
      setCart(cart);
      renderCart();

      trackGaEvent("add_to_cart", {
        currency: currentCurrency,
        value: round2(unitPrice),
        items: [gaItemFromProduct(product, 1, selectedSizeLabel)]
      });
    }

    function updateQty(lineId, qty) {
      const cart = getCart();
      const idx = cart.findIndex(it => (it?.lineId || it?.id) === lineId);
      if (idx < 0) return;
      cart[idx].qty = Math.max(1, Number(qty) || 1);
      setCart(cart);
      renderCart();
    }

    function removeItem(lineId) {
      const existing = getCart().find((it) => (it?.lineId || it?.id) === lineId);
      if (existing?.type === "product") {
        const removedQty = Math.max(1, Number(existing?.qty) || 1);
        trackGaEvent("remove_from_cart", {
          currency: currentCurrency,
          value: round2(itemUnitPrice(existing) * removedQty),
          items: [{
            item_id: existing?.id || "unknown_item",
            item_name: existing?.title || "Item",
            item_category: "frame",
            price: round2(itemUnitPrice(existing)),
            quantity: removedQty
          }]
        });
      }

      const cart = getCart().filter((it) => (it?.lineId || it?.id) !== lineId);
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
        <article class="card product-card" data-product-id="${escapeHtml(p.id)}">
          <div class="product-media" aria-hidden="true">
            <img src="${p.img}" alt="" loading="lazy">
          </div>
          <div class="pad">
            <h3>${escapeHtml(p.title)}</h3>
            <div class="subtle">${escapeHtml(p.size)}</div>
            <p style="margin-top:10px;">${escapeHtml(p.note)}</p>
            ${Array.isArray(p.sizeOptions) && p.sizeOptions.length ? `
              <label style="display:block;margin-top:8px;">
                <span class="subtle">${escapeHtml(SIZE_LABEL)}</span>
                <select data-size-for="${escapeHtml(p.id)}">
                  ${p.sizeOptions.map((opt) => {
                    const val = typeof opt === "string" ? opt : String(opt?.value || "");
                    const lbl = typeof opt === "string" ? opt : String(opt?.label || opt?.value || "");
                    const isSelected = lbl === p.size;
                    return `<option value="${escapeHtml(val)}" ${isSelected ? "selected" : ""}>${escapeHtml(lbl)}</option>`;
                  }).join("")}
                </select>
              </label>
            ` : ""}
            ${p.orientationOption ? `
              <label style="display:block;margin-top:8px;">
                <span class="subtle">${escapeHtml(ORIENTATION_LABEL)}</span>
                <select data-orientation-for="${escapeHtml(p.id)}">
                  <option value="${escapeHtml(ORIENTATION_VERTICAL)}">${escapeHtml(ORIENTATION_VERTICAL)}</option>
                  <option value="${escapeHtml(ORIENTATION_HORIZONTAL)}">${escapeHtml(ORIENTATION_HORIZONTAL)}</option>
                </select>
              </label>
            ` : ""}
            ${p.customColor ? `
              <label style="display:block;margin-top:8px;">
                <span class="subtle">${escapeHtml(COLOR_LABEL)}</span>
                ${Array.isArray(p.colorOptions) && p.colorOptions.length ? `
                  <select data-color-for="${escapeHtml(p.id)}">
                    <option value="">${escapeHtml(COLOR_SELECT_PLACEHOLDER)}</option>
                    ${p.colorOptions.map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("")}
                  </select>
                ` : `
                  <input type="text" data-color-for="${escapeHtml(p.id)}" placeholder="${escapeHtml(COLOR_PLACEHOLDER)}">
                `}
              </label>
            ` : ""}
            <div class="product-actions">
              <strong>${moneyEUR(convertAmount(p.price, "EUR", currentCurrency))}</strong>
              <button class="btn primary" type="button" ${p.customColor ? `data-add-custom="${escapeHtml(p.id)}"` : `data-add="${escapeHtml(p.id)}"`}>${ADD_LABEL}</button>
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
              ${it?.type === "maatwerk" ? T.customQuote : moneyEUR(itemUnitPrice(it))} •
              ${T.qty}:
              <input class="cart-qty" type="number" min="1" value="${Number(it?.qty) || 1}" data-qty="${escapeHtml(it?.lineId || it?.id)}">
            </div>
          </div>
          <div class="cart-item-end">
            <strong>${moneyEUR(itemUnitPrice(it) * (Number(it?.qty) || 0))}</strong>
            <button class="btn" type="button" data-remove="${escapeHtml(it?.lineId || it?.id)}">${REMOVE_LABEL}</button>
          </div>
        </div>
      `).join("");

      const subtotalAll = subtotal(items);
      const hasProducts = items.some(it => it?.type === "product");
      const shipping = hasProducts ? shippingCostInCurrentCurrency() : 0;
      const total = subtotalAll + shipping;

      subEl.textContent = moneyEUR(subtotalAll);
      if (shipEl) shipEl.textContent = moneyEUR(shipping);
      if (totalEl) totalEl.textContent = moneyEUR(total);
      if (payAmountEl) payAmountEl.textContent = moneyEUR(total);
      updatePaymentLinks();

      if (!viewCartTracked && hasProducts) {
        viewCartTracked = true;
        trackGaEvent("view_cart", {
          currency: currentCurrency,
          value: round2(subtotalAll),
          items: gaItemsFromCart(items)
        });
      }
    }

    function trackBeginCheckout(source) {
      if (beginCheckoutTracked) return;
      const prodItems = getCart().filter((it) => it?.type === "product");
      if (!prodItems.length) return;

      const prodSubtotal = subtotal(prodItems);
      const shipping = prodSubtotal > 0 ? shippingCostInCurrentCurrency() : 0;
      const total = prodSubtotal + shipping;

      beginCheckoutTracked = true;
      trackGaEvent("begin_checkout", {
        currency: currentCurrency,
        value: round2(total),
        shipping: round2(shipping),
        checkout_source: source,
        items: gaItemsFromCart(prodItems)
      });
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
    const paypalMeLink = document.getElementById("paypalMeLink");
    function getCheckoutTotal() {
      const prodItems = getCart().filter((it) => it?.type === "product");
      const prodSubtotal = subtotal(prodItems);
      const shipping = prodSubtotal > 0 ? shippingCostInCurrentCurrency() : 0;
      return prodSubtotal + shipping;
    }

    function updatePaymentLinks() {
      if (paypalLink) paypalLink.href = PAYPAL_URL;
      if (paypalMeLink) {
        const amountNum = getCheckoutTotal();
        const amount = amountNum > 0 ? `/${amountNum.toFixed(2)}` : "";
        paypalMeLink.href = `${PAYPAL_ME_URL}${amount}`;
      }
    }

    updatePaymentLinks();

    if (paypalLink) {
      paypalLink.addEventListener("click", () => {
        const prodItems = getCart().filter((it) => it?.type === "product");
        if (!prodItems.length) return;

        const prodSubtotal = subtotal(prodItems);
        const shipping = prodSubtotal > 0 ? shippingCostInCurrentCurrency() : 0;
        const total = prodSubtotal + shipping;

        trackBeginCheckout("paypal_link");
        trackGaEvent("add_payment_info", {
          currency: currentCurrency,
          value: round2(total),
          payment_type: "paypal",
          items: gaItemsFromCart(prodItems)
        });
      });
    }

    if (paypalMeLink) {
      paypalMeLink.addEventListener("click", () => {
        const prodItems = getCart().filter((it) => it?.type === "product");
        if (!prodItems.length) return;

        const prodSubtotal = subtotal(prodItems);
        const shipping = prodSubtotal > 0 ? shippingCostInCurrentCurrency() : 0;
        const total = prodSubtotal + shipping;

        trackBeginCheckout("paypal_me_link");
        trackGaEvent("add_payment_info", {
          currency: currentCurrency,
          value: round2(total),
          payment_type: "paypal_me",
          items: gaItemsFromCart(prodItems)
        });
      });
    }
    // Bestelreferentie hint (optioneel)
    const refHint = document.getElementById("swishHint");
    if (refHint) refHint.textContent = `${PAYPAL_NOTE_TEXT} ${paymentRef}`;

    // Copy reference
    document.getElementById("copyRefBtn")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(paymentRef);
        alert(T.copyRefCopied + paymentRef);
      } catch {
        alert(T.copyRefFallback + paymentRef);
      }
    });

    // Mail after payment (standard products only)
      document.getElementById("paidMailBtn")?.addEventListener("click", () => {
      const prodItems = getCart().filter(it => it?.type === "product");
      if (!prodItems.length) return alert(T.emptyCartAlert);

      trackBeginCheckout("paid_mail_button");
      trackGaEvent("generate_lead", {
        currency: currentCurrency,
        value: round2(subtotal(prodItems)),
        lead_type: "order_email_after_payment"
      });

      const prodSubtotal = subtotal(prodItems);
      const shipping = prodSubtotal > 0 ? shippingCostInCurrentCurrency() : 0;
      const total = prodSubtotal + shipping;

      const lines = [];
      lines.push(T.orderTitle);
      lines.push("");
      lines.push(T.paidVia);
      lines.push(T.orderRef + paymentRef);
      lines.push("");

      prodItems.forEach((it, i) => {
        lines.push(`${i + 1}. ${it.title}`);
        lines.push(`   ${T.qty}: ${it.qty}`);
        lines.push(`   ${T.price}: ${moneyEUR(itemUnitPrice(it))}`);
        lines.push("");
      });

      lines.push(`${T.subtotal}: ${moneyEUR(prodSubtotal)}`);
      lines.push(`${T.shipping}: ${moneyEUR(shipping)}`);
      lines.push(`${T.total}: ${moneyEUR(total)}`);
      lines.push("");
      lines.push(T.name);
      lines.push(T.address);
      lines.push(T.phoneOptional);
      lines.push(T.notes);

      const subject = encodeURIComponent(T.subjectPrefix + paymentRef + ")");
      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = `mailto:info@ramstuga.se?subject=${subject}&body=${body}`;
    });

    // Clear cart
    document.getElementById("clearCartBtn")?.addEventListener("click", () => {
      if (confirm(T.confirmClearCart)) {
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
        if (p) {
          const card = e.target.closest(".product-card");
          const sizeSelect = card ? card.querySelector(`[data-size-for="${addId}"]`) : null;
          const selectedSizeValue = String(sizeSelect?.value || "").trim();
          const selectedSizeLabel = String(sizeSelect?.selectedOptions?.[0]?.textContent || "").trim();
          const colorField = card ? card.querySelector(`[data-color-for="${addId}"]`) : null;
          const colorValue = String(colorField?.value || "").trim();
          const orientationSelect = card ? card.querySelector(`[data-orientation-for="${addId}"]`) : null;
          const orientationValue = String(orientationSelect?.value || "").trim();
          if (selectedSizeValue === SIZE_CUSTOM_VALUE) {
            window.location.href = buildCustomPageUrl(p, {
              sizeLabel: selectedSizeLabel,
              color: colorValue,
              orientation: orientationValue
            });
            return;
          }
          addToCart(p, { size: selectedSizeValue, sizeLabel: selectedSizeLabel, orientation: orientationValue });
        }
        return;
      }
      const addCustomId = e.target?.getAttribute?.("data-add-custom");
      if (addCustomId) {
        const p = PRODUCTS.find(x => x.id === addCustomId);
        if (!p) return;
        const card = e.target.closest(".product-card");
        const sizeSelect = card ? card.querySelector(`[data-size-for="${addCustomId}"]`) : null;
        const selectedSizeValue = String(sizeSelect?.value || "").trim();
        const selectedSizeLabel = String(sizeSelect?.selectedOptions?.[0]?.textContent || "").trim();
        const colorField = card ? card.querySelector(`[data-color-for="${addCustomId}"]`) : null;
        const orientationSelect = card ? card.querySelector(`[data-orientation-for="${addCustomId}"]`) : null;
        const colorValue = String(colorField?.value || "").trim();
        const orientationValue = String(orientationSelect?.value || "").trim();
        if (selectedSizeValue === SIZE_CUSTOM_VALUE) {
          window.location.href = buildCustomPageUrl(p, {
            sizeLabel: selectedSizeLabel,
            color: colorValue,
            orientation: orientationValue
          });
          return;
        }
        if (!colorValue) {
          alert(COLOR_REQUIRED_MSG);
          colorField?.focus();
          return;
        }
        addToCart(p, { size: selectedSizeValue, sizeLabel: selectedSizeLabel, color: colorValue, orientation: orientationValue });
        return;
      }
      const remId = e.target?.getAttribute?.("data-remove");
      if (remId) removeItem(remId);
    });

    document.addEventListener("input", (e) => {
      const id = e.target?.getAttribute?.("data-qty");
      if (id) updateQty(id, e.target.value);
    });

    document.addEventListener("change", (e) => {
      const sizeFor = e.target?.getAttribute?.("data-size-for");
      if (!sizeFor) return;
      if (String(e.target?.value || "").trim() === SIZE_CUSTOM_VALUE) {
        const p = PRODUCTS.find((x) => x.id === sizeFor);
        const card = e.target.closest(".product-card");
        const selectedSizeLabel = String(e.target?.selectedOptions?.[0]?.textContent || "").trim();
        const colorField = card ? card.querySelector(`[data-color-for="${sizeFor}"]`) : null;
        const orientationSelect = card ? card.querySelector(`[data-orientation-for="${sizeFor}"]`) : null;
        const colorValue = String(colorField?.value || "").trim();
        const orientationValue = String(orientationSelect?.value || "").trim();
        if (p) {
          window.location.href = buildCustomPageUrl(p, {
            sizeLabel: selectedSizeLabel,
            color: colorValue,
            orientation: orientationValue
          });
        } else {
          window.location.href = CUSTOM_PAGE_URL;
        }
      }
    });

    document.querySelectorAll('a[href="#pay"]').forEach((link) => {
      link.addEventListener("click", () => {
        trackBeginCheckout("pay_anchor");
      });
    });

    function addProductFromQuery() {
      const url = new URL(window.location.href);
      const addId = url.searchParams.get("add");
      if (!addId) return;

      const productFromCatalog = PRODUCTS.find((p) => p.id === addId);
      const projectSet = PROJECT_PRODUCTS[addId];
      const projectProduct = projectSet ? (projectSet[langKey] || projectSet.sv) : null;
      const product = productFromCatalog || projectProduct;
      if (product) addToCart(product);

      url.searchParams.delete("add");
      const nextSearch = url.searchParams.toString();
      const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash || ""}`;
      window.history.replaceState({}, "", nextUrl);
    }

    function focusProductFromQuery() {
      const url = new URL(window.location.href);
      const focusId = String(url.searchParams.get("focus") || "").trim();
      if (!focusId) return;

      const card = document.querySelector(`[data-product-id="${CSS.escape(focusId)}"]`);
      if (!card) return;

      const header = document.querySelector(".site-header");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const top = window.scrollY + card.getBoundingClientRect().top - headerHeight - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      const previousBoxShadow = card.style.boxShadow;
      card.style.boxShadow = "0 0 0 3px rgba(163, 94, 58, 0.45)";
      setTimeout(() => {
        card.style.boxShadow = previousBoxShadow;
      }, 1800);
      setTimeout(() => {
        const correctedTop = window.scrollY + card.getBoundingClientRect().top - headerHeight - 16;
        window.scrollTo({ top: Math.max(0, correctedTop), behavior: "smooth" });
      }, 250);
    }

    // Init
    renderProducts();
    initShippingRegion();
    focusProductFromQuery();
    addProductFromQuery();
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
      ".gallery img, .project-pair-gallery img, .shop-help-media img, .product-media img, .shop-hero-plaque img, .shop-hero-media img, .about-frame img"
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
  document.querySelectorAll(".gallery a.shot, .project-pair-gallery a.shot").forEach((a) => {
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
