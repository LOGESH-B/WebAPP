const mongoose = require('mongoose');

const registeSchema=new mongoose.Schema({
    name:{
        type: String,
        
    },
    rollno:{
      type: String,

      unique: true
    },
    department: {
      type: String,
      
    },
  username: {
    type: String,
    
    unique: true
    },
    member: {
        type: String,
    },
    userid:{
        type: mongoose.Schema.Types.ObjectId,
        required: true

    }
})

const Register = new mongoose.model("Register", registeSchema);
module.exports=Register;