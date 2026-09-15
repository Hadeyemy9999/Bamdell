/**
 * Bam Dell Disabilities and Orphanage Home - Main Site Script
 * Handles live animated stat counters, cookie consent banner, accordions,
 * progressive scroll reveal, lazy image loading, and responsive touch interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSiteMarquee();
  applyRemoteMedia();
  initHeroCarousel();
  initLazyImages();
  initScrollReveal();
  initInfiniteScroll();
  initFeaturedVideo();
  initMediaLightbox();
  initCookieBanner();
  initStatCounters();
  initAccordions();
  updateCurrentYear();
});

/* Lazy Loading for Images */
function initLazyImages() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (img.hasAttribute('loading')) return;
    const isHeroSlide = img.closest('.hero-slide');
    const isActiveHero = img.closest('.hero-slide.is-active');
    img.setAttribute('loading', isActiveHero ? 'eager' : (isHeroSlide ? 'lazy' : 'lazy'));
    if (isActiveHero) img.setAttribute('fetchpriority', 'high');
  });
}

/* Progressive Scroll Reveal for Page Sections and Cards */
function initScrollReveal() {
  // Only reveal targets if prefers-reduced-motion is not active
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const revealTargets = document.querySelectorAll('.section, .card, .stat-box, article');
  if (!revealTargets.length) return;

  revealTargets.forEach(target => {
    target.classList.add('scroll-reveal');
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.05
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealTargets.forEach(target => observer.observe(target));
}

function initSiteMarquee() {
  if (document.querySelector('.media-marquee-section')) return;
  const main = document.getElementById('main-content');
  if (!main) return;

  const section = document.createElement('section');
  section.className = 'media-marquee-section';
  section.setAttribute('aria-label', 'Moments from Bam Dell Home');
  section.innerHTML = `
    <div class="media-marquee">
      <div class="media-marquee-track">
        <div class="media-marquee-item"><img src="/assets/images/gallery-care.svg" data-media="galleryCare" alt="Daily care at Bam Dell Home" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-meals.svg" data-media="galleryMeals" alt="Shared meals at Bam Dell Home" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-therapy.svg" data-media="galleryTherapy" alt="Physiotherapy at Bam Dell Home" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-classroom.svg" data-media="galleryClassroom" alt="Inclusive classroom at Bam Dell Home" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-play.svg" data-media="galleryPlay" alt="Children playing at Bam Dell Home" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-home.svg" data-media="galleryHome" alt="Bam Dell Home in Ibadan" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-visit.svg" data-media="galleryVisit" alt="Partners visiting Bam Dell Home" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-worship.svg" data-media="galleryWorship" alt="Spiritual care at Bam Dell Home" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-care.svg" data-media="galleryCare" alt="" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-meals.svg" data-media="galleryMeals" alt="" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-therapy.svg" data-media="galleryTherapy" alt="" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-classroom.svg" data-media="galleryClassroom" alt="" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-play.svg" data-media="galleryPlay" alt="" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-home.svg" data-media="galleryHome" alt="" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-visit.svg" data-media="galleryVisit" alt="" /></div>
        <div class="media-marquee-item"><img src="/assets/images/gallery-worship.svg" data-media="galleryWorship" alt="" /></div>
      </div>
    </div>
  `;

  const first = main.firstElementChild;
  if (first && (first.classList.contains('hero') || first.classList.contains('section'))) {
    first.after(section);
  } else {
    main.prepend(section);
  }
}

/* Infinite Scroll Engine for Fast Page Loading & Dynamic Content Streams */
function initInfiniteScroll() {
  const marked = Array.from(document.querySelectorAll('[data-infinite-scroll="true"]'));
  const autoGrids = Array.from(document.querySelectorAll('.grid, .serve-group-grid, .needs-grid, .media-gallery-grid'))
    .filter(el => !el.hasAttribute('data-infinite-scroll'));
  const containers = marked.concat(autoGrids);

  if (!containers.length) return;

  containers.forEach(container => {
    const items = Array.from(container.children).filter(child =>
      child.classList.contains('card') ||
      child.classList.contains('gallery-card') ||
      child.classList.contains('serve-group-item') ||
      child.classList.contains('need-item-card') ||
      child.hasAttribute('data-infinite-item') ||
      child.tagName === 'ARTICLE'
    );

    if (items.length < 5) return;

    const BATCH_SIZE = container.classList.contains('media-gallery-grid') ? 6 : 4;
    let currentlyShown = BATCH_SIZE;

    // Initially hide items beyond BATCH_SIZE
    items.forEach((item, index) => {
      if (index >= BATCH_SIZE) {
        item.style.display = 'none';
      }
    });

    // Create sentinel element for triggering batch loads on scroll
    const sentinel = document.createElement('div');
    sentinel.className = 'infinite-loader-wrapper';
    sentinel.innerHTML = `
      <div class="infinite-spinner" aria-hidden="true"></div>
      <p style="font-size: 0.9rem; color: var(--dark-muted); margin-bottom: 0.5rem;">Loading more items...</p>
      <button type="button" class="btn btn-outline btn-sm manual-load-more" style="margin-top: 0.25rem;">Load More Now &darr;</button>
    `;
    container.after(sentinel);

    const loadNextBatch = () => {
      if (currentlyShown >= items.length) {
        sentinel.innerHTML = `
          <div class="infinite-end-msg">
            ✨ All items on this page loaded • Bam Dell Disabilities and Orphanage Home
          </div>
        `;
        if (sentinelObserver) sentinelObserver.disconnect();
        return;
      }

      const nextLimit = Math.min(currentlyShown + BATCH_SIZE, items.length);
      for (let i = currentlyShown; i < nextLimit; i++) {
        items[i].style.display = '';
        items[i].classList.add('scroll-reveal');
        setTimeout(() => items[i].classList.add('is-revealed'), 50 * (i - currentlyShown));
      }
      currentlyShown = nextLimit;

      if (currentlyShown >= items.length) {
        sentinel.innerHTML = `
          <div class="infinite-end-msg">
            ✨ All items on this page loaded • Bam Dell Disabilities and Orphanage Home
          </div>
        `;
        if (sentinelObserver) sentinelObserver.disconnect();
      }
    };

    // Manual fallback button click handler
    sentinel.addEventListener('click', (e) => {
      if (e.target.classList.contains('manual-load-more')) {
        loadNextBatch();
      }
    });

    // Infinite scroll observer
    const sentinelObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && currentlyShown < items.length) {
          setTimeout(loadNextBatch, 250);
        }
      });
    }, { rootMargin: '200px' });

    sentinelObserver.observe(sentinel);
  });
}

