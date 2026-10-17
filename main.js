(function () {
  'use strict';

  var C = window.INVITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!window.gsap;

  var gate = $('#gate'), intro = $('#intro'), video = $('#introVideo'), page = $('#page');
  var lenis = null, music = null, introDone = false;

  /* ---------- Guest name from the link (?to=Name) ---------- */
  var params = new URLSearchParams(location.search);
  var guest = (params.get('to') || params.get('guest') || '').trim().slice(0, 60);
  if (guest) {
    var gl = $('#guestLine');
    gl.textContent = 'Dear ' + guest + ',';
    gl.hidden = false;
    $('#rsvpName').value = guest;
  }

  /* ---------- Static links ---------- */
  $('#mapLink').href = C.mapUrl || '#';
  buildCalendar();

  /* ---------- Split the names into letters for the reveal ---------- */
  $$('.name').forEach(function (el) {
    var t = el.textContent;
    el.textContent = '';
    t.split('').forEach(function (c) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = c;
      el.appendChild(s);
    });
  });

  /* ---------- Gate entrance ---------- */
  if (hasGsap) {
    gsap.timeline({ delay: .2 })
      .to('.gate__ganesha', { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', startAt: { y: 12 } })
      .to('.gate__guest, .gate__pre', { opacity: 1, y: 0, duration: .9, stagger: .15, startAt: { y: 10 } }, '-=.6')
      .to('.gate__names', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', startAt: { y: 16 } }, '-=.5')
      .to('.gate__date', { opacity: 1, duration: .9 }, '-=.7')
      .to('.gate__btn', { opacity: 1, y: 0, duration: .9, startAt: { y: 10 } }, '-=.5');
  } else {
    $$('.gate [class^="gate__"]').forEach(function (e) { e.style.opacity = 1; });
  }

  // Hide the invite content until the intro has finished
  if (hasGsap) {
    gsap.set('.hero .r', { opacity: 0, y: 14 });
    gsap.set('.name .ch', { opacity: 0, y: 22 });
    gsap.set('.rule', { scaleX: 0 });
    gsap.set('.hero__bg img', { scale: 1.16 });
  }

  /* ---------- Get the invitation ready behind the gate ----------
     Decoding the artwork and building the scroll effects now means nothing
     heavy happens at the moment the video hands over to the invitation. */
  var heroImg = $('.hero__bg img');
  if (heroImg.decode) heroImg.decode().catch(function () {});
  $$('img[loading=lazy]').forEach(function (i) { i.loading = 'eager'; });
  setupScroll();
  // Keep the page still underneath the gate and the video on touch screens
  [gate, intro].forEach(function (el) {
    el.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  });

  /* ---------- Open: gate -> video ---------- */
  try { video.load(); } catch (e) {}

  $('#openBtn').addEventListener('click', function () {
    startMusic();
    intro.style.visibility = 'visible';

    var p;
    try { video.currentTime = 0; p = video.play(); } catch (e) { p = null; }
    if (p && p.then) {
      p.then(function () { intro.classList.add('is-playing'); })
       .catch(function () { endIntro(true); });
    } else {
      intro.classList.add('is-playing');
    }

    if (hasGsap) {
      gsap.to(gate, { opacity: 0, duration: .9, ease: 'power2.inOut', onComplete: function () { gate.remove(); } });
    } else {
      gate.remove();
    }

    // If the video never gets going (very slow network), don't keep people waiting
    setTimeout(function () { if (video.currentTime < .2) endIntro(); }, 6000);
  }, { once: true });

  // Start the glow just before the last frame so it never freezes on screen
  video.addEventListener('timeupdate', function () {
    if (video.duration && video.currentTime >= video.duration - .9) endIntro();
  });
  video.addEventListener('ended', function () { endIntro(); });
  video.addEventListener('error', function () { endIntro(true); });
  // Some browsers pause muted video when the tab is hidden; resume quietly
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !introDone && video.paused && intro.classList.contains('is-playing')) video.play().catch(function () {});
  });
  $('#skipBtn').addEventListener('click', function () { endIntro(); });

  /* ---------- Video -> invite transition ---------- */
  function endIntro(fast) {
    if (introDone) return;
    introDone = true;

    if (!hasGsap) {
      intro.remove();
      unlock();
      return;
    }

    // One continuous move: the video drifts forward into a soft glow while the
    // invitation (already painted underneath) dissolves through it.
    var k = fast ? .4 : 1;
    var tl = gsap.timeline({ onComplete: function () { intro.remove(); unlock(); } });
    tl.to('.intro__skip', { opacity: 0, duration: .3 }, 0)
      .to('.intro__glow', { opacity: .85, duration: 1.1 * k, ease: 'sine.inOut' }, 0)
      .to(video, { scale: 1.06, duration: 2.2 * k, ease: 'sine.in' }, 0)
      .add(revealHero, .6 * k)
      .to(intro, { opacity: 0, duration: 1.6 * k, ease: 'sine.inOut' }, .7 * k);
  }

  function revealHero() {
    if (!hasGsap) return;
    var tl = gsap.timeline();
    tl.to('.hero__bg img', { scale: 1, duration: reduced ? .01 : 3.2, ease: 'power2.out' }, 0)
      .to('.hero__ganesha', { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }, .5)
      .to('.hero__blessing', { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out' }, .85)
      .to('.name--a .ch', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: .07 }, 1.2)
      .to('.and', { opacity: 1, y: 0, duration: .9 }, 1.7)
      .to('.rule', { scaleX: 1, duration: 1, ease: 'power2.inOut' }, 1.75)
      .to('.name--b .ch', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: .06 }, 1.9)
      .to('.hero__tag, .hero__heart, .hero__save, .hero__date, .hero__year, .hero__time, .hero__venue, .hero__lotus',
        { opacity: 1, y: 0, duration: .9, ease: 'power2.out', stagger: .12 }, 2.5)
      .to('#scrollCue', { opacity: 1, duration: .8 }, 3.6)
      .add(startPetals, 2.6);
  }

  /* ---------- Smooth scrolling + scroll animations ---------- */
  function unlock() {
    window.scrollTo(0, 0);
    document.body.classList.remove('is-locked');
    if (music) $('#musicBtn').hidden = false;
    if (lenis) lenis.start();
  }

  function setupScroll() {
    if (!hasGsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis && !reduced) {
      lenis = new Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: .9 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }

    gsap.to('#scrollCue', {
      opacity: 0, scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=120', scrub: true }
    });

    if (!reduced) {
      // Gentle depth: artwork drifts slower than the page
      gsap.fromTo('.hero__bg', { yPercent: 0 }, {
        yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.fromTo('.venue__bg img', { scale: 1.12, yPercent: -4 }, {
        scale: 1, yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: '#venue', start: 'top bottom', end: 'bottom top', scrub: true }
      });
      gsap.fromTo('.rsvp__bg img', { scale: 1.1 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: '#rsvp', start: 'top bottom', end: 'bottom bottom', scrub: true }
      });
    }

    gsap.from('.end > *', {
      opacity: 0, y: reduced ? 0 : 20, duration: 1, stagger: .15, ease: 'power2.out',
      scrollTrigger: { trigger: '.end', start: 'top bottom', once: true }
    });
    $$('.venue .r, .rsvp .r').forEach(function (el) {
      gsap.from(el, {
        opacity: 0, y: reduced ? 0 : 36, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
    gsap.from('.countdown__orn', {
      scaleX: 0, duration: 1.3, ease: 'power2.inOut',
      scrollTrigger: { trigger: '.countdown', start: 'top 85%', once: true }
    });
    gsap.from('.rsvp__title', {
      letterSpacing: '.3em', duration: 1.6, ease: 'power3.out',
      scrollTrigger: { trigger: '.rsvp__title', start: 'top 85%', once: true }
    });
    gsap.from('.corner', {
      opacity: 0, scale: .6, duration: 1, stagger: .1, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: '.rsvp__panel', start: 'top 80%', once: true }
    });
    ScrollTrigger.refresh();
  }

  /* ---------- Falling jasmine petals over the invitation ---------- */
  function startPetals() {
    if (reduced) return;
    var cv = $('#petals'), ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), petals = [], running = true;
    function size() {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function petal(top) {
      return {
        x: Math.random() * W, y: top ? Math.random() * H : -20,
        r: 3 + Math.random() * 4.5, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .02,
        vy: .25 + Math.random() * .45, sway: Math.random() * 6.28, a: .55 + Math.random() * .4
      };
    }
    size();
    for (var i = 0; i < 18; i++) petals.push(petal(true));
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () {
      var was = running; running = !document.hidden;
      if (running && !was) requestAnimationFrame(draw);
    });
    // Petals drift a little with the scroll so they feel part of the page
    var lastY = window.scrollY;
    function draw() {
      if (!running) return;
      var dy = window.scrollY - lastY; lastY = window.scrollY;
      ctx.clearRect(0, 0, W, H);
      petals.forEach(function (p, i) {
        p.y += p.vy - dy * .25;
        if (p.y < -30) p.y = H + 10; p.sway += .012; p.x += Math.sin(p.sway) * .35; p.rot += p.vr;
        if (p.y > H + 20) petals[i] = petal(false);
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.a;
        var g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 1.6);
        g.addColorStop(0, '#fffdf7'); g.addColorStop(.7, '#fff3dc'); g.addColorStop(1, 'rgba(240,215,170,.6)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.6, p.r, 0, 0, 6.283); ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---------- Countdown ---------- */
  var target = new Date(C.date || '2026-12-10T09:30:00+05:30').getTime();
  var cells = {};
  $$('#countdown b').forEach(function (b) { cells[b.dataset.u] = b; });
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var d = Math.max(0, target - Date.now());
    var v = {
      d: pad(Math.floor(d / 864e5)),
      h: pad(Math.floor(d / 36e5) % 24),
      m: pad(Math.floor(d / 6e4) % 60),
      s: pad(Math.floor(d / 1e3) % 60)
    };
    Object.keys(v).forEach(function (k) {
      if (cells[k].textContent !== v[k]) {
        cells[k].textContent = v[k];
        if (hasGsap && !reduced && k === 's') gsap.fromTo(cells[k], { y: -5, opacity: .35 }, { y: 0, opacity: 1, duration: .45, ease: 'power2.out' });
      }
    });
    if (d === 0) $('.countdown__lead').textContent = 'Today we celebrate!';
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Add to calendar (.ics) ---------- */
  function buildCalendar() {
    function ics(d) { return new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
    var body = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Akesh & Michelle//Invite//EN', 'BEGIN:VEVENT',
      'UID:akesh-michelle-20261210@invite',
      'DTSTAMP:' + ics(Date.now()),
      'DTSTART:' + ics(C.date || '2026-12-10T09:30:00+05:30'),
      'DTEND:' + ics(C.endDate || '2026-12-10T13:00:00+05:30'),
      'SUMMARY:' + (C.title || 'Wedding of Akesh & Michelle'),
      'LOCATION:' + (C.venue || '').replace(/,/g, '\\,'),
      'URL:' + (C.mapUrl || ''),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    $('#calLink').href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  }

  /* ---------- RSVP ---------- */
  var form = $('#rsvpForm'), msg = $('#formMsg'), guestsRow = $('#guestsRow'), count = $('#guestCount');
  var n = 1;
  form.addEventListener('change', function (e) {
    if (e.target.name === 'attending') guestsRow.classList.toggle('is-on', e.target.value === 'Joyfully accepts');
  });
  $$('.stepper button').forEach(function (b) {
    b.addEventListener('click', function () {
      n = Math.min(10, Math.max(1, n + Number(b.dataset.step)));
      count.textContent = n;
    });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    var att = (form.querySelector('input[name=attending]:checked') || {}).value;
    if (!name) { msg.textContent = 'Please tell us your name.'; form.elements.name.focus(); return; }
    if (!att) { msg.textContent = 'Please let us know if you can join us.'; return; }

    var data = new URLSearchParams({
      name: name, attending: att,
      guests: att === 'Joyfully accepts' ? String(n) : '0',
      note: form.elements.note.value.trim(),
      link: guest, submitted: new Date().toISOString()
    });
    var btn = form.querySelector('.submit');
    btn.disabled = true;
    msg.textContent = 'Sending…';

    var done = function () {
      msg.textContent = att === 'Joyfully accepts'
        ? 'Thank you, ' + name.split(' ')[0] + '! We can’t wait to celebrate with you.'
        : 'Thank you, ' + name.split(' ')[0] + '. You will be missed, and we are grateful for your blessings.';
      btn.textContent = 'Sent';
      if (hasGsap) gsap.fromTo(msg, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .6 });
    };
    if (!C.rsvpEndpoint) { console.warn('RSVP endpoint not set in config.js; response not saved.', Object.fromEntries(data)); done(); return; }
    fetch(C.rsvpEndpoint, { method: 'POST', mode: 'no-cors', body: data })
      .then(done)
      .catch(function () { btn.disabled = false; msg.textContent = 'Something went wrong. Please try again.'; });
  });

  /* ---------- Optional music ---------- */
  if (C.music) {
    music = new Audio(C.music);
    music.loop = true; music.volume = .55;
    $('#musicBtn').addEventListener('click', function () {
      if (music.paused) { music.play().catch(function () {}); this.classList.remove('is-off'); }
      else { music.pause(); this.classList.add('is-off'); }
    });
  }
  function startMusic() { if (music) music.play().catch(function () {}); }
})();
