require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initialiseDatabase } = require('./db');

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
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

const startServer = async () => {
  try {
    await initialiseDatabase();
    console.log('Connected to MySQL database');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    process.exitCode = 1;
  }
};

startServer();
