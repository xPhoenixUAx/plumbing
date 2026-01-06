(() => {
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");

  if (nav && toggle) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.contains("is-open");
      setOpen(!isOpen);
    });

    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("is-open")) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (nav.contains(target) || toggle.contains(target)) return;
      setOpen(false);
    });

    nav.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.matches("a")) setOpen(false);
    });
  }

  // Active nav link
  (() => {
    const path = location.pathname.split("/").pop() || "index.html";
    const links = document.querySelectorAll(".site-nav a.nav-link");
    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      const normalized = href.split("/").pop();
      if (normalized === path) a.setAttribute("aria-current", "page");
    });
  })();

  // Footer year
  (() => {
    const year = document.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());
  })();

  // Contact form (demo)
  (() => {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const status = form.querySelector("[data-form-status]");
    const phone = form.querySelector('input[name="phone"]');

    const setStatus = (msg, kind) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.toggle("is-ok", kind === "ok");
      status.classList.toggle("is-bad", kind === "bad");
    };

    const digitsCount = (value) => (value.match(/\d/g) || []).length;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const name = String(formData.get("name") || "").trim();
      const phoneValue = String(formData.get("phone") || "").trim();

      if (!name) {
        setStatus("Please enter your name.", "bad");
        return;
      }

      if (!phoneValue || digitsCount(phoneValue) < 7) {
        setStatus("Please check the phone number (at least 7 digits).", "bad");
        if (phone instanceof HTMLInputElement) phone.focus();
        return;
      }

      setStatus("Thanks! Your request was saved locally (demo).", "ok");

      // Demo: store last submission locally
      try {
        const payload = Object.fromEntries(formData.entries());
        localStorage.setItem(
          "plumbing:lastLead",
          JSON.stringify({
            ...payload,
            at: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }

      form.reset();
    });

    // Light input hinting
    if (phone instanceof HTMLInputElement) {
      phone.addEventListener("input", () => {
        if (!status) return;
        if (!status.textContent) return;
        if (digitsCount(phone.value) >= 7) setStatus("", "");
      });
    }
  })();

  // Cookie consent banner
  (() => {
    const CONSENT_COOKIE = "cookie_consent";

    const getCookie = (name) => {
      const cookies = document.cookie ? document.cookie.split(";") : [];
      for (const item of cookies) {
        const [rawKey, ...rest] = item.split("=");
        const key = (rawKey || "").trim();
        if (key !== name) continue;
        return decodeURIComponent(rest.join("=") || "");
      }
      return "";
    };

    const setCookie = (name, value, days) => {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${encodeURIComponent(
        value
      )}; Expires=${expires}; Path=/; SameSite=Lax`;
    };

    const existing = getCookie(CONSENT_COOKIE);
    if (existing === "accepted" || existing === "declined") return;

    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie preferences");
    banner.innerHTML = `
      <div class="cookie-banner-inner">
        <p class="cookie-banner-text">
          We use cookies to remember your preferences and improve this website.
          You can accept or decline optional cookies. Read our
          <a href="cookies.html">Cookie Policy</a>.
        </p>
        <div class="cookie-banner-actions">
          <button class="btn btn-ghost" type="button" data-cookie-decline>Decline</button>
          <button class="btn btn-primary" type="button" data-cookie-accept>Accept</button>
        </div>
      </div>
    `.trim();

    document.body.appendChild(banner);

    const accept = banner.querySelector("[data-cookie-accept]");
    const decline = banner.querySelector("[data-cookie-decline]");

    const close = () => {
      banner.classList.add("is-hidden");
      window.setTimeout(() => banner.remove(), 200);
    };

    if (accept) {
      accept.addEventListener("click", () => {
        setCookie(CONSENT_COOKIE, "accepted", 180);
        close();
      });
    }
    if (decline) {
      decline.addEventListener("click", () => {
        setCookie(CONSENT_COOKIE, "declined", 180);
        close();
      });
    }
  })();

  // Scroll-to-middle modal (all pages except Contact)
  (() => {
    const path = location.pathname.split("/").pop() || "index.html";
    if (path === "contact.html") return;

    let hasShown = false;
    let rafId = 0;

    const buildModal = () => {
      if (document.querySelector(".modal-overlay")) return;

      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-label="Contact prompt">
          <button class="modal-close" type="button" aria-label="Close">×</button>
          <img
            class="modal-illustration"
            src="assets/img/28693-removebg-preview.png"
            alt="Plumber illustration"
            loading="lazy"
            decoding="async"
          />
          <p class="modal-title">Need a plumber today?</p>
          <p class="modal-text">Tell us what’s going on — we’ll respond by phone or text.</p>
          <p class="modal-text modal-discount"><strong>Book service now:</strong> get 15% off all services.</p>
          <div class="modal-actions">
            <a class="btn btn-primary btn-blink" href="contact.html#form">Contact us</a>
          </div>
        </div>
      `.trim();

      const close = () => {
        overlay.classList.add("is-hidden");
        window.setTimeout(() => overlay.remove(), 180);
        document.removeEventListener("keydown", onKeyDown);
      };

      const onKeyDown = (e) => {
        if (e.key === "Escape") close();
      };

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
      });

      const closeBtn = overlay.querySelector(".modal-close");
      if (closeBtn) closeBtn.addEventListener("click", close);

      const cta = overlay.querySelector(
        "a[href=" + JSON.stringify("contact.html#form") + "]"
      );
      if (cta) cta.addEventListener("click", close);

      document.addEventListener("keydown", onKeyDown);
      document.body.appendChild(overlay);
      window.setTimeout(() => overlay.classList.add("is-open"), 0);
    };

    const check = () => {
      rafId = 0;
      if (hasShown) return;
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      if (maxScroll <= 0) return;
      if (window.scrollY >= maxScroll / 2) {
        hasShown = true;
        buildModal();
      }
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(check);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  // Rate-us modal (About page, when testimonials are reached)
  (() => {
    const path = location.pathname.split("/").pop() || "index.html";
    if (path !== "about.html") return;

    const RATED_KEY = "plumbing:rateModalRated";
    let hasBuilt = false;

    const hasRated = () => {
      try {
        return localStorage.getItem(RATED_KEY) === "1";
      } catch {
        return false;
      }
    };

    const markRated = () => {
      try {
        localStorage.setItem(RATED_KEY, "1");
      } catch {
        // ignore
      }
    };

    const target = document.querySelector("[data-testimonials]");
    if (!target) return;

    const buildModal = () => {
      if (hasRated()) return;
      if (hasBuilt) return;
      if (document.querySelector(".modal-overlay")) return;

      hasBuilt = true;

      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.setAttribute("data-modal", "rate");
      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-label="Rate us">
          <button class="modal-close" type="button" aria-label="Close">×</button>
          <p class="modal-title">Rate us</p>
          <p class="modal-text">How was your experience? Tap a rating below.</p>
          <div class="rate-stars" role="group" aria-label="Rating">
            <button class="btn btn-ghost rate-star" type="button" data-rate="1" aria-label="Rate 1 out of 5">★</button>
            <button class="btn btn-ghost rate-star" type="button" data-rate="2" aria-label="Rate 2 out of 5">★★</button>
            <button class="btn btn-ghost rate-star" type="button" data-rate="3" aria-label="Rate 3 out of 5">★★★</button>
            <button class="btn btn-ghost rate-star" type="button" data-rate="4" aria-label="Rate 4 out of 5">★★★★</button>
            <button class="btn btn-primary rate-star" type="button" data-rate="5" aria-label="Rate 5 out of 5">★★★★★</button>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" type="button" data-rate-later>Not now</button>
          </div>
        </div>
      `.trim();

      const close = () => {
        overlay.classList.add("is-hidden");
        window.setTimeout(() => overlay.remove(), 180);
        document.removeEventListener("keydown", onKeyDown);
      };

      const onKeyDown = (e) => {
        if (e.key === "Escape") close();
      };

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
      });

      const closeBtn = overlay.querySelector(".modal-close");
      if (closeBtn) closeBtn.addEventListener("click", close);

      const laterBtn = overlay.querySelector("[data-rate-later]");
      if (laterBtn)
        laterBtn.addEventListener("click", () => {
          close();
        });

      const stars = overlay.querySelectorAll("[data-rate]");
      stars.forEach((btn) => {
        btn.addEventListener("click", () => {
          const rating = Number(btn.getAttribute("data-rate") || "0");
          markRated();
          try {
            localStorage.setItem(
              "plumbing:lastRating",
              JSON.stringify({ rating, at: new Date().toISOString() })
            );
          } catch {
            // ignore
          }
          close();
        });
      });

      document.addEventListener("keydown", onKeyDown);
      document.body.appendChild(overlay);
      window.setTimeout(() => overlay.classList.add("is-open"), 0);
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.disconnect();
            buildModal();
            return;
          }
        },
        { threshold: 0.35 }
      );
      observer.observe(target);
    } else {
      // Fallback: simple scroll check
      let rafId = 0;
      const check = () => {
        rafId = 0;
        if (hasRated()) return;
        const rect = target.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.75) {
          window.removeEventListener("scroll", onScroll);
          buildModal();
        }
      };
      const onScroll = () => {
        if (rafId) return;
        rafId = window.requestAnimationFrame(check);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.setTimeout(check, 600);
    }
  })();
})();
