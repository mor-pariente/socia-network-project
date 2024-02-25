
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


passport.use(new GoogleStrategy({
  clientID: "***REMOVED***",
  clientSecret: "***REMOVED***",
  callbackURL: "http://localhost:3000/api/auth/google/callback"
},
function(accessToken, refreshToken, profile, done) {
  profile.id = profile._json.sub.toString();

  // use the profile info (including the profile id) to check if the user is registered in your database
  return done(null, profile);
}));