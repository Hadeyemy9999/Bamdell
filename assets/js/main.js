/**
 * Hope Ability Foundation Nigeria - Main Site Script
 * Handles live animated stat counters, cookie consent banner, accordions,
 * progressive scroll reveal, lazy image loading, and infinite scroll stream.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLazyImages();
  initScrollReveal();
  initInfiniteScroll();
  initCookieBanner();
  initStatCounters();
  initAccordions();
  updateCurrentYear();
});

/* Lazy Loading for Images */
function initLazyImages() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });
}

/* Progressive Scroll Reveal for Page Sections and Cards */
function initScrollReveal() {
  const revealTargets = document.querySelectorAll('.section, .card, .stat-box, article, .hero');
  if (!revealTargets.length) return;

  revealTargets.forEach(target => {
    target.classList.add('scroll-reveal');
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
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

/* Infinite Scroll Engine for Fast Page Loading & Dynamic Content Streams */
function initInfiniteScroll() {
  const containers = document.querySelectorAll('[data-infinite-scroll="true"], .infinite-scroll-container, .grid-3, .grid-2');
  if (!containers.length) return;

  containers.forEach(container => {
    // Only paginate containers with more than 3 direct child cards or articles
    const items = Array.from(container.children).filter(child => 
      child.classList.contains('card') || child.tagName === 'ARTICLE'
    );

    if (items.length <= 3) return;

    const BATCH_SIZE = 3;
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
            ✨ All items on this page loaded • Hope Ability Foundation Nigeria
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
            ✨ All items on this page loaded • Hope Ability Foundation Nigeria
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
          // Simulate rapid smooth fetch/render delay
          setTimeout(loadNextBatch, 300);
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
  const savedSettingsRaw = localStorage.getItem('hafn_cookie_settings') || localStorage.getItem('hafn_cookie_consent');
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
    localStorage.setItem('hafn_cookie_settings', JSON.stringify(prefs));
    localStorage.setItem('hafn_cookie_consent', 'accepted');
    
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
    threshold: 0.5
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
  const duration = 2000; // 2 seconds
  const stepTime = 30;
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