/* NDPA 2023 Compliant Cookie Consent & Settings Engine */
function initCookieBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  const acceptBtn = document.getElementById('accept-cookies-btn');
  const openSettingsBtn = document.getElementById('open-cookie-settings-btn');
  const rejectBtn = document.getElementById('reject-cookies-btn');
  const footerSettingsBtn = document.getElementById('footer-cookie-settings-btn');
  
  const modal = document.getElementById('cookie-settings-modal');
  const closeModalBtn = document.getElementById('close-cookie-modal-btn');
  const modalAcceptAllBtn = document.getElementById('modal-accept-all-btn');
  const form = document.getElementById('cookie-settings-form');
  const toast = document.getElementById('cookie-toast-notification');

  const analyticsCheck = document.getElementById('cookie-opt-analytics');
  const functionalCheck = document.getElementById('cookie-opt-functional');

  // Load existing cookie preferences from localStorage
  const savedSettingsRaw = localStorage.getItem('bamdell_cookie_settings') || localStorage.getItem('bamdell_cookie_consent');
  let savedSettings = null;
  if (savedSettingsRaw) {
    try {
      savedSettings = JSON.parse(savedSettingsRaw);
    } catch(e) {
      if (savedSettingsRaw === 'accepted') {
        savedSettings = { essential: true, analytics: true, functional: true };
      }
    }
  }

  // If no preferences saved, display banner
  if (!savedSettings && banner) {
    banner.style.display = 'flex';
  }

  // Populate checkboxes if settings exist
  if (savedSettings) {
    if (analyticsCheck) analyticsCheck.checked = !!savedSettings.analytics;
    if (functionalCheck) functionalCheck.checked = !!savedSettings.functional;
  }

  // Helper to show confirmation toast notification
  function showConfirmationToast() {
    if (!toast) return;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 4500);
  }

  // Save Settings Helper
  function saveCookiePreferences(analyticsVal, functionalVal) {
    const prefs = {
      essential: true,
      analytics: analyticsVal,
      functional: functionalVal,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('bamdell_cookie_settings', JSON.stringify(prefs));
    localStorage.setItem('bamdell_cookie_consent', 'accepted');
    
    if (banner) banner.style.display = 'none';
    if (modal) modal.style.display = 'none';

    showConfirmationToast();
  }

  // Button handlers
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      saveCookiePreferences(true, true);
    });
  }

  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
      saveCookiePreferences(false, false);
    });
  }

  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      if (modal) modal.style.display = 'flex';
    });
  }

  if (footerSettingsBtn) {
    footerSettingsBtn.addEventListener('click', () => {
      if (modal) modal.style.display = 'flex';
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
  }

  if (modalAcceptAllBtn) {
    modalAcceptAllBtn.addEventListener('click', () => {
      if (analyticsCheck) analyticsCheck.checked = true;
      if (functionalCheck) functionalCheck.checked = true;
      saveCookiePreferences(true, true);
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const analyticsVal = analyticsCheck ? analyticsCheck.checked : false;
      const functionalVal = functionalCheck ? functionalCheck.checked : false;
      saveCookiePreferences(analyticsVal, functionalVal);
    });
  }

  // Close modal when clicking backdrop
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
}

/* Live Animated Stat Counters */
function initStatCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const observerOptions = {
    threshold: 0.3
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1800;
  const stepTime = 25;
  const steps = duration / stepTime;
  const increment = target / steps;
  
  let current = 0;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      el.textContent = target.toLocaleString() + suffix;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current).toLocaleString() + suffix;
    }
  }, stepTime);
}

