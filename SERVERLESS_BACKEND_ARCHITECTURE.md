# Hope Ability Foundation Nigeria — Static Frontend + Serverless Backend Architecture

> **Architecture Specification & Deployment Blueprint**  
> Tailored for Hope Ability Foundation Nigeria (HAFN) to decouple the static, accessible, high-performance website from secure, serverless form processing and SMTP email notification services.

---

## PART 1 — Architectural Overview

This system uses a **decoupled, two-tier architecture**:

1. **Frontend (Pure Static HTML5 / CSS3 / JavaScript)**:
   - Hosted on any plain web host (NairaHost, cPanel, Nginx, Apache, Cloudflare Pages, or GitHub Pages).
   - Zero Node.js runtime required at the edge or client.
   - Ultra-fast initial paint, full WCAG 2.1 AA accessibility, and native mobile optimization.
   - Communicates with the serverless backend via asynchronous `fetch()` to cross-origin API endpoints with `Accept: application/json` headers.

2. **Backend (Vercel Serverless Functions)**:
   - Hosted on Vercel Serverless (or Node.js Lambda/Google Cloud Functions).
   - Receives multipart/form-data with optional file uploads (e.g. Volunteer CVs, Medical referral reports, CSR sponsorship briefs).
   - Validates all fields, executes honeypot spam protection, and sends dual transactional email notifications via secure SMTP using `nodemailer`.
   - Returns clean JSON status codes (`200 OK`, `400 Bad Request`, `405 Method Not Allowed`, `500 Server Error`).

---

## PART 2 — Repository Layout

The system is structured into two clean directories / repositories:

```text
hopeability-frontend/               # Deploy to cPanel / Shared Hosting / Web Root
├── public/ (or workspace root)
│   ├── index.html                  # Main homepage
│   ├── about.html                  # Mission, team, registration
│   ├── programs.html               # 4 Core disability initiatives
│   ├── impact.html                 # Transparency, audit reports, metrics
│   ├── volunteer.html              # Volunteer Application Form (with file upload)
│   ├── contact.html                # General Contact, Referrals & CSR (with file upload)
│   ├── donate.html                 # Donation calculator & bank details
│   ├── safeguarding.html           # Child protection policy
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css           # Core styling & responsive breakpoints
│   │   │   └── accessibility.css   # High-contrast, dyslexic font, text scaling
│   │   └── js/
│   │       ├── form-config.js      # Backend URL config (single source of truth)
│   │       ├── form-config.v1.js   # Cache-busting copy
│   │       ├── spam-guard.js       # Client-side spam & bot protection
│   │       ├── forms.js            # Form handling, validation & UI states
│   │       ├── accessibility.js    # Accessibility toolbar
│   │       ├── components.js       # Dynamic header/footer includes
│   │       └── main.js             # Lazy loader & scroll animations
└── sitemap.xml

hopeability-backend/                # Deploy to Vercel
├── api/
│   ├── submit-volunteer.js         # Serverless function for volunteer recruitment
│   └── submit-contact.js           # Serverless function for inquiries & referrals
├── services/
│   ├── emailService.js             # Nodemailer transporter & branded email templates
│   └── cors.js                     # Shared CORS validation & preflight helper
├── package.json                    # Dependencies: formidable, nodemailer
├── vercel.json                     # Serverless routing configuration
├── .env.example                    # Template for required environment variables
└── .gitignore                      # Ignores node_modules/, .env, .vercel/
```

---

## PART 3 — Backend Specifications (`hopeability-backend`)

### 3.1 Serverless Function Endpoints

Each major form flow has a dedicated endpoint inside `api/`:

| Endpoint | File | Purpose | Handled Inputs |
| :--- | :--- | :--- | :--- |
| `POST /api/submit-volunteer` | `api/submit-volunteer.js` | Volunteer Applications | `fullName`, `email`, `phone`, `state`, `role`, `experience`, `safeguardingConsent`, `cvFile` (optional attachment) |
| `POST /api/submit-contact` | `api/submit-contact.js` | Contact, Referrals & CSR | `name`, `email`, `phone`, `subject`, `message`, `document` (optional attachment) |

