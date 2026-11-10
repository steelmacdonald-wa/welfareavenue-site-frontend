/* Welfare Avenue website: Google Analytics, only with the visitor's permission (Quebec Law 25).
   Nothing is sent to Google and no analytics cookie is set until the visitor presses Accept.
   The choice is kept in this browser (wa_consent = yes or no). Any element with data-wa-consent-open
   (the privacy pages have one) shows the banner again so people can change their mind. */
(function () {
  'use strict';
  var ID = 'G-J4RXM9WJSW';
  var KEY = 'wa_consent';
  var FR = (document.documentElement.lang || '').toLowerCase().indexOf('fr') === 0;
  var T = FR ? {
    label: 'Témoins',
    text: 'Nous aimerions utiliser les témoins de Google Analytics pour compter les visites et savoir quelles pages vous sont utiles. Aucune publicité, et nous ne vendons jamais vos données.',
    more: 'Confidentialité', href: '/fr/confidentialite/', yes: 'Accepter', no: 'Refuser'
  } : {
    label: 'Cookies',
    text: 'We would like to use Google Analytics cookies to count visits and see which pages help people most. No ads, and we never sell your data.',
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
  function track() {
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('a, button') : null;
      if (!el || el.closest('.consent')) return;
      var inForm = !!el.closest('dialog, form, .waf');
      var href = el.getAttribute('href') || '';
      if (el.hasAttribute('data-wa-donate') || /hub\.welfareavenue\.com\/give/.test(href)) {
        var amt = Number(el.getAttribute('data-wa-amount')) || undefined;
        ev('donate_click', { campaign: el.getAttribute('data-wa-campaign') || 'general', value: amt, currency: amt ? 'CAD' : undefined, link_text: label(el) });
        return;
      }
      if (inForm) return;
      if (el.closest('[data-wa-popup]') || /#(apply|groups)(-form)?$/.test(href)) {
        ev('signup_open', { form: formName(el), link_text: label(el) });
        return;
      }
      if (el.hasAttribute('hreflang')) { ev('language_switch', { to: el.getAttribute('hreflang') }); return; }
      if (/^mailto:/.test(href)) { ev('contact_click', { method: 'email' }); return; }
      if (/^(tel|sms):/.test(href)) { ev('contact_click', { method: href.split(':')[0] }); return; }
      if (el.classList.contains('btn') || el.tagName === 'BUTTON') {
        ev('button_click', { link_text: label(el), link_url: href || undefined });
      }
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
  }

  /* Remove Google Analytics cookies when someone withdraws their permission. */
  function clearCookies() {
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^_ga/.test(name)) return;
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
    if (was === 'yes' || loaded) { clearCookies(); location.reload(); }
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
