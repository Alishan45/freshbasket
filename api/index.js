import app from '../server/src/app.js';

export default function handler(req, res) {
  // Normalize req.url so that Express router (/api/...) always matches
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
}
