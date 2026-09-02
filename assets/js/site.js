/* Portfolio behaviour: mobile nav, scroll spy, reveals, back-to-top. */
(function () {
  'use strict';

  var nav = document.querySelector('.nav');
  var navMark = document.querySelector('.nav__mark');
  var hero = document.querySelector('.hero');
  var toggle = document.querySelector('.nav__toggle');
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
  var totop = document.querySelector('.totop');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme toggle ------------------------------------------------------------
     Dark is the site's base look regardless of the visitor's OS setting.
     A saved choice (localStorage) always wins; with no saved choice the
     page simply stays dark, and this control just shows what's active. */
  var themeToggle = document.querySelector('.theme-toggle');
  var root = document.documentElement;

  function effectiveTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return 'dark';
  }

  function syncToggleLabel() {
    if (!themeToggle) return;
    var isDark = effectiveTheme() === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncToggleLabel();
      window.dispatchEvent(new Event('portfolio:themechange'));
    });

    syncToggleLabel();
  }

  /* Mobile nav ------------------------------------------------------------ */
  function closeNav() {
    nav.setAttribute('data-open', 'false');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', open ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  }

  links.forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* Sticky border + back-to-top ------------------------------------------ */
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('is-stuck', y > 8);
    if (totop) totop.classList.toggle('is-visible', y > 500);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Nav mark — only once the hero's scrolled past ------------------------- */
  if (navMark && hero) {
    if ('IntersectionObserver' in window) {
      var markSpy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          navMark.classList.toggle('is-visible', !entry.isIntersecting);
        });
      }, { rootMargin: '-68px 0px 0px 0px' });
      markSpy.observe(hero);
    } else {
      navMark.classList.add('is-visible');
    }
  }

  /* Scroll spy ------------------------------------------------------------ */
  var sections = links
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* Scroll reveals -------------------------------------------------------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  function revealAll() {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  if (reduced || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    var observerRan = false;

    var reveal = new IntersectionObserver(function (entries, observer) {
      observerRan = true;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = Number(entry.target.getAttribute('data-delay') || 0);
        setTimeout(function () { entry.target.classList.add('is-in'); }, delay);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el) { reveal.observe(el); });

    /* If the observer never reported anything, show everything rather than
       leaving the page blank. */
    setTimeout(function () { if (!observerRan) revealAll(); }, 3000);
  }

  /* Page-load sequence in the hero ---------------------------------------- */
  window.addEventListener('load', function () {
    document.querySelectorAll('.hero .reveal').forEach(function (el) {
      el.classList.add('is-in');
    });
  });
})();

/* Hero role — typing effect ----------------------------------------------- */
(function () {
  'use strict';

  var target = document.getElementById('heroRole');
  if (!target) return;

  var text = "I'm a Software Engineer";
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    target.textContent = text;
    return;
  }

  var CYCLE = 6000;

  function runCycle() {
    var i = 0;
    target.textContent = '';
    function type() {
      target.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) setTimeout(type, 55);
    }
    type();
    setTimeout(runCycle, CYCLE);
  }

  window.addEventListener('load', function () {
    setTimeout(runCycle, 700);
  });
})();

/* Contact-section particles -------------------------------------------------
   A slow bokeh-like drift, confined to the one dark surface on the page —
   particles read as atmosphere there and would just be noise on the light
   sections. Colour comes from --teal-lt, the accent this section already
   uses, so the effect reinforces the existing palette rather than adding
   a new one. Skipped entirely under prefers-reduced-motion. */
(function () {
  'use strict';

  var canvas = document.querySelector('.contact__particles');
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var section = canvas.closest('.contact');
  var ctx = canvas.getContext('2d');
  var particles = [];
  var width = 0;
  var height = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var rafId = null;
  var running = false;

  function seed() {
    var area = width * height;
    var count = Math.max(32, Math.min(90, Math.round(area / 11000)));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 1.6,
        alpha: 0.12 + Math.random() * 0.38,
        speed: 10 + Math.random() * 22,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.3 + Math.random() * 0.4
      });
    }
  }

  function resize() {
    var rect = section.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  var lastT = null;
  function tick(t) {
    if (!running) return;
    if (lastT === null) lastT = t;
    var dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(111, 214, 201)'; /* --teal-lt */

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.y -= p.speed * dt;
      p.drift += p.driftSpeed * dt;
      if (p.y < -4) {
        p.y = height + 4;
        p.x = Math.random() * width;
      }
      var x = p.x + Math.sin(p.drift) * 8;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    lastT = null;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  if ('IntersectionObserver' in window) {
    var visible = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && document.visibilityState === 'visible') start();
        else stop();
      });
    }, { threshold: 0.01 });
    visible.observe(section);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') stop();
  });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  resize();
})();

