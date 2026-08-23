/**
 * Hope Ability Foundation Nigeria - Component Loader
 * Loads shared header and footer asynchronously via fetch.
 * Provides fallback inline templates if loaded via file:// or offline.
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
    if (linkPath && (currentPath.endsWith(linkPath) || (currentPath === '/' && linkPath === '/index.html'))) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu-list');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('is-open');
      const menuIcon = document.getElementById('menu-icon');
      if (menuIcon) {
        menuIcon.textContent = isExpanded ? '☰' : '✕';
      }
    });

    // Close mobile menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        mobileToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
        const menuIcon = document.getElementById('menu-icon');
        if (menuIcon) menuIcon.textContent = '☰';
        mobileToggle.focus();
      }
    });
  }
}

/* Fallback Header HTML if component fetch fails */
function getHeaderFallback() {
  return `
    <header class="site-header">
      <div class="header-inner container">
        <a href="/index.html" class="site-logo">
          <div class="site-logo-icon">BDH</div>
          <div>
            <div style="line-height: 1.1; font-size: 1.15rem; font-weight: 800; color: var(--primary);">Bam Dell</div>
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--dark-muted);">DISABILITIES & ORPHANAGE HOME</div>
          </div>
        </a>
        <button class="mobile-nav-toggle" id="mobile-menu-btn" aria-expanded="false">☰</button>
        <nav id="primary-navigation">
          <ul class="nav-menu" id="nav-menu-list">
            <li><a href="/index.html" class="nav-link">Home</a></li>
            <li><a href="/about.html" class="nav-link">About Us</a></li>
            <li><a href="/programs.html" class="nav-link">Who We Serve</a></li>
            <li><a href="/impact.html" class="nav-link">Objectives & Needs</a></li>
            <li><a href="/get-involved.html" class="nav-link">Get Involved</a></li>
            <li><a href="/volunteer.html" class="nav-link">Volunteer</a></li>
            <li><a href="/news.html" class="nav-link">News</a></li>
            <li><a href="/contact.html" class="nav-link">Contact</a></li>
            <li><a href="/donate.html" class="btn btn-accent btn-sm">Donate Now</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `;
}

/* Fallback Footer HTML if component fetch fails */
function getFooterFallback() {
  return `
    <footer class="site-footer">
      <div class="container text-center">
        <p>© 2026 Bam Dell Disabilities and Orphanage Home — <i>Let Love Lead</i></p>
        <p style="font-size: 0.85rem; color: #9CA3AF;">5B/5A, Opposite Bolude Hall, Alafara, Olubadan Adeoti, Ibadan | 07030700033</p>
        <div class="flex justify-center gap-3" style="margin-top: 1rem;">
          <a href="/safeguarding.html">Safeguarding</a> | 
          <a href="/privacy-policy.html">Privacy Policy</a> | 
          <a href="/terms.html">Terms</a> | 
          <a href="/contact.html">Contact Us</a>
        </div>
      </div>
    </footer>
  `;
}
