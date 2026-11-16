require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

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

mongoose
  .connect(process.env.MongoDB_Host)
  .then(async () => {
    console.log('connected to database');
  })
  .catch((error) => {
    console.error('connection failed:', error.message);
  });

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
