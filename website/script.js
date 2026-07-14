/* ═══════════════════════════════════════════════
   SKYAWEB — SCRIPT.JS
   ═══════════════════════════════════════════════ */

'use strict';

/* ── NAVBAR SCROLL ───────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── NAV DROPDOWN ────────────────────────────── */
(function initDropdowns() {
  const dropdowns = document.querySelectorAll('.nav-dropdown');

  dropdowns.forEach(dropdown => {
    const btn = dropdown.querySelector('.nav-dropdown-btn');
    const menu = dropdown.querySelector('.nav-dropdown-menu');
    if (!btn || !menu) return;

    function open() { menu.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    function close() { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    function toggle() { menu.classList.contains('open') ? close() : open(); }

    btn.addEventListener('click', e => { e.stopPropagation(); toggle(); });

    btn.addEventListener('keydown', e => {
      if (e.key === 'Escape') { close(); btn.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); menu.querySelector('a')?.focus(); }
    });

    menu.addEventListener('keydown', e => {
      if (e.key === 'Escape') { close(); btn.focus(); }
    });
  });

  /* Cierra cualquier menú abierto al hacer clic fuera */
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown-menu.open').forEach(m => {
        m.classList.remove('open');
        m.previousElementSibling?.setAttribute('aria-expanded', 'false');
      });
    }
  });
})();

/* ── HAMBURGER MENU ──────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

/* ── PARTICLE CANVAS ─────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let W, H, particles = [], mouse = { x: null, y: null };
  const COUNT = window.innerWidth < 768 ? 40 : 80;
  const COLORS = ['rgba(0,212,255,', 'rgba(123,47,255,', 'rgba(255,0,110,'];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 10;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -(Math.random() * 0.4 + 0.1);
      this.r = Math.random() * 1.5 + 0.5;
      this.a = Math.random() * 0.5 + 0.1;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    update() {
      if (mouse.x !== null) {
        const dx = this.x - mouse.x, dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          this.vx += dx / dist * 0.06;
          this.vy += dy / dist * 0.06;
        }
      }
      this.vx *= 0.99;
      this.vy *= 0.99;
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -10 || this.x < -10 || this.x > W + 10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.a + ')';
      ctx.fill();
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,212,255,${0.06 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animate);
  }

  resize();
  for (let i = 0; i < COUNT; i++) particles.push(new Particle());
  animate();

  window.addEventListener('resize', () => { resize(); }, { passive: true });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });
  canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
})();

/* ── HERO PARALLAX + SPOTLIGHT ───────────────── */
(function initHeroEffects() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const hero = document.getElementById('inicio');
  const content = hero?.querySelector('.hero-content');
  const badge = hero?.querySelector('.hero-badge');
  if (!hero || !content) return;

  /* Spotlight cursor */
  const spotlight = document.createElement('div');
  spotlight.className = 'hero-spotlight';
  hero.appendChild(spotlight);

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nx = (x / rect.width - 0.5) * 2;
    const ny = (y / rect.height - 0.5) * 2;

    /* Spotlight */
    spotlight.style.left = x + 'px';
    spotlight.style.top = y + 'px';
    spotlight.style.opacity = '1';

    /* Parallax — content moves opposite to cursor, badge a bit more */
    content.style.transform = `translate(${nx * -10}px, ${ny * -6}px)`;
    if (badge) badge.style.transform = `translate(${nx * -16}px, ${ny * -10}px)`;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    spotlight.style.opacity = '0';
    content.style.transition = 'transform 900ms var(--ease-out)';
    if (badge) badge.style.transition = 'transform 900ms var(--ease-out)';
    content.style.transform = 'translate(0, 0)';
    if (badge) badge.style.transform = 'translate(0, 0)';
    setTimeout(() => {
      content.style.transition = '';
      if (badge) badge.style.transition = '';
    }, 900);
  });
})();

