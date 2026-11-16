require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

app.use(
  cors({
    origin: ['http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());
app.use(cookieParser());

// Activities API routes
app.use('/api/activities', require('./routes/activities.route'));
// Registrations API routes
app.use('/api/registrations', require('./routes/registrations.route'));
// Users API routes
app.use('/api/users', require('./routes/users.route'));
// Reminders API routes
app.use('/api/reminders', require('./routes/reminders.route'));

const port = Number(process.env.PORT || 3000);
const { query } = require('./db');

app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'mysql' });
  } catch (error) {
    console.error('health check failed:', error.message);
    res.status(503).json({ status: 'error', database: 'mysql' });
  }
});

const browserPath = path.join(__dirname, '..', 'dist', 'BIT210-Service-Day-Dashboard', 'browser');
app.use(express.static(browserPath));
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(browserPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
