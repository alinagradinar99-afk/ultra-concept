// Главная: прелоадер, первый экран с горизонтальной прокруткой по направлениям, каталог, видео,
// подбор, занавес, схема узла учёта, одометры, шаги услуг.
(function () {
  const U = window.ULTRA, { $, $$, I, tile, sections, products, solutions, facets, reduce, hasGsap } = U;
  const small = matchMedia('(max-width: 680px)').matches;
  const G = hasGsap && !reduce;

  /* ——— Отраслевые решения: лесенка ——— */
  $('#stairs').innerHTML = solutions.map((s, i) => {
    const n = products.filter(p => p.industry.includes(s.industry)).length;
    return `<a class="stair reveal" href="catalog.html?industry=${encodeURIComponent(s.industry)}"><span class="label">0${i + 1}</span>
      <div><h3>${s.name}</h3><p>${s.text}</p><span class="go">${n} приборов в фильтре →</span></div></a>`;
  }).join('');

  $('#inlineForm').innerHTML = U.formHtml('inline');
  U.bindForms($('#inlineForm'));

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
  $('#ticks').innerHTML = '<i></i>'.repeat(small ? 24 : 48);

  /* ——— Без анимаций: показываем всё в финальном состоянии ——— */
  if (!G) {
    $('#preloader').remove();
    $$('.odo .col').forEach(c => c.style.transform = `translateY(-${(10 + +c.dataset.d) * 5}%)`);
    $$('#ticks i').forEach(i => i.classList.add('on'));
    U.ready();
    return;
  }

  /* ========== Анимации (GSAP) ========== */

  /* Прелоадер-HUD: один раз за сессию */
  const pre = $('#preloader');
  const seen = sessionStorage.getItem('ultraSeen') || sessionStorage.getItem('ultraNav');
  const heroIn = () => {
    // На мобильном заголовок не прячем (opacity 0 задерживает LCP) — только лёгкий сдвиг
    gsap.from('.hx-slide[data-i="0"] .hx-num, .hx-slide[data-i="0"] .hx-copy > *, .hx-slide[data-i="0"] .hx-facts, .hx-progress', { opacity: 0, y: 24, duration: 1.2, ease: 'expo.out', stagger: .08, delay: .2 });
    gsap.from('.hx-stage', { opacity: 0, scale: .86, duration: 1.8, ease: 'expo.out' }); // анимируем сцену целиком: у самих приборов прозрачностью управляет прокрутка
  };
  if (seen) { pre.remove(); U.ready(); heroIn(); }
  else {
    sessionStorage.setItem('ultraSeen', 1);
    U.lenis && U.lenis.stop();
    const cnt = $('#plCount'), arc = $('#plArc'), p = { v: 0 };
    $$('.orbit', pre).forEach(g => gsap.to(g, { rotation: 360 * Math.sign(+g.dataset.s), duration: 6 / Math.abs(+g.dataset.s), repeat: -1, ease: 'none', svgOrigin: '0 0' }));
    gsap.from($$('.ring', pre), { attr: { r: 0 }, opacity: 0, duration: 1.6, stagger: .1, ease: 'expo.out' });
    gsap.from('.pl-tag', { opacity: 0, filter: 'blur(8px)', duration: 1, stagger: .2, delay: .4 });
    gsap.timeline()
      .to(p, { v: 100, duration: 2.6, ease: 'power2.inOut', onUpdate: () => { cnt.textContent = String(Math.round(p.v)).padStart(3, '0'); arc.setAttribute('stroke-dashoffset', 1 - p.v / 100); } })
      .to(pre.querySelector('svg'), { rotationX: 68, scale: 1.5, opacity: 0, duration: 1.1, ease: 'expo.in', transformPerspective: 900 }, '+=.15')
      .to('.pl-tag, .pl-brand, .pl-count', { opacity: 0, y: -20, duration: .6, stagger: .04 }, '<')
      .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut', onStart: heroIn, onComplete: () => { pre.remove(); U.lenis && U.lenis.start(); } }, '-=.3');
    U.ready({ holdCurtain: false });
  }

  /* ——— Первый экран: вертикальная прокрутка двигает направления по горизонтали ——— */
  const hero = $('#hero'), track = $('#hxTrack'), devs = $$('.hx-dev'), segs = $$('.hx-seg');
  const N = devs.length;
  // Прибор не исчезает, а сменяется: новый «встаёт» с лёгким поворотом и масштабом
  let shown = -1;
  const showDev = i => {
    if (i === shown) return;
    const dir = i > shown ? 1 : -1; shown = i;
    devs.forEach((d, k) => d.classList.toggle('is-on', k === i));
    gsap.fromTo(devs[i], { rotationY: 28 * dir, scale: .9, xPercent: 6 * dir }, { rotationY: 0, scale: 1, xPercent: 0, duration: 1, ease: 'expo.out', overwrite: true });
  };
  showDev(0);
  const htl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero, start: 'top top', end: () => '+=' + innerHeight * (N - 1) * (small ? .9 : 1.1), pin: '.hx-pin', scrub: 1, anticipatePin: 1,
      snap: { snapTo: 1 / (N - 1), duration: { min: .3, max: .8 }, ease: 'power2.inOut', delay: .08 },
      onUpdate: self => {
        const p = self.progress * (N - 1), a = Math.round(p);
        if (hero.dataset.active != a) hero.dataset.active = a;
        showDev(a);
        segs.forEach((g, i) => { g.style.setProperty('--p', Math.max(0, Math.min(1, p - i + 1))); g.classList.toggle('is-on', i === a); });
      }
    }
  });
  // круглый бейдж «Отправить запрос» не мешает прогрессу, пока закреплён первый экран
  ScrollTrigger.create({ trigger: hero, start: 'top top', end: () => htl.scrollTrigger.end, toggleClass: { targets: document.body, className: 'in-scene' } });
  htl.to(track, { xPercent: -100 * (N - 1) / N, duration: N - 1 }, 0);
  segs.forEach((g, i) => g.addEventListener('click', () => {
    const st = htl.scrollTrigger, y = st.start + (st.end - st.start) * i / (N - 1);
    U.lenis ? U.lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' });
  }));

  // «Живой» прибор: парит и наклоняется за курсором
  const stage = $('#device'), look = { x: 0, y: 0 };
  gsap.to(stage, { y: -12, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true });
  const sway = gsap.fromTo(look, { x: -5 }, { x: 5, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
  hero.addEventListener('pointermove', e => {
    sway.pause();
    gsap.to(look, { x: (e.clientX / innerWidth - .5) * 18, y: (e.clientY / innerHeight - .5) * -10, duration: 1.2, ease: 'power3.out', overwrite: true });
  });
  hero.addEventListener('pointerleave', () => gsap.to(look, { x: 0, y: 0, duration: 1.2, onComplete: () => sway.restart() }));
  gsap.ticker.add(() => { if (htl.scrollTrigger.isActive || scrollY < innerHeight) gsap.set(stage, { rotationY: look.x, rotationX: look.y, transformPerspective: 1400 }); });

  /* Видео: обложка чуть приближается при прокрутке */
  gsap.fromTo('.video-full .video-poster', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#video', start: 'top bottom', end: 'top top', scrub: true } });

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