/* ── TYPEWRITER ──────────────────────────────── */
(function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phrases = ['IA que capta clientes 24/7.', 'En Google desde el día 1.', 'Webs que convierten de verdad.', 'Resultados en 72 horas.'];
  let i = 0, j = 0, deleting = false;

  function tick() {
    const phrase = phrases[i];
    el.textContent = deleting ? phrase.slice(0, j--) : phrase.slice(0, j++);

    if (!deleting && j > phrase.length) {
      deleting = true;
      setTimeout(tick, prefersReduced ? 200 : 1800);
      return;
    }
    if (deleting && j < 0) {
      deleting = false;
      i = (i + 1) % phrases.length;
      j = 0;
      setTimeout(tick, prefersReduced ? 100 : 400);
      return;
    }
    setTimeout(tick, prefersReduced ? 50 : deleting ? 40 : 65);
  }

  setTimeout(tick, 800);
})();

/* ── SCROLL REVEAL ───────────────────────────── */
(function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    observer.observe(el);
  });
})();

/* ── COUNTER ANIMATION ───────────────────────── */
(function initCounters() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCounter(el, target, duration) {
    if (prefersReduced) { el.textContent = target; return; }
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      animateCounter(el, target, 1800);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(el => observer.observe(el));
})();

/* ── HOURS LIVE COUNTER (Automatización) ─────── */
(function initHoursCounter() {
  const el = document.getElementById('hoursCounter');
  if (!el) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const base = parseInt(el.dataset.target, 10) || 0;
  let current = 0;

  function render(n) {
    el.textContent = Math.round(n).toLocaleString('es-ES');
  }

  function startLiveTick() {
    current = base;
    render(current);
    if (prefersReduced) return;
    setInterval(() => {
      current += Math.random() * 0.8 + 0.3;
      render(current);
    }, 2200);
  }

  function countUp(target, duration) {
    if (prefersReduced) { startLiveTick(); return; }
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      render(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else startLiveTick();
    }
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      countUp(base, 1800);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  observer.observe(el);
})();

/* ── FAQ ACCORDION ───────────────────────────── */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const answer = document.getElementById(btn.getAttribute('aria-controls'));
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item.open').forEach(open => {
      open.classList.remove('open');
      open.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      open.querySelector('.faq-answer').classList.remove('open');
    });

    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      answer.classList.add('open');
    }
  });
});

/* ── VIDEO MODAL ─────────────────────────────── */
(function initVideoModal() {
  const modal = document.getElementById('video-modal');
  const iframe = document.getElementById('modal-iframe');
  const close = document.getElementById('modal-close');
  const backdrop = document.getElementById('modal-backdrop');
  if (!modal || !iframe || !close || !backdrop) return;
  let lastFocus = null;

  function openModal(videoUrl) {
    lastFocus = document.activeElement;
    iframe.src = videoUrl + '?autoplay=1&rel=0';
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    close.focus();
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    iframe.src = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('.case-video-thumb[data-video]').forEach(thumb => {
    const handler = () => openModal(thumb.dataset.video);
    thumb.addEventListener('click', handler);
    thumb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });

  close.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
  });
})();

