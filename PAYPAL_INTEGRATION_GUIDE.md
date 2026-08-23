# PayPal Integration Guide for Bam Dell Disabilities and Orphanage Home

> **Complete Guide for International Donations (USD, GBP, EUR, CAD, AUD)**  
> **Organization:** Bam Dell Disabilities and Orphanage Home (*Let Love Lead*)  
> **Audience:** Frontend Developers, NGO Administrators, and Finance Teams

---

## 1. Overview & Architecture

Bam Dell Disabilities and Orphanage Home supports both local Nigerian donors (via direct bank transfer to Zenith/GTBank and Paystack) and **international donors** (via PayPal, Debit/Credit cards).

```
 ┌───────────────────────────────────────────────────────────┐
 │                   International Donor                     │
 └─────────────────────────────┬─────────────────────────────┘
                               │
               Clicks "Donate with PayPal / Card"
                               ▼
 ┌───────────────────────────────────────────────────────────┐
 │        Bam Dell Frontend (`donate.html` + `forms.js`)      │
 │  - Currency selection (USD $, EUR €, GBP £, CAD $, NGN ₦) │
 │  - Amount selection + Custom amount input                 │
 │  - Frequency (One-Time vs. Monthly Recurring)            │
 └─────────────────────────────┬─────────────────────────────┘
                               │
            PayPal JS SDK (Render Smart Payment Buttons)
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌──────────────┐                               ┌──────────────┐
│ PayPal Wallet│                               │ Debit/Credit │
│  (1-Click)   │                               │ Card (Direct)│
└──────┬───────┘                               └──────┬───────┘
       │                                               │
       └───────────────────────┬───────────────────────┘
                               │
                 `onApprove(data, actions)`
                               │
                               ▼
 ┌───────────────────────────────────────────────────────────┐
 │             Vercel Serverless Backend / Webhook           │
 │  - Captures payment / Validates PayPal Order ID           │
 │  - Dispatches automated receipt & tax acknowledgment email │
 └───────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites & PayPal Account Setup

### Step 1: Create a PayPal Business Account
1. Visit [PayPal Business Signup](https://www.paypal.com/bizsignup/).
2. Register using your official NGO domain email (e.g. `donations@bamdellhome.org.ng` or `info@bamdellhome.org.ng`).
3. Set your primary legal business name to: **Bam Dell Disabilities and Orphanage Home**.

### Step 2: Apply for PayPal Non-Profit Discounted Rates (Optional but Recommended)
PayPal offers discounted transaction processing rates for certified charities and NGOs (~1.99% + $0.49 per transaction instead of standard commercial rates):
- Go to **PayPal for Nonprofits** (`https://www.paypal.com/nonprofits`).
- Upload the NGO's registration certificates (CAC Certificate of Incorporation, Constitution/Trust Deed, and bank statement matching the legal name).

### Step 3: Retrieve API Credentials (Sandbox & Live)
1. Go to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Log in with your PayPal Business account.
3. Navigate to **Apps & Credentials** > Click **Create App**:
   - **App Name:** `BamDell-Donations-Frontend`
   - **App Type:** `Merchant`
4. Copy the following keys:
   - **Client ID** (used in frontend HTML/JS)
   - **Secret Key** (stored strictly in backend `.env` variables)

---

## 3. Integration Options

You can implement PayPal using either of the following approaches:

### Option A: PayPal JavaScript SDK (Recommended — Seamless In-Page Experience)
Allows users to pay directly inside `donate.html` without leaving the website, supporting both PayPal accounts and Debit/Credit cards.

#### 1. Add the SDK Script to `donate.html`
Place the PayPal SDK script tag in `<head>` or before `</body>`:

```html
<!-- Load PayPal JS SDK with your Client ID and dynamic currency support -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=USD&components=buttons"></script>
```

> **Note for Production:** Replace `YOUR_PAYPAL_CLIENT_ID` with your live Client ID from the PayPal Developer Portal.

#### 2. Add the PayPal Button Container in `donate.html`
Inside the donation form section in `donate.html`:

