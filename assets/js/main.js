/* ==========================================================
   MobiPoint — скрипти (vanilla JS)
   ========================================================== */
(function () {
  'use strict';

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ---------- Конфіг ---------- */
  var CONFIG = {
    timeZone: 'Europe/Kyiv',
    // 0 = неділя ... 6 = субота; null = вихідний
    hours: {
      0: null,
      1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19],
      6: [10, 17]
    },
    // Форма надсилається через Web3Forms (web3forms.com) — заявки приходять на пошту.
    formEndpoint: 'https://api.web3forms.com/submit',
    // Access Key з листа від Web3Forms. Ключ публічний, його можна тримати на сайті.
    web3formsKey: 'c038d139-13f1-4de7-9b2b-7d2b7bebe488'
  };

  /* ---------- Поточний рік ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Шапка: зменшення при прокрутці, кнопка «Нагору» ---------- */
  var header = $('#header');
  var toTop = $('#to-top');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 20);
    toTop.hidden = y < 600;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Бургер-меню ---------- */
  var burger = $('#burger');
  var nav = $('#nav');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('.nav a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------- Підсвічування активного розділу ---------- */
  var links = $$('.nav__link');
  var sections = links
    .map(function (l) { return $(l.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Поява елементів при прокрутці + лічильники ---------- */
  var revealTargets = $$('.section__head, .feature, .brand, .gallery__item, .person, .acc, .hours, .contacts > *, .stats li');
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var duration = 1400;
    var start = null;
    var fmt = new Intl.NumberFormat('uk-UA');
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        var counter = $('[data-count]', entry.target);
        if (counter) animateCount(counter);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
    $$('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* ---------- Галерея: фільтр ---------- */
  var tabs = $$('.tab');
  var items = $$('.gallery__item');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var f = tab.getAttribute('data-filter');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      items.forEach(function (it) {
        it.hidden = !(f === 'all' || it.getAttribute('data-category') === f);
      });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox');
  var lbStage = $('#lb-stage');
  var lbCaption = $('#lb-caption');
  var lbIndex = 0;
  var lastFocus = null;

  function visibleButtons() {
    return items.filter(function (i) { return !i.hidden; })
      .map(function (i) { return $('.gallery__btn', i); });
  }

  function renderLightbox() {
    var btns = visibleButtons();
    var btn = btns[lbIndex];
    if (!btn) return;
    var img = $('img', btn);
    var ph = $('.ph', btn);
    lbStage.innerHTML = '';
    if (img) {
      var big = document.createElement('img');
      big.src = btn.getAttribute('data-full') || img.currentSrc || img.src;
      big.alt = img.alt;
      lbStage.appendChild(big);
    } else if (ph) {
      lbStage.appendChild(ph.cloneNode(true));
    }
    lbCaption.textContent = btn.getAttribute('data-caption') || '';
  }

  function openLightbox(btn) {
    lastFocus = btn;
    lbIndex = Math.max(0, visibleButtons().indexOf(btn));
    renderLightbox();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lb-close').focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  function moveLightbox(dir) {
    var n = visibleButtons().length;
    lbIndex = (lbIndex + dir + n) % n;
    renderLightbox();
  }

  $$('.gallery__btn').forEach(function (btn) {
    btn.addEventListener('click', function () { openLightbox(btn); });
  });
  $('#lb-close').addEventListener('click', closeLightbox);
  $('#lb-prev').addEventListener('click', function () { moveLightbox(-1); });
  $('#lb-next').addEventListener('click', function () { moveLightbox(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') moveLightbox(-1);
    if (e.key === 'ArrowRight') moveLightbox(1);
  });

  // свайп на мобільному
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) moveLightbox(dx > 0 ? -1 : 1);
    touchX = null;
  });

  /* ---------- Акордеон ---------- */
  $$('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      // одночасно відкритий лише один блок
      $$('.acc__btn').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        $('#' + b.getAttribute('aria-controls')).hidden = true;
      });
      if (!expanded) {
        btn.setAttribute('aria-expanded', 'true');
        $('#' + btn.getAttribute('aria-controls')).hidden = false;
      }
    });
  });

  /* ---------- Робочі години: статус «відчинено / зачинено» ---------- */
  function kyivNow() {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: CONFIG.timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      day: days[map.weekday],
      minutes: (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10)
    };
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function nextOpening(now) {
    for (var i = 0; i < 7; i++) {
      var d = (now.day + i) % 7;
      var h = CONFIG.hours[d];
      if (!h) continue;
      if (i === 0 && now.minutes >= h[0] * 60) continue;
      var names = ['неділю', 'понеділок', 'вівторок', 'середу', 'четвер', "п'ятницю", 'суботу'];
      var when = i === 0 ? 'сьогодні' : (i === 1 ? 'завтра' : 'у ' + names[d]);
      return when + ' о ' + pad(h[0]) + ':00';
    }
    return '';
  }

  function updateStatus() {
    var now = kyivNow();
    var h = CONFIG.hours[now.day];
    var open = !!h && now.minutes >= h[0] * 60 && now.minutes < h[1] * 60;
    var text;
    if (open) {
      text = 'Зараз відчинено · до ' + pad(h[1]) + ':00';
    } else {
      text = 'Зараз зачинено · відчинимось ' + nextOpening(now);
    }
    $$('[data-open-status]').forEach(function (el) {
      el.textContent = text;
      el.classList.toggle('is-open', open);
      el.classList.toggle('is-closed', !open);
    });
    $$('.hours tr').forEach(function (tr) {
      tr.classList.toggle('is-today', parseInt(tr.getAttribute('data-day'), 10) === now.day);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Форма зворотного зв'язку ---------- */
  var form = $('#contact-form');
  var statusEl = $('#form-status');
  var submitBtn = $('#f-submit');

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var phoneRe = /^\+?[0-9\s().-]{9,18}$/;

  function setError(id, msg) {
    var small = $('[data-error-for="' + id + '"]');
    var input = document.getElementById(id);
    if (small) small.textContent = msg || '';
    var field = input && input.closest('.field');
    if (field) field.classList.toggle('has-error', !!msg);
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  var rules = {
    'f-name': function (v) {
      if (v.trim().length < 2) return "Вкажіть ім'я (мінімум 2 символи)";
    },
    'f-contact': function (v) {
      v = v.trim();
      if (!v) return 'Вкажіть телефон або e-mail';
      if (!emailRe.test(v) && !phoneRe.test(v)) return 'Невірний формат телефону або e-mail';
    },
    'f-message': function (v) {
      if (v.trim().length < 10) return 'Повідомлення має містити щонайменше 10 символів';
    },
    'f-agree': function (v, el) {
      if (!el.checked) return 'Потрібна згода на обробку даних';
    }
  };

  function validateField(id) {
    var el = document.getElementById(id);
    var msg = rules[id](el.value, el);
    setError(id, msg);
    return !msg;
  }

  Object.keys(rules).forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener('blur', function () { validateField(id); });
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validateField(id);
    });
  });

  function showStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = 'form__status ' + (kind ? 'is-' + kind : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showStatus('', '');

    var valid = true;
    var firstInvalid = null;
    Object.keys(rules).forEach(function (id) {
      if (!validateField(id)) {
        valid = false;
        if (!firstInvalid) firstInvalid = document.getElementById(id);
      }
    });
    if (!valid) { firstInvalid.focus(); return; }

    // Honeypot: боти заповнюють приховане поле
    if (form.elements.website.value) return;

    var contact = form.elements.contact.value.trim();
    // Ключі українською — так вони виглядатимуть у листі із заявкою
    var payload = {
      access_key: CONFIG.web3formsKey,
      subject: 'Нова заявка з сайту MobiPoint: ' + form.elements.topic.value,
      from_name: 'Сайт MobiPoint',
      "Ім'я": form.elements.name.value.trim(),
      'Контакт': contact,
      'Тема': form.elements.topic.value,
      'Повідомлення': form.elements.message.value.trim()
    };
    // Якщо клієнт залишив e-mail — на лист можна буде відповісти кнопкою «Відповісти»
    if (emailRe.test(contact)) payload.replyto = contact;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Надсилання…';

    var request;
    if (!CONFIG.web3formsKey) {
      console.warn('Форма не налаштована: вкажіть CONFIG.web3formsKey у assets/js/main.js');
      request = Promise.reject(new Error('No Web3Forms key'));
    } else {
      // Обриваємо запит, якщо сервіс не відповідає 15 секунд
      var controller = 'AbortController' in window ? new AbortController() : null;
      var timer = controller && setTimeout(function () { controller.abort(); }, 15000);
      request = fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data.success) throw new Error(data.message || 'HTTP ' + r.status);
        });
      }).then(function () {
        clearTimeout(timer);
      }, function (err) {
        clearTimeout(timer);
        throw err;
      });
    }

    request.then(function () {
      showStatus('Дякуємо! Ми отримали ваше повідомлення й зв\'яжемося з вами найближчим часом.', 'ok');
      form.reset();
      Object.keys(rules).forEach(function (id) { setError(id, ''); });
    }).catch(function (err) {
      console.error('Помилка відправки форми:', err);
      showStatus('Не вдалося надіслати повідомлення. Спробуйте ще раз або зателефонуйте нам.', 'error');
    }).then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Надіслати повідомлення';
    });
  });
})();
