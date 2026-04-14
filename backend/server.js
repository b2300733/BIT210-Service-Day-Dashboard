require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();

app.use(cors());
app.use(express.json());

// Activities API routes
app.use('/api/activities', require('./routes/activities.route'));
// Users API routes
app.use('/api/users', require('./routes/users.route'));

mongoose
  .connect(process.env.MongoDB_Host)
  .then(async () => {
    console.log('connected to database');
  })
  .catch(() => {
    console.log('connection failed');
  });

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
