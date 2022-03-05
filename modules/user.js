
const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");

 const userSchema = new mongoose.Schema ({
    name:{
        type: String,
        required: true
    },
    rollno:{
      type: String,
      required: true,
      unique: true
    },
    department: {
      type: String,
      required: true
    },
  username: {
    type: String,
    required: true,
    unique: true
    },
  password: {
    type: String,
    
    
    }
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
module.exports=User;