// Hero: расходомер в разборе. Каждая деталь — отдельный слой со своей глубиной (translateZ),
// поэтому при повороте всей сборки слои смещаются друг относительно друга и картинка читается как объём.
// Детали прилетают и встают на место (сборка), дальше прибор «дышит» и мягко поворачивается.
// Картинка плоская: большие сдвиги деталей и глубокий поворот открывают линии разреза, поэтому амплитуды малые.
(function () {
  const W = 1267, H = 1241;
  // x, y, w, h — положение детали на исходной картинке; z — глубина; ax, ay — куда деталь едет при сборке
  const PARTS = [
    { id: 'housing',  x: 232, y: 120, w: 549, h: 449, z: 0,  ax: 0,    ay: 0 },
    { id: 'body',     x: 385, y: 675, w: 581, h: 401, z: 10, ax: -40,  ay: -150 },
    { id: 'cap_l',    x: 20,  y: 8,   w: 423, h: 346, z: 20, ax: 130,  ay: 85 },
    { id: 'neck',     x: 485, y: 598, w: 139, h: 216, z: 25, ax: -25,  ay: -120 },
    { id: 'pcb',      x: 547, y: 247, w: 348, h: 368, z: 30, ax: -95,  ay: -60 },
    { id: 'washer_r', x: 723, y: 166, w: 70,  h: 89,  z: 30, ax: -70,  ay: 25 },
    { id: 'washer_l', x: 156, y: 347, w: 62,  h: 100, z: 40, ax: 95,   ay: -25 },
    { id: 'flange',   x: 129, y: 898, w: 309, h: 325, z: 45, ax: 190,  ay: -110 },
    { id: 'bolt_r',   x: 804, y: 136, w: 95,  h: 87,  z: 50, ax: -140, ay: 45 },
    { id: 'bolt_l',   x: 22,  y: 388, w: 102, h: 91,  z: 60, ax: 190,  ay: -55 },
    { id: 'cap_r',    x: 782, y: 350, w: 477, h: 460, z: 70, ax: -210, ay: -85 }
  ];
  const BREATH = 4; // px: насколько детали «дышат» вдоль своей оси сборки

  const rig = document.getElementById('rig'), box = document.getElementById('device');
  if (!rig) return;
  rig.innerHTML = PARTS.map(p => `<div class="part" data-id="${p.id}" style="left:${p.x / W * 100}%;top:${p.y / H * 100}%;width:${p.w / W * 100}%;height:${p.h / H * 100}%"><img src="img/explode/${p.id}.webp" alt="" draggable="false"${p.id === 'housing' || p.id === 'cap_r' ? ' fetchpriority="high"' : ''}></div>`).join('');
  const els = [...rig.children];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = document.getElementById('deviceState');
  if (!window.gsap || reduce) return;

  // Сдвиги задаём в процентах от размера сцены, чтобы работало на любой ширине
  const sx = v => v / W * box.clientWidth, sy = v => v / H * box.clientHeight;
  const depth = () => box.clientWidth / 900; // глубина масштабируется вместе со сценой
  els.forEach((el, i) => gsap.set(el, { z: PARTS[i].z * .8 * depth() }));

  window.DEVICE = {
    start() {
      // 1. Детали прилетают из глубины в разобранное положение
      const intro = gsap.timeline();
      els.forEach((el, i) => {
        const p = PARTS[i], k = 2.4;
        intro.from(el, {
          x: -sx(p.ax) * k, y: -sy(p.ay) * k, z: `+=${400 + Math.random() * 300}`, rotation: (Math.random() - .5) * 40,
          opacity: 0, filter: 'blur(14px)', duration: 1.6, ease: 'expo.out', clearProps: 'filter'
        }, .05 * i);
      });

      intro.call(() => state && (state.textContent = '[ в разборе ]'));

      // 2. «Дыхание»: каждая деталь чуть ходит вдоль своей оси сборки, корпус неподвижен
      els.forEach((el, i) => {
        const p = PARTS[i], len = Math.hypot(p.ax, p.ay);
        if (!len) return;
        gsap.to(el, { x: p.ax / len * BREATH, y: p.ay / len * BREATH, duration: 2.4 + (i % 4) * .35, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: intro.duration() + i * .12 });
      });

      // 3. Медленное вращение всей сборки + наклон за курсором
      const spin = { ry: 0, rx: 0 }, mouse = { x: 0, y: 0 };
      gsap.fromTo(spin, { ry: -9 }, { ry: 9, duration: 8, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.fromTo(spin, { rx: 3 }, { rx: -2, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      box.closest('section').addEventListener('pointermove', e => {
        const r = box.getBoundingClientRect();
        gsap.to(mouse, { x: ((e.clientX - r.left) / r.width - .5) * 8, y: ((e.clientY - r.top) / r.height - .5) * -5, duration: 1.2, ease: 'power3.out' });
      });
      let visible = true;
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(box);
      gsap.ticker.add(() => { if (visible) gsap.set(rig, { rotationY: spin.ry + mouse.x, rotationX: spin.rx + mouse.y }); });

      // Подписи появляются после прилёта деталей
      gsap.from('.device-tag, .device-state', { opacity: 0, x: -10, stagger: .15, duration: .8, delay: 1.4 });
    }
  };
})();
