const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name : {
        type : String,
        required : true,
        trim : true
    },
       email : {
        type : String,
        required : true,
        trim : true
    },
        : {
        type : Number,
        required : true,
        trim : true
    },
})