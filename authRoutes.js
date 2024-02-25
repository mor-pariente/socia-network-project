const express = require("express");
const passport = require("passport");

const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/api/auth/google/callback", passport.authenticate("google", { failureRedirect: "/failed" }),
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
      } 
    }
    res.redirect("/good");
  });

  router.get('/logout', (req, res, next) => {
    req.logout((error) => {
        if (error) {return next(error)}
        res.redirect('/')
    })
  })
  
/* GET Home Page */

router.get('/home', isAuthenticated, function(req, res){

  res.render('home', { user: req.user });

});

module.exports = router;
