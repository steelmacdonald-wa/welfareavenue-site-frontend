/* Welfare Avenue website: Google Analytics, Microsoft Clarity and the Meta pixel.
   No banner (Steel, 12/11/26): all three are on for every visitor. The privacy pages say so and carry the off switch.
   Before that date the site asked first (Quebec Law 25), so a choice someone already made still stands.
   The choice is kept in this browser (wa_consent): no = nothing loads; yes = Google Analytics and Clarity without the
   Meta pixel (which measures which of our Meta ads lead to gifts and sign-ups); all, or no choice yet = everything.
   Two exceptions while there is no choice yet (see start()): a browser on European time, and a browser that cannot
   keep a choice, get nothing until the visitor turns it on.
   Any element with data-wa-consent-open (the privacy pages have one) opens the chooser. */
(function () {
  'use strict';
  var ID = 'G-J4RXM9WJSW';
  /* Microsoft Clarity (heat maps and visit recordings, Steel 10/11/26): its project id, empty until the project exists. */
  var CLARITY = 'zbcoohovt6';
  /* Meta pixel (Steel 11/11/26, for the gift drive and One Bag Challenge ads): its id from Meta Events Manager.
     Empty means the pixel stays off. It loads with the rest unless the visitor chose Analytics only or All off, and never receives names, emails or phone numbers. */
  var PIXEL = '1871923090651607';
  var KEY = 'wa_consent';
  var FR = (document.documentElement.lang || '').toLowerCase().indexOf('fr') === 0;
  var T = FR ? {
    label: 'Témoins',
    text: 'Google Analytics et Microsoft Clarity nous aident à compter les visites et à voir comment nos pages sont utilisées (clics et défilement), et le pixel de Meta mesure quelles publicités de Welfare Avenue sur Facebook et Instagram mènent à des dons. Choisissez ce qui reste activé dans ce navigateur. Nous ne vendons jamais vos données.',
    more: 'Confidentialité', href: '/fr/confidentialite/', yes: 'Tout activer', some: 'Statistiques seulement', no: 'Tout désactiver'
  } : {
    label: 'Cookies',
    text: 'Google Analytics and Microsoft Clarity help us count visits and see how people use our pages (clicks and scrolling), and the Meta pixel measures which Welfare Avenue ads on Facebook and Instagram lead to gifts. Choose what stays on in this browser. We never sell your data.',
    more: 'Privacy', href: '/privacy/', yes: 'All on', some: 'Analytics only', no: 'All off'
  };

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* this browser keeps nothing: see canStore() */ } }
  /* Can this browser keep a choice? If not, an "All off" would be forgotten on the next page, so nothing loads by default. */
  function canStore() { try { localStorage.setItem(KEY + '_t', '1'); localStorage.removeItem(KEY + '_t'); return true; } catch (e) { return false; } }
  /* A browser on European time. The EU, the UK and Switzerland need a real yes before any of this loads, and Google's
     and Microsoft's own terms need one there too, so these visitors get nothing unless they turn it on themselves. */
  function europe() {
    try {
      var z = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      return /^Europe\//.test(z) || /^Atlantic\/(Azores|Canary|Faroe|Faeroe|Madeira|Reykjavik|Jan_Mayen)$/.test(z) || z === 'Arctic/Longyearbyen';
    } catch (e) { return false; }
  }

  var loaded = false, adsOn = false;
  function load(ads) {
    if (ads) meta();
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
    track();
    clarity();
  }
  /* The Meta pixel: page views, plus the conversions below (Donate, InitiateCheckout, Lead, CompleteRegistration). */
  function meta() {
    if (!PIXEL || adsOn) return;
    adsOn = true;
    if (!window.fbq) {
      var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!window._fbq) window._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      var f = document.createElement('script');
      f.async = true;
      f.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(f);
    }
    window.fbq('init', PIXEL);
    window.fbq('track', 'PageView');
    if (/^\/(fr\/paniers-cadeaux|gift-basket-drive)\//.test(location.pathname)) fb('ViewContent', { content_name: 'gift-basket-drive', content_category: 'campaign' });
  }
  function fb(name, p) { if (!adsOn) return; try { window.fbq('track', name, p || {}); } catch (e) { /* never break the page */ } }
  function clarity() {
    if (!CLARITY || window.clarity) return;
    window.clarity = function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    var c = document.createElement('script');
    c.async = true;
    c.src = 'https://www.clarity.ms/tag/' + CLARITY;
    document.head.appendChild(c);
    window.clarity('consent');
    /* Labels on every Clarity visit, so heat maps and recordings can be split by language, campaign and kind of page. */
    var path = location.pathname;
    var camp = /^\/(fr\/paniers-cadeaux|gift-basket-drive)\//.test(path) ? 'gift-basket-drive'
      : /one-?bag|un-sac/.test(path) ? 'one-bag' : 'none';
    var kind = path === '/' || path === '/fr/' ? 'home'
      : /benevol|volunteer/.test(path) ? 'volunteer'
      : /don|give|donat/.test(path) ? 'give'
      : /event|evenement/.test(path) ? 'events'
      : /privacy|confidentialite/.test(path) ? 'privacy' : 'other';
    cset('language', FR ? 'fr' : 'en');
    cset('campaign', camp);
    cset('page_kind', kind);
    var q = new URLSearchParams(location.search);
    if (q.get('utm_source')) cset('utm_source', q.get('utm_source').slice(0, 40));
    if (q.get('utm_campaign')) cset('utm_campaign', q.get('utm_campaign').slice(0, 40));
  }
  function cset(k, v) { try { window.clarity('set', k, v); } catch (e) { /* never break the page */ } }
  /* The moments that matter, marked on the Clarity recording so the team can filter to them
     (for example: opened a sign-up form but never sent it). Visits with a gift or a sent form are kept first. */
  var CLARITY_EVENTS = { donate_click: 1, donate_done: 1, signup_open: 1, form_start: 1, form_submit: 1, form_sent: 1,
    newsletter_signup: 1, contact_click: 1, language_switch: 1 };
  function cev(name) {
    if (!window.clarity || !CLARITY_EVENTS[name]) return;
    try {
      window.clarity('event', name);
      if (name === 'donate_click' || name === 'donate_done' || name === 'form_sent' || name === 'newsletter_signup') window.clarity('upgrade', name);
    } catch (e) { /* never break the page */ }
  }

  /* Welfare Avenue's own events, on top of what Google measures by itself (page views, time on the site,
     scrolling, outbound links, video plays, form starts). Runs whenever tracking is on. */
  function ev(name, p) { try { window.gtag('event', name, p || {}); } catch (e) { /* never break the page */ } cev(name); }
  function label(el) { return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100); }
  function formName(el) {
    var f = el.closest('[data-wa-form]');
    if (f) return f.getAttribute('data-wa-form');
    var d = el.closest('dialog');
    return d && d.id ? d.id : location.pathname;
  }
  /* Where on the page a click happened: the menu, the footer, a pop-up form, or the page section (its id, else its heading). */
  function areaOf(el) {
    if (el.closest('header, .top, nav')) return 'menu';
    if (el.closest('footer, .foot')) return 'footer';
    if (el.closest('dialog')) return 'popup';
    var sec = el.closest('section, [id]');
    while (sec && !(sec.id || sec.querySelector('h1,h2'))) sec = sec.parentElement ? sec.parentElement.closest('section, [id]') : null;
    if (!sec) return 'page';
    if (sec.id) return sec.id.slice(0, 40);
    var h = sec.querySelector('h1,h2'); return h ? label(h).toLowerCase().slice(0, 40) : 'page';
  }
  function track() {
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('a, button, summary, [role="button"]') : null;
      if (!el || el.closest('.consent')) return;
      var inForm = !!el.closest('dialog, form, .waf');
      var href = el.getAttribute('href') || '';
      var base = { click_text: label(el), click_area: areaOf(el) };
      if (el.hasAttribute('data-wa-donate') || /hub\.welfareavenue\.com\/give/.test(href)) {
        var amt = Number(el.getAttribute('data-wa-amount')) || undefined;
        var camp = el.getAttribute('data-wa-campaign') || 'general';
        ev('donate_click', Object.assign({ donate_campaign: camp, value: amt, currency: amt ? 'CAD' : undefined }, base));
        fb('InitiateCheckout', amt ? { content_name: camp, value: amt, currency: 'CAD' } : { content_name: camp });
        return;
      }
      if (inForm) return;
      if (el.closest('[data-wa-popup]') || /#(apply|groups)(-form)?$/.test(href)) {
        ev('signup_open', Object.assign({ form: formName(el) }, base));
        return;
      }
      if (el.hasAttribute('hreflang')) { ev('language_switch', Object.assign({ switch_to: el.getAttribute('hreflang') }, base)); return; }
      if (/^mailto:/.test(href)) { ev('contact_click', Object.assign({ contact_method: 'email' }, base)); return; }
      if (/^(tel|sms):/.test(href)) { ev('contact_click', Object.assign({ contact_method: href.split(':')[0] }, base)); return; }
      if (el.tagName === 'A' && href && !el.classList.contains('btn')) {
        /* every other link: the menu, the footer, text links, cards (outbound ones too; GA also counts those as click) */
        ev('link_click', Object.assign({ click_url: href.slice(0, 120) }, base));
        return;
      }
      ev('button_click', Object.assign({ click_url: href ? href.slice(0, 120) : undefined }, base));
    }, true);
    document.addEventListener('submit', function (e) {
      var f = e.target;
      if (f && f.closest) ev('form_submit', { form: formName(f) });
    }, true);
    /* A form sent successfully shows its thank-you box (.waf-done, assets/forms.js). */
    if (window.MutationObserver) {
      new MutationObserver(function (list) {
        list.forEach(function (m) {
          for (var i = 0; i < m.addedNodes.length; i++) {
            var n = m.addedNodes[i];
            if (n.nodeType === 1 && n.classList.contains('waf-done')) {
              var name = formName(n);
              var news = /newsletter|infolettre/.test(name);
              ev(news ? 'newsletter_signup' : 'form_sent', { form: name });
              fb(news ? 'CompleteRegistration' : 'Lead', { content_name: name });
            }
          }
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
    /* A gift completed in the donation pop-up (the Hub's give/embed.js tells the page). The amount is sent only
       if the Hub passes it along (detail.amount, in dollars). */
    window.addEventListener('wa-donate-done', function (e) {
      var d = (e && e.detail) || {}, camp = d.campaign || 'general', amt = Number(d.amount) || undefined;
      ev('donate_done', { donate_campaign: camp, value: amt, currency: amt ? 'CAD' : undefined });
      fb('Donate', amt ? { content_name: camp, value: amt, currency: 'CAD' } : { content_name: camp, currency: 'CAD' });
    });
    /* How far down people read: once per page at 25, 50, 75 and 100 percent. */
    var marks = [25, 50, 75, 100], hit = {};
    function depth() {
      var d = document.documentElement, max = Math.max(1, d.scrollHeight - window.innerHeight);
      var p = max <= 1 ? 100 : Math.round(window.scrollY / max * 100);
      marks.forEach(function (m) { if (p >= m && !hit[m]) { hit[m] = 1; ev('scroll_depth', { scroll_pct: m }); } });
    }
    var tick = null;
    window.addEventListener('scroll', function () { if (tick) return; tick = setTimeout(function () { tick = null; depth(); }, 250); }, { passive: true });
    setTimeout(depth, 1500);
    /* Which parts of a page people actually see: each section once, when half of it (or half the screen) is in view. */
    if (window.IntersectionObserver) {
      var seen = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var r = en.intersectionRatio, big = en.boundingClientRect.height > window.innerHeight;
          if (r < 0.5 && !(big && en.intersectionRect.height >= window.innerHeight * 0.5)) return;
          var name = areaOf(en.target.querySelector('h1,h2,h3') || en.target);
          if (seen[name]) return; seen[name] = 1; io.unobserve(en.target);
          ev('section_view', { section: name });
        });
      }, { threshold: [0, 0.25, 0.5, 0.75] });
      document.querySelectorAll('main section, main > [id], section[id]').forEach(function (s) { io.observe(s); });
    }
  }

  /* Remove Google Analytics cookies when someone withdraws their permission. */
  function clearCookies() {
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^(_ga|_clck|_clsk|CLID|ANONCHK|MR|MUID|SM|_fbp|_fbc)$|^_ga/.test(name)) return;
      ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }

  var bar = null;
  function hide() { if (bar) { bar.hidden = true; } }
  function choose(v) {
    var was = get();
    set(v);
    hide();
    if (v === 'all' || (v === 'yes' && !adsOn)) { load(v === 'all'); return; }
    if (was === 'yes' || was === 'all' || loaded) { try { if (window.clarity) window.clarity('consent', false); } catch (e) { /* fine */ } clearCookies(); location.reload(); }
  }
  function show() {
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'consent noprint';
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', T.label);
      var wrap = document.createElement('div');
      wrap.className = 'wrap';
      var p = document.createElement('p');
      p.appendChild(document.createTextNode(T.text + ' '));
      var a = document.createElement('a');
      a.href = T.href;
      a.textContent = T.more;
      p.appendChild(a);
      var btns = document.createElement('div');
      btns.className = 'consent-btns';
      var no = document.createElement('button');
      no.type = 'button'; no.className = 'consent-no'; no.textContent = T.no;
      no.addEventListener('click', function () { choose('no'); });
      var some = document.createElement('button');
      some.type = 'button'; some.className = 'consent-no'; some.textContent = T.some;
      some.addEventListener('click', function () { choose('yes'); });
      var yes = document.createElement('button');
      yes.type = 'button'; yes.className = 'consent-yes'; yes.textContent = T.yes;
      yes.addEventListener('click', function () { choose('all'); });
      btns.appendChild(no); btns.appendChild(some); btns.appendChild(yes);
      wrap.appendChild(p); wrap.appendChild(btns);
      bar.appendChild(wrap);
      document.body.appendChild(bar);
    }
    bar.hidden = false;
  }

  function start() {
    var c = get();
    /* No banner. A choice the visitor made always wins: no = nothing, yes = no Meta pixel, all = everything.
       With no choice yet, everything loads, except on European time or where a choice cannot be kept. */
    if (c === 'yes') load(false);
    else if (c === 'all' || (c !== 'no' && canStore() && !europe())) load(true);
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-wa-consent-open]') : null;
      if (!t) return;
      e.preventDefault();
      show();
      var first = bar.querySelector('button');
      if (first) first.focus();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
