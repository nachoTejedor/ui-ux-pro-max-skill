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

/* ── TYPEWRITER ──────────────────────────────── */
(function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phrases = ['Con Inteligencia Artificial.', 'Sin parar 24/7.', 'Para tu PYME.', 'Empieza hoy.'];
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

  document.querySelectorAll('.case-video-thumb').forEach(thumb => {
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
      Enviando...
    `;

    try {
      await emailjs.send('service_adja48a', 'template_acl1weh', {
        nombre: form.nombre.value,
        empresa: form.empresa.value,
        email: form.email.value,
        telefono: form.telefono.value,
        interes: form.interes.value,
        mensaje: form.mensaje.value,
      });
      form.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = true);
      success.removeAttribute('hidden');
      success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_err) {
      submit.disabled = false;
      submit.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
        Enviar y recibir consulta gratuita
      `;
      let errMsg = document.getElementById('send-error');
      if (!errMsg) {
        errMsg = document.createElement('p');
        errMsg.id = 'send-error';
        errMsg.style.cssText = 'color:#ef4444;text-align:center;margin-top:1rem;font-size:.875rem;';
        form.appendChild(errMsg);
      }
      errMsg.textContent = 'Error al enviar el mensaje. Escríbenos a contacto@skyaweb.com';
    }
  });
})();

/* ── SMOOTH ANCHOR SCROLLING ─────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ── FOOTER YEAR ─────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
