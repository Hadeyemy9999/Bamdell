/**
 * Bam Dell Disabilities and Orphanage Home - Form & Donation Engine
 * Handles client-side accessible validation, SpamGuard protection,
 * Serverless SMTP endpoint integration, Flutterwave and Monnify checkout,
 * and copy-to-clipboard bank details.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDonationCalculator();
  initServerlessForms();
  initBankDetailsCopy();
});

function getPaymentConfig() {
  return window.PAYMENT_CONFIG || {
    flutterwavePublicKey: '',
    monnifyApiKey: '',
    monnifyContractCode: '',
    monnifyIsTestMode: true
  };
}

function setPaymentStatus(message, type) {
  const statusEl = document.getElementById('payment-checkout-status');
  if (!statusEl) return;
  statusEl.textContent = message || '';
  statusEl.classList.remove('is-error', 'is-success');
  if (type) statusEl.classList.add(type);
}

function buildDonationReference(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function splitDonorName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Friend',
    lastName: parts.slice(1).join(' ') || 'Donor'
  };
}

/* Interactive Donation Calculator Engine */
function initDonationCalculator() {
  const donationForm = document.getElementById('donation-submit-form');
  const donationPresets = document.querySelectorAll('.amount-opt-btn');
  const customAmountInput = document.getElementById('custom-amount-input');
  const freqOneTime = document.getElementById('freq-onetime');
  const freqMonthly = document.getElementById('freq-monthly');
  const flutterwaveBtn = document.getElementById('flutterwave-checkout-btn');
  const monnifyBtn = document.getElementById('monnify-checkout-btn');
  const impactEstimate = document.getElementById('impact-estimate');
  const donationImpactNotice = document.getElementById('donation-impact-notice');

  if (!donationForm && !flutterwaveBtn && !monnifyBtn) return;

  let currentAmount = parseInt(customAmountInput && customAmountInput.value, 10) || 35000;
  let currentFreq = 'one-time';

  const impactDescriptions = {
    5000: 'Nutritious school meals and therapeutic snacks for a child for one full month.',
    15000: 'A complete adaptive learning kit and specialized school supplies.',
    35000: 'Full month of nutritious meals, daily diapers, and basic medication for a special needs child at Bam Dell Home.',
    75000: 'Speech therapy and physiotherapy sessions plus essential medical supplies.',
    150000: 'Mobility support, rehabilitation, and several weeks of shelter and feeding for children in our care.'
  };

  function updateImpactDescription(amount) {
    const fallback = amount > 0
      ? `Your generous gift of ₦${amount.toLocaleString()} directly transforms the lives of vulnerable children in Nigeria.`
      : 'Please select or enter a donation amount.';
    const detail = impactDescriptions[amount] || fallback;
    const title = amount > 0 ? `Your ₦${amount.toLocaleString()} Gift Provides:` : 'Choose a gift amount';

    if (impactEstimate) {
      const heading = impactEstimate.querySelector('div');
      const body = impactEstimate.querySelector('p');
      if (heading) heading.textContent = title;
      if (body) body.textContent = detail;
    }
    if (donationImpactNotice) {
      donationImpactNotice.textContent = amount > 0 ? `Your ₦${amount.toLocaleString()} gift provides: ${detail}` : fallback;
    }
  }

  function setActivePreset(activeBtn) {
    donationPresets.forEach((btn) => {
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-outline');
    });
    if (activeBtn) {
      activeBtn.classList.remove('btn-outline');
      activeBtn.classList.add('btn-primary');
    }
  }

  donationPresets.forEach((btn) => {
    btn.addEventListener('click', () => {
      const rawAmount = btn.getAttribute('data-amount');
      setActivePreset(btn);
      if (rawAmount === 'custom') {
        if (customAmountInput) {
          customAmountInput.focus();
          customAmountInput.select();
        }
        currentAmount = parseInt(customAmountInput && customAmountInput.value, 10) || 0;
      } else {
        currentAmount = parseInt(rawAmount, 10) || 0;
        if (customAmountInput) customAmountInput.value = String(currentAmount);
      }
      updateImpactDescription(currentAmount);
    });
  });

  if (customAmountInput) {
    customAmountInput.addEventListener('input', () => {
      const val = parseInt(customAmountInput.value, 10);
      currentAmount = isNaN(val) ? 0 : val;
      const matching = Array.from(donationPresets).find((btn) => btn.getAttribute('data-amount') === String(currentAmount));
      setActivePreset(matching || Array.from(donationPresets).find((btn) => btn.getAttribute('data-amount') === 'custom'));
      updateImpactDescription(currentAmount);
    });
  }

  function setFrequency(freq) {
    currentFreq = freq;
    if (freqOneTime && freqMonthly) {
      freqOneTime.classList.toggle('btn-primary', freq === 'one-time');
      freqOneTime.classList.toggle('btn-outline', freq !== 'one-time');
      freqMonthly.classList.toggle('btn-primary', freq === 'monthly');
      freqMonthly.classList.toggle('btn-outline', freq !== 'monthly');
    }
  }

  if (freqOneTime) {
    freqOneTime.addEventListener('click', () => setFrequency('one-time'));
  }
  if (freqMonthly) {
    freqMonthly.addEventListener('click', () => setFrequency('monthly'));
  }

  function readDonorDetails() {
    const nameInput = document.getElementById('donor-name');
    const emailInput = document.getElementById('donor-email');
    const phoneInput = document.getElementById('donor-phone');
    const amountInput = document.getElementById('custom-amount-input');
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const amount = parseInt(amountInput && amountInput.value, 10) || currentAmount;

    if (!name) {
      setPaymentStatus('Please enter your full name before paying.', 'is-error');
      if (nameInput) nameInput.focus();
      return null;
    }
    if (!email || !validateEmailFormat(email)) {
      setPaymentStatus('Please enter a valid email address before paying.', 'is-error');
      if (emailInput) emailInput.focus();
      return null;
    }
    if (!amount || amount < 1000) {
      setPaymentStatus('Please enter a donation of at least ₦1,000.', 'is-error');
      if (amountInput) amountInput.focus();
      return null;
    }

    currentAmount = amount;
    return { name, email, phone, amount };
  }

  function launchFlutterwaveCheckout() {
    const donor = readDonorDetails();
    if (!donor) return;

    const config = getPaymentConfig();
    if (!config.flutterwavePublicKey) {
      setPaymentStatus('Flutterwave is ready on this page. Add your Flutterwave public key in assets/js/form-config.v1.js to go live.', 'is-error');
      return;
    }
    if (typeof FlutterwaveCheckout !== 'function') {
      setPaymentStatus('Flutterwave checkout could not load. Please refresh and try again.', 'is-error');
      return;
    }

    const names = splitDonorName(donor.name);
    setPaymentStatus('Opening Flutterwave checkout...');
    FlutterwaveCheckout({
      public_key: config.flutterwavePublicKey,
      tx_ref: buildDonationReference('BAMD-FLW-'),
      amount: donor.amount,
      currency: 'NGN',
      payment_options: 'card,banktransfer,ussd,account,mobilemoneyghana',
      customer: {
        email: donor.email,
        phone_number: donor.phone || '07030700033',
        name: donor.name
      },
      customizations: {
        title: 'Bam Dell Home',
        description: currentFreq === 'monthly' ? 'Monthly donation to Bam Dell Home' : 'One-time donation to Bam Dell Home',
        logo: 'https://res.cloudinary.com/ngts2ryy/image/upload/v1790504318/IMG_20260927_111654_662.jpg'
      },
      meta: {
        frequency: currentFreq,
        first_name: names.firstName,
        last_name: names.lastName
      },
      callback: function (response) {
        if (response && (response.status === 'successful' || response.status === 'completed')) {
          setPaymentStatus('Thank you. Your Flutterwave donation was received. A receipt will follow by email.', 'is-success');
        } else {
          setPaymentStatus('Flutterwave checkout closed before completion. You can try again or use bank transfer.', 'is-error');
        }
      },
      onclose: function () {
        const statusEl = document.getElementById('payment-checkout-status');
        if (statusEl && !statusEl.classList.contains('is-success')) {
          setPaymentStatus('Flutterwave checkout closed.');
        }
      }
    });
  }

  function launchMonnifyCheckout() {
    const donor = readDonorDetails();
    if (!donor) return;

    const config = getPaymentConfig();
    if (!config.monnifyApiKey || !config.monnifyContractCode) {
      setPaymentStatus('Monnify is ready on this page. Add your API key and contract code in assets/js/form-config.v1.js to go live.', 'is-error');
      return;
    }
    if (!window.MonnifySDK || typeof window.MonnifySDK.initialize !== 'function') {
      setPaymentStatus('Monnify checkout could not load. Please refresh and try again.', 'is-error');
      return;
    }

    const names = splitDonorName(donor.name);
    setPaymentStatus('Opening Monnify checkout...');
    window.MonnifySDK.initialize({
      amount: donor.amount,
      currency: 'NGN',
      reference: buildDonationReference('BAMD-MNF-'),
      customerFullName: donor.name,
      customerEmail: donor.email,
      customerMobileNumber: donor.phone || '07030700033',
      apiKey: config.monnifyApiKey,
      contractCode: config.monnifyContractCode,
      paymentDescription: currentFreq === 'monthly' ? 'Monthly donation to Bam Dell Home' : 'One-time donation to Bam Dell Home',
      isTestMode: config.monnifyIsTestMode !== false,
      metadata: {
        frequency: currentFreq,
        firstName: names.firstName,
        lastName: names.lastName
      },
      onComplete: function (response) {
        const paid = response && (response.paymentStatus === 'PAID' || response.status === 'SUCCESS' || response.completed === true);
        if (paid) {
          setPaymentStatus('Thank you. Your Monnify donation was received. A receipt will follow by email.', 'is-success');
        } else {
          setPaymentStatus('Monnify checkout closed before completion. You can try again or use bank transfer.', 'is-error');
        }
      },
      onClose: function () {
        const statusEl = document.getElementById('payment-checkout-status');
        if (statusEl && !statusEl.classList.contains('is-success')) {
          setPaymentStatus('Monnify checkout closed.');
        }
      }
    });
  }

  if (flutterwaveBtn) {
    flutterwaveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      launchFlutterwaveCheckout();
    });
  }
  if (monnifyBtn) {
    monnifyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      launchMonnifyCheckout();
    });
  }

  if (donationForm) {
    donationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      launchFlutterwaveCheckout();
    });
  }

  updateImpactDescription(currentAmount);
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

      let targetEndpoint = form.getAttribute('data-endpoint') || config.contactEndpoint;
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
        showFormAlert(form, 'Unable to connect to the submission server. Please check your internet connection or email us directly at info@bamdellhome.org.', 'error');
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
