// Load partials then enhance
(function(){
  const zones = ["social","videos","footer"];
  const cacheBust = ""; // you can set `?v=1` if you need to force refresh
  let revealObserver;

  function inject(name, html){
    const slot = document.getElementById(name);
    if (slot) slot.innerHTML = html;
    initEnhancements();
  }

  async function loadPartials(){
    await Promise.all(zones.map(async (name) => {
      try{
        const res = await fetch(`partials/${name}.html${cacheBust}`);
        const html = await res.text();
        inject(name, html);
      }catch(err){
        console.error("Error loading partial:", name, err);
      }
    }));
  }

  // ----- Enhancements (theme, deep links, year) -----
  function isIOS(){ return /iP(hone|ad|od)/i.test(navigator.userAgent); }
  function isAndroid(){ return /Android/i.test(navigator.userAgent); }

  // Safety stubs: some listener removal calls reference these handlers
  // when the mobile hamburger/nav was removed. Define no-op handlers
  // so removeEventListener won't throw ReferenceError in browsers.
  function _navOutsideHandler() { /* noop */ }
  function _navKeyHandler() { /* noop */ }

  function buildAndroidIntent(webUrl, pkg){
    const cleaned = (webUrl || '').replace(/^https?:\/\//,'');
    if (!cleaned) return '';
    if (!pkg) return `intent://${cleaned}#Intent;scheme=https;end`;
    return `intent://${cleaned}#Intent;scheme=https;package=${pkg};end`;
  }

  function openDeepLink({ios, androidPackage, web}){
    const start = Date.now();
    if (isIOS() && ios){
      location.href = ios;
      setTimeout(() => { if (Date.now() - start < 1500 && web) location.href = web; }, 1200);
      return;
    }
    if (isAndroid() && web){
      const intent = buildAndroidIntent(web, androidPackage);
      if (intent) {
        location.href = intent;
        setTimeout(() => { if (Date.now() - start < 1500 && web) location.href = web; }, 1200);
        return;
      }
    }
    if (web) window.open(web, '_blank', 'noopener');
  }

  function initEnhancements(){
    // Theme persistence removed (static theme)

    // Deep link delegation
    document.removeEventListener('click', _deeplinkDelegation, true);
    document.addEventListener('click', _deeplinkDelegation, true);

    // No mobile hamburger: nav is always visible; remove any leftover listeners
    document.removeEventListener('click', _navOutsideHandler);
    document.removeEventListener('keydown', _navKeyHandler);

    // Footer year (idempotent)
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();

    setupScrollAnimations();
  }

  // No nav toggle functions required when nav is always visible

  function setupScrollAnimations(){
    const sections = Array.from(document.querySelectorAll('[data-animate]'));
    if (!sections.length) return;

    const prefersReducedMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    sections.forEach(primeChildAnimations);

    if (prefersReducedMotion || !('IntersectionObserver' in window)){
      sections.forEach(section => {
        if (!section.classList.contains('is-visible')) section.classList.add('is-visible');
        revealChildren(section);
      });
      return;
    }

    if (!revealObserver){
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add('is-visible');
          revealChildren(el);
          if (revealObserver) revealObserver.unobserve(el);
        });
      }, { rootMargin: '0px 0px -10%', threshold: 0.2 });
    }

    sections.forEach(section => {
      if (section.classList.contains('is-visible')){
        revealChildren(section);
        return;
      }
      revealObserver.observe(section);
    });
  }

  function primeChildAnimations(root){
    const selector = root.getAttribute('data-animate-children');
    if (!selector) return;
    const targets = root.querySelectorAll(selector);
    targets.forEach((child, index) => {
      if (!child.classList.contains('reveal-child')) child.classList.add('reveal-child');
      child.style.setProperty('--reveal-index', index.toString());
      if (root.classList.contains('is-visible')){
        requestAnimationFrame(() => child.classList.add('is-visible'));
      }
    });
  }

  function revealChildren(root){
    const selector = root.getAttribute('data-animate-children');
    if (!selector) return;
    const targets = root.querySelectorAll(selector);
    targets.forEach((child, index) => {
      if (!child.classList.contains('reveal-child')){
        child.classList.add('reveal-child');
        child.style.setProperty('--reveal-index', index.toString());
      }
      requestAnimationFrame(() => child.classList.add('is-visible'));
    });
  }

  // theme delegation removed

  function _deeplinkDelegation(e){
    const a = e.target.closest && e.target.closest('a[data-app="true"]');
    if (!a) return;
    const ios = a.getAttribute('data-ios');
    const pkg = a.getAttribute('data-android-package');
    const web = a.getAttribute('data-web') || a.getAttribute('href');
    e.preventDefault();
    openDeepLink({ ios, androidPackage: pkg, web });
  }

  // kick things off
  loadPartials().then(initEnhancements);
})();
