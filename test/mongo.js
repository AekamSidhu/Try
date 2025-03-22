// test-mongo.js
const mongoose = require('mongoose');
require('dotenv').config();

const uri = "mongodb+srv://Parth:Parth@hack2hatch.227la.mongodb.net/?retryWrites=true&w=majority&appName=hack2hatch";

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });