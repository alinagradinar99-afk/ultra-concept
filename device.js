// Hero: расходомер в разборе — одна картинка в хорошем качестве.
// «Живая»: появляется из размытия, медленно покачивается, наклоняется за курсором,
// и её можно немного повернуть, потянув мышью или пальцем (после отпускания возвращается).
(function () {
  const rig = document.getElementById('rig'), box = document.getElementById('device');
  if (!rig) return;
  rig.innerHTML = '<img class="device-img" src="img/flowmeter-exploded.webp?v=1" width="1239" height="1215" alt="Расходомер ГК «УЛЬТРА» в разборе: корпус, электроника, крышки, измерительная часть" fetchpriority="high" draggable="false">';
  const img = rig.firstChild;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = document.getElementById('deviceState');
  if (state) state.textContent = '[ в разборе ]';
  if (!window.gsap || reduce) return;

  window.DEVICE = {
    start() {
      // Появление
      gsap.from(img, { opacity: 0, scale: .86, y: 40, filter: 'blur(18px)', duration: 1.8, ease: 'expo.out', clearProps: 'filter' });
      gsap.from('.device-tag, .device-state', { opacity: 0, x: -10, stagger: .15, duration: .8, delay: 1 });

      // Покачивание и лёгкое парение
      const spin = { ry: 0, rx: 0 }, look = { x: 0, y: 0 }, drag = { x: 0, y: 0 };
      gsap.fromTo(spin, { ry: -6 }, { ry: 6, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.fromTo(spin, { rx: 2 }, { rx: -2, duration: 5, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to(img, { y: -10, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.8 });

      // Поворот перетаскиванием (ограничен, чтобы плоская картинка не превращалась в «карточку»)
      let dragging = false, sx = 0, sy = 0;

      // Наклон за курсором
      const section = box.closest('section');
      section.addEventListener('pointermove', e => {
        if (dragging) return;
        const r = box.getBoundingClientRect();
        gsap.to(look, { x: ((e.clientX - r.left) / r.width - .5) * 14, y: ((e.clientY - r.top) / r.height - .5) * -8, duration: 1.2, ease: 'power3.out' });
      });
      section.addEventListener('pointerleave', () => gsap.to(look, { x: 0, y: 0, duration: 1.4, ease: 'power3.out' }));

      box.style.touchAction = 'pan-y';
      box.style.cursor = 'grab';
      box.addEventListener('pointerdown', e => { dragging = true; sx = e.clientX; sy = e.clientY; box.style.cursor = 'grabbing'; box.setPointerCapture(e.pointerId); });
      box.addEventListener('pointermove', e => {
        if (!dragging) return;
        drag.x = gsap.utils.clamp(-22, 22, (e.clientX - sx) * .15);
        drag.y = gsap.utils.clamp(-12, 12, (e.clientY - sy) * -.1);
      });
      const release = () => { if (!dragging) return; dragging = false; box.style.cursor = 'grab'; gsap.to(drag, { x: 0, y: 0, duration: 1.6, ease: 'elastic.out(1, .5)' }); };
      box.addEventListener('pointerup', release);
      box.addEventListener('pointercancel', release);

      let visible = true;
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(box);
      gsap.ticker.add(() => { if (visible) gsap.set(rig, { rotationY: spin.ry + look.x + drag.x, rotationX: spin.rx + look.y + drag.y }); });
    }
  };
})();
