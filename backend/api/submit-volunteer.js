/**
 * Vercel Serverless Function: Submit Volunteer Application
 * Hope Ability Foundation Nigeria
 */

const fs = require('fs');
const formidable = require('formidable');
const { handleCors } = require('../services/cors');
const { sendVolunteerEmails } = require('../services/emailService');

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
      console.error('[Submit Volunteer] Formidable Parse Error:', err.message);
      if (err.message && err.message.includes('maxFileSize exceeded')) {
        return res.status(400).json({
          success: false,
          error: 'Uploaded file exceeds the maximum allowed size of 4MB. Please compress or select a smaller file.'
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Unable to parse form data. Please ensure fields are valid.'
      });
    }

    try {
      // Normalize fields (formidable v3 may return arrays or single values)
      const getField = (name) => {
        const val = fields[name];
        if (Array.isArray(val)) return val[0];
        return val || '';
      };

      const fullName = getField('fullName') || getField('name');
      const email = getField('email');
      const phone = getField('phone');
      const state = getField('state') || getField('location');
      const role = getField('role');
      const experience = getField('experience') || getField('message');
      const botcheck = getField('botcheck');

      // Honeypot check: If bot filled the hidden botcheck field, silently discard and pretend success
      if (botcheck && botcheck.trim() !== '') {
        console.warn('[Submit Volunteer] Honeypot triggered. Silently dropping submission.');
        return res.status(200).json({
          success: true,
          message: 'Volunteer application submitted successfully.'
        });
      }

      // Validate required fields
      const missingFields = [];
      if (!fullName || !fullName.trim()) missingFields.push('Full Name');
      if (!email || !email.trim()) missingFields.push('Email Address');
      if (!phone || !phone.trim()) missingFields.push('Phone Number');
      if (!state || !state.trim()) missingFields.push('State / Location');
      if (!role || !role.trim()) missingFields.push('Area of Interest');

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
          error: 'Please provide a valid email address.'
        });
      }

      // Process uploaded file (e.g. CV / Credentials) if present
      let fileAttachment = null;
      const uploadedFile = files.cvFile || files.file || files.attachment;
      const fileObj = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

      if (fileObj && fileObj.filepath && fileObj.size > 0) {
        if (fileObj.size > MAX_FILE_SIZE_BYTES) {
          return res.status(400).json({
            success: false,
            error: 'The uploaded file exceeds the 4MB limit.'
          });
        }

        const buffer = fs.readFileSync(fileObj.filepath);
        fileAttachment = {
          buffer,
          originalFilename: fileObj.originalFilename || 'CV_Attachment.pdf',
          mimetype: fileObj.mimetype || 'application/octet-stream'
        };

        // Clean up temporary upload file
        try {
          fs.unlinkSync(fileObj.filepath);
        } catch (cleanupErr) {
          // Ignored non-fatal
        }
      }

      // Send transactional confirmation and inbox notification emails
      await sendVolunteerEmails({
        fullName,
        email,
        phone,
        state,
        role,
        experience,
        fileAttachment
      });

      return res.status(200).json({
        success: true,
        message: 'Your volunteer application has been received successfully. A confirmation email has been sent to your inbox.'
      });

    } catch (sendErr) {
      console.error('[Submit Volunteer] Processing/Email Error:', sendErr);
      return res.status(500).json({
        success: false,
        error: 'We could not complete your submission due to an email delivery error. Please try again or contact us directly at volunteer@hopeability.org.ng.'
      });
    }
  });
};