```html
<!-- Currency Selector for International Donors -->
<div class="form-group" style="margin-bottom: 1.25rem;">
  <label for="paypal-currency-select" style="font-weight: 700;">Select Currency</label>
  <select id="paypal-currency-select" class="form-control" style="width: 100%; padding: 0.75rem; border-radius: 8px;">
    <option value="USD" selected>USD ($) - United States Dollar</option>
    <option value="GBP">GBP (£) - British Pound</option>
    <option value="EUR">EUR (€) - Euro</option>
    <option value="CAD">CAD ($) - Canadian Dollar</option>
    <option value="AUD">AUD ($) - Australian Dollar</option>
  </select>
</div>

<!-- PayPal Smart Buttons Mount Target -->
<div id="paypal-button-container" style="margin-top: 1.5rem; min-height: 150px;"></div>

<!-- PayPal Success Notification Box -->
<div id="paypal-success-message" style="display: none; background: var(--light-surface); border: 2px solid var(--primary); padding: 1.5rem; border-radius: 12px; margin-top: 1rem; text-align: center;">
  <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
  <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Thank You for Supporting Our Children!</h3>
  <p id="paypal-donor-acknowledgment" style="color: var(--dark); font-size: 1rem;"></p>
</div>
```

#### 3. Client-Side JavaScript Initialization (`assets/js/paypal-donate.js`)

Create `assets/js/paypal-donate.js` or include this logic inside `assets/js/forms.js`:

```javascript
/**
 * Bam Dell Disabilities and Orphanage Home
 * PayPal Smart Buttons Integration
 */

function initPayPalButtons() {
  const container = document.getElementById('paypal-button-container');
  if (!container || typeof paypal === 'undefined') return;

  // Clear previous buttons when currency/amount changes
  container.innerHTML = '';

  let selectedCurrency = document.getElementById('paypal-currency-select')?.value || 'USD';
  
  // Helper to get active donation amount
  function getDonationAmount() {
    const customInput = document.getElementById('custom-amount');
    if (customInput && customInput.value && parseFloat(customInput.value) > 0) {
      return parseFloat(customInput.value).toFixed(2);
    }
    // Default preset amount if using amount selector pills (e.g. $25, $50, $100)
    const activePill = document.querySelector('.amount-pill.is-selected');
    return activePill ? activePill.dataset.usdValue || '50.00' : '25.00';
  }

  paypal.Buttons({
    style: {
      layout: 'vertical',
      color:  'gold',
      shape:  'rect',
      label:  'donate',
      height: 48
    },

    // Create Order when donor clicks PayPal button
    createOrder: function(data, actions) {
      const amount = getDonationAmount();
      const currentCurrency = document.getElementById('paypal-currency-select')?.value || 'USD';

      return actions.order.create({
        purchase_units: [{
          description: "Donation to Bam Dell Disabilities and Orphanage Home (Let Love Lead)",
          amount: {
            currency_code: currentCurrency,
            value: amount
          },
          payee: {
            email_address: "donations@bamdellhome.org.ng" // Your PayPal business email
          }
        }],
        application_context: {
          brand_name: "Bam Dell Disabilities & Orphanage Home",
          user_action: "DONATE_NOW",
          shipping_preference: "NO_SHIPPING"
        }
      });
    },

    // Execute capture after donor authorizes
    onApprove: function(data, actions) {
      return actions.order.capture().then(function(orderData) {
        console.log('Capture result:', orderData);
        
        const donorName = orderData.payer.name.given_name || 'Generous Donor';
        const transactionId = orderData.purchase_units[0].payments.captures[0].id;
        const capturedAmount = orderData.purchase_units[0].payments.captures[0].amount.value;
        const currency = orderData.purchase_units[0].payments.captures[0].amount.currency_code;

        // Hide buttons, show confirmation UI
        container.style.display = 'none';
        const successBox = document.getElementById('paypal-success-message');
        const ackText = document.getElementById('paypal-donor-acknowledgment');
        
        if (successBox && ackText) {
          ackText.innerHTML = `
            Dear <strong>${donorName}</strong>, your gift of <strong>${currency} ${capturedAmount}</strong> 
            has been received with heartfelt gratitude.<br>
            <small style="color: var(--dark-muted); display: block; margin-top: 0.5rem;">
              Transaction ID: ${transactionId} • A confirmation receipt has been sent to ${orderData.payer.email_address}.
            </small>
          `;
          successBox.style.display = 'block';
          successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Send telemetry/receipt request to backend
        fetch('/api/paypal-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.orderID,
            transactionId: transactionId,
            payer: orderData.payer,
            amount: capturedAmount,
            currency: currency
          })
        }).catch(err => console.log('Backend notification log:', err));
      });
    },

    onError: function(err) {
      console.error('PayPal Checkout error:', err);
      alert('An error occurred during checkout. Please try again or use direct bank transfer.');
    },

    onCancel: function(data) {
      console.log('Donor cancelled checkout:', data);
    }
  }).render('#paypal-button-container');
}

// Re-render when currency dropdown changes
document.addEventListener('DOMContentLoaded', () => {
  initPayPalButtons();
  const currSelect = document.getElementById('paypal-currency-select');
  if (currSelect) {
    currSelect.addEventListener('change', () => {
      // Re-initialize buttons with updated currency code
      initPayPalButtons();
    });
  }
});
```

