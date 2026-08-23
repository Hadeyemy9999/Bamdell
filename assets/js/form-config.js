/**
 * Bam Dell Disabilities and Orphanage Home - Backend API Configuration
 * Single Source of Truth for Serverless Endpoint Routing
 */

const FORM_BACKEND = {
  // In development, relative '/api' is proxied or uses deployed Vercel backend URL
  baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '' 
    : 'https://hopeability-backend.vercel.app',
  volunteerEndpoint: '/api/submit-volunteer',
  contactEndpoint: '/api/submit-contact',
  recipientEmail: 'info@hopeability.org.ng',
  volunteerEmail: 'volunteer@hopeability.org.ng',
  maxFileSizeMB: 4
};

// Expose globally for browser execution
window.FORM_BACKEND = FORM_BACKEND;
