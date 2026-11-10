/* Welfare Avenue website: Google Analytics and Microsoft Clarity, only with the visitor's permission (Quebec Law 25).
   Nothing is sent to Google and no analytics cookie is set until the visitor presses Accept.
   The choice is kept in this browser (wa_consent = yes or no). Any element with data-wa-consent-open
   (the privacy pages have one) shows the banner again so people can change their mind. */
(function () {
  'use strict';
  var ID = 'G-J4RXM9WJSW';
  /* Microsoft Clarity (heat maps and visit recordings, Steel 10/11/26): its project id, empty until the project exists. */
  var CLARITY = 'zbcoohovt6';
  var KEY = 'wa_consent';
  var FR = (document.documentElement.lang || '').toLowerCase().indexOf('fr') === 0;
  var T = FR ? {
    label: 'Témoins',
    text: 'Nous aimerions utiliser les témoins de Google Analytics et de Microsoft Clarity pour compter les visites et voir comment nos pages sont utilisées (clics et défilement). Aucune publicité, et nous ne vendons jamais vos données.',
    more: 'Confidentialité', href: '/fr/confidentialite/', yes: 'Accepter', no: 'Refuser'
  } : {
    label: 'Cookies',
    text: 'We would like to use cookies from Google Analytics and Microsoft Clarity to count visits and see how people use our pages (clicks and scrolling). No ads, and we never sell your data.',
    more: 'Privacy', href: '/privacy/', yes: 'Accept', no: 'Decline'
  };

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: ask again next visit */ } }

  var loaded = false;
  function load() {
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
  function clarity() {
    if (!CLARITY || window.clarity) return;
    window.clarity = function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    var c = document.createElement('script');
    c.async = true;
    c.src = 'https://www.clarity.ms/tag/' + CLARITY;
    document.head.appendChild(c);
    window.clarity('consent');
  }

  /* Welfare Avenue's own events, on top of what Google measures by itself (page views, time on the site,
     scrolling, outbound links, video plays, form starts). Only runs once the visitor has accepted. */
  function ev(name, p) { try { window.gtag('event', name, p || {}); } catch (e) { /* never break the page */ } }
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
        ev('donate_click', Object.assign({ donate_campaign: el.getAttribute('data-wa-campaign') || 'general', value: amt, currency: amt ? 'CAD' : undefined }, base));
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
              ev(/newsletter|infolettre/.test(name) ? 'newsletter_signup' : 'form_sent', { form: name });
            }
          }
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
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
      if (!/^(_ga|_clck|_clsk|CLID|ANONCHK|MR|MUID|SM)$|^_ga/.test(name)) return;
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
    if (v === 'yes') { load(); return; }
    if (was === 'yes' || loaded) { try { if (window.clarity) window.clarity('consent', false); } catch (e) { /* fine */ } clearCookies(); location.reload(); }
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
      var yes = document.createElement('button');
      yes.type = 'button'; yes.className = 'consent-yes'; yes.textContent = T.yes;
      yes.addEventListener('click', function () { choose('yes'); });
      btns.appendChild(no); btns.appendChild(yes);
      wrap.appendChild(p); wrap.appendChild(btns);
      bar.appendChild(wrap);
      document.body.appendChild(bar);
    }
    bar.hidden = false;
  }

  function start() {
    var c = get();
    if (c === 'yes') load();
    else if (c !== 'no') show();
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
