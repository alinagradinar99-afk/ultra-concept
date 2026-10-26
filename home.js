// Главная v2: прелоадер, hero, сцена «внутрь прибора», манифест, направления,
// подбор, занавес, схема узла учёта, одометры, шаги услуг.
(function () {
  const U = window.ULTRA, { $, $$, I, tile, sections, products, solutions, facets, reduce, hasGsap } = U;
  const small = matchMedia('(max-width: 680px)').matches;
  const G = hasGsap && !reduce;

  /* ——— Направления (строки) ——— */
  const art = { flow: 'optiflux9090.webp', level: 'rrf5.webp', aux: 'venturi.webp' };
  $('#dirList').innerHTML = Object.entries(sections).map(([k, s], i) => `
    <a class="dir-row reveal" href="${s.url}" data-img="img/${art[k]}">
      <span class="num">0${i + 1}</span><h3>${s.name}</h3><p>${s.text}</p>
      <span class="cnt">${String(products.filter(p => p.s === k).length).padStart(2, '0')} поз. ${I.ne}</span>
    </a>`).join('');
  // Фото направления едет за курсором
  const fl = $('#dirFloat'), flImg = $('img', fl);
  if (G) {
    const qx = gsap.quickTo(fl, 'x', { duration: .6, ease: 'power3' }), qy = gsap.quickTo(fl, 'y', { duration: .6, ease: 'power3' });
    $('#dirList').addEventListener('pointermove', e => { qx(e.clientX); qy(e.clientY); });
  }
  $$('.dir-row').forEach(r => {
    r.addEventListener('pointerenter', () => { flImg.src = r.dataset.img; fl.classList.add('is-on'); });
    r.addEventListener('pointerleave', () => fl.classList.remove('is-on'));
  });

  /* ——— Подбор ——— */
  const st = { s: 'flow', medium: '', ex: '' };
  const out = $('[data-picker-out]'), nEl = $('[data-picker-n]');
  function renderPicker() {
    const list = products.filter(p => p.s === st.s && (!st.medium || p.medium.includes(st.medium)) && (!st.ex || p.ex));
    const from = { v: +nEl.textContent || 0 };
    if (G) gsap.to(from, { v: list.length, duration: .6, ease: 'power2.out', onUpdate: () => nEl.textContent = String(Math.round(from.v)).padStart(2, '0') });
    else nEl.textContent = String(list.length).padStart(2, '0');
    $$('[data-pick="medium"] button').forEach(b => { const v = b.dataset.v; b.disabled = !!v && !products.some(p => p.s === st.s && p.medium.includes(v)); });
    out.innerHTML = list.slice(0, 6).map(tile).join('') || '<div class="empty"><p>Готового прибора нет</p>Инженер подберёт решение по опросному листу.</div>';
    if (G) gsap.from($$('.tile', out), { opacity: 0, y: 24, duration: .8, stagger: .05, ease: 'expo.out' });
    const q = new URLSearchParams({ s: st.s }); if (st.medium) q.set('medium', st.medium); if (st.ex) q.set('ex', 'Взрывозащищенное Ex');
    $('[data-picker-link]').href = 'catalog.html?' + q;
  }
  $$('[data-pick]').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    $$('button', g).forEach(x => x.setAttribute('aria-pressed', x === b));
    st[g.dataset.pick] = b.dataset.v;
    if (g.dataset.pick === 's') { st.medium = ''; $$('[data-pick="medium"] button').forEach((x, i) => x.setAttribute('aria-pressed', i === 0)); }
    renderPicker();
  }));
  renderPicker();

  /* ——— Отраслевые решения: лесенка ——— */
  $('#stairs').innerHTML = solutions.map((s, i) => {
    const n = products.filter(p => p.industry.includes(s.industry)).length;
    return `<a class="stair reveal" href="catalog.html?industry=${encodeURIComponent(s.industry)}"><span class="label">0${i + 1}</span>
      <div><h3>${s.name}</h3><p>${s.text}</p><span class="go">${n} приборов в фильтре →</span></div></a>`;
  }).join('');
  $('#indChips').innerHTML = facets.industry.values.map(v => `<a class="chip" href="catalog.html?industry=${encodeURIComponent(v)}">${v}</a>`).join('');

  $('#inlineForm').innerHTML = U.formHtml('inline');
  U.bindForms($('#inlineForm'));

  /* ——— Одометры: колонки цифр ——— */
  $$('[data-odo]').forEach(el => {
    const val = el.dataset.odo, unit = el.dataset.unit;
    el.innerHTML = '<div class="win">' + [...val].map(ch => /\d/.test(ch)
      ? `<span class="col" data-d="${ch}">${Array.from({ length: 20 }, (_, i) => `<span>${i % 10}</span>`).join('')}</span>`
      : `<span class="static">${ch}</span>`).join('') + '</div>' + (unit ? `<span class="unit">${unit}</span>` : '');
  });

  // Манифест: разбиваем на слова
  const man = $('#manifesto');
  (function split(n) {
    [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) { f.append(w); return; } const s = document.createElement('span'); s.className = 'w'; s.textContent = w; f.append(s); });
        c.replaceWith(f);
      } else if (c.nodeType === 1) { c.style.fontStyle = 'normal'; split(c); [...c.querySelectorAll('.w')].forEach(w => w.dataset.hl = 1); }
    });
  })(man);

  // Шкала-прогресс услуг
  $('#ticks').innerHTML = '<i></i>'.repeat(small ? 24 : 48);

  /* ——— Без анимаций: показываем всё в финальном состоянии ——— */
  if (!G) {
    $('#preloader').remove();
    $$('.chapter, .chapter-note').forEach((c, i) => c.style.display = c.dataset.ch === '3' ? '' : 'none');
    $$('.odo .col').forEach(c => c.style.transform = `translateY(-${(10 + +c.dataset.d) * 5}%)`);
    $$('.manifesto .w').forEach(w => w.style.color = w.dataset.hl ? 'var(--accent)' : 'var(--text)');
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
    if (small) gsap.from('#heroTitle', { y: 24, duration: 1.2, ease: 'expo.out' });
    else U.blurIn($('#heroTitle'), { delay: .1, stagger: .018 });
    gsap.to('#hero .reveal', { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .12, delay: .4 });
    window.DEVICE && window.DEVICE.start();
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

  /* Hero: параллакс при уходе */
  gsap.to('.hero-text', { yPercent: -18, opacity: .25, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('#device', { yPercent: 12, scale: .92, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ——— Сцена «внутрь прибора»: закреплена, камера движется по прокрутке ——— */
  const S = window.SCENE.state;
  const ch = $$('.chapter'), notes = $$('.chapter-note'), dots = $$('#sceneDots i'), counter = $('#sceneCounter');
  gsap.set([...ch, ...notes], { autoAlpha: 0, y: 40 });
  gsap.set([ch[0], notes[0]], { autoAlpha: 1, y: 0 });
  const showCh = (i) => {
    dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
    counter.textContent = `0${i + 1} / 04`;
  };
  // Отверстие фланца на фото — точка, в которую «влетает» камера
  gsap.set('#specimen', { transformOrigin: '25% 58%' });
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#scene', start: 'top top', end: small ? '+=300%' : '+=420%', pin: true, scrub: 1, anticipatePin: 1,
      onUpdate: self => showCh(Math.min(3, Math.floor(self.progress * 4.0001 - (self.progress > .99 ? .001 : 0))))
    }
  });
  const swap = (a, b, at) => {
    tl.to([ch[a], notes[a]], { autoAlpha: 0, y: -40, duration: .4, ease: 'power2.in' }, at)
      .fromTo([ch[b], notes[b]], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .5, ease: 'power2.out' }, at + .35);
  };
  tl.from('#frame .scene-tag', { autoAlpha: 0, x: i => i < 2 ? -20 : 20, stagger: .1, duration: .4 }, 0)
    .to({}, { duration: .6 })                                                // пауза на приборе
    .to('#frame', { autoAlpha: 0, scale: 1.3, duration: .6 }, 1)
    .to('#specimen', { scale: small ? 9 : 12, duration: 1.6, ease: 'power2.in' }, 1)
    .to('#specimen', { autoAlpha: 0, duration: .5 }, 2.2)
    .to(S, { tunnel: 1, duration: .6 }, 2.1)
    .fromTo(S, { speed: .6 }, { speed: 1.6, duration: 2.2 }, 2.1);
  swap(0, 1, 1.9);
  tl.to(S, { tunnel: 0, duration: .6 }, 4.3)
    .to(S, { vortex: 1, duration: .6 }, 4.4)
    .fromTo(S, { speed: .8 }, { speed: 1.4, duration: 2.4 }, 4.4);
  swap(1, 2, 4.3);
  swap(2, 3, 6.6);
  // Камера выходит из трубы обратно к прибору — сцена замыкается
  tl.to(S, { vortex: .18, duration: .8 }, 6.6)
    .to('#specimen', { scale: 1, autoAlpha: 1, duration: 1.2, ease: 'power3.out' }, 6.7)
    .to('#frame', { autoAlpha: 1, scale: 1, duration: .6 }, 7.4)
    .to({}, { duration: .7 }, 8);

  // Круглый бейдж прячется, пока идёт сцена
  ScrollTrigger.create({ trigger: '#scene', start: 'top 60%', end: () => tl.scrollTrigger.end + innerHeight * .4, toggleClass: { targets: document.body, className: 'in-scene' } });

  /* Манифест: слова закрашиваются */
  gsap.to('.manifesto .w', {
    color: (i, el) => el.dataset.hl ? '#3ee6c8' : '#f2eff7', stagger: .1, ease: 'none',
    scrollTrigger: { trigger: man, start: 'top 78%', end: 'bottom 45%', scrub: true }
  });

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
