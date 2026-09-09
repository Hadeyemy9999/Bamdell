/**
 * Bam Dell Disabilities and Orphanage Home - Backend API Configuration
 * Single Source of Truth for Serverless Endpoint Routing
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
