/**
 * Email Notification Service (Nodemailer + SMTP)
 * Bam Dell Disabilities and Orphanage Home
 * Tagline: Let Love Lead
 */

const nodemailer = require('nodemailer');

// Load environment variables locally if not production
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (err) {
    // Dotenv optional in production
  }
}

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.zoho.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;

const SMTP_USER_VOLUNTEER = process.env.SMTP_USER_VOLUNTEER || 'volunteer@bamdellhome.org';
const SMTP_PASS_VOLUNTEER = process.env.SMTP_PASS_VOLUNTEER || '';

const SMTP_USER_CONTACT = process.env.SMTP_USER_CONTACT || 'info@bamdellhome.org';
const SMTP_PASS_CONTACT = process.env.SMTP_PASS_CONTACT || '';

const EMAIL_TO = process.env.EMAIL_TO || 'bamdellhome@gmail.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Bam Dell Disabilities and Orphanage Home';

/**
 * Creates an SMTP Transporter instance
 */
function createTransporter(user, pass) {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
}

const volunteerTransporter = createTransporter(SMTP_USER_VOLUNTEER, SMTP_PASS_VOLUNTEER);
const contactTransporter = createTransporter(SMTP_USER_CONTACT, SMTP_PASS_CONTACT);

function smtpConfigured(user, pass) {
  return Boolean(user && pass);
}

async function deliverMail(transporter, user, pass, mailOptions, label) {
  if (!smtpConfigured(user, pass)) {
    console.warn(`[Email] SMTP not configured for ${label}. Submission stored in logs only.`);
    console.info(`[Email:${label}]`, {
      to: mailOptions.to,
      subject: mailOptions.subject,
      replyTo: mailOptions.replyTo
    });
    return;
  }
  await transporter.sendMail(mailOptions);
}

/**
 * Sanitize text inputs for safe email headers & rendering
 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[\r\n]+/g, ' ');
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Send Volunteer Application Emails (Submitter confirmation + Staff notification)
 */
