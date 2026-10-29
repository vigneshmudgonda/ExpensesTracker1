const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('MongoDb Connected Successfully');
}).catch((err) => {
    console.log('MongoDb Connection Failed', err);
})


module.exports