/* ── CONTACT FORM ────────────────────────────── */
(function initContactForm() {
  const form = document.getElementById('contact-form');
  const submit = document.getElementById('form-submit');
  const success = document.getElementById('form-success');
  if (!form) return;

  function showError(fieldId, msg) {
    const err = document.getElementById(fieldId + '-error');
    if (!err) return;
    err.textContent = msg;
    err.classList.add('show');
  }
  function clearError(fieldId) {
    const err = document.getElementById(fieldId + '-error');
    if (err) err.classList.remove('show');
  }

  ['nombre', 'email', 'interes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', () => validate(id, el.value));
  });

  function validate(id, value) {
    clearError(id);
    if (id === 'nombre' && !value.trim()) { showError(id, 'Por favor, escribe tu nombre.'); return false; }
    if (id === 'email') {
      if (!value.trim()) { showError(id, 'El email es obligatorio.'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { showError(id, 'Introduce un email válido.'); return false; }
    }
    if (id === 'interes' && !value) { showError(id, 'Selecciona una opción.'); return false; }
    return true;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const nombre = document.getElementById('nombre');
    const email = document.getElementById('email');
    const interes = document.getElementById('interes');

    const valid = [
      validate('nombre', nombre.value),
      validate('email', email.value),
      validate('interes', interes.value)
    ].every(Boolean);

    if (!valid) {
      const firstErr = form.querySelector('.field-error.show');
      if (firstErr) firstErr.previousElementSibling?.focus();
      return;
    }

    submit.disabled = true;
    submit.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Enviando (puede tardar unos segundos)...
    `;

    const interesLabels = {
      'agente-ia': 'Agente de IA para captar clientes',
      'web-conversion': 'Web de alta conversión',
      'automatizacion': 'Automatización de marketing',
      'todo': 'Todo lo anterior',
      'otro': 'Duda específica',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          access_key: '7501a353-468f-4631-ad41-b23c481eea31',
          subject:    `Nuevo contacto: ${interesLabels[form.interes.value] || form.interes.value} — ${form.nombre.value}`,
          from_name:  'Formulario web Skyaweb',
          Nombre:     form.nombre.value,
          Empresa:    form.empresa.value || '—',
          Email:      form.email.value,
          Teléfono:   form.telefono.value || '—',
          Interés:    interesLabels[form.interes.value] || form.interes.value,
          Mensaje:    form.mensaje.value || '—',
        }),
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('server error');
      form.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = true);
      success.removeAttribute('hidden');
      success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (typeof gtag !== 'undefined') {
        gtag('event', 'generate_lead', { event_category: 'contact_form', event_label: form.interes?.value });
        // Para Google Ads: sustituye AW-XXXXXXXXX/XXXXXXXXXX por tu ID de conversión real
        // gtag('event', 'conversion', { send_to: 'AW-XXXXXXXXX/XXXXXXXXXX' });
      }
    } catch (_err) {
      clearTimeout(timeout);
      submit.disabled = false;
      submit.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
        Quiero mi auditoría SEO gratuita
      `;
      let errMsg = document.getElementById('send-error');
      if (!errMsg) {
        errMsg = document.createElement('p');
        errMsg.id = 'send-error';
        errMsg.style.cssText = 'color:#ef4444;text-align:center;margin-top:1rem;font-size:.875rem;';
        form.appendChild(errMsg);
      }
      const waText = encodeURIComponent(`Hola, intenté escribir por el formulario de la web pero no me funcionó. Me llamo ${form.nombre.value || ''} y quería hablar sobre: ${interesLabels[form.interes.value] || 'una consulta'}.`);
      errMsg.innerHTML = `El formulario está tardando más de lo normal. Escríbenos directamente: <a href="https://wa.me/34628245180?text=${waText}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan);font-weight:600;">WhatsApp</a> o <a href="mailto:contacto@skyaweb.com" style="color:var(--cyan);font-weight:600;">contacto@skyaweb.com</a>`;
    }
  });
})();

/* ── SMOOTH ANCHOR SCROLLING ─────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const hash = a.getAttribute('href');
    if (!hash || hash === '#') return;
    let target;
    try { target = document.querySelector(hash); } catch (_) { return; }
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', hash);
  });
});

/* ── FOOTER YEAR ─────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── WHATSAPP CLICK TRACKING ─────────────────── */
document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
  el.addEventListener('click', () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'whatsapp_click', { event_category: 'whatsapp_lead', event_label: el.className });
      // Para Google Ads: sustituye AW-XXXXXXXXX/XXXXXXXXXX por tu ID de conversión real
      // gtag('event', 'conversion', { send_to: 'AW-XXXXXXXXX/XXXXXXXXXX' });
    }
  });
});