#### Implementation Rules:
- **POST Only**: Any `GET`, `PUT`, or `DELETE` receives `405 Method Not Allowed` with `Allow: POST` header.
- **Multipart Parsing**: Vercel's default JSON parser is disabled via:
  ```javascript
  module.exports.config = { api: { bodyParser: false } };
  ```
  Data is parsed using `formidable` (v3).
- **Honeypot Filter**: If the hidden `botcheck` parameter contains any text, the backend logs a warning and immediately returns `200 { "success": true }` to silently drop the bot without sending emails.
- **Transactional Emails**: Submissions trigger two asynchronous emails via `nodemailer` before returning `200 OK`.

### 3.2 File Attachment & Size Limits
- Vercel's free tier caps request bodies at ~4.5MB.
- `formidable` enforces a strict `maxFileSize` of `4 * 1024 * 1024` (4MB).
- Uploaded files are read into a memory buffer and passed as standard email attachments to `EMAIL_TO`, then cleaned up immediately from disk.

### 3.3 Email Notification Service (`services/emailService.js`)
Uses `nodemailer` with two distinct mailbox transporters:
1. `volunteerTransporter` (`SMTP_USER_VOLUNTEER` — e.g. `volunteer@hopeability.org.ng`)
2. `contactTransporter` (`SMTP_USER_CONTACT` — e.g. `info@hopeability.org.ng`)

#### Two Emails are Dispatched per Valid Submission:
1. **Submitter Confirmation Email**:
   - Branded in HAFN forest green (`#0F5132`) and warm amber.
   - Acknowledges receipt, details response times (24–48 hours), and includes the safeguarding hotline.
2. **Internal Staff Notification Email**:
   - Sent to `EMAIL_TO` (`inbox@hopeability.org.ng`).
   - Includes full applicant contact details, location, role/subject, formatted message, timestamp (WAT), and attached files.
   - Sets `replyTo` directly to the applicant's email address for one-click email replies.

### 3.4 CORS Helper (`services/cors.js`)
- Protects the serverless endpoints from unauthorized third-party origins.
- Allows the live production domain (`https://hopeability.org.ng`, `https://www.hopeability.org.ng`) and local development ports (`http://localhost:3000`, `5173`, `8080`).
- Supports preview URLs using regex (`*.vercel.app`, `*.run.app`).
- Responds with `204 No Content` to HTTP `OPTIONS` preflight requests.

### 3.5 Environment Variables (Vercel)
Set these in your Vercel Project Dashboard under **Settings > Environment Variables**:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `SMTP_HOST` | `smtp.zoho.com` / `smtp.gmail.com` | Your mail provider's SMTP host |
| `SMTP_PORT` | `465` | Secure SSL/TLS port |
| `SMTP_SECURE` | `true` | Set to `true` for port 465 |
| `SMTP_USER_VOLUNTEER` | `volunteer@hopeability.org.ng` | Volunteer mailbox username |
| `SMTP_PASS_VOLUNTEER` | `********` | Mailbox App Password |
| `SMTP_USER_CONTACT` | `info@hopeability.org.ng` | Contact mailbox username |
| `SMTP_PASS_CONTACT` | `********` | Mailbox App Password |
| `EMAIL_TO` | `inbox@hopeability.org.ng` | Central NGO review mailbox |
| `EMAIL_FROM_NAME` | `Hope Ability Foundation Nigeria` | Display name on outbound emails |

---

## PART 4 — Frontend Specifications (`hopeability-frontend`)

### 4.1 Backend Route Config (`assets/js/form-config.js`)
Single source of truth for routing API calls:
```javascript
const FORM_BACKEND = {
  baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '' 
    : 'https://hopeability-backend.vercel.app',
  volunteerEndpoint: '/api/submit-volunteer',
  contactEndpoint: '/api/submit-contact',
  recipientEmail: 'info@hopeability.org.ng',
  volunteerEmail: 'volunteer@hopeability.org.ng',
  maxFileSizeMB: 4
};
window.FORM_BACKEND = FORM_BACKEND;
```

### 4.2 Client-Side Spam Guard (`assets/js/spam-guard.js`)
Multi-layer bot and spam filtration before making any network request:
1. **Off-screen Honeypot**:
   - Hidden text field: `<input type="text" name="botcheck" tabindex="-1" autocomplete="off" />` wrapped in an off-screen container (`left: -5000px`).
   - Invisible to human users; automatically filled by automated spambots.
