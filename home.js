// Главная: прелоадер, первый экран с горизонтальной прокруткой по направлениям, каталог, видео,
// подбор, занавес, схема узла учёта, одометры, шаги услуг.
(function () {
  const U = window.ULTRA, { $, $$, I, tile, sections, products, solutions, facets, reduce, hasGsap } = U;
  const small = matchMedia('(max-width: 680px)').matches;
  const G = hasGsap && !reduce;
  const full = !!$('#solutions'); // в короткой версии страницы (home-short.html) блоков ниже видео нет

  /* ——— Отраслевые решения: лесенка ——— */
  if (full) $('#stairs').innerHTML = solutions.map((s, i) => {
    const n = products.filter(p => p.industry.includes(s.industry)).length;
    return `<a class="stair reveal" href="catalog.html?industry=${encodeURIComponent(s.industry)}"><span class="label">0${i + 1}</span>
      <div><h3>${s.name}</h3><p>${s.text}</p><span class="go">${n} приборов в фильтре →</span></div></a>`;
  }).join('');

  if (full) { $('#inlineForm').innerHTML = U.formHtml('inline'); U.bindForms($('#inlineForm')); }

  /* ——— Одометры: колонки цифр ——— */
  $$('[data-odo]').forEach(el => {
    const val = el.dataset.odo, unit = el.dataset.unit;
    el.innerHTML = '<div class="win">' + [...val].map(ch => /\d/.test(ch)
      ? `<span class="col" data-d="${ch}">${Array.from({ length: 20 }, (_, i) => `<span>${i % 10}</span>`).join('')}</span>`
      : `<span class="static">${ch}</span>`).join('') + '</div>' + (unit ? `<span class="unit">${unit}</span>` : '');
  });

  /* ——— Видео на весь экран: Rutube грузится только по клику ——— */
  const vid = $('#video');
  vid.addEventListener('click', () => {
    if (vid.querySelector('iframe')) return;
    vid.insertAdjacentHTML('beforeend', `<iframe src="${vid.dataset.src}" allow="clipboard-write; autoplay; fullscreen" allowfullscreen title="Видео ГК «УЛЬТРА»: собственное производство"></iframe>`);
    vid.classList.add('is-playing');
  });

  // Шкала-прогресс услуг
  if (full) $('#ticks').innerHTML = '<i></i>'.repeat(small ? 24 : 48);

  /* ——— Без анимаций: показываем всё в финальном состоянии ——— */
  if (!G) {
    $('#preloader').remove();
    $$('.odo .col').forEach(c => c.style.transform = `translateY(-${(10 + +c.dataset.d) * 5}%)`);
    $$('#ticks i').forEach(i => i.classList.add('on'));
    U.ready();
    return;
  }

  /* ========== Анимации (GSAP) ========== */

  const txt = sl => $$(".hx-copy > *, .hx-side .hx-num, .hx-facts > div, .hx-side > p, .hx-side > .btn", sl); // текст слайда для поэтапного появления
  /* Прелоадер: один раз за сессию */
  const pre = $('#preloader');
  const seen = sessionStorage.getItem('ultraSeen') || sessionStorage.getItem('ultraNav');
  const heroIn = () => {
    // На мобильном заголовок не прячем (opacity 0 задерживает LCP) — только лёгкий сдвиг
    const w = $('.hx-welcome');
    gsap.from($('.hx-stage', w), { opacity: 0, scale: .94, duration: 1.6, ease: 'sine.inOut' }); // сначала прибор,
    gsap.from(txt(w), { opacity: 0, y: 28, duration: 1.2, ease: 'power3.out', stagger: .12, delay: 1 }); // потом текст
    gsap.from(".hx-progress", { opacity: 0, duration: 1, delay: 1.2 });
  };
  if (seen) { pre.remove(); U.ready(); heroIn(); }
  else {
    sessionStorage.setItem('ultraSeen', 1);
    U.lenis && U.lenis.stop();
    // Минималистичный прелоадер: логотип заполняется снизу вверх, внизу шкала загрузки из делений
    const plTicks = $('#plTicks'), plN = small ? 20 : 48, pl = { v: 0 };
    plTicks.innerHTML = '<i></i>'.repeat(plN);
    const plI = $$('i', plTicks);
    gsap.timeline()
      .from('.pl-logo, .pl-ticks', { opacity: 0, duration: .5, ease: 'power1.out' })
      .to('#plFill', { attr: { y: 0 }, duration: 1.8, ease: 'power2.inOut' }, '<.1')
      .to(pl, { v: plN, duration: 1.8, ease: 'power2.inOut', onUpdate: () => plI.forEach((t, i) => t.classList.toggle('on', i < Math.round(pl.v))) }, '<')
      .to(pre, { opacity: 0, duration: .7, ease: 'power1.inOut', onStart: heroIn, onComplete: () => { pre.remove(); U.lenis && U.lenis.start(); } }, '+=.2');
    U.ready({ holdCurtain: false });
  }

  /* ——— Первый экран: вертикальная прокрутка двигает направления по горизонтали ——— */
  const hero = $('#hero'), track = $('#hxTrack'), segs = $$('.hx-seg'), slides = $$('.hx-slide', track);
  const N = slides.length; // приветствие + три направления; сегмент прогресса k = слайд k + 1
  // Прибор лежит внутри своего слайда и едет вместе с текстом. Текст каждого слайда появляется
  // после прибора — плавно, по строкам; уходящий текст гаснет до начала сдвига
  slides.forEach((sl, k) => { if (k) gsap.set(txt(sl), { opacity: 0, y: 28 }); });
  const reveal = (sl, delay) => {
    gsap.fromTo($$('.hx-stage', sl), { scale: .94, opacity: .6 }, { scale: 1, opacity: 1, duration: 1.6, ease: 'sine.inOut', overwrite: 'auto' });
    gsap.to(txt(sl), { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: .1, delay, overwrite: true });
  };
  // Одна прокрутка — одно направление. Слайды переключаются анимацией по времени, а не по положению
  // скролла, поэтому промежуточных состояний («застывший» на середине текст) не бывает.
  let idx = 0, busy = false, doneAt = -1e9;
  const justDone = now => now - doneAt < 1500; // хвост инерции после переключения
  const go = (i, scroll) => {
    i = Math.max(0, Math.min(N - 1, i));
    const changed = i !== idx, prev = slides[idx]; idx = i;
    hero.dataset.active = i;
    if (changed) {
      gsap.to(txt(prev), { opacity: 0, y: -12, duration: .45, ease: 'power1.in', stagger: .02, overwrite: true });
      gsap.to($$('.hx-stage', prev), { scale: .94, opacity: .6, duration: 1.4, ease: 'sine.inOut', overwrite: 'auto' });
      reveal(slides[i], 1.15); // текст — когда прибор уже на месте
    }
    gsap.to(track, { xPercent: -100 * i / N, duration: 1.6, ease: 'sine.inOut', overwrite: true });
    segs.forEach((g, k) => { g.classList.toggle('is-on', k + 1 === i); gsap.to(g, { '--p': k + 1 <= i ? 1 : 0, duration: .8, ease: 'power2.inOut', overwrite: true }); });
    if (scroll) {
      busy = true;
      const y = st.start + step() * i;
      const done = () => { if (busy) { busy = false; doneAt = performance.now(); } };
      const settle = () => setTimeout(done, 500); // ждём, пока проявится текст
      U.lenis ? U.lenis.scrollTo(y, { duration: 1.6, lock: true, force: true, onComplete: settle }) : (scrollTo({ top: y, behavior: 'smooth' }), setTimeout(done, 2100));
      setTimeout(done, 2500); // страховка
    }
    return changed;
  };
  const step = () => innerHeight * (small ? .9 : 1.1);
  const st = ScrollTrigger.create({
    trigger: hero, start: 'top top', end: () => '+=' + step() * (N - 1), pin: '.hx-pin', anticipatePin: 1,
    // если попали в блок не колесом (клавиши, ползунок, якорь) — показываем ближайший слайд целиком
    onUpdate: self => { if (!busy) { const a = Math.round(self.progress * (N - 1)); if (a !== idx) go(a); } }
  });
  // Пока листаем направления — хедер стоит на месте (app.js не прячет его при body.in-scene).
  // Зона чуть длиннее блока, чтобы на последнем слайде хедер не уезжал
  ScrollTrigger.create({ trigger: hero, start: 'top top', end: () => '+=' + (step() * (N - 1) + innerHeight * .25), toggleClass: { targets: document.body, className: 'in-scene' } });
  go(0);
  // Колесо и свайп внутри закреплённого блока: жест = ровно один слайд, Lenis на это время не листает страницу
  const inZone = () => scrollY >= st.start - 2 && scrollY <= st.end + 2;
  const handle = (dir, e) => {
    if (!inZone()) return;
    if (busy) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    const next = idx + dir;
    if (next < 0 || next > N - 1) return;           // крайний слайд — дальше обычная прокрутка страницы
    e.preventDefault(); e.stopImmediatePropagation();
    go(next, true);
  };
  // Инерция тачпада шлёт события ещё ~1 с после жеста: новый жест принимаем только после паузы в колесе
  let lastWheel = 0;
  window.addEventListener('wheel', e => {
    const now = performance.now(), gap = now - lastWheel; lastWheel = now;
    if (!inZone()) return;
    if (Math.abs(e.deltaY) < 4 || (gap < 160 && !busy && justDone(now))) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    handle(e.deltaY > 0 ? 1 : -1, e);
  }, { capture: true, passive: false });
  let ty = null;
  window.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { capture: true, passive: true });
  window.addEventListener('touchmove', e => {
    if (ty == null) return; const d = ty - e.touches[0].clientY;
    if (inZone() && (busy || Math.abs(d) > 4)) { const dir = d > 0 ? 1 : -1; const next = idx + dir; if (busy || (next >= 0 && next < N)) e.preventDefault(); }
    if (Math.abs(d) > 40) { handle(d > 0 ? 1 : -1, e); ty = null; }
  }, { capture: true, passive: false });
  window.addEventListener('keydown', e => {
    if (!inZone() || !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) return;
    handle(e.key === 'ArrowUp' || e.key === 'PageUp' ? -1 : 1, e);
  });
  segs.forEach((g, k) => g.addEventListener('click', () => go(k + 1, true)));

  // Прибор стоит неподвижно — анимируется только смена направления

  /* Видео: обложка чуть приближается при прокрутке */
  gsap.fromTo('.video-full .video-poster', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#video', start: 'top bottom', end: 'top top', scrub: true } });

  if (!full) return;

  /* Занавес: фиолетовая панель раскрывается на всю ширину (ON) */
  gsap.fromTo('#curtainPanel',
    { clipPath: `inset(8% ${small ? 3 : 7}% 0% ${small ? 3 : 7}% round 32px 32px 0px 0px)` },
    { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'none', scrollTrigger: { trigger: '#curtainPanel', start: 'top 95%', end: 'top 15%', scrub: true } });

  /* Схема узла учёта рисуется линиями (Zeggo) */
  const lns = $$('#scheme .ln');
  lns.forEach(l => { l.setAttribute('pathLength', 1); l.style.strokeDasharray = '1'; l.style.strokeDashoffset = '1'; });
  const flowDash = $('#scheme .flow-dash'); flowDash.style.strokeDasharray = '';
  gsap.set(flowDash, { opacity: 0 });
  gsap.set('#scheme .sch-labels > *', { opacity: 0 });
  const stl = gsap.timeline({ scrollTrigger: { trigger: '#schemeWrap', start: 'top 75%', end: 'center 45%', scrub: 1 } });
  stl.to(lns.filter(l => l !== flowDash), { strokeDashoffset: 0, duration: 1, stagger: .08, ease: 'none' })
    .to('#scheme .sch-labels > *', { opacity: 1, duration: .3, stagger: .03 }, '-=.6')
    .to(flowDash, { opacity: 1, duration: .2 });
  gsap.to(flowDash, { strokeDashoffset: -60, duration: 1.2, repeat: -1, ease: 'none' });

  /* Одометры (Vast) */
  $$('.odo').forEach(el => {
    gsap.fromTo($$('.col', el), { yPercent: 0 }, {
      yPercent: (i, c) => -(10 + +c.dataset.d) * 5, duration: 2.2, ease: 'expo.out', stagger: .12,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  /* Шаги услуг и шкала-прогресс */
  const ticks = $$('#ticks i'), steps = $$('.step');
  gsap.set(steps, { opacity: .35 });
  ScrollTrigger.create({
    trigger: '#steps', start: 'top 70%', end: 'bottom 40%', scrub: true,
    onUpdate: s => {
      const n = Math.round(s.progress * ticks.length);
      ticks.forEach((t, i) => t.classList.toggle('on', i < n));
      steps.forEach((st, i) => { const on = s.progress >= i / steps.length; st.classList.toggle('is-on', on); st.style.opacity = on ? 1 : .35; });
    }
  });
})();
