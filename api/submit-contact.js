import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../backend/api/submit-contact.js');

export const config = {
  api: {
    bodyParser: false
  }
};

export default handler;
