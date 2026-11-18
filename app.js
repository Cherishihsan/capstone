const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const csurf = require('csurf');
const { sessionConfig } = require('./config/session');
const routes = require('./routes');

const app = express();

// Security and Logging (CSP disabled for Stitch Tailwind CDN & Google Fonts)
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(morgan('dev'));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(sessionConfig);

// CSRF
const csrfProtection = csurf({ cookie: false });

// View Engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/') ||
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes('application/json'))
  ) {
    return next();
  }
  return csrfProtection(req, res, next);
});

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
  res.locals.user = req.session ? req.session.user || null : null;
  res.locals.currentPath = req.path || '/';
  res.locals.currentQuery = req.query || {};
  res.locals.flash = req.session ? req.session.flash || {} : {};
  if (req.session) {
    req.session.flash = {};
  }
  next();
});

// Routes
app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Halaman Tidak Ditemukan — SIMNILAI' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('errors/500', {
    title: 'Terjadi Kesalahan Server — SIMNILAI',
    message: err.message
  });
});

module.exports = app;
