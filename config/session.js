const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./database');

const sessionStore = new SequelizeStore({
  db: sequelize
});

const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-12345',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
});

module.exports = { sessionConfig, sessionStore };