2. **Disposable Domain Filter**:
   - Instant rejection of temporary/throwaway email services (e.g. `mailinator.com`, `tempmail.com`, `10minutemail.com`).
3. **Live DNS MX Verification**:
   - Executes a lightweight DNS-over-HTTPS query via Google DNS (`https://dns.google/resolve?name=domain&type=MX`) to verify that the email domain has valid mail exchange records.
   - Fails open on network timeout so legitimate users with slow connections are never blocked.
4. **Rate Limiting**:
   - Sliding 15-minute window in `localStorage` allowing a maximum of 5 submissions to prevent form spamming.

### 4.3 Form Submission Pipeline (`assets/js/forms.js`)
1. On `submit` event: `event.preventDefault()`.
2. Validates all required fields, valid email syntax, and checkbox consent.
3. Checks file upload size against `FORM_BACKEND.maxFileSizeMB` (4MB).
4. Runs `SpamGuard.validateForm(form, email)`.
5. Replaces button label with an animated loading spinner and disables the button.
6. Dispatches `fetch(requestUrl, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })`.
7. On `200 OK` + `success: true`:
   - Calls `SpamGuard.recordSubmission()`.
   - Replaces the form with a confirmation card with an option to reset and submit another request.
8. On failure: Reads the JSON error message (or raw text body) and renders an accessible error alert above the form.

### 4.4 Cache Busting Strategy
- When updating API endpoints or script logic, deploy with versioned filenames (`form-config.v1.js`, `form-config.v2.js`) and update HTML `<script>` references to bypass CDN edge caching.

---

## PART 5 — Step-by-Step Deployment Runbook

### Step A: Deploy Backend to Vercel
1. Create a clean folder with the backend code:
   ```bash
   cd backend
   npm install
   ```
2. Initialize Git and set the author:
   ```bash
   git init
   git add .
   git commit -m "feat: initial serverless backend for Hope Ability Foundation"
   ```
3. Deploy to Vercel:
   ```bash
   vercel login
   vercel link
   ```
4. Add all production environment variables:
   ```bash
   vercel env add SMTP_HOST production
   vercel env add SMTP_PORT production
   vercel env add SMTP_SECURE production
   vercel env add SMTP_USER_VOLUNTEER production
   vercel env add SMTP_PASS_VOLUNTEER production
   vercel env add SMTP_USER_CONTACT production
   vercel env add SMTP_PASS_CONTACT production
   vercel env add EMAIL_TO production
   ```
5. Deploy production build:
   ```bash
   vercel deploy --prod
   ```
6. Note the deployed URL (e.g. `https://hopeability-backend.vercel.app`).

### Step B: Configure Frontend
1. Open `assets/js/form-config.js` and `assets/js/form-config.v1.js`.
2. Update `baseUrl` with your live Vercel backend URL:
   ```javascript
   baseUrl: 'https://hopeability-backend.vercel.app'
   ```
3. Ensure your production frontend domain (e.g. `https://hopeability.org.ng`) is listed in `backend/services/cors.js`.
4. Upload the static frontend files (HTML, CSS, JS, images, PDF documents) directly to your web server / cPanel `public_html` directory.

---

## PART 6 — Verification & Gotchas Checklist

- [x] **Accept Header**: `fetch()` always sends `headers: { Accept: 'application/json' }`.
- [x] **4MB Body Cap**: Both backend `formidable.IncomingForm({ maxFileSize })` and frontend validation enforce files ≤ 4MB.
- [x] **Honeypot Input**: Off-screen text field `botcheck` used instead of `display:none` checkboxes.
- [x] **Dual Transactional Emails**: Submissions dispatch both submitter welcome receipt and internal inbox notification with attachments.
- [x] **CORS Support**: Preflight `OPTIONS` returns `204 No Content` with appropriate headers.
- [x] **No Committed Secrets**: `.env` and `.vercel` are ignored in `.gitignore`.
- [x] **Cache Busting**: Frontend scripts load `form-config.v1.js` for aggressive proxy support.
- [x] **Accessibility (WCAG 2.1 AA)**: Error states use `role="alert"`, `aria-invalid`, and keyboard-focused alert banners.
