
const mongoose = require('mongoose');
const eventSchema=new mongoose.Schema({



   
    eventname: {
      type: String,
      required: true
  },
    eventdiscription: {
      type: String,
      required: true
  },
    eventdate: {
      type: String,
      required: true
  },
    enddate:{
      type: String,
      required: true
  },
 images: [{
   url: String,
   filename: String
 }],
 register: [{type: mongoose.Schema.Types.ObjectId, ref: 'Register'}]
      
    });


    const Event = new mongoose.model("Event", eventSchema);
module.exports=Event;