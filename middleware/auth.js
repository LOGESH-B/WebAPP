const Club = require("../modules/club");



module.exports.isAuthor = async (req, res, next) => {
    
    const admin="620f2281964cadf729be5283"
    if(!(admin==req.user._id))
    {
        return res.redirect("/") 
    }
    
    next();
}
module.exports.isClubAuthor=async(req, res, next) => {
    console.log("kii",req.params)
    var i=-1;
    const clubname=req.params.clubname;
    const found =await Club.findOne({clubname});
       
        const admin=found.author;
        for(let element of admin)
            {
            if(!(element==req.user.username) )
            {           
            i++;
            if(i==2){
                req.flash('error','Your have not have access to that page')
                return res.redirect("/")
            };           
            }  
     }
    next();
    
}

module.exports.isLoggedIn=async (req, res, next) => {
    if (!req.isAuthenticated()){
        console.log("i ammmmmmmm")
        req.flash('error','First LogIn to Access')
       return  res.redirect('/login')
      } 
    next();
}