---

### Option B: PayPal Hosted Donate Button / PayPal.Me Link (Instant Quick-Launch)
If you prefer not to write JavaScript or maintain client IDs:

1. Log in to [PayPal Buttons Dashboard](https://www.paypal.com/donate/buttons).
2. Click **Create Donate Button**:
   - Organization Name: `Bam Dell Disabilities and Orphanage Home`
   - Purpose: `Child care, pediatric therapy, and orphanage support`
   - Let donors choose specific amounts or any custom amount.
3. Copy the generated **Hosted Button ID** or **Direct Donation URL** (e.g. `https://www.paypal.com/donate/?hosted_button_id=XXXXXXXXXXXXX`).
4. Add the button directly into `donate.html`:

```html
<a href="https://www.paypal.com/donate/?hosted_button_id=YOUR_HOSTED_BUTTON_ID" 
   target="_blank" 
   rel="noopener noreferrer" 
   class="btn btn-accent btn-lg" 
   style="display: inline-flex; align-items: center; gap: 0.75rem; font-weight: 700;">
  <span>💳</span> Donate via PayPal / International Card &rarr;
</a>
```

---

## 4. Recurring Donations (Monthly Giving)

To enable recurring monthly gifts (e.g., $25/month for food & physiotherapy):

1. Navigate to **PayPal Developer** > **Subscriptions** / **Billing Plans**.
2. Create Subscription Plans (e.g. `$20/mo`, `$50/mo`, `$100/mo`).
3. Set the `vault: true` parameter when loading the PayPal SDK:
   ```html
   <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&vault=true&intent=subscription"></script>
   ```
4. Render subscription buttons using `createSubscription`:
   ```javascript
   paypal.Buttons({
     createSubscription: function(data, actions) {
       return actions.subscription.create({
         'plan_id': 'P-XXXXXXXXXXXXXXX' // Your Created Plan ID
       });
     },
     onApprove: function(data, actions) {
       alert('Monthly subscription established! Subscription ID: ' + data.subscriptionID);
     }
   }).render('#paypal-monthly-button-container');
   ```

---

## 5. Testing with PayPal Sandbox

Before deploying live:
1. Log in to [PayPal Developer Dashboard](https://developer.paypal.com/).
2. Go to **Testing Tools** > **Sandbox Accounts**.
3. Use the auto-generated **Personal (Buyer)** account credentials (email and password) to perform test donations.
4. Verify that the simulated funds appear in the **Business (Facilitator)** sandbox account.
5. Once verified, replace the Sandbox `client-id` with your Live Production Client ID.

---

## 6. Security & Compliance Best Practices

1. **Client ID vs. Secret Key**:
   - The `Client ID` is public and can safely exist in frontend HTML/JS files.
   - The `Secret Key` must **NEVER** be committed to Git or exposed in client-side code.
2. **Server-Side Verification**:
   - For accounting and database reconciliation, capture orders on the serverless backend (`/api/paypal-capture`) using PayPal's REST API with your Secret Key.
3. **Receipts & Acknowledgments**:
   - PayPal automatically sends an itemized email receipt to the donor.
   - You can configure custom receipt headers in your PayPal Account Settings under **Business Profile > Custom Receipts**.

---

## 7. Support & Contacts

For assistance with PayPal technical configuration:
- **PayPal Developer Docs:** [https://developer.paypal.com/docs/](https://developer.paypal.com/docs/)
- **Bam Dell IT / Web Admin:** `bwayzconcept@gmail.com`
- **Official NGO Contact:** Bolude Hall, Alafara, Ibadan, Oyo State, Nigeria
- **Motto:** *Let Love Lead*
