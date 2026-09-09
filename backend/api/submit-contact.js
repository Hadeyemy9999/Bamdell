/**
 * Vercel Serverless Function: Submit General Inquiries, Beneficiary Referrals & Partnerships
 * Hope Ability Foundation Nigeria
 */

const fs = require('fs');
const formidable = require('formidable');
const { handleCors } = require('../services/cors');
const { sendContactEmails } = require('../services/emailService');

// Disable Vercel's default JSON body parser for multipart parsing
module.exports.config = {
  api: {
    bodyParser: false
  }
};

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB maximum file size

module.exports = async function handler(req, res) {
  // 1. Handle CORS preflight & headers
  if (handleCors(req, res)) {
    return;
  }

  // 2. Enforce POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. This endpoint accepts POST requests only.'
    });
  }

  // 3. Parse multipart/form-data
  const form = new formidable.IncomingForm({
    maxFileSize: MAX_FILE_SIZE_BYTES,
    keepExtensions: true,
    allowEmptyFiles: false
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('[Submit Contact] Formidable Parse Error:', err.message);
      if (err.message && err.message.includes('maxFileSize exceeded')) {
        return res.status(400).json({
          success: false,
          error: 'Uploaded file exceeds the maximum allowed size of 4MB. Please compress or select a smaller document.'
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Unable to parse form data. Please verify all inputs.'
      });
    }

    try {
      // Normalize fields
      const getField = (name) => {
        const val = fields[name];
        if (Array.isArray(val)) return val[0];
        return val || '';
      };

      const name = getField('name') || getField('fullName');
      const email = getField('email');
      const phone = getField('phone');
      const subject = getField('subject') || 'General Information';
      const message = getField('message');
      const botcheck = getField('botcheck');

      // Honeypot check
      if (botcheck && botcheck.trim() !== '') {
        console.warn('[Submit Contact] Honeypot triggered. Silently dropping submission.');
        return res.status(200).json({
          success: true,
          message: 'Message sent successfully.'
        });
      }

      // Validate required fields
      const missingFields = [];
      if (!name || !name.trim()) missingFields.push('Your Name');
      if (!email || !email.trim()) missingFields.push('Email Address');
      if (!subject || !subject.trim()) missingFields.push('Nature of Inquiry');
      if (!message || !message.trim()) missingFields.push('Message');

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required field(s): ${missingFields.join(', ')}.`
        });
      }

      // Basic email syntax validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid email address.'
        });
      }

      // Process optional uploaded document (e.g., Medical referral summary, CSR sponsorship deck)
      let fileAttachment = null;
      const uploadedFile = files.document || files.file || files.attachment;
      const fileObj = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

      if (fileObj && fileObj.filepath && fileObj.size > 0) {
        if (fileObj.size > MAX_FILE_SIZE_BYTES) {
          return res.status(400).json({
            success: false,
            error: 'The attached document exceeds the 4MB limit.'
          });
        }

        const buffer = fs.readFileSync(fileObj.filepath);
        fileAttachment = {
          buffer,
          originalFilename: fileObj.originalFilename || 'Document_Attachment.pdf',
          mimetype: fileObj.mimetype || 'application/octet-stream'
        };

        try {
          fs.unlinkSync(fileObj.filepath);
        } catch (cleanupErr) {
          // Ignored
        }
      }

      // Send transactional emails
      await sendContactEmails({
        name,
        email,
        phone,
        subject,
        message,
        fileAttachment
      });

      return res.status(200).json({
        success: true,
        message: 'Thank you! Your message has been delivered to our team. A confirmation has been sent to your email.'
      });

    } catch (sendErr) {
      console.error('[Submit Contact] Processing/Email Error:', sendErr);
      return res.status(500).json({
        success: false,
        error: 'We could not deliver your message due to an email gateway error. Please contact info@hopeability.org.ng directly.'
      });
    }
  });
};
