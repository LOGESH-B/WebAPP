const mongoose = require('mongoose');
const Event=require("./event");
const Register = require('./register');


const clubSchema=new mongoose.Schema({
    clubname:{

        type: String,
        required: true
    },
    events: [{type: mongoose.Schema.Types.ObjectId, ref: 'Event'}],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
    
    
});

const Club = new mongoose.model("Club", clubSchema);
const club=new Club({
    clubname: "Cultural Club",
    author:"61e0455aff4b576c56019975"
})
//club.save()
module.exports=Club;