/* Hero-section particles -----------------------------------------------
   Small teal/blue flecks drifting in the hero's own negative space — an
   echo of the log line's "measured, not decorative" idea, not a network
   diagram behind the headline. Particles are spawned only outside the
   text, portrait and log-line bounding boxes (with a margin) and then
   wander in a small orbit around their spawn point, so they can never
   drift in behind the copy later, however long the page sits open.
   Colour is read from the live --teal/--blue custom properties (unlike
   the contact section's fixed palette, the hero flips with the theme),
   and re-read on 'portfolio:themechange'. Skipped under
   prefers-reduced-motion, exactly like the contact particles. */
(function () {
  'use strict';

  var canvas = document.querySelector('.hero__particles');
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var section = canvas.closest('.hero');
  var copyEl = document.querySelector('.hero__copy');
  var portraitEl = document.querySelector('.hero__portrait');
  var metaEl = document.querySelector('.hero__meta');
  var ctx = canvas.getContext('2d');
  var particles = [];
  var width = 0;
  var height = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var rafId = null;
  var running = false;
  var teal = '#1b6e68';
  var blue = '#3157c7';

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    teal = cs.getPropertyValue('--teal').trim() || teal;
    blue = cs.getPropertyValue('--blue').trim() || blue;
  }

  /* Bounding boxes to keep clear, in canvas-local (section-relative)
     coordinates, each padded so particles can't wander into the text
     even at the outer edge of their orbit. */
  function keepOutRects() {
    var sectionRect = section.getBoundingClientRect();
    var pad = 28;
    return [copyEl, portraitEl, metaEl].filter(Boolean).map(function (el) {
      var r = el.getBoundingClientRect();
      return {
        left: r.left - sectionRect.left - pad,
        right: r.right - sectionRect.left + pad,
        top: r.top - sectionRect.top - pad,
        bottom: r.bottom - sectionRect.top + pad
      };
    });
  }

  function inAnyRect(x, y, rects) {
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
    }
    return false;
  }

  function seed() {
    readColors();
    var rects = keepOutRects();
    var area = width * height;
    var target = Math.max(14, Math.min(46, Math.round(area / 24000)));
    particles = [];

    for (var i = 0; i < target; i++) {
      var placed = false;
      for (var attempt = 0; attempt < 18 && !placed; attempt++) {
        var orbit = 12 + Math.random() * 18;
        var x = Math.random() * width;
        var y = Math.random() * height;
        /* Check the point plus its full orbit radius, not just the
           anchor, so the wander never reaches into a keep-out rect. */
        if (
          !inAnyRect(x - orbit, y - orbit, rects) &&
          !inAnyRect(x + orbit, y - orbit, rects) &&
          !inAnyRect(x - orbit, y + orbit, rects) &&
          !inAnyRect(x + orbit, y + orbit, rects) &&
          !inAnyRect(x, y, rects)
        ) {
          particles.push({
            ax: x, ay: y,
            orbit: orbit,
            angle: Math.random() * Math.PI * 2,
            speed: 0.7 + Math.random() * 0.9,
            r: 1.8 + Math.random() * 2.2,
            alpha: 0.16 + Math.random() * 0.3,
            color: Math.random() < 0.7 ? teal : blue
          });
          placed = true;
        }
      }
    }
  }

  function resize() {
    var rect = section.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  var lastT = null;
  function tick(t) {
    if (!running) return;
    if (lastT === null) lastT = t;
    var dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;

    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.angle += p.speed * dt;
      var x = p.ax + Math.cos(p.angle) * p.orbit;
      var y = p.ay + Math.sin(p.angle) * p.orbit * 0.6;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    lastT = null;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  if ('IntersectionObserver' in window) {
    var visible = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && document.visibilityState === 'visible') start();
        else stop();
      });
    }, { threshold: 0.01 });
    visible.observe(section);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') stop();
  });

  window.addEventListener('portfolio:themechange', function () {
    readColors();
    particles.forEach(function (p) { p.color = Math.random() < 0.7 ? teal : blue; });
  });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  resize();
})();
