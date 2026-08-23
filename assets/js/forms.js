/**
 * Bam Dell Disabilities and Orphanage Home - Form & Donation Engine
 * Handles client-side accessible validation, SpamGuard protection,
 * Serverless SMTP endpoint integration, Paystack checkout simulation,
 * and copy-to-clipboard bank details.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDonationCalculator();
  initServerlessForms();
  initBankDetailsCopy();
});

/* Interactive Donation Calculator Engine */
function initDonationCalculator() {
  const donationPresets = document.querySelectorAll('.donation-preset');
  const customAmountInput = document.getElementById('custom-donation-amount');
  const donationFrequencyBtns = document.querySelectorAll('.donation-freq-btn');
  const checkoutBtn = document.getElementById('paystack-checkout-btn');
  const donationImpactNotice = document.getElementById('donation-impact-notice');

  if (!checkoutBtn) return;

  let currentAmount = 15000; // Default preset ₦15,000
  let currentFreq = 'one-time';

  const impactDescriptions = {
    5000: "₦5,000 provides nutritious school meals and therapeutic snacks for a child for one full month.",
    15000: "₦15,000 funds a complete braille/adaptive learning kit and specialized school supplies.",
    50000: "₦50,000 sponsors a custom mobility aid (adaptive wheelchair or pediatric crutches) for a child.",
    100000: "₦100,000 covers 3 months of comprehensive speech therapy & physical rehabilitation sessions."
  };

  donationPresets.forEach(btn => {
    btn.addEventListener('click', () => {
      donationPresets.forEach(b => b.classList.remove('btn-primary'));
      donationPresets.forEach(b => b.classList.add('btn-outline'));
      
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary');

      currentAmount = parseInt(btn.getAttribute('data-amount'), 10);
      if (customAmountInput) customAmountInput.value = '';
      updateImpactDescription(currentAmount);
    });
  });

  if (customAmountInput) {
    customAmountInput.addEventListener('input', () => {
      donationPresets.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
      });
      const val = parseInt(customAmountInput.value, 10);
      currentAmount = isNaN(val) ? 0 : val;
      updateImpactDescription(currentAmount);
    });
  }

  donationFrequencyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      donationFrequencyBtns.forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      currentFreq = btn.getAttribute('data-freq');
    });
  });

  function updateImpactDescription(amount) {
    if (!donationImpactNotice) return;
    if (impactDescriptions[amount]) {
      donationImpactNotice.textContent = impactDescriptions[amount];
    } else if (amount > 0) {
      donationImpactNotice.textContent = `Your generous gift of ₦${amount.toLocaleString()} directly transforms the lives of vulnerable children in Nigeria.`;
    } else {
      donationImpactNotice.textContent = "Please select or enter a donation amount.";
    }
  }

  // Paystack Integration / Simulation Trigger
  checkoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentAmount <= 0) {
      alert("Please select or enter a valid donation amount.");
      return;
    }

    const confirmMsg = `Thank you for supporting Bam Dell Disabilities and Orphanage Home!\n\nDonation Summary:\nAmount: ₦${currentAmount.toLocaleString()}\nFrequency: ${currentFreq === 'monthly' ? 'Monthly Recurring' : 'One-Time'}\n\nYou will now be directed to Paystack secure checkout portal.`;
    
    if (confirm(confirmMsg)) {
      alert("Redirecting to Paystack secure payment gateway... (Demo Mode Active)");
    }
  });
}