/* Accessible Expandable Accordion Component */
function initAccordions() {
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');
  
  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const contentId = trigger.getAttribute('aria-controls');
      const content = document.getElementById(contentId);
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      trigger.setAttribute('aria-expanded', !isExpanded);
      if (content) {
        content.hidden = isExpanded;
        content.style.display = isExpanded ? 'none' : 'block';
      }

      const icon = trigger.querySelector('.accordion-icon');
      if (icon) {
        icon.textContent = isExpanded ? '➕' : '➖';
      }
    });
  });
}

function updateCurrentYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

function getMediaConfig() {
  return window.BAMDELL_MEDIA || { images: {}, videos: {} };
}

function optimizeCloudinaryUrl(url) {
  if (!url || url.indexOf('res.cloudinary.com') === -1) return url;
  if (url.indexOf('/upload/f_auto') !== -1) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto,c_fill,w_1200/');
}

function vimeoEmbedUrl(value) {
  if (!value) return '';
  const match = String(value).match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  const id = match ? match[1] : (/^\d+$/.test(String(value).trim()) ? String(value).trim() : '');
  if (!id) return '';
  return 'https://player.vimeo.com/video/' + id + '?title=0&byline=0&portrait=0&dnt=1';
}

function applyRemoteMedia() {
  const media = getMediaConfig();
  const images = media.images || {};
  const videos = media.videos || {};
  const counters = {};

  document.querySelectorAll('[data-media]').forEach(img => {
    const key = img.getAttribute('data-media');
    const slides = images[key + 'Slides'];
    const value = images[key];
    let remote = '';
    if (Array.isArray(slides) && slides.length) {
      const i = counters[key] || 0;
      remote = optimizeCloudinaryUrl(slides[i % slides.length]);
      counters[key] = i + 1;
    } else if (typeof value === 'string') {
      remote = optimizeCloudinaryUrl(value);
    }
    if (!remote) return;
    img.setAttribute('src', remote);
    const wrap = img.closest('[data-lightbox]');
    if (wrap) wrap.setAttribute('data-lightbox', remote);
  });

  document.querySelectorAll('[data-vimeo]').forEach(stage => {
    const key = stage.getAttribute('data-vimeo');
    const embed = vimeoEmbedUrl(videos[key]);
    if (!embed) return;
    const iframe = document.createElement('iframe');
    iframe.src = embed;
    iframe.title = 'Bam Dell Home video';
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    iframe.className = 'vimeo-embed';
    stage.innerHTML = '';
    stage.appendChild(iframe);
    stage.classList.add('has-vimeo');
  });
}

