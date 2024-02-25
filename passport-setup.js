
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


passport.use(new GoogleStrategy({
  clientID: "insert here google client id",
  clientSecret: "insert here google client id",
  callbackURL: "http://localhost:3000/api/auth/google/callback"
},
function(accessToken, refreshToken, profile, done) {
  // use the profile info (mainly profile id) to check if the user is registered in your database
    return done(null, profile);
  }));
