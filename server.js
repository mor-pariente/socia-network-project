const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieSession = require("cookie-session");
const { MongoClient, ServerApiVersion } = require('mongodb');

require("./passport-setup");
app.use(cors());
app.use(express.static('public'))

const mongoUrl = '***REMOVED***';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieSession({
  name: "tuto-session",
  keys: ["key1", "key2"]
}));

const isLoggedIn = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
}

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.get("/failed", (req, res) =>   res.redirect("/")
);

app.get("/good", isLoggedIn, (req, res) => {
 const userEmail = req.user.emails[0].value;
 const userName = req.user.displayName;

 res.redirect("/home");// לרנדר את דף הבית + התנתקות 

});


app.get("/profile", (req, res) => {
  if (req.user) {
    // משתמש מחובר, מאשר גישה לדף הבית
    res.sendFile(__dirname + "/public/profile.html");
  } else {
    // משתמש לא מחובר, מחזיר מענה או מעביר אותו לדף התחברות
    res.sendStatus(401); 
  }
});

app.get("/home", (req, res) => {
  if (req.user) {
    // משתמש מחובר, מאשר גישה לדף הבית
    res.sendFile(__dirname + "/public/home.html");
  } else {
    // משתמש לא מחובר, מחזיר מענה או מעביר אותו לדף התחברות
    res.sendStatus(401); 
  }
});

app.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/api/auth/google/callback", passport.authenticate("google", { failureRedirect: "/failed" }),
  async function (req, res) {
    if (req.user) {
      const userEmail = req.user.emails[0].value;
      const userName = req.user.displayName;
      const user = {
        name: userName,
        email: userEmail,
      };
      
      const client = new MongoClient(mongoUrl, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });

      try {
        await client.connect();
        await client.db("social").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const db = client.db('social');
        const result = await db.collection('users').insertOne(user);
        console.log(`Inserted user with ID: ${result.insertedId}`);
      } catch (err) {
        console.error("Error inserting user into MongoDB:", err);
      } finally {
        await client.close();
      }
    }
    res.redirect("/good");
    
  });

app.get("/logout", (req, res) => {
  req.session = null;
  req.logout();
  res.redirect("/");
  
});


app.get("/api/getUserName", isLoggedIn, (req, res) => {
  const userName = req.user.displayName; // שם המשתמש של המשתמש המחובר
  console.log(userName);
  res.json({ userName }); // שליחת השם כתשובה בפורמט JSON
});


app.listen(3000, () => console.log("newApp is listening on port 3000!"));
