'use strict';

(() => {
  const root = document.documentElement;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Тема: сохранение выбора ---------- */
  const themeBtn = $('#themeToggle');
  const applyTheme = (t) => {
    root.dataset.theme = t;
    themeBtn?.setAttribute('aria-pressed', String(t === 'light'));
  };
  let theme = 'dark';
  try {
    theme = localStorage.getItem('resume-theme')
      || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  } catch (e) { /* localStorage недоступен — используем значение по умолчанию */ }
  applyTheme(theme);
  themeBtn?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    try { localStorage.setItem('resume-theme', root.dataset.theme); } catch (e) {}
  });

  /* ---------- Год в футере ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Индикатор прокрутки и кнопка «наверх» ---------- */
  const bar = $('#progressBar');
  const toTop = $('#toTop');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = root.scrollHeight - root.clientHeight;
      bar.style.transform = `scaleX(${max > 0 ? root.scrollTop / max : 0})`;
      toTop.classList.toggle('show', root.scrollTop > 480);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () =>
    scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' }));

  /* ---------- Появление блоков при прокрутке ---------- */
  const revealEls = $$('.reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Подсветка активного раздела в меню ---------- */
  const links = $$('.nav-link');
  const sections = new Map();
  links.forEach(l => {
    const sec = document.getElementById(l.getAttribute('href').slice(1));
    if (sec) sections.set(sec, l);
  });
  if ('IntersectionObserver' in window && sections.size) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          sections.get(en.target)?.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach((_, sec) => spy.observe(sec));
  }

  /* ---------- Копирование контактов + уведомление ---------- */
  const toast = $('#toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  };
  $$('[data-copy]').forEach(btn =>
    btn.addEventListener('click', async () => {
      try {
        await copyText(btn.dataset.copy);
        showToast(btn.dataset.toast || 'Скопировано');
      } catch (e) {
        showToast('Не удалось скопировать');
      }
    }));

  /* ---------- Печать / PDF: раскрыть все карточки опыта ---------- */
  $('#printBtn')?.addEventListener('click', () => window.print());
  let openedBeforePrint = [];
  addEventListener('beforeprint', () => {
    openedBeforePrint = $$('details.job').filter(d => d.open);
    $$('details.job').forEach(d => { d.open = true; });
  });
  addEventListener('afterprint', () => {
    $$('details.job').forEach(d => { d.open = false; });
    openedBeforePrint.forEach(d => { d.open = true; });
    openedBeforePrint = [];
  });

  /* ---------- Эффект глубины: параллакс фона и наклон hero-карточки ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion.matches) {
    const bg = $('.bg');
    const card = $('#heroCard');
    addEventListener('pointermove', (e) => {
      const x = e.clientX / innerWidth - .5;
      const y = e.clientY / innerHeight - .5;
      bg.style.setProperty('--px', `${(x * 18).toFixed(1)}px`);
      bg.style.setProperty('--py', `${(y * 18).toFixed(1)}px`);
    }, { passive: true });
    card?.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform =
        `perspective(900px) rotateX(${(-y * 2).toFixed(2)}deg) rotateY(${(x * 2).toFixed(2)}deg)`;
    });
    card?.addEventListener('pointerleave', () => { card.style.transform = ''; });
  }
})()