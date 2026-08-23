# Hope Ability Foundation Nigeria (HAFN) — Official NGO Website

A complete, production-ready, accessibility-first web application for **Hope Ability Foundation Nigeria** — a CAC-registered non-governmental organization serving children with disabilities and less-privileged children across Nigeria.

---

## 🌟 Key Features

- **Vibrant Palette Design**: Styled with a warm cream background (`#FFFBF2`), vibrant teal primary accent (`#0D9488`), and warm amber gold (`#F59E0B`).
- **Accessibility Toolbar (WCAG 2.1 AA Compliant)**:
  - Font scaling (Default, Large 110%, Extra Large 120%)
  - High Contrast mode toggle (OLED high-contrast yellow/black palette)
  - Dyslexia-friendly font toggle (`OpenDyslexic` fallback)
  - Reduced motion preference detector
  - Keyboard navigation focus rings & skip-to-main-content links
- **Modular Architecture (Zero-Build Step)**:
  - Header & Footer loaded via clean asynchronous ES6 vanilla JavaScript component loader (`assets/js/components.js`).
  - Native HTML5, CSS3 variables, and plain ES6 JavaScript — directly uploadable to **NairaHost**, Whogohost, or any standard cPanel web hosting.
- **Paystack Integration & Bank Details**:
  - Interactive online donation modal & custom amount selector.
  - Direct GTBank & Zenith Bank official non-profit accounts with 1-click "Copy Account Number" functionality.
- **Client-Side Form Validation Engine**:
  - Interactive real-time form validation with inline screen-reader alerts (`role="alert"`).
  - Compatible with Formspree, Web3Forms, or custom PHP backend handlers.

---

## 📂 Directory Structure

```text
/
├── index.html              # Homepage with Hero, Quick Stats, Programs, Impact Highlights
├── about.html              # Mission, Vision, Board of Trustees, CAC & SCUML Credentials
├── programs.html           # 4 Primary Program Pillars & Eligibility Accordion
├── impact.html             # Financial Allocation Charts, Beneficiary Stories & PDF Reports
├── get-involved.html       # Volunteer, Donate, Corporate CSR & In-Kind Equipment Gifts
├── volunteer.html          # Volunteer Application Form & Safeguarding Notice
├── donate.html             # Interactive Paystack & Bank Transfer Giving Page
├── news.html               # News & Press Releases Grid
├── news-single.html        # Detailed Article View
├── contact.html            # Ikeja Lagos Hub & Abuja Office Info + Contact Form
├── safeguarding.html       # Child Protection & Safeguarding Policy
├── privacy-policy.html     # NDPA 2023 Compliant Data Protection Policy
├── terms.html              # Terms of Service
├── 404.html                # Custom Accessible Error Page
├── sitemap.xml             # Search Engine Sitemap
├── robots.txt              # Search Engine Crawler Guidance
├── components/
│   ├── header.html         # Shared Navigation & Accessibility Bar Component
│   └── footer.html         # Shared Footer & CAC Badge Component
└── assets/
    ├── css/
    │   ├── style.css       # Core Design Tokens, Typography, Grid & Component CSS
    │   └── accessibility.css # High Contrast, Dyslexia Font & A11y Widget Styles
    ├── js/
    │   ├── components.js   # Dynamic HTML Include Engine
    │   ├── accessibility.js# Font Scaling, Contrast & Dyslexia Widget Engine
    │   ├── forms.js        # Form Validation & Copy Bank Account Engine
    │   └── main.js         # Stat Counters, Accordions & Cookie Notice Engine
    └── images/             # Vector SVG Illustrations & Icons
```

---

## 🚀 How to Deploy to NairaHost / cPanel Shared Hosting

1. Zip all files in the root folder.
2. Log into your **NairaHost / cPanel** File Manager.
3. Navigate to `public_html/`.
4. Upload and extract the zip file.
5. The site is live immediately! No Node.js process, npm build, or database installation required.

---

## 🔒 SCUML & Legal Credentials

- **CAC Registration**: CAC/IT/NO 148290
- **SCUML Reg No**: SC 151402911
- **Official Address**: 12 Inclusive Way, Ikeja, Lagos State, Nigeria.