async function sendVolunteerEmails({ fullName, email, phone, state, role, experience, fileAttachment }) {
  const cleanName = sanitizeInput(fullName);
  const cleanEmail = sanitizeInput(email);
  const cleanPhone = sanitizeInput(phone);
  const cleanState = sanitizeInput(state);
  const cleanRole = sanitizeInput(role);
  const cleanExp = experience ? experience.trim() : 'None provided';

  const attachments = [];
  if (fileAttachment && fileAttachment.buffer) {
    attachments.push({
      filename: fileAttachment.originalFilename || 'Volunteer_Document.pdf',
      content: fileAttachment.buffer,
      contentType: fileAttachment.mimetype || 'application/octet-stream'
    });
  }

  // 1. Internal Staff Notification
  const adminMailOptions = {
    from: `"${FROM_NAME} Volunteer Portal" <${SMTP_USER_VOLUNTEER}>`,
    to: EMAIL_TO,
    replyTo: `"${cleanName}" <${cleanEmail}>`,
    subject: `[New Volunteer Application] ${cleanName} - ${cleanRole} (${cleanState})`,
    text: `NEW VOLUNTEER APPLICATION RECEIVED - BAM DELL HOME\n\n` +
          `Applicant Name: ${cleanName}\n` +
          `Email: ${cleanEmail}\n` +
          `Phone: ${cleanPhone}\n` +
          `Location / State: ${cleanState}\n` +
          `Preferred Role: ${cleanRole}\n` +
          `Attachment: ${fileAttachment ? fileAttachment.originalFilename : 'No document attached'}\n\n` +
          `Experience & Motivation:\n${cleanExp}\n\n` +
          `Submitted via bamdellhome.org on ${new Date().toUTCString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0D9488; color: #FFFFFF; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">🌟 New Volunteer Application</h2>
          <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Bam Dell Disabilities and Orphanage Home — Let Love Lead</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #4B5563;">Applicant Name:</td>
              <td style="padding: 8px 0; color: #111827;">${escapeHtml(cleanName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4B5563;">Email Address:</td>
              <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(cleanEmail)}" style="color: #0D9488;">${escapeHtml(cleanEmail)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4B5563;">Phone Number:</td>
              <td style="padding: 8px 0;"><a href="tel:${escapeHtml(cleanPhone)}" style="color: #0D9488;">${escapeHtml(cleanPhone)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4B5563;">Location:</td>
              <td style="padding: 8px 0; color: #111827;">${escapeHtml(cleanState)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4B5563;">Selected Role:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #0D9488;">${escapeHtml(cleanRole)}</td>
            </tr>
          </table>

          <div style="background-color: #F9FAFB; border-left: 4px solid #0D9488; padding: 14px; margin-bottom: 20px; border-radius: 4px;">
            <h4 style="margin: 0 0 8px; color: #111827; font-size: 14px;">Motivation & Experience:</h4>
            <p style="margin: 0; font-size: 14px; white-space: pre-wrap; color: #374151;">${escapeHtml(cleanExp)}</p>
          </div>

          <p style="font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 12px; margin: 0;">
            Center: 5B/5A, Opposite Bolude Hall, Alafara, Olubadan Adeoti, Ibadan | Helplines: 07030700033, 08023129353
          </p>
        </div>
      </div>
    `,
    attachments
  };

  // 2. Submitter Confirmation
  const submitterMailOptions = {
    from: `"${FROM_NAME}" <${SMTP_USER_VOLUNTEER}>`,
    to: cleanEmail,
    subject: `Thank you for applying to volunteer with Bam Dell Home ("Let Love Lead")`,
    text: `Dear ${cleanName},\n\n` +
          `Thank you for offering your heart and time to volunteer with Bam Dell Disabilities and Orphanage Home (${cleanRole}).\n\n` +
          `We have received your application. Our coordination team in Ibadan will review your details and contact you shortly to schedule an orientation.\n\n` +
          `Address: 5B/5A, Opposite Bolude Hall, Alafara, Olubadan Adeoti, Ibadan\n` +
          `Phone / WhatsApp: 07030700033, 08023129353\n` +
          `Social: @bam_dell / bamdellhome\n\n` +
          `"Let Love Lead"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0D9488; color: #FFFFFF; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px;">Thank You for Letting Love Lead! 💚</h2>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Bam Dell Disabilities and Orphanage Home</p>
        </div>
        <div style="padding: 24px;">
          <p>Dear <b>${escapeHtml(cleanName)}</b>,</p>
          <p>Thank you for submitting your application to volunteer with Bam Dell Home under the <b>${escapeHtml(cleanRole)}</b> unit in Ibadan.</p>
          <p>To the Glory of God and His Grace, we minister to the physical and spiritual needs of orphans and special needs children. Your dedication makes an eternal impact.</p>
          
          <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px; color: #0D9488;">📍 Our Ibadan Center:</h4>
            <p style="margin: 0; font-size: 14px; color: #15803D;">
              5B/5A, Opposite Bolude Hall, Alafara, Olubadan Adeoti, Ibadan, Oyo State.<br>
              Direct Helplines: <b>07030700033</b> | <b>08023129353</b> | <b>08029594000</b>
            </p>
          </div>

          <p style="margin-top: 24px; font-size: 14px; color: #111827;">
            Warm regards,<br>
            <b>Management & Volunteer Team</b><br>
            Bam Dell Disabilities and Orphanage Home<br>
            <i>Social: @bam_dell / bamdellhome</i>
          </p>
        </div>
      </div>
    `
  };

  await Promise.all([
    deliverMail(volunteerTransporter, SMTP_USER_VOLUNTEER, SMTP_PASS_VOLUNTEER, adminMailOptions, 'volunteer-admin'),
    deliverMail(volunteerTransporter, SMTP_USER_VOLUNTEER, SMTP_PASS_VOLUNTEER, submitterMailOptions, 'volunteer-submitter')
  ]);
}

/**
 * Send Contact / Inquiry Emails
 */
