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
})();
