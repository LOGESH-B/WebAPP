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
const Token = require("./modules/token");
const Register=require("./modules/register")
const path=require("path")
const flash = require('connect-flash');
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const bcrypt = require("bcrypt"); 
const crypto = require("crypto");

const {isAuthor,isLoggedIn,isClubAuthor} = require("./middleware/auth");


const sendEmail=require("./public/js/mail.js")

const multer = require('multer');
const { storage } = require('./clodinary');
const upload = multer({ storage });



const session = require('express-session')
const passport = require("passport");
const localStrategy=require("passport-local")

const req = require('express/lib/request');
const { cookie, redirect } = require('express/lib/response');
 

const app = express()
app.use(express.static(path.join(__dirname,"/public")))
//app.use(express.static(__dirname+"/public"));



app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
    cookie:{
      expires: Date.now()+1000*60*60*24*7,
      maxAge:1000*60*60*24*7
    }
  }));
  app.use(flash());
 
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(methodOverride('_method'))
  app.engine('ejs',ejsMate)

 // mongodb+srv://logesh:logeshb.20it@cluster0.e7qad.mongodb.net/userDB?retryWrites=true&w=majority

   //mongoose.connect("mongodb://localhost:27017/userDB");
 // mongoose.connect("mongodb+srv://logesh:logeshb.20it@cluster0.e7qad.mongodb.net/userDB");

//  mongoose.connect("mongodb+srv://logesh:logeshb.20it@cluster0.e7qad.mongodb.net/userDB");



  
  mongoose.connect("mongodb+srv://logesh:logeshb.20it@cluster0.e7qad.mongodb.net/userDB?retryWrites=true&w=majority");



passport.use(new localStrategy(User.authenticate()));
  passport.use(User.createStrategy());

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    app.use(async(req,res,next)=>{
      res.locals.currentUser=req.user;
      const clubs=await Club.find({})
      res.locals.club=clubs;
      res.locals.success=req.flash('success');
      res.locals.error=req.flash('error');
      
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
     req.flash("success",'Successfully Logged Out')
     res.redirect("/login");
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
  club.author=authors;
  club.images=req.files.map(f => ({ url: f.path, filename: f.filename }));
  console.log("looo",club.images)
  await club.save();
  req.flash('success','Club Created Successfully!')
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
       req.flash('success','Event Created Successfully');
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
      req.flash('success','Event Edited Successfully');
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
      req.flash('success','Event Deleted Successfully');
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
    req.flash('success','Registered Successfully');
    response.redirect(`/club/${clubname}`)
  })
  

})

app.get("/club/:clubname/:eventid",isLoggedIn,(req,res)=>{
  const {clubname,eventid}=req.params
  console.log("hiiii",req.params.eventid)
  Club.findOne({clubname: clubname},(err,found)=>{
    if(!err){
     Event.findById(req.params.eventid).populate('register').then(foundevent=>{
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
  passport.authenticate('local', { failureFlash: true,failureRedirect: '/login' }),(req,res)=>{
    req.flash('success','Successfully Logged In!');
    res.redirect('/');
  });


 app.get("/eventcard",isLoggedIn,(req,res)=>{
   
    res.render('eventcard');
})
 
require("./public/js/passport")(passport);

app.post("/signUp",async(req,res)=>{
  if(req.body.password===req.body.confirm_password)
  {
    
      bcrypt.genSalt(Number(process.env.SALT), async (err, salt)=> {
        if(err){req.flash('error',err.message)}  
        bcrypt.hash(req.body.password, salt, async (err, hash)=> {
          try {
            const user=await new User(req.body);
            user.password=hash;
            await user.save();  
            passport.authenticate("local")(req, res, function(){
              res.redirect("/");
            }); 
          }
          catch (error) {
            console.log(error);
            if(error.code==11000){
              req.flash('error',"Roll Number/Mail ID Already Exits");
              res.redirect("/signUp");
            }
            else{
              req.flash('error',error.message);
            res.redirect("/signUp");
            }
          }
         
          // Store hash in database here
        });
      });
   console.log(req.body.password)
   
    // User.register({username: req.body.username,name: req.body.name,rollno: req.body.rollno,department: req.body.department}, req.body.password, function(err, user){
    //     if (err) {
    //       console.log(err);
    //       if(err.code==11000){
    //         req.flash('error',"Roll Number Already Exits");
    //         res.redirect("/signUp");
    //       }
    //       else{
    //         req.flash('error',err.message);
    //       res.redirect("/signUp");
    //       }
          
    //     } else {
    //       passport.authenticate("local")(req, res, function(){
    //         res.redirect("/");
    //       });
    //     }
    //   });
    }
    else{    
      req.flash('error','Password and confirm Password Not Match!');
      res.redirect("/signUp")
    }
  
})

app.get("/forgotten-password",(req,res)=>{
  res.render("reset")
})
app.get("/forgotten-password/:userId/:token",(req,res)=>{
  const {userId,token}=req.params;
  res.render("change_password",{userId,token})
})

app.post("/forgotten-password", async (req, res) => {
  
  try {
      const schema = Joi.object({ email: Joi.string().email().required() });
      const { error } = schema.validate(req.body);
      if (error) return res.status(400).send(error.details[0].message);
      const user = await User.findOne({ username: req.body.email });
      if (!user)
          return res.status(400).send(  
            req.flash('error',"User With Given Email Doesn't Exist"),
          res.redirect('/forgotten-password'));
      let token = await Token.findOne({ userId: user._id });
      if (!token) {
          token = await new Token({
              userId: user._id,
              token: crypto.randomBytes(32).toString("hex"),
          }).save();
      }
      const link = `http://localhost:3000/forgotten-password/${user._id}/${token.token}`;
      await sendEmail.sendEmail(user.username, "Oru Password Niyabagam vechika mudiyala ni lam yethu valthukittu....savula sethapayale", link);

      res.send(
        req.flash('success',"Password Reset Link Sent To Your Email Account"),
      res.redirect('/login')
      );
  } catch (error) {
      res.send(error);
      console.log(error);
  }
 
});


app.post("/forgotten-password/:userId/:token", async (req, res) => {
  if(req.body.password===req.body.confirm_password)
  {
  try {
    

    const user = await User.findOne({ _id: req.params.userId });
    if (!user) return res.status(400).send(
      req.flash('error',"Invalid Link"),
      res.redirect('/login')
    )
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send( 
      req.flash('error',"Invalid Link"),
    res.redirect('/login')
    );
    if (!user.verified) user.verified = true;

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    
    user.password=hashPassword;
    
    await user.save();
    await token.remove();
    res.status(200).send(
      req.flash('success',"Password Reset successfully"),
    res.redirect('/login'));
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
}
else{    
  req.flash('error','Password and confirm Password Not Match!');
  res.redirect(`/forgotten-password/${req.params.userId}/${req.params.token}`)
}

});






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