/* ── CASES SLIDER ───────────────────────────── */
(function initCasesSlider() {
  const slider = document.getElementById('cases-slider');
  const track  = document.getElementById('cases-track');
  const prev   = document.getElementById('slider-prev');
  const next   = document.getElementById('slider-next');
  const dots   = document.querySelectorAll('.slider-dot');
  if (!track) return;

  const total = track.children.length;
  let current = 0;
  let timer;
  let touchStartX = 0;

  function goTo(i) {
    current = (i + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, idx) => {
      const active = idx === current;
      d.classList.toggle('active', active);
      d.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function startAuto() { timer = setInterval(() => goTo(current + 1), 5000); }
  function stopAuto()  { clearInterval(timer); }
  function resetAuto() { stopAuto(); startAuto(); }

  next?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
  prev?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });

  dots.forEach(d => d.addEventListener('click', () => {
    goTo(+d.dataset.slide); resetAuto();
  }));

  slider?.addEventListener('mouseenter', stopAuto);
  slider?.addEventListener('mouseleave', startAuto);

  slider?.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  slider?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 48) { dx < 0 ? goTo(current + 1) : goTo(current - 1); resetAuto(); }
  }, { passive: true });

  /* Keyboard: left/right arrows when slider is focused */
  slider?.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
    if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAuto(); }
  });

  startAuto();
})();

/* ── COOKIE CONSENT ──────────────────────────── */
(function initCookieConsent() {
  const CONSENT_KEY = 'cookie_consent';
  const CONSENT_VERSION = '1';

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch (_) { return null; }
  }

  function setConsent(accepted) {
    const data = { accepted, version: CONSENT_VERSION, date: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    document.cookie = 'cookie_consent=' + (accepted ? 'accepted' : 'rejected') + '; max-age=31536000; path=/; SameSite=Lax';
  }

  function loadAnalytics() {
    if (document.getElementById('ga-script')) return;
    const s = document.createElement('script');
    s.id = 'ga-script';
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-JECBD8LKHR';
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-JECBD8LKHR', { anonymize_ip: true });
  }

  function loadAdsense() {
    if (document.getElementById('adsense-script')) return;
    const s = document.createElement('script');
    s.id = 'adsense-script';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7498469267704561';
    document.head.appendChild(s);
  }

  function applyConsent(accepted) {
    if (accepted) {
      loadAnalytics();
      loadAdsense();
    }
  }

  function hideBanner(banner) {
    banner.classList.remove('visible');
    banner.addEventListener('transitionend', () => banner.remove(), { once: true });
  }

  function createBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML = `
      <div class="cookie-banner-inner">
        <div class="cookie-banner-text">
          <p>Usamos cookies propias y de terceros (Google Analytics, Google AdSense y Meta Pixel) para analizar el tráfico y mostrar publicidad personalizada. Consulta nuestra <a href="/cookies">política de cookies</a> y <a href="/privacidad">política de privacidad</a>.</p>
        </div>
        <div class="cookie-banner-actions">
          <button class="cookie-btn-reject" id="cookie-reject">Solo esenciales</button>
          <button class="cookie-btn-accept" id="cookie-accept">Aceptar todas</button>
        </div>
      </div>`;
    document.body.appendChild(banner);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => banner.classList.add('visible'));
    });

    banner.querySelector('#cookie-accept').addEventListener('click', () => {
      setConsent(true);
      applyConsent(true);
      hideBanner(banner);
    });

    banner.querySelector('#cookie-reject').addEventListener('click', () => {
      setConsent(false);
      hideBanner(banner);
    });
  }

  window.openCookieSettings = function () {
    const existing = document.querySelector('.cookie-banner');
    if (existing) return;
    localStorage.removeItem(CONSENT_KEY);
    createBanner();
  };

  const consent = getConsent();
  if (consent === null) {
    createBanner();
  } else if (consent.accepted) {
    applyConsent(true);
  }
})();
