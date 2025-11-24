import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// SECURITY: Block access to sensitive files
app.use((req, res, next) => {
  // Block dotfiles (.env, .git, etc.)
  if (req.path.match(/\/\./)) {
    return res.status(404).send('Not Found');
  }

  // Block sensitive file types
  if (req.path.match(/\.(env|git|json|lock|md|yml|yaml|toml)$/i)) {
    return res.status(404).send('Not Found');
  }

  next();
});

// SECURITY: Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; font-src 'self' data:;");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});

// Serve static files from dist directory with proper MIME types
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Handle client-side routing - serve index.html only for non-file routes
app.get('*', (req, res) => {
  // Don't serve index.html for asset requests
  if (req.path.startsWith('/assets/') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ZirakBook Frontend running on port ${PORT}`);
});
// Trigger rebuild Mon Nov 24 11:49:04 AM UTC 2025
