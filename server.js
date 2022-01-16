if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}



const express = require('express')
const res = require('express/lib/response')
const https=require("https")
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejsMate=require('ejs-mate')
const methodOverride = require('method-override')
const User=require("./modules/user")
const Club=require("./modules/club")
const Event=require("./modules/event")
const Register=require("./modules/register")

const isAuthor = require("./middleware/auth");


const multer = require('multer');
const { storage } = require('./clodinary');
const upload = multer({ storage });



const session = require('express-session')
const passport = require("passport");
const localStrategy=require("passport-local")

const req = require('express/lib/request');
 

const app = express()
app.use(express.static(__dirname+"/public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
  }));
 
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(methodOverride('_method'))
  app.engine('ejs',ejsMate)

 mongoose.connect("mongodb+srv://logesh:logeshb.20it@cluster0.e7qad.mongodb.net/userDB");


passport.use(new localStrategy(User.authenticate()));
  passport.use(User.createStrategy());

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    app.use((req,res,next)=>{
      res.locals.currentUser=req.user;
      
      next()
    })
    

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));


const port = process.env.PORT || 3000

app.get("/",(req,res)=>{
    if (req.isAuthenticated()){
        res.render("home");
      } else {
        console.log("i am here")
        res.redirect("/login");
      }
    });
    
app.get("/logout", function(req, res){
     req.logout();
     res.redirect("/");
  });
    
    
app.get("/about",(req,res)=>{
    if (req.isAuthenticated()){
      res.render("about");      
      } else {
        res.redirect("/");
      } 
})

app.get("/club/:clubname",(req,res)=>{
  
    console.log(req.params.clubname);
     Club.findOne({clubname: req.params.clubname}).populate('events').then(found=>{ 
      
    res.render('eventcard', {found});
     })   
    });      

  app.get("/club/:clubname/add",(req,res)=>{
    const {clubname}=req.params;
    res.render('addevent',{clubname})

  })
  app.post("/club/:clubname/add",upload.array('image'),async(req,res)=>{
    
    console.log(req.files)
    const {clubname}=req.params;
    const event=new Event(req.body);
    event.images = req.files.map(f => ({ url: f.path, filename: f.filename }));

    console.log("i am here",event.images);
     Club.findOne({clubname},async(err,foundclub)=>{
       await foundclub.events.push(event);
       await event.save();
       await foundclub.save();   
      res.redirect(`/club/${clubname}`)
     })
   

  })


 app.get("/club/:clubname/:eventid/edit",(req,res)=>{
  
   console.log(req.params)
   const {clubname , eventid}=req.params;
   Event.findById(eventid,(err,foundevent)=>{
     if(!err){
     console.log(foundevent)
     res.render('edit',{clubname,foundevent});
     }
   })
 }) 

 app.put("/club/:clubname/:eventid/edit",(req,res)=>{
  const {clubname , eventid}=req.params;
  // Event.findById(eventid,(err,event)=>{
  //   images = req.files.map(f => ({ url: f.path, filename: f.filename }));
  // })
  
  Event.UpdateOne(eventid,req.body,{new: true,runValidators: true},(err,edited)=>{
    if(!err)
    {
      res.redirect(`/club/${clubname}`)
    }
  })
})

app.delete("/club/:clubname/:eventid/delete",async(req,res)=>{
  const {clubname,eventid}=req.params;
  const found=await Club.findOne({clubname})
    if(found)
    {
      console.log(found);
     await Club.findByIdAndUpdate(found._id,{$pull: {events: eventid}});
      await Event.findByIdAndDelete(eventid);
      res.redirect(`/club/${clubname}`)
    }
})

app.get("/club/:clubname/:eventid/register",async(req,res)=>{
  const {clubname,eventid}=req.params
  const register=new Register(req.body)
  register.userid=req.user._id;

  Event.findById(eventid,async(err,foundevent)=>{
    await foundevent.register.push(register);
    await register.save()
    await foundevent.save()
    res.redirect(`/club/${clubname}`)
  })
  res.render("eventregister",)
})

app.get("/club/:clubname/:eventid",(req,res)=>{
  const {clubname,eventid}=req.params
  console.log("hiiii",req.params.eventid)
  Event.findById(req.params.eventid,(err,foundevent)=>{
    console.log(foundevent)
    res.render("event",{foundevent,clubname})
  })
 

})


app.get("/login",(req,res)=>{
   
    res.render('login');
})
app.get("/signUp",(req,res)=>{
    
  
    res.render('signUp');
})

app.post("/login", (req,response)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
      });
    
      req.login(user, function(err){
        if (err) {
          console.log(err);
          res.redirect("/login");
        } else {
            passport.authenticate("local") (req, res, function(){
                response.redirect("/");
              });
            }
        })
})


 app.get("/eventcard",(req,res)=>{
   
    res.render('eventcard');
})
 

app.post("/signUp",(req,res)=>{
  console.log(req.body.password)
    User.register({username: req.body.username,name: req.body.name,rollno: req.body.rollno,department: req.body.department}, req.body.password, function(err, user){
        if (err) {
          console.log(err);
          res.redirect("/signUp");
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/");
          });
        }
      });
})



 app.listen(port,function(){
    console.log("Started")
    }
    )
