/**
 * Bam Dell Disabilities and Orphanage Home - Backend API Configuration (v1)
 * Single Source of Truth for Serverless Endpoint Routing
 * Cache-busted for aggressive edge caching CDNs
 */

const FORM_BACKEND = {
  // In development, relative '/api' is used; in production, point to the deployed Vercel backend
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