function initHeroCarousel() {
  const carousels = document.querySelectorAll('[data-hero-carousel], [data-media-carousel]');
  carousels.forEach(carousel => {
    let urls = [];
    try {
      urls = JSON.parse(carousel.getAttribute('data-slides') || '[]');
    } catch (err) {
      urls = [];
    }
    if (!urls.length) {
      const mediaImages = (getMediaConfig().images || {});
      const fromConfig = mediaImages.galleryVisitSlides || mediaImages.galleryVisit;
      urls = Array.isArray(fromConfig) ? fromConfig : (fromConfig ? [fromConfig] : []);
    }
    const viewport = carousel.querySelector('.hero-carousel-viewport');
    const currentImg = carousel.querySelector('.hero-carousel-current');
    const incomingImg = carousel.querySelector('.hero-carousel-incoming');
    const dots = Array.from(carousel.querySelectorAll('.hero-carousel-dots button'));
    const prevBtn = carousel.querySelector('.hero-carousel-prev');
    const nextBtn = carousel.querySelector('.hero-carousel-next');
    if (!viewport || !currentImg || !incomingImg || urls.length < 2) return;

    const height = parseInt(carousel.getAttribute('data-height'), 10) || 420;
    viewport.setAttribute('style', 'position:relative;width:100%;height:' + height + 'px;overflow:hidden;border-radius:16px;background:#0B0F0B;box-shadow:0 12px 30px rgba(0,0,0,0.12);');
    const layerStyle = 'position:absolute;top:4px;left:4px;width:calc(100% - 8px);height:calc(100% - 8px);max-width:none;object-fit:cover;object-position:center;display:block;margin:0;padding:clamp(4px,1vw,10px);border:4px solid #39FF14;border-radius:8px;box-shadow:0 0 10px rgba(57,255,20,1),0 0 22px rgba(57,255,20,0.65),0 0 40px rgba(57,255,20,0.35);backface-visibility:hidden;';
    currentImg.setAttribute('style', layerStyle + 'z-index:1;transform:translateX(0);');
    incomingImg.setAttribute('style', layerStyle + 'z-index:2;transform:translateX(100%);');

    let index = 0;
    let animating = false;
    let timer = null;
    let effectIndex = 0;
    const effects = ['door', 'flip'];
    const intervalMs = parseInt(carousel.getAttribute('data-interval'), 10) || 40000;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const updateDots = () => {
      dots.forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle('is-active', active);
        if (active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };

    const resetLayers = () => {
      viewport.style.perspective = 'none';
      currentImg.style.transition = 'none';
      currentImg.style.transform = 'translateX(0)';
      currentImg.style.transformOrigin = 'center center';
      currentImg.style.clipPath = 'none';
      currentImg.style.opacity = '1';
      incomingImg.style.transition = 'none';
      incomingImg.style.transform = 'translateX(100%)';
      incomingImg.style.transformOrigin = 'center center';
      incomingImg.style.clipPath = 'none';
      incomingImg.style.opacity = '1';
      incomingImg.style.zIndex = '2';
    };

    const goTo = (next, dir) => {
      if (animating) return;
      const target = (next + urls.length) % urls.length;
      if (target === index) return;
      animating = true;
      const direction = dir || (target > index || (index === urls.length - 1 && target === 0) ? 1 : -1);
      const effect = reduceMotion ? 'instant' : effects[effectIndex % effects.length];
      effectIndex++;

      incomingImg.src = urls[target];
      incomingImg.alt = '';

      if (effect === 'instant') {
        currentImg.src = urls[target];
        index = target;
        updateDots();
        animating = false;
        return;
      }

      if (effect === 'flip') {
        viewport.style.perspective = '1600px';
        currentImg.style.transition = 'none';
        currentImg.style.transform = 'translateX(0)';
        currentImg.style.opacity = '1';
        incomingImg.style.transition = 'none';
        incomingImg.style.transformOrigin = direction === 1 ? 'left center' : 'right center';
        incomingImg.style.transform = 'rotateY(' + (direction === 1 ? -100 : 100) + 'deg)';
        incomingImg.style.opacity = '1';
        incomingImg.style.zIndex = '3';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            incomingImg.style.transition = 'transform 0.9s cubic-bezier(0.22, 0.61, 0.36, 1)';
            incomingImg.style.transform = 'rotateY(0deg)';
          });
        });
      } else {
        viewport.style.perspective = 'none';
        currentImg.style.transition = 'none';
        currentImg.style.transform = 'translateX(0)';
        currentImg.style.opacity = '1';
        incomingImg.style.transition = 'none';
        incomingImg.style.transform = 'translateX(0)';
        incomingImg.style.transformOrigin = 'center center';
        incomingImg.style.opacity = '1';
        incomingImg.style.zIndex = '3';
        incomingImg.style.clipPath = 'inset(0 50% 0 50%)';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            incomingImg.style.transition = 'clip-path 0.9s cubic-bezier(0.22, 0.61, 0.36, 1)';
            incomingImg.style.clipPath = 'inset(0 0 0 0)';
          });
        });
      }

      window.setTimeout(() => {
        currentImg.src = urls[target];
        currentImg.alt = incomingImg.alt || currentImg.alt;
        resetLayers();
        index = target;
        updateDots();
        animating = false;
      }, 940);
    };

    const startTimer = () => {
      if (reduceMotion) return;
      stopTimer();
      timer = window.setInterval(() => goTo(index + 1, 1), intervalMs);
    };

    const stopTimer = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        goTo(i, i > index ? 1 : -1);
        startTimer();
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
      goTo(index - 1, -1);
      startTimer();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
      goTo(index + 1, 1);
      startTimer();
    });

    carousel.addEventListener('mouseenter', stopTimer);
    carousel.addEventListener('mouseleave', startTimer);

    updateDots();
    startTimer();
  });
}

