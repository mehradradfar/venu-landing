/* Venu landing — interactions. Replace these with your real store links before launch. */
const VENU = {
  appStore: '#',            // e.g. https://apps.apple.com/app/idXXXXXXXX
  googlePlay: '#',          // e.g. https://play.google.com/store/apps/details?id=...
  qrUrl: ''                 // page the QR opens; empty = this page's URL
};

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let vw = innerWidth, vh = innerHeight;
  const isMobile = () => vw <= 820;

  /* ---------- phone sizing: 390×844 canvas scaled into a device frame ---------- */
  function sizePhone(el, H) {
    const bz = Math.max(6, Math.round(H * .0135));
    const sh = H - 2 * bz, sw = sh * 390 / 844;
    el.style.setProperty('--bz', bz + 'px');
    el.style.setProperty('--ph', H + 'px');
    el.style.setProperty('--pw', (sw + 2 * bz) + 'px');
    el.style.setProperty('--s', (sw / 390).toFixed(5));
    el.style.width = (sw + 2 * bz) + 'px';
    el.style.height = H + 'px';
    return sw + 2 * bz;
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis && matchMedia('(pointer:fine)').matches) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  }
  const scrollToY = (y, dur = 1.4) => {
    if (lenis) lenis.scrollTo(y, { duration: dur });
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ---------- views (users / business) ---------- */
  const views = { users: $('#users'), biz: $('#biz') };
  const tabs = { users: $('#tab-users'), biz: $('#tab-biz') };
  const knob = $('.toggle .knob');
  const navcta = $('#navcta');
  let current = 'users';
  function placeKnob() {
    const b = tabs[current];
    knob.style.width = b.offsetWidth + 'px';
    knob.style.transform = `translateX(${b.offsetLeft - 2}px)`;
  }
  function show(name, push = true) {
    if (name === current) return;
    const from = views[current], to = views[name];
    from.classList.add('out');
    setTimeout(() => {
      from.hidden = true;
      to.hidden = false; to.classList.add('out');
      current = name;
      Object.entries(tabs).forEach(([k, b]) => b.setAttribute('aria-selected', k === name));
      placeKnob();
      navcta.textContent = name === 'biz' ? 'Contact' : 'Download App';
      navcta.setAttribute('href', name === 'biz' ? '#contact' : '#download');
      if (lenis) lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0);
      layout();
      prepReveals(to);
      requestAnimationFrame(() => to.classList.remove('out'));
      if (push) history.replaceState(null, '', name === 'biz' ? '#business' : location.pathname + location.search);
    }, reduce ? 0 : 320);
    placeKnobTo(name);
  }
  function placeKnobTo(name) { const b = tabs[name]; knob.style.width = b.offsetWidth + 'px'; knob.style.transform = `translateX(${b.offsetLeft - 2}px)`; }
  tabs.users.addEventListener('click', () => show('users'));
  tabs.biz.addEventListener('click', () => show('biz'));
  addEventListener('hashchange', () => show(location.hash === '#business' ? 'biz' : 'users', false));

  /* in-page anchors scroll smoothly without touching the hash route */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (a.hasAttribute('data-store')) { e.preventDefault(); return; }
    if (a.hasAttribute('data-jump')) return; // handled by journey
    e.preventDefault();
    if (!id) return scrollToY(0);
    const t = document.getElementById(id);
    if (t && !t.closest('[hidden]')) {
      let y = t.getBoundingClientRect().top + scrollY;
      if (id === 'download') y += dlLen * .72; // land on the revealed card
      scrollToY(y - (id === 'contact' ? 90 : 0));
    }
  });

  /* ---------- hero ticker ---------- */
  const tick = $$('#ticker span'); let ti = 0;
  tick[0].classList.add('on');
  if (!reduce) setInterval(() => {
    const a = tick[ti]; ti = (ti + 1) % tick.length; const b = tick[ti];
    a.classList.remove('on'); a.classList.add('off');
    b.classList.remove('off'); b.classList.add('on');
    setTimeout(() => a.classList.remove('off'), 600);
  }, 2200);

  /* ---------- journey ---------- */
  const J = {
    sec: $('#journey'), stage: $('#stage'), copy: $('#heroCopy'), phone: $('#phone'), back: $('#phoneBack'),
    cv: $('#cv'), screens: $$('#cv .scr'), steps: $$('.step-txt'), fls: $$('#floaters .fl'), floaters: $('#floaters'),
    rail: $$('#rail button'), bars: $$('#rail .bar i'), dots: $$('.dots i'), nav: $('#nav'), tap: $('#tap'),
    feed: $('#feed'), venue: $$('#cv .scr[data-s="2"] .vhead, #cv .scr[data-s="2"] .vscroll'), mapimg: $('#cv .scr[data-s="1"] .mapimg'),
    mlist: $('#mlist'), vscr: $('#cv .scr[data-s="2"]'), evt: $('#cv .scr[data-s="3"]'), attend: $('#attend'), frows: $$('#cv .frow'),
    top: 0, heroLen: 0, stepLen: 0, H: 0, pw: 0, y0: 0, y1: 0, dx: 0, idx: -1
  };
  J.cv.appendChild(J.tap);
  const TAPS = { 1: [95, 175], 2: [152, 448], 3: [200, 377], 4: [290, 792] };

  function layoutJourney() {
    const m = isMobile();
    J.heroLen = vh * (m ? .7 : .85);
    J.stepLen = vh * (m ? .9 : 1.0);
    J.sec.style.height = (vh + J.heroLen + 5 * J.stepLen + vh * .3) + 'px';
    J.top = J.sec.getBoundingClientRect().top + scrollY;
    J.H = m ? clamp(vh - 300, 340, 600) : clamp(vh * .8, 480, 780);
    if (m && vw < 380) J.H = Math.min(J.H, vh - 290);
    J.pw = sizePhone(J.phone, J.H);
    sizePhone(J.back, J.H);
    J.stage.style.setProperty('--pw', J.pw + 'px');
    J.floaters.style.setProperty('--pw', J.pw + 'px');
    // hero resting position: phone top just under the hero copy, at least 150px showing
    J.copy.style.transform = ''; J.copy.style.opacity = '';
    const cb = J.copy.getBoundingClientRect().bottom - J.stage.getBoundingClientRect().top;
    const top0 = Math.min(vh - (m ? 120 : 170), cb + (m ? 26 : 40));
    J.y0 = top0 + J.H / 2 - vh / 2;
    J.y1 = m ? (86 + J.H / 2 - vh / 2) : 0;
    J.dx = (!m && vw < 1180) ? vw * .14 : 0;
  }

  function setScreen(i) {
    const prev = J.idx;
    J.idx = i;
    J.screens.forEach(s => {
      const n = +s.dataset.s;
      s.classList.toggle('is-active', n === i);
      s.classList.toggle('is-past', n < i);
    });
    J.steps.forEach(s => { const n = +s.dataset.st; s.classList.toggle('on', n === i); s.classList.toggle('past', n < i); });
    J.fls.forEach(f => f.classList.toggle('on', +f.dataset.st === i));
    J.rail.forEach((b, n) => { b.classList.toggle('on', n === i); b.setAttribute('aria-current', n === i ? 'step' : 'false'); });
    J.dots.forEach((d, n) => d.classList.toggle('on', n === i));
    if (i === prev + 1 && TAPS[i] && prev >= 0) {
      const [x, y] = TAPS[i];
      J.tap.style.left = x + 'px'; J.tap.style.top = y + 'px';
      J.tap.classList.remove('go'); void J.tap.offsetWidth; J.tap.classList.add('go');
    }
  }

  function updateJourney(sy) {
    const y = sy - J.top;
    const m = isMobile();
    const t = clamp(y / J.heroLen), et = easeIO(t);
    const st = (y - J.heroLen) / J.stepLen;
    const idx = clamp(Math.floor(st), 0, 4);
    const f = st < 0 ? 0 : clamp(st - idx);

    // hero copy lifts away
    J.copy.style.transform = `translate3d(0,${-t * (m ? 70 : 120)}px,0)`;
    J.copy.style.opacity = clamp(1 - t * 1.9);
    J.copy.style.pointerEvents = t > .4 ? 'none' : '';
    J.stage.style.setProperty('--gs', (1 + t * .25).toFixed(3));

    // phone rises, straightens and settles
    const k = m ? .55 : 1;
    const px = lerp(-64 * k, J.dx, et), py = lerp(J.y0, J.y1, et), pr = lerp(-5, 0, et);
    J.phone.style.transform = `translate3d(calc(-50% + ${px}px), calc(-50% + ${py}px), 0) rotate(${pr}deg)`;
    const bx = 150 * k + 420 * k * et, by = J.y0 + 46 + (J.y1 - J.y0) * et * .6, br = 9 + 8 * et;
    J.back.style.transform = `translate3d(calc(-50% + ${bx}px), calc(-50% + ${by}px), 0) rotate(${br}deg) scale(.94)`;
    J.back.style.opacity = clamp(1 - (t - .25) / .55);
    J.floaters.style.transform = `translateX(${J.dx}px)`;

    const inSteps = st > -.12;
    J.stage.classList.toggle('steps', inSteps);
    const end = J.sec.offsetHeight - vh;
    J.nav.classList.toggle('in-story', y > J.heroLen * .6 && y < end + vh * .2);

    if (idx !== J.idx) setScreen(idx);

    // inside-the-app motion
    const p0 = idx > 0 ? 1 : f, p2 = idx > 2 ? 1 : idx === 2 ? f : 0, p4 = idx === 4 ? f : 0;
    J.feed.style.transform = `translate3d(0,${-ease(p0) * 430}px,0)`;
    J.mapimg.style.transform = `translate3d(${-(idx === 1 ? f : idx > 1 ? 1 : 0) * 16}px,${-(idx === 1 ? f : idx > 1 ? 1 : 0) * 22}px,0) scale(1.05)`;
    J.venue.forEach(el => el.style.transform = `translate3d(0,${-ease(p2) * 300}px,0)`);
    J.vscr.classList.toggle('scrolled', ease(p2) * 300 > 150);
    J.mlist.style.transform = `translate3d(0,${-ease(p4) * 200}px,0)`;
    const attending = idx > 3 || (idx === 3 && f > .2);
    const sheet = idx > 3 || (idx === 3 && f > .42);
    const invited = idx > 3 ? 3 : idx === 3 ? clamp(Math.floor((f - .55) / .1) + 1, 0, 3) : 0;
    J.attend.classList.toggle('on', attending);
    J.attend.lastElementChild.textContent = attending ? 'Attending' : 'Attend';
    J.evt.classList.toggle('sheet-on', sheet);
    J.frows.forEach((r, n) => r.classList.toggle('on', n < invited));

    // rail progress
    J.bars.forEach((b, n) => b.style.transform = `scaleX(${n < idx ? 1 : n === idx ? (inSteps ? f : 0) : 0})`);
  }

  function jumpTo(n) {
    const y = J.top + J.heroLen + n * J.stepLen + J.stepLen * .12;
    scrollToY(y, 1.6);
  }
  $$('[data-jump]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); jumpTo(+b.dataset.jump); }));

  /* ---------- statement word reveal ---------- */
  const stEl = $('#statement');
  (function split() {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(w => {
            if (!w) return;
            if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w));
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        }
      });
    };
    walk(stEl);
  })();
  const words = $$('.w, .pic', stEl);
  function updateStatement() {
    const r = stEl.getBoundingClientRect();
    const p = clamp((vh * .82 - r.top) / (r.height + vh * .3));
    const act = p * words.length * 1.12;
    words.forEach((w, i) => w.style.setProperty('--a', (.14 + .86 * clamp(act - i)).toFixed(3)));
  }

  /* ---------- download: V mark zoom ---------- */
  const D = { sec: $('#download'), stage: $('#dlStage'), intro: $('#dlIntro'), vz: $('#vz'), top: 0 };
  let dlLen = 0;
  function layoutDl() { D.top = D.sec.getBoundingClientRect().top + scrollY; dlLen = D.sec.offsetHeight - vh; }
  function updateDl(sy) {
    const p = clamp((sy - D.top) / dlLen);
    D.intro.style.opacity = clamp(1 - (p - .06) / .18);
    D.intro.style.transform = `translate3d(0,${-p * 160}px,0)`;
    const z = clamp((p - .04) / .56);
    const max = Math.max(vw, vh) / 132 * 9;
    D.vz.style.transform = `scale(${1 + Math.pow(z, 3.2) * max}) rotate(${z * -8}deg)`;
    D.vz.style.opacity = p > .66 ? 0 : 1;
    D.stage.classList.toggle('purple', p > .5);
    D.stage.classList.toggle('done', p > .6);
  }

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.remove('pre');
    if (e.target.id === 'trio') autoChips();
    if (e.target.id === 'dash') drawDonut(true);
    io.unobserve(e.target);
  }), { threshold: .18 });
  function prepReveals(root) {
    $$('.rv, #trio, #dash, #duo', root).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top > vh * .92 && !reduce) { el.classList.add('pre'); io.observe(el); }
      else { el.classList.remove('pre'); if (el.id === 'trio') autoChips(); if (el.id === 'dash') drawDonut(true); }
    });
  }

  /* ---------- donut ---------- */
  const C = 2 * Math.PI * 42;
  function drawDonut(on) {
    $$('#dash .arc').forEach(a => {
      const len = +a.dataset.len * C, off = +a.dataset.off * C;
      a.style.strokeDasharray = on ? `${len} ${C}` : `0 ${C}`;
      a.style.strokeDashoffset = -off;
    });
  }
  drawDonut(false);

  /* ---------- interest chips ---------- */
  const chips = $$('#ichips .ichip'); let chipsTouched = false, chipsPlayed = false;
  const setChip = (c, on) => { c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); };
  chips.forEach(c => c.addEventListener('click', () => { chipsTouched = true; setChip(c, !c.classList.contains('on')); }));
  function autoChips() {
    if (chipsPlayed) return; chipsPlayed = true;
    [0, 4, 5, 1].forEach((n, i) => setTimeout(() => { if (!chipsTouched) setChip(chips[n], true); }, 700 + i * 520));
  }

  /* ---------- category marquee ---------- */
  const CATS = [['Bar', 'v-bar'], ['Live Music', 'v-live-music'], ['Comedy', 'v-comedy'], ['Live Sport', 'v-live-sport'], ['Brunch', 'v-brunch'], ['Nightclub', 'v-nightclub'], ['Quiz Night', 'v-trivia'], ['Happy Hour', 'v-happy-hour'], ['Karaoke', 'v-karaoke'], ['Cafe', 'v-cafe'], ['Live DJ', 'v-live-dj'], ['Pub', 'v-pub'], ['Beach Club', 'v-beach-club'], ['Cocktail Bar', 'v-coctail-bar'], ['Restaurant', 'v-restuarant'], ['Student Night', 'v-student-night'], ['Networking', 'v-networking'], ['Sport Bar', 'v-sport-bar'], ['Food Deals', 'v-food-deals'], ['Live Band', 'v-live-band'], ['Fitness', 'v-fitness'], ['Coffee Shop', 'v-coffee-shop']];
  const pill = ([n, ic], dk) => `<span class="cat${dk ? ' dk' : ''}"><span class="ic"><svg class="i" aria-hidden="true"><use href="#i-${ic}"/></svg></span>${n}</span>`;
  const r1 = CATS.slice(0, 11), r2 = CATS.slice(11);
  const row = (arr, dkAt) => { const h = arr.map((c, i) => pill(c, i === dkAt)).join(''); return h + h; };
  $('#mq1').innerHTML = row(r1, 3); $('#mq2').innerHTML = row(r2, 5);
  $$('#mq1 .cat, #mq2 .cat').slice(0).forEach((el, i) => { if (i >= 11 && i < 22 || i >= 33) el.setAttribute('aria-hidden', 'true'); });

  /* ---------- store links + QR ---------- */
  $$('[data-store]').forEach(a => {
    const url = a.dataset.store === 'ios' ? VENU.appStore : VENU.googlePlay;
    if (url && url !== '#') { a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.removeAttribute('data-store'); }
  });
  (function qr() {
    const box = $('#qr');
    const url = VENU.qrUrl || location.href.split('#')[0];
    try {
      const q = qrcode(0, 'H'); q.addData(url); q.make();
      box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }) + '<span class="qi"><img src="assets/app-icon.png" alt=""></span>';
    } catch (e) { box.innerHTML = '<img src="assets/app-icon.png" alt="" style="width:100%;height:100%;object-fit:contain">'; }
  })();

  /* ---------- contact form ---------- */
  const form = $('#cform');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#c-name'), ct = $('#c-contact'), err = $('#cerr');
    $$('.fld', form).forEach(f => f.classList.remove('err'));
    const v = ct.value.trim();
    const okContact = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || /^\+?[\d\s().-]{7,}$/.test(v);
    if (!name.value.trim()) { name.parentElement.classList.add('err'); err.textContent = 'Add your full name so we know who to contact.'; name.focus(); return; }
    if (!okContact) { ct.parentElement.classList.add('err'); err.textContent = 'Enter an email address, or a phone number starting with your country code.'; ct.focus(); return; }
    err.textContent = '';
    $('#c-echo').textContent = v;
    form.classList.add('sent');
  });

  /* ---------- fit-to-width clusters ---------- */
  function layoutFits() {
    $$('.fit').forEach(f => {
      if (f.closest('[hidden]')) return;
      const w = +f.dataset.w, h = +f.dataset.h, s = Math.min(1, f.clientWidth / w);
      const inner = f.firstElementChild;
      inner.style.transform = `scale(${s})`;
      inner.style.left = Math.max(0, (f.clientWidth - w * s) / 2) + 'px';
      f.style.height = (h * s) + 'px';
    });
  }

  /* ---------- loop ---------- */
  function layout() {
    vw = innerWidth; vh = innerHeight;
    placeKnob();
    if (current === 'users') { layoutJourney(); layoutDl(); }
    sizePhone($('#bphone'), vw <= 900 ? 500 : 561);
    layoutFits();
    frame(true);
  }
  let lastY = -1;
  function frame(force) {
    const sy = lenis ? lenis.scroll : scrollY;
    if (!force && sy === lastY) return;
    lastY = sy;
    if (current === 'users') { updateJourney(sy); updateStatement(); updateDl(sy); }
  }
  function raf(time) { if (lenis) lenis.raf(time); frame(false); requestAnimationFrame(raf); }

  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 120); });
  if (location.hash === '#business') {
    views.users.hidden = true; views.biz.hidden = false; current = 'biz';
    tabs.users.setAttribute('aria-selected', false); tabs.biz.setAttribute('aria-selected', true);
    navcta.textContent = 'Contact'; navcta.setAttribute('href', '#contact');
  }
  document.fonts && document.fonts.ready.then(() => layout());
  layout();
  prepReveals(views[current]);
  requestAnimationFrame(raf);
})();
