(() => {
  // ======================
  // Helpers
  // ======================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const rafThrottle = (fn) => {
    let rafId = 0;
    return (...args) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        fn(...args);
      });
    };
  };

  const createScrollLock = (lenis) => {
    const locks = new Set();

    const apply = () => {
      const locked = locks.size > 0;
      document.body.classList.toggle("no-scroll", locked);
      if (locked) lenis?.stop?.();
      else lenis?.start?.();
    };

    return {
      lock: (key) => {
        if (!key) return;
        locks.add(key);
        apply();
      },
      unlock: (key) => {
        if (!key) return;
        locks.delete(key);
        apply();
      },
      reset: () => {
        locks.clear();
        apply();
      },
      has: (key) => locks.has(key),
    };
  };

  // ======================
  // Lenis
  // ======================
  const initLenis = () => {
    if (typeof Lenis === "undefined") return null;
    const lenis = new Lenis({ autoRaf: true });
    window.lenis = lenis;
    return lenis;
  };

  // ======================
  // Multiplier / s()
  // ======================
  const state = {
    multiplier: 1,
    swipers: {},
  };

  const getWidthMultiplier = () => {
    const w = window.innerWidth;
    if (w <= 767) return Math.min(window.innerWidth, window.innerHeight) / 375;
    if (w <= 1024) return Math.min(window.innerWidth, window.innerHeight) / 768;
    return window.innerWidth / 1920;
  };

  const updateMultiplier = () => {
    state.multiplier = getWidthMultiplier();
  };

  const s = (value) => value * state.multiplier;

  // ======================
  // Header + dropdowns
  // ======================
  const initHeader = ({ scrollLock } = {}) => {
    const header = $(".header");
    const burger = $(".header__burger");
    const nav = $(".header__nav");

    const supportsHover = window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches;

    const setPadTop = () => {
      if (!header) return;
      // если нужно, можно выставлять padding-top у body под фикс-хедер
      // document.body.style.paddingTop = `${header.offsetHeight}px`;
    };

    const setHeaderScrolled = () => {
      if (!header) return;
      header.classList.toggle("is-scrolled", window.scrollY > 5);
    };

    // --- Menu (burger)
    const setMenuOpen = (open) => {
      if (!burger || !nav) return;
      burger.classList.toggle("active", open);
      nav.classList.toggle("open", open);

      if (scrollLock) open ? scrollLock.lock("menu") : scrollLock.unlock("menu");
    };

    const closeMenu = () => setMenuOpen(false);

    if (burger && nav) {
      burger.addEventListener("click", (e) => {
        e.preventDefault();
        setMenuOpen(!nav.classList.contains("open"));
      });

      window.addEventListener(
        "scroll",
        rafThrottle(() => {
          if (nav.classList.contains("open")) closeMenu();
        }),
        { passive: true }
      );
    }

    // --- Dropdowns (.dd)
    const closeAllDD = (except = null) => {
      $$(".dd.is-open").forEach((dd) => {
        if (dd === except) return;
        dd.classList.remove("is-open");
        const btn = dd.querySelector("[data-dd-btn]");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    };

    const openDD = (dd) => {
      if (!dd) return;
      closeAllDD(dd);
      dd.classList.add("is-open");
      const btn = dd.querySelector("[data-dd-btn]");
      if (btn) btn.setAttribute("aria-expanded", "true");
    };

    const closeDD = (dd) => {
      if (!dd) return;
      dd.classList.remove("is-open");
      const btn = dd.querySelector("[data-dd-btn]");
      if (btn) btn.setAttribute("aria-expanded", "false");
    };

    // Hover (desktop)
    if (supportsHover) {
      $$(".dd").forEach((dd) => {
        dd.addEventListener("mouseenter", () => openDD(dd));
        dd.addEventListener("mouseleave", () => closeDD(dd));
      });
    }

    // Click handlers (touch + click outside)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-dd-btn]");
      if (btn && !supportsHover) {
        const dd = btn.closest(".dd");
        if (!dd) return;

        const isOpen = dd.classList.contains("is-open");
        if (isOpen) closeDD(dd);
        else openDD(dd);

        e.preventDefault();
        return;
      }

      if (!e.target.closest(".dd")) closeAllDD();

      if (!e.target.closest(".header__nav") && !e.target.closest(".header__burger")) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      closeAllDD();
      closeMenu();
    });

    // initial
    setPadTop();
    setHeaderScrolled();

    return {
      closeMenu,
      closeAllDD,
      setPadTop,
      setHeaderScrolled,
    };
  };

  // ======================
  // Swiper
  // ======================
  const initSwipers = () => {
    if (typeof Swiper === "undefined") return;

    state.swipers.hero = new Swiper(".heroSwiper", {
      direction: "vertical",
      spaceBetween: s(8),
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      },
    });

    state.swipers.partners = new Swiper(".partnersSwiper", {
      slidesPerView: 2,
      spaceBetween: s(8),
      breakpoints: {
        768: { slidesPerView: 3 },
        1025: { slidesPerView: 5 },
      },
    });

    state.swipers.achievements = new Swiper(".achievementsSwiper", {
      slidesPerView: 1.1,
      spaceBetween: s(16),
      pagination: {
        el: ".achievements-pagination",
      },
      breakpoints: {
        768: {
          spaceBetween: s(24),
          slidesPerView: 1.63,
        },
      },
    });

    state.swipers.cert = new Swiper(".certSwiper", {
      slidesPerView: "auto",
      spaceBetween: s(8),
    });
  };

  // ======================
  // Fancybox
  // ======================
  const initFancybox = () => {
    if (window.Fancybox?.bind) {
      window.Fancybox.bind("[data-fancybox]");
    }
  };

  // ======================
  // Accordion
  // ======================
  const initAccordion = () => {
    const items = $$(".accordion__item");
    if (!items.length) return;

    items.forEach((item) => {
      item.addEventListener("click", () => {
        items.forEach((el) => {
          if (el === item) return;
          el.classList.remove("active");
          const body = $(".accordion__body", el);
          if (body) body.style.maxHeight = null;
        });

        item.classList.toggle("active");
        const body = $(".accordion__body", item);
        if (!body) return;

        body.style.maxHeight = item.classList.contains("active")
          ? `${body.scrollHeight}px`
          : null;
      });
    });
  };

  // ======================
  // Tabby
  // ======================
  const initTabby = () => {
    if (typeof Tabby === "undefined") return;
    if (!document.querySelector("[data-tabs]")) return;
    new Tabby("[data-tabs]");
  };

  // ======================
  // Phone mask
  // ======================
  const initPhoneMask = () => {
    const inputs = $$('input[type="tel"]');
    if (!inputs.length) return;

    const matrix = "+7 (___) ___ ____";

    const mask = function (event) {
      const keyCode = event.keyCode || event.which;
      const pos = this.selectionStart;

      if (pos < 3) event.preventDefault();

      const def = matrix.replace(/\D/g, "");
      const val = this.value.replace(/\D/g, "");

      let i = 0;
      let newValue = matrix.replace(/[_\d]/g, (a) =>
        i < val.length ? val.charAt(i++) || def.charAt(i) : a
      );

      i = newValue.indexOf("_");
      if (i !== -1) {
        if (i < 5) i = 3;
        newValue = newValue.slice(0, i);
      }

      let reg = matrix
        .substring(0, this.value.length)
        .replace(/_+/g, (a) => `\\d{1,${a.length}}`)
        .replace(/[+()]/g, "\\$&");

      reg = new RegExp(`^${reg}$`);

      if (!reg.test(this.value) || this.value.length < 5 || (keyCode > 47 && keyCode < 58)) {
        this.value = newValue;
      }

      if (event.type === "blur" && this.value.length < 5) this.value = "";
    };

    inputs.forEach((input) => {
      input.addEventListener("input", mask, false);
      input.addEventListener("focus", mask, false);
      input.addEventListener("blur", mask, false);
      input.addEventListener("keydown", mask, false);
    });
  };

  // ======================
  // Modals
  // ======================
  const initModals = ({ scrollLock }) => {
    const wrapper = $(".modals");
    if (!wrapper) return;

    const modals = $$(".modal", wrapper);
    const getModalByType = (type) => wrapper.querySelector(`.modal[data-type="${type}"]`);

    const showWrapper = () => {
      wrapper.style.opacity = 1;
      wrapper.style.pointerEvents = "all";
      scrollLock?.lock?.("modal");
    };

    const hideWrapper = () => {
      wrapper.style.opacity = 0;
      wrapper.style.pointerEvents = "none";
      scrollLock?.unlock?.("modal");
    };

    const openModal = (type) => {
      modals.forEach((m) => {
        m.style.display = "none";
        m.style.removeProperty("transform");
      });

      const modal = getModalByType(type);
      if (!modal) return;

      modal.style.display = "block";
      showWrapper();

      if (window.gsap) {
        window.gsap.fromTo(modal, { y: -100 }, { y: 0, duration: 0.5, ease: "power3.out" });
      }
    };

    const closeCurrentModal = () => {
      const current = modals.find((m) => getComputedStyle(m).display !== "none");

      const finish = () => {
        if (current) current.style.display = "none";
        hideWrapper();
      };

      if (current && window.gsap) {
        window.gsap.to(current, {
          y: -100,
          duration: 0.4,
          ease: "power3.in",
          onComplete: () => {
            current.style.removeProperty("transform");
            finish();
          },
        });
      } else {
        finish();
      }
    };

    $$(".modal-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const type = btn.dataset.type;
        if (!type) return;
        openModal(type);
      });
    });

    wrapper.addEventListener("click", (e) => {
      if (e.target === wrapper || e.target.closest(".modal__close")) closeCurrentModal();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (wrapper.style.pointerEvents === "all") closeCurrentModal();
    });
  };

  // ======================
  // GSAP School animation 
  // ======================
  const initSchoolGsap = () => {
    if (!window.gsap || typeof window.ScrollTrigger === "undefined") return;

    window.gsap.registerPlugin(window.ScrollTrigger);

    const school = document.querySelector(".school");
    const wrap = school?.querySelector(".school__wrap");
    const folders = school ? Array.from(school.querySelectorAll(".school__folder")) : [];

    if (!school || !wrap || folders.length < 3) return;

    const setActive = (i) => {
      folders.forEach((el, idx) => el.classList.toggle("is-active", idx === i));
    };

    const getH = () => wrap.getBoundingClientRect().height;

    const setPositions = () => {
      const h = getH();
      window.gsap.set(folders[0], { y: 0, zIndex: 1 });
      window.gsap.set(folders[1], { y: h, zIndex: 2 });
      window.gsap.set(folders[2], { y: h, zIndex: 3 });
      setActive(0);
    };

    window.ScrollTrigger.matchMedia({
      "(max-width: 1024px)": () => {
        setPositions();

        const tl = window.gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: school,
            start: "top top",
            end: () => "+=" + getH() * 2,
            scrub: 1,
            pin: true,
            pinSpacing: true,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onRefreshInit: setPositions,
          },
        });

        tl.to(folders[1], { y: 0, duration: 1 })
          .add(() => setActive(1))
          .to(folders[2], { y: 0, duration: 1 })
          .add(() => setActive(2));

        window.addEventListener("load", () => window.ScrollTrigger.refresh());
      },

      "(min-width: 1025px)": () => {
        setPositions();

        const tl = window.gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: school,
            start: "top top",
            end: () => "+=" + getH() * 2,
            scrub: 1,
            pin: true,
            pinSpacing: true,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onRefreshInit: setPositions,
          },
        });

        tl.to(folders[1], { y: 0, duration: 1 }).add(() => setActive(1));
        tl.to(folders[2], { y: 0, duration: 1 }).add(() => setActive(2));

        window.addEventListener("load", () => window.ScrollTrigger.refresh());
      },
    });
  };

  // ======================
  // Boot
  // ======================
  window.addEventListener("load", () => {
    const lenis = initLenis();
    updateMultiplier();

    const scrollLock = createScrollLock(lenis);

    const headerApi = initHeader({ scrollLock });
    initSwipers();
    initFancybox();
    initAccordion();
    initTabby();
    initPhoneMask();
    initModals({ scrollLock });
    initSchoolGsap();

    const swiper = new Swiper('#historySwiper', {
      slidesPerView: 1,
      spaceBetween: 18,
      speed: 600,
      simulateTouch: true,
      grabCursor: true,
      autoHeight: true,
      keyboard: { enabled: true },
    });

    const tl = document.getElementById('historyTimeline');
    const btns = Array.from(tl.querySelectorAll('.timeline__btn'));

    const setActive = (i) => {
      btns.forEach((b, idx) => b.classList.toggle('is-active', idx === i));
    };

    tl.addEventListener('click', (e) => {
      const btn = e.target.closest('.timeline__btn');
      if (!btn) return;
      swiper.slideTo(+btn.dataset.slide);
    });

    swiper.on('slideChange', () => {
      setActive(swiper.activeIndex);
    });

    setActive(0);

    window.addEventListener(
      "resize",
      rafThrottle(() => {
        updateMultiplier();
        headerApi?.setPadTop?.();
        Object.values(state.swipers).forEach((sw) => sw?.update?.());
      }),
      { passive: true }
    );

    window.addEventListener(
      "scroll",
      rafThrottle(() => {
        headerApi?.setHeaderScrolled?.();
      }),
      { passive: true }
    );
  });
})();