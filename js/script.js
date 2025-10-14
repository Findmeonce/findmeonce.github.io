// Load partials then enhance
(function(){
  const zones = ["hero","social","videos","portfolio","footer"];
  const cacheBust = ""; // you can set `?v=1` if you need to force refresh
  let revealObserver;

  // --- simple i18n map (client-side) ---
  const i18n = {
    en: {
      navSocial: 'Social',
      heroAction: 'Watch most recent',
      heroEyebrow: 'Editor • Creator • E commerce',
      heroTitle: 'Video editor & <span class="gradient-text">content creator</span>',
      heroLead: "Hey, I'm Findmeonce and you're in the best spot to catch what's new.",
      socialHead: 'Social channels',
      socialLead: 'Official social links, follow to stay up to date.',
      labelYouTube: 'YouTube',
      labelInstagram: 'Instagram',
      labelTikTok: 'TikTok',
      labelLinkedIn: 'LinkedIn',
      labelX: 'X',
      labelEmail: 'Email',
      videosHead: 'Latest videos',
      videosLead: 'Catch the newest uploads straight from the channel.',
      videosFeaturedTitle: 'Dropping tomorrow',
      videosFeaturedLead: "First ever vlog, hope y'all enjoy",
      videosFeaturedAction: 'Watch on YouTube',
      portfolioHead: 'Services & Pricing',
      portfolioLead: 'Full service menu arriving soon: dedicated editing for TikTok, Instagram and YouTube plus account management.',
      priceStarterTitle: 'Starter',
      priceStarterLead: 'Great for shorts, reels and small projects.',
      priceStarterAmount: '€80',
      priceProTitle: 'Pro',
      priceProLead: 'For YouTube videos and regular content.',
      priceProAmount: '€250',
      priceEntTitle: 'Enterprise',
      priceEntLead: 'Custom solutions and long term partnerships.',
      priceEntAmount: 'Custom quote',
  priceComingTitle: 'Coming soon',
      priceComingLead: 'We are finalising packages covering short form and long form editing with channel management support.',
      priceComingAmount: 'Limited spots available',
      priceComingFeature1: 'Short form and long form editing for TikTok, Instagram and YouTube',
      priceComingFeature2: 'Account management, performance tracking and creative guidance',
      priceComingBtn: 'Join the waitlist',
      footerCopy: '© 2025 Findmeonce'
    },
    fr: {
      navSocial: 'Réseaux',
      heroAction: 'Voir la dernière vidéo',
      heroEyebrow: 'Monteur • Créateur • E commerce',
      heroTitle: 'Monteur vidéo & <span class="gradient-text">créateur de contenu</span>',
      heroLead: "Salut, ici Findmeonce. Tu es au bon endroit pour suivre toutes les nouveautés.",
      socialHead: 'Réseaux sociaux',
      socialLead: 'Liens officiels, suivez pour rester à jour.',
      labelYouTube: 'YouTube',
      labelInstagram: 'Instagram',
      labelTikTok: 'TikTok',
      labelLinkedIn: 'LinkedIn',
      labelX: 'X',
      labelEmail: 'Email',
      videosHead: 'Dernières vidéos',
      videosLead: 'Visionnez les dernières publications de la chaîne.',
      videosFeaturedTitle: 'Sort demain',
      videosFeaturedLead: 'Tout premier vlog, profitez-en !',
      videosFeaturedAction: 'Voir sur YouTube',
      portfolioHead: 'Services & Tarifs',
      portfolioLead: 'La grille complète arrive bientôt : montage pour TikTok, Instagram, YouTube et gestion de compte.',
      priceStarterTitle: 'Starter',
      priceStarterLead: 'Parfait pour shorts, reels et petits projets.',
      priceStarterAmount: '€80',
      priceProTitle: 'Pro',
      priceProLead: 'Pour vidéos YouTube et contenu régulier.',
      priceProAmount: '€250',
      priceEntTitle: 'Enterprise',
      priceEntLead: 'Solutions sur mesure et partenariats long terme.',
      priceEntAmount: 'Devis personnalisé',
  priceComingTitle: 'Bientôt disponible',
      priceComingLead: 'Nous finalisons des forfaits qui couvrent le montage short form et long form avec un soutien en gestion de chaîne.',
      priceComingAmount: 'Places limitées',
      priceComingFeature1: 'Montage short form et long form pour TikTok, Instagram et YouTube',
      priceComingFeature2: 'Gestion de compte, suivi des performances et direction créative',
      priceComingBtn: 'Rejoindre la liste d\'attente',
      footerCopy: '© 2025 Findmeonce'
    }
  };
  function currentLang(){ return localStorage.getItem('lang') || 'en'; }
  function setLang(lang){ localStorage.setItem('lang', lang); updateLangButtons(lang); }
  function applyLang(lang){
    const map = i18n[lang] || i18n.en;
    // translate any element that uses data-i18n
    const trans = document.querySelectorAll('[data-i18n]');
    trans.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const val = map[key];
      if (val === undefined) return;
      // If the translation contains HTML (like footerCopy), set innerHTML, otherwise textContent
      if (val.includes('<') && val.includes('>')) el.innerHTML = val; else el.textContent = val;
    });
  }

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

    // Language switch wiring (EN/FR buttons)
    // Use both direct handlers and a delegated handler so clicks remain reliable
    const langGroup = document.getElementById('lang-switch');
    if (langGroup){
      const btns = Array.from(langGroup.querySelectorAll('.lang-btn'));
      btns.forEach(b => {
        b.removeEventListener('click', _langBtnHandler);
        b.addEventListener('click', _langBtnHandler);
        // also listen for mouse events to ensure Safari desktop captures the interaction
        b.removeEventListener('mousedown', _langMouseHandler);
        b.addEventListener('mousedown', _langMouseHandler);
        b.removeEventListener('mouseup', _langMouseHandler);
        b.addEventListener('mouseup', _langMouseHandler);
      });
      // ensure delegated listener is active (click + pointerup for mobile taps)
      document.removeEventListener('click', _langBtnDelegation, true);
      document.addEventListener('click', _langBtnDelegation, true);
      document.removeEventListener('pointerup', _langBtnDelegation, true);
      document.addEventListener('pointerup', _langBtnDelegation, true);
      // reflect stored language
      updateLangButtons(currentLang());
    } else {
      // if no lang group present, ensure delegation is not attached
      document.removeEventListener('click', _langBtnDelegation);
      document.removeEventListener('pointerup', _langBtnDelegation, true);
    }

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

  function _langBtnHandler(e){
    const btn = e.currentTarget;
    if (!btn) return;
    const lang = btn.getAttribute('data-lang');
    if (!lang) return;
    setLang(lang);
  }

  function _langMouseHandler(e){
    const btn = e.currentTarget;
    if (!btn) return;
    const lang = btn.getAttribute('data-lang');
    if (!lang) return;
    // treat mouseup/mousedown as triggers on desktop
    if (e.type === 'mouseup' || e.type === 'mousedown') setLang(lang);
  }

  function _langBtnDelegation(e){
    const btn = e.target && e.target.closest && e.target.closest('.lang-btn');
    if (!btn) return;
    const lang = btn.getAttribute('data-lang');
    if (!lang) return;
    e.preventDefault();
    setLang(lang);
  }

  function updateLangButtons(lang){
    const group = document.getElementById('lang-switch');
    if (!group) return;
    const btns = Array.from(group.querySelectorAll('.lang-btn'));
    btns.forEach(b => {
      const is = b.getAttribute('data-lang') === lang;
      b.setAttribute('aria-pressed', is ? 'true' : 'false');
      if (is) b.classList.add('active'); else b.classList.remove('active');
    });
    applyLang(lang);
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
