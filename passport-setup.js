
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


passport.use(new GoogleStrategy({
  clientID: "288454897898-a2dej48iutcm4pn4heg9jr1grjeearok.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "http://localhost:3000/api/auth/google/callback"
},
function(accessToken, refreshToken, profile, done) {
  // הוסף את ה-ID של המשתמש לפרופיל
  profile.id = profile._json.sub.toString();

  // use the profile info (including the profile id) to check if the user is registered in your database
  return done(null, profile);
}));