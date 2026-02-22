/* ============================================================
   POSEIDON GEODYNAMICS — Main Interactions
   Nav, scroll, animations, counters, form handling
   ============================================================ */

(function () {
  "use strict";

  // ─── Mobile Menu ───
  const mobileMenu = document.querySelector(".mobile-menu");
  const navLinks = document.querySelector(".nav-links");

  if (mobileMenu && navLinks) {
    mobileMenu.addEventListener("click", function () {
      navLinks.classList.toggle("active");
      mobileMenu.classList.toggle("active");
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("active");
        mobileMenu.classList.remove("active");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".nav")) {
        navLinks.classList.remove("active");
        mobileMenu.classList.remove("active");
      }
    });
  }

  // ─── Navbar Scroll Effect ───
  const nav = document.querySelector(".nav");

  if (nav) {
    var lastScroll = 0;

    window.addEventListener(
      "scroll",
      function () {
        var currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
          nav.classList.add("scrolled");
        } else {
          nav.classList.remove("scrolled");
        }

        lastScroll = currentScroll;
      },
      { passive: true },
    );
  }

  // ─── Smooth Scroll for Anchor Links ───
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = this.getAttribute("href");
      if (href === "#") return;

      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var navHeight = nav ? nav.offsetHeight : 0;
        var targetPosition =
          target.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  // ─── Active Nav Link Tracking ───
  var sections = document.querySelectorAll("section[id]");
  var navLinksAll = document.querySelectorAll(".nav-links a");

  if (sections.length > 0 && navLinksAll.length > 0) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute("id");
            navLinksAll.forEach(function (link) {
              link.classList.remove("active");
              if (link.getAttribute("href") === "#" + id) {
                link.classList.add("active");
              }
            });
          }
        });
      },
      { rootMargin: "-30% 0px -70% 0px" },
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  // ─── Fade-In Animations on Scroll ───
  var fadeElements = document.querySelectorAll(".fade-in");

  if (fadeElements.length > 0) {
    var fadeObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    fadeElements.forEach(function (el) {
      fadeObserver.observe(el);
    });
  }

  // Stagger groups
  var staggerGroups = document.querySelectorAll(".stagger");

  if (staggerGroups.length > 0) {
    var staggerObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    staggerGroups.forEach(function (el) {
      staggerObserver.observe(el);
    });
  }

  // ─── Animated Number Counters ───
  var counters = document.querySelectorAll("[data-count]");

  if (counters.length > 0) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  }

  function animateCounter(el) {
    var target = el.getAttribute("data-count");
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 2000;
    var startTime = null;

    // Parse target value
    var targetNum = parseFloat(target);
    var isFloat = target.indexOf(".") !== -1;
    var decimals = isFloat ? (target.split(".")[1] || "").length : 0;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing: ease-out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = eased * targetNum;

      if (isFloat) {
        el.textContent = prefix + current.toFixed(decimals) + suffix;
      } else {
        el.textContent = prefix + Math.floor(current) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  // ─── Tab Switching ───
  var tabContainers = document.querySelectorAll("[data-tabs]");

  tabContainers.forEach(function (container) {
    var tabs = container.querySelectorAll(".tab");
    var contents = container.querySelectorAll(".tab-content");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = this.getAttribute("data-tab");

        tabs.forEach(function (t) {
          t.classList.remove("active");
        });
        contents.forEach(function (c) {
          c.classList.remove("active");
        });

        this.classList.add("active");
        var targetContent = container.querySelector(
          '[data-tab-content="' + target + '"]',
        );
        if (targetContent) {
          targetContent.classList.add("active");
        }
      });
    });
  });

  // ─── Form Submission ───
  var forms = document.querySelectorAll(".contact-form, .quote-form");

  forms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn) return;

      var originalText = submitBtn.textContent;
      submitBtn.textContent = "Sending...";
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";

      // Simulate send (replace with actual endpoint later)
      setTimeout(function () {
        submitBtn.textContent = "Sent!";
        submitBtn.style.background = "#10b981";
        submitBtn.style.opacity = "1";

        setTimeout(function () {
          submitBtn.textContent = originalText;
          submitBtn.style.background = "";
          submitBtn.disabled = false;
          form.reset();
        }, 2500);
      }, 1200);
    });
  });

  // ─── Current Year in Footer ───
  var yearEls = document.querySelectorAll("[data-year]");
  yearEls.forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ─── Pause Animations Off-Screen (Performance) ───
  var animatedSections = document.querySelectorAll(".hero, .cta-section");

  if (animatedSections.length > 0) {
    var animObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var animated = entry.target.querySelectorAll('[style*="animation"]');
          if (entry.isIntersecting) {
            animated.forEach(function (el) {
              el.style.animationPlayState = "running";
            });
          } else {
            animated.forEach(function (el) {
              el.style.animationPlayState = "paused";
            });
          }
        });
      },
      { rootMargin: "100px" },
    );

    animatedSections.forEach(function (section) {
      animObserver.observe(section);
    });
  }
})();
