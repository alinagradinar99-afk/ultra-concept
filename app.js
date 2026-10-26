// Общие части концепции v2: шапка-плашки, плавная прокрутка (Lenis + GSAP),
// шторка переходов, поиск, плитки, форма запроса, базовые анимации.
(function () {
  const D = window.ULTRA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!window.gsap;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9h16M4 15h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16M14 6l6 6-6 6"/></svg>',
    ne: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4v12M6 11l6 6 6-6M5 20h14"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 9 6 6 6-6"/></svg>',
    clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="30" height="30"><path d="m5 12 5 5L20 7"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 18 4-6"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>'
  };
  const logoSvg = '<svg viewBox="0 0 34 34" fill="none"><rect width="34" height="34" fill="#5b2d90"/><path d="M10 8v10a7 7 0 0 0 14 0V8M17 8v10" stroke="#fff" stroke-width="2.4"/></svg>';
  const page = document.body.dataset.page;
  const count = s => D.products.filter(p => p.s === s).length;

  /* ——— Шапка, меню, подвал ——— */
  const header = `
    <header class="header" id="header">
      <a class="logo" href="index.html" aria-label="ГК «УЛЬТРА», на главную">${logoSvg}<span><small>ГРУППА КОМПАНИЙ</small><b>УЛЬТРА</b></span></a>
      <nav class="plates" aria-label="Основное меню">
        <div class="has-mega"><a class="plate ${page !== 'home' ? 'is-active' : ''}" href="catalog.html">Каталог ${I.chev}</a>
          <div class="mega">${Object.entries(D.sections).map(([k, s]) => `<a href="${s.url}"><b>${s.name}</b><span>${s.text}</span><i>${String(count(k)).padStart(2, '0')} позиций →</i></a>`).join('')}</div>
        </div>
        <a class="plate" href="index.html#solutions">Решения ${I.chev}</a>
        <a class="plate" href="index.html#services">Услуги ${I.chev}</a>
        <a class="plate" href="index.html#company">Компания ${I.chev}</a>
        <a class="plate" href="index.html#ql">Документация ${I.chev}</a>
      </nav>
      <div class="h-actions">
        <button class="icon-btn" data-search aria-label="Поиск по сайту">${I.search}</button>
        <a class="icon-btn" href="tel:+74999677799" aria-label="Позвонить +7 (499) 967-77-99">${I.phone}</a>
        <button class="btn btn-accent btn-s h-cta" data-modal="Запрос ТКП">Отправить запрос ${I.arrow}</button>
        <button class="icon-btn burger" aria-label="Меню" aria-expanded="false">${I.menu}</button>
      </div>
    </header>
    <div class="mobile-menu" id="mobileMenu">
      ${[['Каталог', 'catalog.html'], ['Решения', 'index.html#solutions'], ['Услуги', 'index.html#services'], ['Компания', 'index.html#company'], ['Опросные листы', 'index.html#ql'], ['Контакты', '#contacts']]
        .map(([t, u], i) => `<a class="mm-link" href="${u}">${t}<i>0${i + 1}</i></a>`).join('')}
      <div class="mm-foot">
        <a class="btn btn-line" href="tel:+74999677799">+7 (499) 967-77-99 ${I.phone}</a>
        <button class="btn btn-accent" data-modal="Запрос ТКП">Отправить запрос ${I.arrow}</button>
      </div>
    </div>
    <div class="search-layer" id="search" role="dialog" aria-label="Поиск"><div class="search-box">
      <span class="label br">Поиск по сайту</span>
      <input type="search" placeholder="Прибор, тип или задача" aria-label="Поиск">
      <div class="search-hint">Например: вихревой · пар · RRF · поверка  ·  Esc — закрыть</div>
      <div class="search-results"></div>
    </div></div>
    <div class="curtain" aria-hidden="true"><i></i><i></i><b>[ УЛЬТРА ]</b></div>
    <button class="badge-cta" data-modal="Запрос ТКП" aria-label="Отправить запрос">
      <svg class="txt" viewBox="0 0 100 100"><defs><path id="bc" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0"/></defs><text><textPath href="#bc">ОТПРАВИТЬ ЗАПРОС · ОТПРАВИТЬ ЗАПРОС · </textPath></text></svg>
      <svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17 17 7M9 7h8v8"/></svg>
    </button>`;

  const footer = `
    <footer class="footer" id="contacts"><div class="wrap">
      <div class="footer-grid">
        <div><a class="logo" href="index.html">${logoSvg}<span><small>ГРУППА КОМПАНИЙ</small><b>УЛЬТРА</b></span></a>
          <ul style="margin-top:24px"><li><a class="mono" href="tel:+74999677799">+7 (499) 967-77-99</a></li><li><a href="mailto:sales.msh@ultra-gk.ru">sales.msh@ultra-gk.ru</a></li><li style="color:var(--muted)">111033, Москва, ул. Крузенштерна, 7</li></ul></div>
        <div><h5>Каталог</h5><ul>${Object.values(D.sections).map(s => `<li><a href="${s.url}">${s.name}</a></li>`).join('')}</ul></div>
        <div><h5>Услуги</h5><ul><li><a href="#">Метрология и поверка</a></li><li><a href="#">Техобслуживание</a></li><li><a href="#">Сертификация</a></li></ul></div>
        <div><h5>Компания</h5><ul><li><a href="#">ГК УЛЬТРА</a></li><li><a href="#">УЛЬТРАМАШ</a></li><li><a href="#">УЛЬТРА-СТАНДАРТ</a></li><li><a href="#">КРОНЕ-Автоматика</a></li><li><a href="#">Вакансии</a></li></ul></div>
        <div><h5>Документация</h5><ul><li><a href="index.html#ql">Опросные листы</a></li><li><a href="#">Справочный центр</a></li><li><a href="#">Новости</a></li><li><a href="#">Политика ПДн</a></li></ul></div>
      </div>
      <div class="footer-word" aria-hidden="true">${'УЛЬТРА'.split('').map(c => `<span>${c}</span>`).join('')}</div>
      <div class="footer-bottom"><span>© ООО «ГК УЛЬТРА», 2026</span><span>Разработка, производство и поверка КИПиА</span><span>Концепция · Атвинта</span></div>
    </div></footer>
    <div class="modal" id="modal" role="dialog" aria-modal="true">${formHtml('modal')}</div>`;

  function formHtml(id) {
    return `<form class="form" novalidate data-form>
      ${id === 'modal' ? `<button type="button" class="icon-btn modal-close" aria-label="Закрыть">${I.close}</button>` : ''}
      <span class="label br" style="margin-bottom:14px">Запрос</span>
      <h3 data-form-title>Запрос ТКП</h3>
      <p class="sub">Инженер ответит в течение рабочего дня</p>
      <div class="field" data-product-field><input id="${id}-p" name="product" placeholder=" "><label for="${id}-p">Прибор или задача</label></div>
      <div class="row">
        <div class="field"><input id="${id}-n" name="name" placeholder=" " required><label for="${id}-n">Имя *</label></div>
        <div class="field"><input id="${id}-c" name="company" placeholder=" "><label for="${id}-c">Компания</label></div>
      </div>
      <div class="row">
        <div class="field"><input id="${id}-t" name="phone" type="tel" placeholder=" " required><label for="${id}-t">Телефон *</label></div>
        <div class="field"><input id="${id}-e" name="email" type="email" placeholder=" "><label for="${id}-e">Эл. почта</label></div>
      </div>
      <label class="drop" data-drop>${I.clip}<span>Прикрепить опросный лист или ТЗ</span><input type="file"></label>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-accent btn-submit" type="submit">Отправить запрос ${I.arrow}</button>
      <p class="legal">Нажимая кнопку, вы соглашаетесь с <a href="#">политикой обработки персональных данных</a></p>
      <div class="form-done"><div><div class="check">${I.check}</div><h3>Заявка отправлена</h3><p>Номер заявки <span class="mono" style="color:var(--text)">№ ${Math.floor(10000 + Math.random() * 89999)}</span>. Инженер свяжется с вами в течение рабочего дня.</p></div></div>
    </form>`;
  }

  $('#header-slot').outerHTML = header;
  $('#footer-slot').outerHTML = footer;
  $$('i[data-i]').forEach(i => { i.outerHTML = I[i.dataset.i]; });

  /* ——— Плитка товара ——— */
  function tile(p) {
    const s = Object.entries(p.key).slice(0, 4);
    return `<article class="tile">
      <div class="tile-img"><div class="badges">${p.soon ? '<span class="badge soon">Скоро</span>' : ''}</div>
        <img src="img/${p.img}" alt="${p.type} ${p.name}" loading="lazy"></div>
      <div class="tile-body">
        <div class="tile-type">${p.type}</div>
        <h3 class="tile-name">${p.name}</h3>
        <dl class="specs">${s.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <div class="tile-foot"><span class="link">Подробнее</span><button class="ql" data-modal="Запрос ТКП" data-product="${p.type} ${p.name}">Запросить ТКП</button></div>
      </div>
      <a class="cover" href="product.html?id=${p.id}" aria-label="${p.type} ${p.name}"></a>
    </article>`;
  }

  /* ——— Плавная прокрутка ——— */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    }
  }
  const scrollTo = (target) => lenis ? lenis.scrollTo(target, { offset: -70 }) : document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  const lock = on => { if (lenis) on ? lenis.stop() : lenis.start(); document.body.style.overflow = on ? 'hidden' : ''; };

  // Якоря на этой же странице — плавно
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.hash && url.search === location.search) {
      const t = document.querySelector(url.hash); if (!t) return;
      e.preventDefault(); closeMenu(); scrollTo(url.hash);
    }
  });

  /* ——— Шапка: прячется при прокрутке вниз ——— */
  const hdr = $('#header'), badge = $('.badge-cta');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-hidden', y > 300 && y > lastY && !$('#mobileMenu').classList.contains('is-open'));
    badge.classList.toggle('is-on', y > innerHeight * .9);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = $('.burger'), mm = $('#mobileMenu');
  function closeMenu() { mm.classList.remove('is-open'); burger.innerHTML = I.menu; burger.setAttribute('aria-expanded', false); lock(false); }
  burger.addEventListener('click', () => {
    const open = !mm.classList.contains('is-open');
    if (!open) return closeMenu();
    mm.classList.add('is-open'); burger.innerHTML = I.close; burger.setAttribute('aria-expanded', true); lock(true);
    if (hasGsap && !reduce) gsap.from($$('.mm-link', mm), { yPercent: 60, opacity: 0, stagger: .05, duration: .9, ease: 'expo.out', delay: .15 });
  });

  /* ——— Поиск (ТЗ 6.9) ——— */
  const sl = $('#search'), si = $('input', sl), sr = $('.search-results', sl);
  const index = [
    ...D.products.map(p => ({ t: p.name, s: p.type, u: `product.html?id=${p.id}`, q: `${p.name} ${p.type} ${p.medium.join(' ')}` })),
    ...Object.values(D.sections).map(s => ({ t: s.name, s: 'Раздел каталога', u: s.url, q: s.name + ' ' + s.text })),
    { t: 'Поверка и калибровка расходомеров', s: 'Услуга', u: 'index.html#services', q: 'поверка калибровка метрология' },
    { t: 'Опросные листы', s: 'Документация', u: 'index.html#ql', q: 'опросный лист' }
  ];
  const openSearch = () => { sl.classList.add('is-open'); lock(true); setTimeout(() => si.focus(), 60); };
  const closeSearch = () => { if (sl.classList.contains('is-open')) { sl.classList.remove('is-open'); lock(false); } };
  $$('[data-search]').forEach(b => b.addEventListener('click', openSearch));
  sl.addEventListener('click', e => { if (e.target === sl) closeSearch(); });
  si.addEventListener('input', () => {
    const q = si.value.trim().toLowerCase();
    sr.innerHTML = !q ? '' : index.filter(x => x.q.toLowerCase().includes(q)).slice(0, 8)
      .map(x => `<a href="${x.u}"><span>${x.t}</span><small>${x.s}</small></a>`).join('') || '<div class="search-hint">Ничего не нашли — оставьте запрос, инженер подберёт прибор</div>';
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSearch(); closeModal(); }
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });

  /* ——— Модалка запроса ——— */
  const modal = $('#modal');
  function closeModal() { if (modal.classList.contains('is-open')) { modal.classList.remove('is-open'); lock(false); } }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-modal]');
    if (b) {
      e.preventDefault(); closeMenu();
      const f = $('form', modal); f.classList.remove('is-sent'); f.reset();
      $('[data-form-title]', f).textContent = b.dataset.modal;
      $('[data-product-field]', f).style.display = b.dataset.modal === 'Заказать звонок' ? 'none' : '';
      if (b.dataset.product) $('input[name=product]', f).value = b.dataset.product; // автоподстановка товара (ТЗ 6.5)
      modal.classList.add('is-open'); lock(true);
    }
    if (e.target === modal || e.target.closest('.modal-close')) closeModal();
  });

  // Формы: honeypot вместо CAPTCHA (ТЗ 7.4), перетаскивание файла
  function bindForms(root = document) {
    $$('[data-form]', root).forEach(f => {
      if (f.dataset.bound) return; f.dataset.bound = 1;
      f.addEventListener('submit', e => {
        e.preventDefault();
        const bad = $$('[required]', f).filter(i => !i.value.trim());
        bad.forEach(i => { i.style.borderColor = '#ff6b8a'; i.addEventListener('input', () => i.style.borderColor = '', { once: true }); });
        if (!bad.length && !f.website.value) f.classList.add('is-sent');
      });
      const d = $('[data-drop]', f), fi = $('input', d);
      ['dragenter', 'dragover'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add('is-over'); }));
      ['dragleave', 'drop'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove('is-over'); }));
      d.addEventListener('drop', e => { if (e.dataTransfer.files[0]) $('span', d).textContent = e.dataTransfer.files[0].name; });
      fi.addEventListener('change', () => { if (fi.files[0]) $('span', d).textContent = fi.files[0].name; });
    });
  }
  bindForms();

  /* ——— Шторка переходов между страницами ——— */
  const cur = $('.curtain'), [c1, c2] = $$('i', cur), cLabel = $('b', cur);
  function curtainOut() {
    document.documentElement.classList.remove('arriving');
    if (!hasGsap || reduce || !sessionStorage.getItem('ultraNav')) return;
    sessionStorage.removeItem('ultraNav');
    gsap.set([c1, c2], { scaleY: 1, transformOrigin: 'top' }); gsap.set(cLabel, { opacity: 1 });
    gsap.timeline()
      .to(cLabel, { opacity: 0, duration: .3 })
      .to(c2, { scaleY: 0, duration: .8, ease: 'expo.inOut' }, 0)
      .to(c1, { scaleY: 0, duration: .9, ease: 'expo.inOut' }, .1);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || !hasGsap || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // якорь — обрабатывается выше
    e.preventDefault();
    sessionStorage.setItem('ultraNav', 1);
    gsap.set([c1, c2], { scaleY: 0, transformOrigin: 'bottom' });
    gsap.timeline({ onComplete: () => { location.href = url.href; } })
      .to(c1, { scaleY: 1, duration: .7, ease: 'expo.inOut' })
      .to(c2, { scaleY: 1, duration: .7, ease: 'expo.inOut' }, .12)
      .to(cLabel, { opacity: 1, duration: .25 }, .5);
  });
  addEventListener('pageshow', e => { if (e.persisted && hasGsap) gsap.set([c1, c2], { scaleY: 0 }); });

  /* ——— Анимации ——— */
  // Посимвольное проявление из размытия (как у ON.energy)
  function splitChars(el) {
    const out = [];
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(' '); return; }
          const word = document.createElement('span'); word.style.cssText = 'display:inline-block;white-space:nowrap';
          [...w].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; word.append(s); out.push(s); });
          frag.append(word);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && !c.classList.contains('sub')) walk(c);
    });
    el.classList.add('blur-chars'); walk(el);
    return out;
  }
  function blurIn(el, opts = {}) {
    const chars = splitChars(el);
    if (!hasGsap || reduce) return null;
    return gsap.from(chars, { opacity: 0, filter: 'blur(16px)', x: -10, duration: 1.3, ease: 'expo.out', stagger: .028, ...opts });
  }

  function initReveals(root = document) {
    if (!hasGsap || reduce) { $$('.reveal', root).forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; }); return; }
    ScrollTrigger.batch($$('.reveal', root), {
      start: 'top 90%', once: true,
      onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .08, overwrite: true })
    });
    $$('[data-blur]', root).forEach(el => blurIn(el, { scrollTrigger: { trigger: el, start: 'top 85%' } }));
  }

  function initFooter() {
    if (!hasGsap || reduce) return;
    gsap.from('.footer-word span', { yPercent: 100, opacity: 0, stagger: .06, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer-word', start: 'top 95%' } });
  }

  window.ULTRA = Object.assign(D, { $, $$, I, reduce, tile, formHtml, bindForms, blurIn, initReveals, curtainOut, lenis, scrollTo, hasGsap });

  // Запуск: каждая страница вызывает ULTRA.ready() после своей разметки
  window.ULTRA.ready = function (opts = {}) {
    initReveals(); initFooter();
    if (!opts.holdCurtain) curtainOut();
    if (hasGsap) { ScrollTrigger.refresh(); addEventListener('load', () => ScrollTrigger.refresh()); }
    if (location.hash && lenis) setTimeout(() => scrollTo(location.hash), 400);
  };
})();
