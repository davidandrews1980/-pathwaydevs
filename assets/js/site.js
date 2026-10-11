/* Pathway Devs site script: hash routing for the home page tabs + consent-gated analytics. */
(function () {
  'use strict';

  /* ---- Home page tabs (only runs where the tab panels exist) ---- */
  var panels = document.querySelectorAll('.page-content');
  if (panels.length) {
    var known = { landing: 1, offerings: 1, about: 1, contact: 1 };
    var show = function (id, scrollTarget) {
      document.querySelectorAll('.page-content').forEach(function (p) { p.classList.remove('active-page'); });
      document.querySelectorAll('nav a[data-tab]').forEach(function (a) { a.classList.remove('active'); a.removeAttribute('aria-current'); });
      var page = document.getElementById('page-' + id);
      var nav = document.getElementById('nav-' + id);
      if (page) page.classList.add('active-page');
      if (nav) { nav.classList.add('active'); nav.setAttribute('aria-current', 'page'); }
      if (scrollTarget) {
        var el = document.getElementById(scrollTarget);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      }
      window.scrollTo({ top: 0 });
    };
    var route = function () {
      var h = (location.hash || '').replace(/^#\/?/, '');
      if (h === 'apps') { location.replace('/apps/'); return; }
      if (h === 'intake-matrix') { show('contact', 'intake-matrix'); return; }
      show(known[h] ? h : 'landing');
    };
    window.addEventListener('hashchange', route);
    route();
  }

  /* ---- Analytics: nothing from Google loads until the visitor accepts ---- */
  var KEY = 'pd-tech-analytics-consent';
  var banner = document.getElementById('pd-consent');
  var gaId = banner ? banner.getAttribute('data-ga-id') : null;
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* ignore */ } }
  function load() {
    if (!gaId || get() !== 'accepted' || document.getElementById('pd-gtag-js')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    var s = document.createElement('script');
    s.id = 'pd-gtag-js'; s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', gaId);
  }
  if (banner) {
    var yes = document.getElementById('pd-consent-accept');
    var no = document.getElementById('pd-consent-decline');
    if (yes) yes.addEventListener('click', function () { set('accepted'); banner.hidden = true; load(); });
    if (no) no.addEventListener('click', function () { set('declined'); banner.hidden = true; });
    var reopen = document.getElementById('pd-cookie-settings');
    if (reopen) reopen.addEventListener('click', function () { banner.hidden = false; });
    if (get() === null) banner.hidden = false;
    load();
  }
})();
