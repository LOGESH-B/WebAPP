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
const path=require("path")

const {isAuthor,isLoggedIn,isClubAuthor} = require("./middleware/auth");




const multer = require('multer');
const { storage } = require('./clodinary');
const upload = multer({ storage });



const session = require('express-session')
const passport = require("passport");
const localStrategy=require("passport-local")

const req = require('express/lib/request');
 

const app = express()
app.use(express.static(path.join(__dirname,"/public")))
//app.use(express.static(__dirname+"/public"));



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

    app.use(async(req,res,next)=>{
      res.locals.currentUser=req.user;
      const clubs=await Club.find({})
      res.locals.club=clubs;
      
      next()
    })
    

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));


const port = process.env.PORT || 3000

app.get("/",isLoggedIn,(req,res)=>{
 
      Club.find({},(err,found)=>{
        console.log(found)
        if(!err){
          res.render("home",{found});
        }
      })  
    });
    
app.get("/logout", function(req, res){
     req.logout();
     res.redirect("/");
  });
    
    
app.get("/about",isLoggedIn,(req,res)=>{    
      res.render("about");          
})

app.get("/club/:clubname",isLoggedIn,(req,res)=>{
  
    console.log(req.params.clubname);
     Club.findOne({clubname: req.params.clubname}).populate('events').then(found=>{ 
       console.log("poda",found)
      
    res.render('eventcard', {found});
     })   
    });      
app.get("/newclub",isLoggedIn,isAuthor,(req,res)=>{
  res.render('newclub')
})

app.post("/newclub",isLoggedIn,isAuthor,upload.array('image'),async(req,res)=>{
  console.log(req.body)
   const authors=[req.body.stfemail,req.body.stuemail,req.user.username]
   
  const club=new Club(req.body)
  console.log("1",club)
  club.author=authors;
  console.log("2",club)
  club.images=req.files.map(f => ({ url: f.path, filename: f.filename }));
  console.log("looo",club.images)
  await club.save();
  res.redirect("/")
})
  app.get("/club/:clubname/add",isLoggedIn,isClubAuthor,(req,res)=>{
    const {clubname}=req.params;
    res.render('addevent',{clubname})

  })
  app.post("/club/:clubname/add",isLoggedIn,isClubAuthor,upload.array('image'),async(req,res)=>{
    
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


 app.get("/club/:clubname/:eventid/edit",isLoggedIn,isClubAuthor,(req,res)=>{
  
   console.log(req.params)
   const {clubname , eventid}=req.params;
   Event.findById(eventid,(err,foundevent)=>{
     if(!err){
     console.log(foundevent)
     res.render('edit',{clubname,foundevent});
     }
     else{
       console.log("hii")
       console.log(err)
     }
   })
 }) 

 app.put("/club/:clubname/:eventid/edit",isLoggedIn,isClubAuthor,(req,res)=>{
   
  const {clubname , eventid}=req.params;
  // Event.findById(eventid,(err,event)=>{
  //   images = req.files.map(f => ({ url: f.path, filename: f.filename }));
  // })
  console.log(req.body)
   Event.updateOne({_id :eventid},{...req.body},{new: true,runValidators: true},(err,edited)=>{
    console.log("jiii")
    if(!err)
    {
      res.redirect(`/club/${clubname}`)
    }
    else{
      console.log(err)
    }
  })
})

app.delete("/club/:clubname/:eventid/delete",isLoggedIn,isClubAuthor,async(req,res)=>{
  const {clubname,eventid}=req.params;
  const found=await Club.findOne({clubname})
    if(found)
    {
      console.log(found);
     await Club.findByIdAndUpdate(found._id,{$pull: {events: eventid}});
     const registers= await  Event.findById(eventid);
      await Event.findByIdAndDelete(eventid);
      for(let reg of registers.register)
      {
        await Register.findByIdAndDelete(reg);

      }
      res.redirect(`/club/${clubname}`)
    }
})

app.get("/club/:clubname/:eventid/register",isLoggedIn,async(req,res)=>{
  const {clubname,eventid}=req.params
  res.render("eventregister",{clubname,eventid})
})
app.post("/club/:clubname/:eventid/register",isLoggedIn,(req,response)=>{
  const {clubname,eventid}=req.params
  console.log("jana",req.body)
  
  const register=new Register(req.body)
  register.userid=req.user._id;

  Event.findById(eventid,async(err,foundevent)=>{
    
    await foundevent.register.push(register);
    await register.save()
    await foundevent.save()
    response.redirect(`/club/${clubname}`)
  })
  

})

app.get("/club/:clubname/:eventid",isLoggedIn,(req,res)=>{
  const {clubname,eventid}=req.params
  console.log("hiiii",req.params.eventid)
  Club.findOne({clubname: clubname},(err,found)=>{
    if(!err){
    Event.findById(req.params.eventid,(err,foundevent)=>{
      console.log(foundevent)
      res.render("event",{foundevent,found})
    })
  }

  })
  
 

})
app.get("/club/:clubname/:eventid/registered",isLoggedIn,isClubAuthor,(req,res)=>{
  Event.findById(req.params.eventid).populate('register').then(foundregister=>{  
 res.render('registered', {foundregister});
  })   
  
})


app.get("/login",(req,res)=>{
   
    res.render('login');
})
app.get("/signUp",(req,res)=>{
    
  
    res.render('signUp');
})


app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login' }));


 app.get("/eventcard",isLoggedIn,(req,res)=>{
   
    res.render('eventcard');
})
 

app.post("/signUp",(req,res)=>{
  if(req.body.password===req.body.confirm_password)
  {
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
    }
    else{    
      res.redirect("/signUp")
    }
  
})

app.get("/pre",(req,res)=>{
  res.render("preloader")
})
app.get("/paralax",(req,res)=>{
  res.render("paralax")
})
app.get("*",(req,res)=>{
  res.send("Page not found")
})

 app.listen(port,function(){
    console.log("Started")
    }
    )