/* Serverless Form Submission & Validation Engine */
function initServerlessForms() {
  const forms = document.querySelectorAll('form[data-validate="true"]');

  forms.forEach(form => {
    // Monitor file size on file input change
    const fileInputs = form.querySelectorAll('input[type="file"]');
    fileInputs.forEach(fileInput => {
      fileInput.addEventListener('change', () => {
        validateFileInputSize(fileInput);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormAlert(form);

      // 1. Client-Side Field Validation
      let isValid = true;
      const requiredInputs = form.querySelectorAll('[required]');
      let userEmail = '';

      requiredInputs.forEach(input => {
        const group = input.closest('.form-group');
        const errorEl = group ? group.querySelector('.form-error') : null;

        if (input.type === 'checkbox') {
          if (!input.checked) {
            isValid = false;
            if (group) group.classList.add('has-error');
            if (errorEl) errorEl.textContent = 'You must agree to continue.';
          } else {
            if (group) group.classList.remove('has-error');
            if (errorEl) errorEl.textContent = '';
          }
        } else if (!input.value.trim()) {
          isValid = false;
          input.setAttribute('aria-invalid', 'true');
          if (group) group.classList.add('has-error');
          if (errorEl) errorEl.textContent = 'This field is required.';
        } else if (input.type === 'email') {
          userEmail = input.value.trim();
          if (!validateEmailFormat(userEmail)) {
            isValid = false;
            input.setAttribute('aria-invalid', 'true');
            if (group) group.classList.add('has-error');
            if (errorEl) errorEl.textContent = 'Please enter a valid email address.';
          } else {
            input.removeAttribute('aria-invalid');
            if (group) group.classList.remove('has-error');
            if (errorEl) errorEl.textContent = '';
          }
        } else {
          input.removeAttribute('aria-invalid');
          if (group) group.classList.remove('has-error');
          if (errorEl) errorEl.textContent = '';
        }
      });

      // Also validate file input sizes
      for (const fileInput of fileInputs) {
        if (!validateFileInputSize(fileInput)) {
          isValid = false;
        }
      }

      if (!isValid) {
        const firstInvalid = form.querySelector('[aria-invalid="true"], .has-error input, .has-error textarea');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // 2. Client-side Spam Guard Execution
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';

      if (window.SpamGuard) {
        const spamResult = await window.SpamGuard.validateForm(form, userEmail);

        if (spamResult.isBot) {
          // Silent honey-pot drop: pretend it succeeded
          showFormSuccess(form, "Your submission has been received. Thank you!");
          return;
        }

        if (!spamResult.valid) {
          showFormAlert(form, spamResult.error || 'Submission blocked by spam security filter.', 'error');
          return;
        }
      }

      // 3. Resolve Serverless Backend Route
      const config = window.FORM_BACKEND || {
        baseUrl: '',
        volunteerEndpoint: '/api/submit-volunteer',
        contactEndpoint: '/api/submit-contact',
        maxFileSizeMB: 4
      };

      let targetEndpoint = config.contactEndpoint;
      if (form.id === 'volunteer-form' || form.getAttribute('data-form-type') === 'volunteer') {
        targetEndpoint = config.volunteerEndpoint;
      }

      const requestUrl = (config.baseUrl ? config.baseUrl.replace(/\/$/, '') : '') + targetEndpoint;

      // 4. Construct FormData
      const formData = new FormData(form);

      // 5. Send POST request with Loading UI
      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <span style="display:inline-block; width:16px; height:16px; border:2px solid #FFF; border-top-color:transparent; border-radius:50%; animation:spin-loader 0.8s linear infinite; vertical-align:middle; margin-right:8px;"></span>
            Processing submission...
          `;
        }

        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: formData
        });

        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const rawText = await response.text();
          responseData = { error: rawText };
        }

        if (response.ok && responseData.success) {
          if (window.SpamGuard) {
            window.SpamGuard.recordSubmission();
          }
          showFormSuccess(form, responseData.message);
        } else {
          const errorMessage = responseData.error || responseData.message || 'An unexpected error occurred while processing your submission. Please try again.';
          showFormAlert(form, errorMessage, 'error');
        }

      } catch (networkErr) {
        console.error('[Form Submission Error]:', networkErr);
        showFormAlert(form, 'Unable to connect to the submission server. Please check your internet connection or email us directly at info@hopeability.org.ng.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  });
}

function validateEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateFileInputSize(fileInput) {
  const maxMB = (window.FORM_BACKEND && window.FORM_BACKEND.maxFileSizeMB) || 4;
  const maxBytes = maxMB * 1024 * 1024;
  const group = fileInput.closest('.form-group');
  const errorEl = group ? group.querySelector('.form-error') : null;

  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    if (file.size > maxBytes) {
      if (group) group.classList.add('has-error');
      if (errorEl) errorEl.textContent = `File "${file.name}" exceeds the ${maxMB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller file.`;
      fileInput.value = '';
      return false;
    }
  }

  if (group) group.classList.remove('has-error');
  if (errorEl) errorEl.textContent = '';
  return true;
}

function showFormAlert(form, message, type = 'error') {
  clearFormAlert(form);
  const alertBox = document.createElement('div');
  alertBox.className = 'form-alert-msg card';
  alertBox.setAttribute('role', 'alert');
  alertBox.style.padding = '1rem';
  alertBox.style.marginBottom = '1.25rem';
  alertBox.style.fontSize = '0.9rem';

  if (type === 'error') {
    alertBox.style.backgroundColor = '#FEE2E2';
    alertBox.style.borderColor = '#EF4444';
    alertBox.style.color = '#991B1B';
    alertBox.innerHTML = `<b>⚠️ Submission Notice:</b> ${escapeHtml(message)}`;
  } else {
    alertBox.style.backgroundColor = '#E0F2FE';
    alertBox.style.borderColor = '#0284C7';
    alertBox.style.color = '#075985';
    alertBox.innerHTML = `ℹ️ ${escapeHtml(message)}`;
  }

  form.insertBefore(alertBox, form.firstChild);
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearFormAlert(form) {
  const existingAlert = form.querySelector('.form-alert-msg');
  if (existingAlert) existingAlert.remove();
}

function showFormSuccess(form, customMessage) {
  const successContainer = document.createElement('div');
  successContainer.className = 'card scroll-reveal is-revealed';
  successContainer.style.backgroundColor = '#F0FDF4';
  successContainer.style.borderColor = '#16A34A';
  successContainer.style.borderWidth = '2px';
  successContainer.style.padding = '2.5rem 2rem';
  successContainer.style.textAlign = 'center';
  successContainer.setAttribute('role', 'alert');

  const messageText = customMessage || 'Your submission has been received successfully. A confirmation email has been dispatched to your inbox.';

  successContainer.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 0.75rem;">✅</div>
    <h3 style="color: #0F5132; margin-bottom: 0.5rem; font-size: 1.5rem;">Submission Received!</h3>
    <p style="color: #166534; font-weight: 600; font-size: 1.05rem; margin-bottom: 0.75rem;">${escapeHtml(messageText)}</p>
    <p style="color: #4B5563; font-size: 0.9rem; max-width: 480px; margin: 0 auto 1.5rem;">Our officers in Lagos and Abuja will review your details. Please check your spam folder if you do not see our automated receipt email within a few minutes.</p>
    <button type="button" class="btn btn-outline btn-sm reset-form-btn">Submit Another Request &rarr;</button>
  `;

  form.style.display = 'none';
  form.parentNode.insertBefore(successContainer, form);

  const resetBtn = successContainer.querySelector('.reset-form-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      clearFormAlert(form);
      successContainer.remove();
      form.style.display = '';
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}

/* Copy Bank Account Details */
function initBankDetailsCopy() {
  const copyBtns = document.querySelectorAll('.copy-bank-btn');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          btn.style.backgroundColor = '#0F5132';
          btn.style.color = '#FFFFFF';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
            btn.style.color = '';
          }, 2500);
        });
      }
    });
  });
}
