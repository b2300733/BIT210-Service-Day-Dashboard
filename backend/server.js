require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MongoDB_Host)
  .then(async () => {
    console.log('connected to database');
  })
  .catch(() => {
    console.log('connection failed');
  });