function initFeaturedVideo() {
  const players = document.querySelectorAll('[data-video-player]');
  players.forEach(player => {
    const stageImg = player.querySelector('img');
    const playBtn = player.querySelector('[data-video-play]');
    const progress = player.querySelector('[data-video-progress] span');
    let frames = [];
    try {
      frames = JSON.parse(player.getAttribute('data-frames') || '[]');
    } catch (err) {
      frames = [];
    }
    if (!stageImg || !playBtn || frames.length < 2) return;

    let timer = null;
    let index = 0;
    const poster = stageImg.getAttribute('src');

    const stopPlayback = () => {
      if (timer) clearInterval(timer);
      timer = null;
      player.classList.remove('is-playing');
      playBtn.setAttribute('aria-pressed', 'false');
      playBtn.textContent = 'Play';
      if (progress) progress.style.width = '0%';
    };

    const startPlayback = () => {
      player.classList.add('is-playing');
      playBtn.setAttribute('aria-pressed', 'true');
      playBtn.textContent = 'Pause';
      index = 0;
      stageImg.setAttribute('src', frames[0]);
      const tickMs = 1400;
      timer = setInterval(() => {
        index += 1;
        if (index >= frames.length) {
          stopPlayback();
          stageImg.setAttribute('src', poster);
          return;
        }
        stageImg.setAttribute('src', frames[index]);
        if (progress) {
          progress.style.width = ((index + 1) / frames.length) * 100 + '%';
        }
      }, tickMs);
    };

    playBtn.addEventListener('click', () => {
      if (timer) {
        stopPlayback();
        stageImg.setAttribute('src', poster);
      } else {
        startPlayback();
      }
    });
  });
}

function initMediaLightbox() {
  const triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'media-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Media preview');
  overlay.innerHTML = `
    <div class="media-lightbox-inner">
      <button type="button" class="media-lightbox-close" data-lightbox-close>Close</button>
      <img alt="" />
    </div>
  `;
  document.body.appendChild(overlay);

  const preview = overlay.querySelector('img');
  const closeBtn = overlay.querySelector('[data-lightbox-close]');

  const closeLightbox = () => {
    overlay.classList.remove('is-open');
    preview.setAttribute('src', '');
    preview.setAttribute('alt', '');
  };

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const src = trigger.getAttribute('data-lightbox') || (trigger.querySelector('img') ? trigger.querySelector('img').getAttribute('src') : '');
      const alt = trigger.getAttribute('data-lightbox-alt') || (trigger.querySelector('img') ? trigger.querySelector('img').getAttribute('alt') : '');
      if (!src) return;
      preview.setAttribute('src', src);
      preview.setAttribute('alt', alt || '');
      overlay.classList.add('is-open');
      closeBtn.focus();
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeLightbox();
    }
  });
}
