/**
 * Hope Ability Foundation Nigeria - Accessibility Suite (WCAG 2.1 AA)
 * Handles font size scaling, high-contrast, dyslexia font, link underlines,
 * and screen reader live notifications.
 */

window.initAccessibilityEngine = function() {
  const panel = document.getElementById('a11y-panel');
  const widgetToggle = document.getElementById('a11y-widget-toggle');
  const topTrigger = document.getElementById('top-a11y-trigger');
  
  if (topTrigger) {
    topTrigger.addEventListener('click', () => togglePanel());
  }
  
  if (widgetToggle) {
    widgetToggle.addEventListener('click', () => togglePanel());
  }

  function togglePanel() {
    if (!panel) return;
    const isExpanded = panel.classList.contains('is-active');
    panel.classList.toggle('is-active');
    if (widgetToggle) {
      widgetToggle.setAttribute('aria-expanded', !isExpanded);
    }
  }

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (panel && panel.classList.contains('is-active')) {
      if (!panel.contains(e.target) && !e.target.closest('#a11y-widget-toggle') && !e.target.closest('#top-a11y-trigger')) {
        panel.classList.remove('is-active');
        if (widgetToggle) widgetToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // Load saved preferences
  applySavedA11yPrefs();

  // Font Size Controls
  const fontBtns = document.querySelectorAll('[data-a11y-font]');
  fontBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const scale = btn.getAttribute('data-a11y-font');
      setFontScale(scale);
      fontBtns.forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      announceA11yChange(`Font size set to ${scale}`);
    });
  });

  // High Contrast Toggle
  const contrastBtn = document.getElementById('a11y-contrast-toggle');
  if (contrastBtn) {
    contrastBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('high-contrast');
      const isHc = document.documentElement.classList.contains('high-contrast');
      localStorage.setItem('hafn_a11y_contrast', isHc ? 'enabled' : 'disabled');
      contrastBtn.classList.toggle('is-selected', isHc);
      announceA11yChange(isHc ? 'High contrast mode enabled' : 'High contrast mode disabled');
    });
  }

  // Dyslexia Font Toggle
  const dyslexiaBtn = document.getElementById('a11y-dyslexia-toggle');
  if (dyslexiaBtn) {
    dyslexiaBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dyslexia-font');
      const isDys = document.documentElement.classList.contains('dyslexia-font');
      localStorage.setItem('hafn_a11y_dyslexia', isDys ? 'enabled' : 'disabled');
      dyslexiaBtn.classList.toggle('is-selected', isDys);
      announceA11yChange(isDys ? 'Dyslexia friendly font enabled' : 'Dyslexia friendly font disabled');
    });
  }

  // Underline Links Toggle
  const underlineBtn = document.getElementById('a11y-underline-toggle');
  if (underlineBtn) {
    underlineBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('underline-links');
      const isUnder = document.documentElement.classList.contains('underline-links');
      localStorage.setItem('hafn_a11y_underline', isUnder ? 'enabled' : 'disabled');
      underlineBtn.classList.toggle('is-selected', isUnder);
      announceA11yChange(isUnder ? 'Underline links enabled' : 'Underline links disabled');
    });
  }

  // Reset Button
  const resetBtn = document.getElementById('a11y-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('hafn_a11y_font');
      localStorage.removeItem('hafn_a11y_contrast');
      localStorage.removeItem('hafn_a11y_dyslexia');
      localStorage.removeItem('hafn_a11y_underline');
      
      document.documentElement.classList.remove('high-contrast', 'dyslexia-font', 'underline-links', 'font-scale-large', 'font-scale-xlarge');
      
      fontBtns.forEach(b => {
        b.classList.toggle('is-selected', b.getAttribute('data-a11y-font') === 'normal');
      });
      if (contrastBtn) contrastBtn.classList.remove('is-selected');
      if (dyslexiaBtn) dyslexiaBtn.classList.remove('is-selected');
      if (underlineBtn) underlineBtn.classList.remove('is-selected');
      
      announceA11yChange('Accessibility settings reset to default');
    });
  }
};

function setFontScale(scale) {
  document.documentElement.classList.remove('font-scale-large', 'font-scale-xlarge');
  if (scale === 'large') {
    document.documentElement.classList.add('font-scale-large');
  } else if (scale === 'xlarge') {
    document.documentElement.classList.add('font-scale-xlarge');
  }
  localStorage.setItem('hafn_a11y_font', scale);
}

function applySavedA11yPrefs() {
  const font = localStorage.getItem('hafn_a11y_font');
  if (font) setFontScale(font);

  if (localStorage.getItem('hafn_a11y_contrast') === 'enabled') {
    document.documentElement.classList.add('high-contrast');
    const contrastBtn = document.getElementById('a11y-contrast-toggle');
    if (contrastBtn) contrastBtn.classList.add('is-selected');
  }

  if (localStorage.getItem('hafn_a11y_dyslexia') === 'enabled') {
    document.documentElement.classList.add('dyslexia-font');
    const dyslexiaBtn = document.getElementById('a11y-dyslexia-toggle');
    if (dyslexiaBtn) dyslexiaBtn.classList.add('is-selected');
  }

  if (localStorage.getItem('hafn_a11y_underline') === 'enabled') {
    document.documentElement.classList.add('underline-links');
    const underlineBtn = document.getElementById('a11y-underline-toggle');
    if (underlineBtn) underlineBtn.classList.add('is-selected');
  }
}

function announceA11yChange(message) {
  let announcer = document.getElementById('a11y-live-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'a11y-live-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    document.body.appendChild(announcer);
  }
  announcer.textContent = message;
}
