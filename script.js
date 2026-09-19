(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '5585997554327';
  const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;

  /* preloader */
  const pre = $('#preloader');
  const t0 = performance.now();
  const hidePre = () => pre && pre.classList.add('is-done');
  // keep the HS reveal on screen long enough to be seen, even on fast loads
  window.addEventListener('load', () => setTimeout(hidePre, Math.max(300, 1900 - (performance.now() - t0))));
  setTimeout(hidePre, 3200);

  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  /* header, progress, floating button */
  const header = $('#header'), progress = $('#scrollProgress'), waFloat = $('#waFloat');
  let ticking = false;
  function onScroll() {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('is-stuck', y > 40);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    waFloat.classList.toggle('is-visible', y > innerHeight * 0.6);
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* mobile menu */
  const burger = $('#burger'), nav = $('#nav');
  const toggleNav = (open) => {
    burger.classList.toggle('is-open', open); nav.classList.toggle('is-open', open);
    header.classList.toggle('is-nav-open', open); document.body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.addEventListener('click', () => toggleNav(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => toggleNav(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) toggleNav(false); });

  /* reveal on scroll */
  const rev = $$('.reveal, .reveal-left, .reveal-right');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    rev.forEach(el => io.observe(el));
  } else rev.forEach(el => el.classList.add('is-in'));

  /* active nav link */
  const navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-35% 0px -55% 0px' });
    $$('main section[id], footer[id]').forEach(s => spy.observe(s));
  }

  /* light parallax */
  if (!reduced && matchMedia('(min-width: 901px)').matches) {
    const items = $$('.frame--main, .cta__bg img');
    let raf = null;
    const run = () => {
      items.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.transform = `translate3d(0, ${(p * -22).toFixed(2)}px, 0)`;
      });
      raf = null;
    };
    addEventListener('scroll', () => { if (raf === null) raf = requestAnimationFrame(run); }, { passive: true });
    run();
  }

  /* ---------- hero video ---------- */
  const heroVideo = $('#heroVideo');
  if (heroVideo && !reduced) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) heroVideo.play().catch(() => {});
        else heroVideo.pause();
      })).observe(heroVideo);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) heroVideo.pause();
      else if (heroVideo.getBoundingClientRect().bottom > 0) heroVideo.play().catch(() => {});
    });
  }

  /* ---------- hero steam ---------- */
  const canvas = $('#steam');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 256;
    const sg = sprite.getContext('2d');
    const grad = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(236,244,245,1)');
    grad.addColorStop(0.45, 'rgba(236,244,245,.45)');
    grad.addColorStop(1, 'rgba(236,244,245,0)');
    sg.fillStyle = grad; sg.fillRect(0, 0, 256, 256);

    let W = 0, H = 0, parts = [], running = true, last = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rand = (a, b) => a + Math.random() * (b - a);
    const make = (initial) => {
      const x = W * (Math.random() < 0.65 ? rand(0.35, 1.05) : rand(-0.05, 0.4));
      return {
        x, y: H + rand(20, 120),
        vy: rand(26, 58), sway: rand(14, 44), phase: rand(0, Math.PI * 2),
        size: rand(70, 150), grow: rand(22, 46), life: 0, max: rand(8, 14), a: rand(0.08, 0.18),
        stretch: rand(1.25, 1.8)
      };
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(70, Math.round(W / 20));
      parts = Array.from({ length: n }, () => { const p = make(true); p.life = rand(0, p.max); return p; });
    };
    const draw = (dt) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.life += dt;
        if (p.life > p.max) Object.assign(p, make(false));
        const t = Math.min(p.life / p.max, 1);
        // fades in fast, lingers, dissolves as it rises
        const alpha = p.a * Math.min(t / 0.18, 1) * Math.pow(1 - t, 1.6);
        const y = p.y - p.vy * p.life - p.life * p.life * 1.2;
        const x = p.x + Math.sin(p.phase + p.life * 0.45) * p.sway * t;
        const s = p.size + p.grow * p.life;
        ctx.globalAlpha = Math.max(alpha, 0);
        ctx.drawImage(sprite, x - s / 2, y - (s * p.stretch) / 2, s, s * p.stretch);
      }
      ctx.globalAlpha = 1;
    };
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      draw(dt);
      if (running) requestAnimationFrame(loop);
    };
    resize();
    addEventListener('resize', () => { resize(); if (reduced) draw(0); });
    if (reduced) draw(0);
    else {
      requestAnimationFrame(loop);
      new IntersectionObserver(([en]) => {
        const vis = en.isIntersecting;
        if (vis && !running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
        running = vis;
      }).observe(canvas);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) running = false;
        else if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
      });
    }
  }


  /* ---------- destaques carousel (estilo Rinnai) ---------- */
  const rTrack = $('#rcarTrack');
  if (rTrack) {
    const slides = $$('.rcar__slide', rTrack), dotsBox = $('#rcarDots'), box = $('#destaques');
    let i = 0, timer = null;
    slides.forEach((_, n) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', `Ir para o destaque ${n + 1}`);
      b.addEventListener('click', () => { go(n); restart(); });
      dotsBox.appendChild(b);
    });
    const dots = $$('button', dotsBox);
    function go(n) {
      i = (n + slides.length) % slides.length;
      rTrack.style.transform = `translateX(-${i * 100}%)`;
      slides.forEach((s, k) => {
        const cur = k === i;
        s.classList.toggle('is-current', cur);
        s.setAttribute('aria-hidden', String(!cur));
        $$('a, button', s).forEach(el => el.tabIndex = cur ? 0 : -1);
      });
      dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    }
    function restart() { clearInterval(timer); if (!reduced) timer = setInterval(() => go(i + 1), 6000); }
    $('#rcarPrev').addEventListener('click', () => { go(i - 1); restart(); });
    $('#rcarNext').addEventListener('click', () => { go(i + 1); restart(); });
    box.addEventListener('mouseenter', () => clearInterval(timer));
    box.addEventListener('mouseleave', restart);
    box.addEventListener('focusin', () => clearInterval(timer));
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { go(i + 1); restart(); }
      if (e.key === 'ArrowLeft') { go(i - 1); restart(); }
    });
    let sx = 0;
    box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) { go(i + (dx < 0 ? 1 : -1)); restart(); }
    }, { passive: true });
    go(0); restart();
  }

  /* ---------- logos marquee: duplicate set for a seamless loop ---------- */
  const lTrack = $('#logosTrack');
  if (lTrack) {
    $$('.logo-card', lTrack).forEach(card => {
      const c = card.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      const img = $('img', c);
      if (img) img.addEventListener('error', () => c.classList.add('no-logo'));
      lTrack.appendChild(c);
    });
  }

  /* ---------- heater estimate ---------- */
  const calc = $('#calc');
  if (calc) {
    const out = $('#showers'), minus = $('#showersMinus'), plus = $('#showersPlus');
    const flowEl = $('#flow'), sizeEl = $('#size'), send = $('#calcSend');
    let showers = 2, shown = 18, anim = null;
    const bands = [
      [10, '7 a 15 L/min'], [20, 'cerca de 20 L/min'], [27, 'cerca de 26 L/min'],
      [36, '30 a 35 L/min'], [45, '40 a 45 L/min']
    ];
    const tween = (to) => {
      cancelAnimationFrame(anim);
      if (reduced) { shown = to; flowEl.textContent = `${to} L/min`; return; }
      const from = shown, t0 = performance.now();
      const step = (now) => {
        const k = Math.min((now - t0) / 420, 1), e = 1 - Math.pow(1 - k, 3);
        shown = Math.round(from + (to - from) * e);
        flowEl.textContent = `${shown} L/min`;
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };
    /* modelos ligados ao resultado do simulador */
    const modelEls = $$('.model', $('#models') || document);
    const modelsNote = $('#modelsNote');
    const ROLES = {
      suggested: { badge: 'Aparelho sugerido', cls: 'is-suggested', text: 'É o modelo que melhor se encaixa no consumo estimado e atende a casa ao longo do ano.' },
      best: { badge: 'Melhor escolha', cls: 'is-best', text: 'Um degrau acima do sugerido: segura a temperatura mesmo em dias frios ou com uso simultâneo.' },
      saver: { badge: 'Opção econômica', cls: 'is-saver', text: 'Menor investimento. Atende na maior parte do ano, mas pode ficar justo nos dias mais frios.' },
      none: { badge: '', cls: '', text: 'Também vendemos, instalamos e damos assistência neste modelo.' }
    };
    let lastIdx = null;
    const syncModels = (flow, ctx) => {
      if (!modelEls.length) return;
      const caps = modelEls.map(el => Number(el.dataset.flow));
      let idx = caps.findIndex(c => c >= flow);
      const over = idx === -1;
      if (over) idx = caps.length - 1;
      modelEls.forEach((el, i) => {
        const role = i === idx ? 'suggested' : i === idx + 1 ? 'best' : i === idx - 1 ? 'saver' : 'none';
        const r = ROLES[role];
        el.classList.remove('is-suggested', 'is-best', 'is-saver', 'is-flash');
        if (r.cls) el.classList.add(r.cls);
        el.classList.toggle('has-badge', !!r.badge);
        $('.model__badge', el).textContent = r.badge;
        $('.model__role', el).textContent = over && i === idx
          ? 'É o maior modelo desta seleção. Acima disso, dimensionamos na visita técnica.'
          : r.text;
        if (i === idx) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current');
        $('.model__cta', el).href = waLink(
          `Olá! Vim pelo site da HS e quero orçamento do aquecedor a gás Rinnai ${el.dataset.name}.\n${ctx}`
        );
      });
      if (modelsNote) modelsNote.hidden = !over;
      if (lastIdx !== null && idx !== lastIdx && !reduced) {
        const el = modelEls[idx];
        el.classList.remove('is-flash');
        void el.offsetWidth;
        el.classList.add('is-flash');
      }
      lastIdx = idx;
    };

    const update = () => {
      out.textContent = showers;
      minus.disabled = showers <= 1; plus.disabled = showers >= 6;
      const extras = $$('input[name="extra"]:checked', calc);
      const flow = showers * 9 + extras.reduce((s, i) => s + Number(i.dataset.flow), 0);
      const band = bands.find(b => flow <= b[0]);
      const size = band ? band[1] : 'projeto sob medida';
      tween(flow);
      sizeEl.textContent = band ? size : 'Projeto sob medida';
      const gas = $('input[name="gas"]:checked', calc).value;
      const extrasTxt = extras.map(i => i.value).join(', ') || 'nenhum';
      const ctx = `• Chuveiros ao mesmo tempo: ${showers}\n• Outros pontos: ${extrasTxt}\n• Gás: ${gas}\n` +
        `• Estimativa do site: ${flow} L/min`;
      send.href = waLink(
        `Olá! Vim pelo site da HS e quero orçamento de aquecedor a gás Rinnai.\n${ctx} (sugestão: ${size})`
      );
      syncModels(flow, ctx);
    };
    minus.addEventListener('click', () => { showers = Math.max(1, showers - 1); update(); });
    plus.addEventListener('click', () => { showers = Math.min(6, showers + 1); update(); });
    calc.addEventListener('change', update);
    update();
  }

  /* ---------- before / after ---------- */
  $$('.ba__stage').forEach(stage => {
    const range = $('.ba__range', stage);
    const set = () => stage.style.setProperty('--pos', range.value + '%');
    range.addEventListener('input', set); set();
  });

  /* ---------- reviews carousel ---------- */
  const track = $('#quotesTrack'), dotsBox = $('#quotesDots');
  if (track && dotsBox) {
    const slides = $$('.quote', track);
    let index = 0, timer = null;
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', `Avaliação ${i + 1}`);
      b.addEventListener('click', () => { go(i); restart(); });
      dotsBox.appendChild(b);
    });
    const dots = $$('button', dotsBox);
    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
      slides.forEach((s, si) => s.setAttribute('aria-hidden', String(si !== index)));
    }
    function restart() { clearInterval(timer); if (!reduced) timer = setInterval(() => go(index + 1), 6500); }
    go(0); restart();
    const box = $('#quotes');
    box.addEventListener('mouseenter', () => clearInterval(timer));
    box.addEventListener('mouseleave', restart);
    box.addEventListener('focusin', () => clearInterval(timer));
    let sx = 0;
    box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) { go(index + (dx < 0 ? 1 : -1)); restart(); }
    }, { passive: true });
  }

  /* ---------- serviços realizados: filtros + tilt ---------- */
  const works = $('#works');
  const figs = works ? $$('.work', works) : [];
  const broken = (f) => !!$('.is-missing', f);

  if (works && figs.length) {
    const chips = $$('.works__filter');
    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(c => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      const cat = chip.dataset.filter;
      works.classList.add('no-anim');
      let vis = 0;
      figs.forEach(f => {
        const show = cat === 'all' || f.dataset.cat === cat;
        f.hidden = !show;
        if (show) {
          f.classList.remove('is-in');
          f.style.setProperty('--d', (Math.min(vis++, 12) * .045).toFixed(3) + 's');
        }
      });
      void works.offsetWidth;
      works.classList.remove('no-anim');
      requestAnimationFrame(() => figs.forEach(f => { if (!f.hidden) f.classList.add('is-in'); }));
    }));

    if (!reduced && matchMedia('(hover:hover) and (pointer:fine)').matches) {
      figs.forEach(f => {
        let raf = null, rx = 0, ry = 0;
        const apply = () => {
          f.style.setProperty('--rx', rx.toFixed(2) + 'deg');
          f.style.setProperty('--ry', ry.toFixed(2) + 'deg');
          raf = null;
        };
        f.addEventListener('pointerenter', () => f.classList.add('is-tilting'));
        f.addEventListener('pointermove', e => {
          const r = f.getBoundingClientRect();
          ry = ((e.clientX - r.left) / r.width - .5) * 11;
          rx = ((e.clientY - r.top) / r.height - .5) * -11;
          if (raf === null) raf = requestAnimationFrame(apply);
        });
        f.addEventListener('pointerleave', () => {
          if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
          f.classList.remove('is-tilting');
          f.style.setProperty('--rx', '0deg'); f.style.setProperty('--ry', '0deg');
        });
      });
    }
  }

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCount = $('#lbCount');
  if (lb && figs.length) {
    let cur = 0;
    const usable = () => figs.filter(f => !f.hidden && !broken(f));
    const open = (fig) => {
      const list = usable(); if (!list.length) return;
      cur = Math.max(0, list.indexOf(fig));
      show(list);
      lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked'); $('#lbClose').focus();
    };
    const show = (list) => {
      const f = list[cur], img = $('img', f);
      lbImg.src = img.src; lbImg.alt = img.alt;
      lbCap.textContent = $('.work__title', f).textContent;
      lbCount.textContent = `${cur + 1} / ${list.length}`;
    };
    const move = (d) => { const list = usable(); cur = (cur + d + list.length) % list.length; show(list); };
    const close = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); document.body.classList.remove('is-locked'); };
    figs.forEach(f => {
      const card = $('.work__card', f);
      card.tabIndex = 0; card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Ampliar foto: ${$('.work__title', f).textContent}`);
      card.addEventListener('click', () => { if (!broken(f)) open(f); });
      card.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !broken(f)) { e.preventDefault(); open(f); } });
    });
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', e => { e.stopPropagation(); move(-1); });
    $('#lbNext').addEventListener('click', e => { e.stopPropagation(); move(1); });
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    });
    let lbx = 0;
    lb.addEventListener('touchstart', e => { lbx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - lbx;
      if (Math.abs(dx) > 45) move(dx < 0 ? 1 : -1);
    }, { passive: true });
  }
})();
