/**
 * Bam Dell Disabilities and Orphanage Home - Component Loader
 * Loads shared header and footer asynchronously via fetch.
 * Provides fallback inline templates if loaded via file:// or offline.
 * Implements mobile-friendly responsive navigation with backdrop & touch handling.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('header-include', '/components/header.html', getHeaderFallback());
  await loadComponent('footer-include', '/components/footer.html', getFooterFallback());

  // Initialize navigation & active states
  initNavigation();
  
  // Trigger Accessibility Engine setup after header component is ready
  if (window.initAccessibilityEngine) {
    window.initAccessibilityEngine();
  }
});

async function loadComponent(targetId, componentUrl, fallbackHtml) {
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  try {
    const response = await fetch(componentUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    targetEl.innerHTML = html;
  } catch (error) {
    console.warn(`Could not fetch ${componentUrl}, using fallback component:`, error);
    targetEl.innerHTML = fallbackHtml;
  }
}

function initNavigation() {
  // Set Active Link State
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath && (currentPath.endsWith(linkPath) || (currentPath === '/' && linkPath === '/index.html') || (currentPath === '' && linkPath === '/index.html'))) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  // Mobile Menu Toggle & Backdrop Elements
  const mobileToggle = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu-list');
  const navBackdrop = document.getElementById('nav-backdrop');

  function closeMobileNav() {
    if (!navMenu) return;
    navMenu.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    if (mobileToggle) {
      mobileToggle.setAttribute('aria-expanded', 'false');
      const menuIcon = document.getElementById('menu-icon');
      if (menuIcon) menuIcon.textContent = '☰';
    }
    if (navBackdrop) {
      navBackdrop.classList.remove('is-visible');
    }
  }

  function openMobileNav() {
    if (!navMenu) return;
    navMenu.classList.add('is-open');
    document.body.classList.add('nav-open');
    if (mobileToggle) {
      mobileToggle.setAttribute('aria-expanded', 'true');
      const menuIcon = document.getElementById('menu-icon');
      if (menuIcon) menuIcon.textContent = '✕';
    }
    if (navBackdrop) {
      navBackdrop.classList.add('is-visible');
    }
  }

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.contains('is-open');
      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    if (navBackdrop) {
      navBackdrop.addEventListener('click', () => {
        closeMobileNav();
      });
    }

    // Auto-close mobile menu when clicking any nav link
    const allMenuLinks = navMenu.querySelectorAll('a');
    allMenuLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMobileNav();
      });
    });

    // Close mobile menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        closeMobileNav();
        mobileToggle.focus();
      }
    });
  }

  // Accessibility Panel Close Button Support (especially on mobile)
  const a11yCloseBtn = document.getElementById('a11y-close-btn');
  const a11yPanel = document.getElementById('a11y-panel');
  const a11yToggle = document.getElementById('a11y-widget-toggle');

  if (a11yCloseBtn && a11yPanel) {
    a11yCloseBtn.addEventListener('click', () => {
      a11yPanel.classList.remove('is-active');
      if (a11yToggle) {
        a11yToggle.setAttribute('aria-expanded', 'false');
        a11yToggle.focus();
      }
    });
  }
}

/* Fallback Header HTML if component fetch fails */
function getHeaderFallback() {
  return `
    <header class="site-header">
      <div class="header-inner container">
        <a href="/index.html" class="site-logo" aria-label="Bam Dell Disabilities and Orphanage Home">
          <div class="site-logo-icon">BDH</div>
          <div>
            <div style="line-height: 1.1; font-size: 1.1rem; font-weight: 800; color: var(--primary);">Bam Dell</div>
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--dark-muted); letter-spacing: 0.04em;">DISABILITIES & ORPHANAGE HOME</div>
            <div style="font-size: 0.65rem; font-weight: 600; color: var(--accent-hover); font-style: italic;">Let Love Lead</div>
          </div>
        </a>
        <button class="mobile-nav-toggle" id="mobile-menu-btn" aria-expanded="false" aria-label="Toggle navigation">☰</button>
        <nav id="primary-navigation">
          <ul class="nav-menu" id="nav-menu-list">
            <li><a href="/index.html" class="nav-link">Home</a></li>
            <li><a href="/about.html" class="nav-link">About Us</a></li>
            <li><a href="/programs.html" class="nav-link">Who We Serve</a></li>
            <li><a href="/impact.html" class="nav-link">Objectives & Needs</a></li>
            <li><a href="/get-involved.html" class="nav-link">Get Involved</a></li>
            <li><a href="/volunteer.html" class="nav-link">Volunteer</a></li>
            <li><a href="/news.html" class="nav-link">News & Press</a></li>
            <li><a href="/contact.html" class="nav-link">Contact</a></li>
            <li><a href="/donate.html" class="btn btn-accent btn-sm">💖 Donate Now</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <div id="nav-backdrop" class="nav-backdrop" aria-hidden="true"></div>
  `;
}

/* Fallback Footer HTML if component fetch fails */
function getFooterFallback() {
  return `
    <footer class="site-footer">
      <div class="container text-center">
        <p>© 2026 Bam Dell Disabilities and Orphanage Home — <i>Let Love Lead</i></p>
        <p style="font-size: 0.85rem; color: #9CA3AF;">5B/5A, Opposite Bolude Hall, Alafara, Olubadan Adeoti, Ibadan | 07030700033</p>
        <div class="flex justify-center gap-3 flex-wrap" style="margin-top: 1rem;">
          <a href="/safeguarding.html">Safeguarding</a> | 
          <a href="/privacy-policy.html">Privacy Policy</a> | 
          <a href="/terms.html">Terms</a> | 
          <a href="/contact.html">Contact Us</a>
        </div>
      </div>
    </footer>
  `;
}
