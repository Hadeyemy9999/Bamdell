try {
  require('dotenv').config();
} catch (err) {
  // Optional in environments that inject env vars directly
}

const express = require('express');
const submitContact = require('./api/submit-contact');
const submitVolunteer = require('./api/submit-volunteer');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'bamdell-backend',
    endpoints: ['/api/submit-contact', '/api/submit-volunteer']
  });
});

app.all('/api/submit-contact', (req, res) => submitContact(req, res));
app.all('/api/submit-volunteer', (req, res) => submitVolunteer(req, res));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});
