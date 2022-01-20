const mongoose = require('mongoose');
const Event=require("./event");
const Register = require('./register');


const clubSchema=new mongoose.Schema({
    clubname:{
        type: String,  
    },
    events: [{type: mongoose.Schema.Types.ObjectId, ref: 'Event'}],
    author: [{
        type: String,
        required: true
    }],
    stucoordinators: {
        type: String
    },
    stfcoordinators:{
        type: String
    },
    clublogo: {
        url: String,
        filename: String
      },

      images: [{
        url: String,
        filename: String
      }],
      discription: {
          type: String
      }
    
    
});

const Club = new mongoose.model("Club", clubSchema);
module.exports=Club;