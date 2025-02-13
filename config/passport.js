const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/usermodel")
const env = require("dotenv").config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"/auth/google/callback",
    passReqToCallback: true, // Pass the request object to store session
},
async(req,accessToken,refreshToken,profile,done)=>{
    try {
        let user =await User.findOne({googleId:profile.id})
        if (!user) {
            user = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
            });
            await user.save();
          }
  
          // Store user details in session
          req.session.user = user;
  
          return done(null, user)
    } catch (err) {
        return done(err,null)
    }
}
));

passport.serializeUser((user,done)=>{
        done(null,user.id)
});
passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user =>{
        done(null,user)
    })
    .catch(err =>{
        done(err,null)
    })
})

module.exports = passport;