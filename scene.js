// Холст главной и телеметрия hero.
// sceneCanvas — сцена «внутрь прибора»: туннель трубы с параболическим профилем скорости
//    и дорожка Кармана за телом обтекания. Режимы смешиваются через SCENE.state (им управляет GSAP).
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 680px)').matches;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const ACC = '62,230,200', VIO = '155,107,255', WHITE = '242,239,247';

  function setup(cv) {
    const ctx = cv.getContext('2d');
    const o = { cv, ctx, W: 0, H: 0, on: true };
    o.resize = () => { o.W = cv.clientWidth; o.H = cv.clientHeight; cv.width = o.W * DPR; cv.height = o.H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
    o.resize();
    addEventListener('resize', () => { clearTimeout(o.t); o.t = setTimeout(() => { o.resize(); o.onResize && o.onResize(); }, 150); });
    new IntersectionObserver(([e]) => { const was = o.on; o.on = e.isIntersecting; if (o.on && !was) requestAnimationFrame(o.loop); }).observe(cv);
    return o;
  }
  const fade = (o, a) => { const c = o.ctx; c.globalCompositeOperation = 'destination-out'; c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(0, 0, o.W, o.H); c.globalCompositeOperation = 'source-over'; };

  /* ——— Живая телеметрия в hero ——— */
  const live = [...document.querySelectorAll('[data-live]')];
  setInterval(() => live.forEach(el => {
    const [b, a, d] = el.dataset.live.split(',').map(Number);
    el.firstChild.textContent = (b + (Math.random() * 2 - 1) * a).toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });
  }), 1000);

  /* ——— 2. Сцена ——— */
  const scv = document.getElementById('sceneCanvas');
  const state = { tunnel: 0, vortex: 0, speed: 1, glow: 0 };
  window.SCENE = { state };
  if (!scv) return;
  const o = setup(scv);
  let t = 0;

  // Туннель: частицы в цилиндре (r, θ, z), камера смотрит вдоль оси
  const N = small ? 420 : 900, FAR = 14;
  const tp = Array.from({ length: N }, () => ({ r: Math.sqrt(Math.random()), a: Math.random() * Math.PI * 2, z: Math.random() * FAR + .3, pz: 0 }));
  const rings = Array.from({ length: 14 }, (_, i) => ({ z: (i / 14) * FAR + .3 }));
  function drawTunnel(alpha) {
    const c = o.ctx, cx = o.W / 2, cy = o.H / 2, R = Math.min(o.W, o.H) * .55, f = 1, sp = .035 * state.speed;
    c.globalAlpha = alpha;
    // стенки трубы — кольца, набегающие на камеру
    for (const g of rings) {
      g.z -= sp * .35; if (g.z < .3) g.z += FAR;
      const s = f / g.z, rr = R * s;
      c.strokeStyle = `rgba(${VIO},${Math.min(.35, .9 / g.z)})`; c.lineWidth = 1;
      c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.stroke();
    }
    for (const p of tp) {
      const v = (1 - p.r * p.r) * .9 + .1; // параболический профиль
      p.pz = p.z; p.z -= sp * v * 2.2;
      if (p.z < .25) { p.z += FAR; p.pz = p.z; continue; }
      const s0 = f / p.pz, s1 = f / p.z;
      const x0 = cx + Math.cos(p.a) * p.r * R * s0, y0 = cy + Math.sin(p.a) * p.r * R * s0;
      const x1 = cx + Math.cos(p.a) * p.r * R * s1, y1 = cy + Math.sin(p.a) * p.r * R * s1;
      const near = Math.min(1, 2.2 / p.z);
      c.strokeStyle = v > .7 ? `rgba(${ACC},${.25 + near * .7})` : `rgba(${WHITE},${.12 + near * .45})`;
      c.lineWidth = .6 + near * 1.6;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
    c.globalAlpha = 1;
  }

  // Дорожка Кармана: частицы + точечные вихри, срывающиеся с тела обтекания
  const M = small ? 500 : 1100;
  const vp = [], vort = [];
  const body = () => ({ x: o.W * (small ? .2 : .26), y: o.H * .44, h: Math.min(o.H * .14, 110), w: 14 });
  const seedV = () => { vp.length = 0; for (let i = 0; i < M; i++) vp.push({ x: Math.random() * o.W, y: o.H * .44 + (Math.random() * 2 - 1) * o.H * .36 }); };
  seedV(); o.onResize = seedV;
  let shed = 0, side = 1, freqShown = 42.7;
  const fNote = document.getElementById('fNote'), vNote = document.getElementById('vNote');
  function drawVortex(alpha) {
    const c = o.ctx, B = body(), U = 2.6 * state.speed;
    c.globalAlpha = alpha;
    // срыв вихрей
    if (++shed > 26 / state.speed) {
      shed = 0; side *= -1;
      vort.push({ x: B.x + B.w + 6, y: B.y + side * B.h * .5, g: -side * 2600, age: 0 });
      if (vort.length > 14) vort.shift();
    }
    for (const v of vort) { v.x += U * .82; v.age++; v.y += Math.sin(v.age * .02) * .05; }
    for (const p of vp) {
      let ux = U, uy = 0;
      for (const v of vort) {
        const dx = p.x - v.x, dy = p.y - v.y, r2 = dx * dx + dy * dy + 900;
        const k = v.g / (2 * Math.PI * r2) * Math.exp(-v.age / 260);
        ux += -dy * k; uy += dx * k;
      }
      // обтекание тела
      const bx = p.x - (B.x + B.w / 2), by = p.y - B.y;
      if (Math.abs(bx) < 60 && Math.abs(by) < B.h * .6) { uy += Math.sign(by || 1) * 2.4 * (1 - Math.abs(bx) / 60); ux *= .6; }
      const px = p.x, py = p.y;
      p.x += ux; p.y += uy;
      if (p.x > o.W + 10 || p.y < -20 || p.y > o.H + 20) { p.x = -10 + Math.random() * 20; p.y = B.y + (Math.random() * 2 - 1) * o.H * .36; continue; }
      const sp = Math.min(1, Math.hypot(ux - U, uy) / 3);
      c.strokeStyle = sp > .35 ? `rgba(${ACC},${.35 + sp * .5})` : `rgba(${WHITE},.28)`;
      c.lineWidth = sp > .35 ? 1.2 : .7;
      c.beginPath(); c.moveTo(px, py); c.lineTo(p.x, p.y); c.stroke();
    }
    // тело обтекания
    c.fillStyle = `rgba(${WHITE},.95)`; c.fillRect(B.x, B.y - B.h / 2, B.w, B.h);
    c.strokeStyle = `rgba(${WHITE},.35)`; c.setLineDash([3, 5]);
    c.beginPath(); c.moveTo(B.x + B.w / 2, B.y - B.h / 2 - 40); c.lineTo(B.x + B.w / 2, B.y - B.h / 2 - 6); c.stroke(); c.setLineDash([]);
    c.font = '10.5px "JetBrains Mono", monospace'; c.fillStyle = `rgba(${WHITE},.7)`;
    c.fillText('[ ТЕЛО ОБТЕКАНИЯ ]', B.x - 50, B.y - B.h / 2 - 50);
    // осциллограмма датчика
    const ow = Math.min(360, o.W * .4), ox = o.W - ow - (small ? 16 : 48), oy = small ? o.H * .12 + 70 : o.H * .2, oh = 46;
    c.strokeStyle = `rgba(${WHITE},.18)`; c.strokeRect(ox, oy - oh / 2, ow, oh);
    c.strokeStyle = `rgba(${ACC},.95)`; c.lineWidth = 1.4; c.beginPath();
    for (let x = 0; x <= ow; x += 2) { const y = oy + Math.sin((x * .09 * state.speed) - t * .22 * state.speed) * oh * .36; x ? c.lineTo(ox + x, y) : c.moveTo(ox + x, y); }
    c.stroke();
    c.fillStyle = `rgba(${WHITE},.7)`; c.fillText('[ СИГНАЛ ДАТЧИКА ]', ox, oy - oh / 2 - 10);
    c.globalAlpha = 1;
  }

  o.loop = () => {
    t++;
    fade(o, state.vortex > .5 ? .2 : .32);
    if (state.tunnel > .01) drawTunnel(state.tunnel);
    if (state.vortex > .01) drawVortex(state.vortex);
    if (t % 20 === 0) {
      freqShown = 42.7 * state.speed + (Math.random() - .5) * .6;
      if (fNote) fNote.textContent = freqShown.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' Гц';
      if (vNote) vNote.textContent = (3.2 * state.speed + (Math.random() - .5) * .05).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' м/с';
    }
    if (o.on && !reduce) requestAnimationFrame(o.loop);
  };
  if (reduce) { state.vortex = 1; for (let i = 0; i < 200; i++) o.loop(); } else requestAnimationFrame(o.loop);
})();
