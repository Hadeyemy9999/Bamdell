/**
 * Bam Dell Disabilities and Orphanage Home - Backend API Configuration (v1)
 * Single Source of Truth for Serverless Endpoint Routing
 * Cache-busted for aggressive edge caching CDNs
 */

const FORM_BACKEND = {
  baseUrl: '',
  volunteerEndpoint: '/api/submit-volunteer',
  contactEndpoint: '/api/submit-contact',
  recipientEmail: 'info@bamdellhome.org',
  volunteerEmail: 'volunteer@bamdellhome.org',
  maxFileSizeMB: 4
};

// Expose globally for browser execution
window.FORM_BACKEND = FORM_BACKEND;