async function sendContactEmails({ name, email, phone, subject, message, fileAttachment }) {
  const cleanName = sanitizeInput(name);
  const cleanEmail = sanitizeInput(email);
  const cleanPhone = sanitizeInput(phone) || 'Not provided';
  const cleanSubject = sanitizeInput(subject);
  const cleanMsg = message ? message.trim() : '';

  const attachments = [];
  if (fileAttachment && fileAttachment.buffer) {
    attachments.push({
      filename: fileAttachment.originalFilename || 'Inquiry_Attachment.pdf',
      content: fileAttachment.buffer,
      contentType: fileAttachment.mimetype || 'application/octet-stream'
    });
  }

  // 1. Internal Staff Notification
  const adminMailOptions = {
    from: `"${FROM_NAME} Web Contact" <${SMTP_USER_CONTACT}>`,
    to: EMAIL_TO,
    replyTo: `"${cleanName}" <${cleanEmail}>`,
    subject: `[Bam Dell Home Inquiry - ${cleanSubject}] from ${cleanName}`,
    text: `NEW CONTACT MESSAGE - BAM DELL HOME\n\n` +
          `Sender Name: ${cleanName}\n` +
          `Email: ${cleanEmail}\n` +
          `Phone: ${cleanPhone}\n` +
          `Subject: ${cleanSubject}\n\n` +
          `Message Content:\n${cleanMsg}\n\n` +
          `Submitted on ${new Date().toUTCString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0D9488; color: #FFFFFF; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">📩 New Web Message</h2>
          <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Bam Dell Disabilities and Orphanage Home</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #4B5563;">Full Name:</td>
              <td style="padding: 8px 0; color: #111827;">${escapeHtml(cleanName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4B5563;">Email Address:</td>
              <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(cleanEmail)}" style="color: #0D9488;">${escapeHtml(cleanEmail)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4B5563;">Phone Number:</td>
              <td style="padding: 8px 0;"><a href="tel:${escapeHtml(cleanPhone)}" style="color: #0D9488;">${escapeHtml(cleanPhone)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4B5563;">Subject:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #D97706;">${escapeHtml(cleanSubject)}</td>
            </tr>
          </table>

          <div style="background-color: #F9FAFB; border-left: 4px solid #D97706; padding: 14px; margin-bottom: 20px; border-radius: 4px;">
            <h4 style="margin: 0 0 8px; color: #111827; font-size: 14px;">Message:</h4>
            <p style="margin: 0; font-size: 14px; white-space: pre-wrap; color: #374151;">${escapeHtml(cleanMsg)}</p>
          </div>
        </div>
      </div>
    `,
    attachments
  };

  // 2. Submitter Confirmation
  const submitterMailOptions = {
    from: `"${FROM_NAME}" <${SMTP_USER_CONTACT}>`,
    to: cleanEmail,
    subject: `Thank you for contacting Bam Dell Disabilities and Orphanage Home`,
    text: `Dear ${cleanName},\n\n` +
          `Thank you for contacting Bam Dell Disabilities and Orphanage Home regarding "${cleanSubject}".\n\n` +
          `We have received your message and will get back to you promptly.\n\n` +
          `Center: 5B/5A, Opposite Bolude Hall, Alafara, Olubadan Adeoti, Ibadan, Nigeria.\n` +
          `Phones: 07030700033, 08023129353, 08029594000\n\n` +
          `Let Love Lead`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0D9488; color: #FFFFFF; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px;">Message Received ✅</h2>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Bam Dell Disabilities and Orphanage Home — "Let Love Lead"</p>
        </div>
        <div style="padding: 24px;">
          <p>Dear <b>${escapeHtml(cleanName)}</b>,</p>
          <p>Thank you for reaching out to us regarding <b>${escapeHtml(cleanSubject)}</b>.</p>
          <p>Our team in Ibadan has received your submission and will get back to you shortly.</p>
          
          <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; padding: 14px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #92400E;">
              📍 <b>Center Location:</b> 5B/5A, Opposite Bolude Hall, Alafara, Olubadan Adeoti, Ibadan.<br>
              📞 <b>Direct Line:</b> 07030700033 | 08023129353
            </p>
          </div>

          <p style="margin-top: 24px; font-size: 14px; color: #111827;">
            Warm regards,<br>
            <b>Administration Team</b><br>
            Bam Dell Disabilities and Orphanage Home
          </p>
        </div>
      </div>
    `
  };

  await Promise.all([
    deliverMail(contactTransporter, SMTP_USER_CONTACT, SMTP_PASS_CONTACT, adminMailOptions, 'contact-admin'),
    deliverMail(contactTransporter, SMTP_USER_CONTACT, SMTP_PASS_CONTACT, submitterMailOptions, 'contact-submitter')
  ]);
}

module.exports = {
  sendVolunteerEmails,
  sendContactEmails
};
