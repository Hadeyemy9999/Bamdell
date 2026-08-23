/**
 * Bam Dell Disabilities and Orphanage Home - Client-Side Spam Guard Engine
 * Protects serverless SMTP endpoints from automated bots, disposable emails, and flood attacks.
 */

(function () {
  // Common disposable temporary email providers blocklist
  const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
    'guerrillamail.com', 'sharklasers.com', 'yopmail.com', 'trashmail.com',
    'dispostable.com', 'getairmail.com', 'fakeinbox.com', 'throwawaymail.com',
    'fakemailgenerator.com', 'maildrop.cc', 'tempail.com', 'inboxkitten.com',
    'burnermail.io', 'generator.email', 'crazymailing.com', 'mytemp.email',
    'mohmal.com', 'emailondeck.com', 'temporarymail.com', 'nada.ltd'
  ]);

  const RATE_LIMIT_KEY = 'bamdell_form_submissions';
  const MAX_SUBMISSIONS_PER_WINDOW = 5;
  const WINDOW_MINUTES = 15;

  const SpamGuard = {
    /**
     * Checks if the off-screen honeypot input was filled by a bot
     */
    isHoneypotTriggered(formElement) {
      const honeypot = formElement.querySelector('input[name="botcheck"]');
      if (honeypot && honeypot.value && honeypot.value.trim() !== '') {
        return true;
      }
      return false;
    },

    /**
     * Verifies if email domain belongs to known disposable email services
     */
    isDisposableEmail(email) {
      if (!email || !email.includes('@')) return false;
      const domain = email.split('@')[1].toLowerCase().trim();
      return DISPOSABLE_DOMAINS.has(domain);
    },

    /**
     * Rate limiter using localStorage to prevent submission flooding
     */
    checkRateLimit() {
      try {
        const now = Date.now();
        const recordsRaw = localStorage.getItem(RATE_LIMIT_KEY);
        let records = recordsRaw ? JSON.parse(recordsRaw) : [];

        // Filter out timestamps outside the sliding time window
        const windowMs = WINDOW_MINUTES * 60 * 1000;
        records = records.filter(ts => (now - ts) < windowMs);

        if (records.length >= MAX_SUBMISSIONS_PER_WINDOW) {
          const oldest = records[0];
          const remainingMins = Math.ceil((windowMs - (now - oldest)) / 60000);
          return {
            allowed: false,
            message: `Too many submissions detected. Please wait ${remainingMins} minute(s) before trying again.`
          };
        }

        return { allowed: true };
      } catch (e) {
        // Fail-open if localStorage is unavailable
        return { allowed: true };
      }
    },

    /**
     * Records a successful submission timestamp for rate limiting
     */
    recordSubmission() {
      try {
        const now = Date.now();
        const windowMs = WINDOW_MINUTES * 60 * 1000;
        const recordsRaw = localStorage.getItem(RATE_LIMIT_KEY);
        let records = recordsRaw ? JSON.parse(recordsRaw) : [];
        records = records.filter(ts => (now - ts) < windowMs);
        records.push(now);
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(records));
      } catch (e) {
        // Ignored
      }
    },

    /**
     * Optional DNS MX record lookup via Google/Cloudflare DNS-over-HTTPS
     * Fails open on timeout or network error so legitimate users are never blocked.
     */
    async checkMxRecord(email) {
      if (!email || !email.includes('@')) return true;
      const domain = email.split('@')[1].toLowerCase().trim();

      // Skip DoH check for standard ubiquitous domains to save latency
      const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'live.com', 'aol.com', 'zoho.com', 'proton.me', 'protonmail.com'];
      if (commonDomains.includes(domain)) return true;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s max timeout

        const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/dns-json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) return true; // Fail-open
        const data = await response.json();
        
        // If domain has MX records (Status === 0 and Answer array has items)
        if (data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0) {
          return true;
        }

        // If no MX records found, check fallback A record
        if (data.Status === 3 || (data.Answer && data.Answer.length === 0)) {
          return false;
        }

        return true;
      } catch (err) {
        // Fail-open on DoH failure
        return true;
      }
    },

    /**
     * Master validation method executed prior to fetch()
     */
    async validateForm(formElement, emailValue) {
      // 1. Honeypot check
      if (this.isHoneypotTriggered(formElement)) {
        return { isBot: true, valid: false };
      }

      // 2. Rate limit check
      const rateCheck = this.checkRateLimit();
      if (!rateCheck.allowed) {
        return { isBot: false, valid: false, error: rateCheck.message };
      }

      // 3. Disposable email check
      if (emailValue && this.isDisposableEmail(emailValue)) {
        return {
          isBot: false,
          valid: false,
          error: 'Please provide a permanent, valid personal or corporate email address (temporary disposable mailboxes are not accepted).'
        };
      }

      // 4. DNS MX record validation
      if (emailValue) {
        const hasValidMx = await this.checkMxRecord(emailValue);
        if (!hasValidMx) {
          return {
            isBot: false,
            valid: false,
            error: 'The domain for this email address does not appear to accept incoming emails. Please check for spelling mistakes.'
          };
        }
      }

      return { isBot: false, valid: true };
    }
  };

  window.SpamGuard = SpamGuard;
})();
