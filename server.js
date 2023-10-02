const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieSession = require("cookie-session");
const multer = require('multer');
const mongoUrl = 'mongodb+srv://mor2500:35fNUn8yoVJ6Ms2j@cluster0.cjgdldn.mongodb.net/';

const { MongoClient, ServerApiVersion, ObjectId, MongoCryptInvalidArgumentError } = require('mongodb');

require("./passport-setup");
app.use(cors());
app.use(express.static('public'))


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
 var result//
app.get("/api/auth/google/callback", passport.authenticate("google", { failureRedirect: "/failed" }),
  async function (req, res) {
    if (req.user) {
      const userEmail = req.user.emails[0].value;
      const userName = req.user.displayName;
      const googleId = req.user.id;
      const user = {
        name: userName,
        email: userEmail,
        googleId: googleId,
        pphId: "65192b86ba431960951abba9",//default picture
        cphId: null,

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

        // בדוק האם כבר קיים משתמש עם אותו googleId
        const existingUser = await db.collection('users').findOne({ googleId: googleId });
        
        if (!existingUser) {
          // משתמש חדש, נוסיף אותו למסד הנתונים
          result = await db.collection('users').insertOne(user);
          console.log(`Inserted user with ID: ${result.insertedId}`);
        }
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
  console.log(req.user.id);

  res.json({ userName }); // שליחת השם כתשובה בפורמט JSON
});

app.get("/api/getUserId", isLoggedIn, (req, res) => {
  const userId = req.user.id; // the google id
  console.log(userId);
  console.log(req.user.id);
  console.log('הצלחה');

  res.json({ userId }); // שליחת השם כתשובה בפורמט JSON
});

// הוספת המשתנה upload עם ההגדרות הרצויות
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload-profile-image', upload.single('image'), async (req, res) => {
  // קביעת האיידי של המשתמש מהסשן
  const userId = req.user.id;
  console.log(req.user.id);
  const client = new MongoClient(mongoUrl, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'לא נבחרה תמונה' });
    }
  
    console.log('נבחרה תמונה');
  
    await client.connect();
    const db = client.db('social');

    // בדוק האם קיים משתמש עם ה- userId
    const userCollection = db.collection('users');
    const existingUser = await userCollection.findOne({ googleId: userId });

    if (!existingUser) {
      return res.status(404).json({ message: 'המשתמש לא נמצא' });
    }
console.log('user found');
    // בדוק האם יש תמונה קיימת ב- pphId ומחק אותה
    const pphId = existingUser.pphId;
    console.log(pphId);
    if (pphId !== null) {
      const imagesCollection = db.collection('images');
      if (pphId != "65192b86ba431960951abba9"){
      await imagesCollection.deleteOne({ _id: (pphId) });
      }
    }

    // שמור את התמונה החדשה במסד הנתונים תחת אוסף שנקרא 'images'
    const image = req.file.buffer;
    const result = await db.collection('images').insertOne({ data: image });

    // עדכן את התמונת הפרופיל של המשתמש להיום
    await userCollection.updateOne(
      { googleId: userId },
      { $set: { pphId: result.insertedId.toString() } }
    );

    res.status(200).json({ message: 'התמונה עודכנה בהצלחה' });
 } catch (err) {
    console.error('שגיאה בעדכון התמונת הפרופיל:', err);
  }
   finally {
    await client.close();
  }
});







// פונקציה שמציאה IMAGEID לפי GOOGLEID
async function getImageIdByGoogleId(googleId) {
  let client; // הגדרת משתנה client

  try {
    // התחבר למסד הנתונים
    const client = new MongoClient(mongoUrl, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    const db = client.db('social');

    // מחפשים את המשתמש במסד הנתונים לפי ה-GOOGLEID
    const user = await db.collection('users').findOne({ googleId });

    // אם לא נמצא משתמש עם ה-GOOGLEID, מחזירים ערך ריק
    if (!user) {
      return null;
    }

    // אם נמצא משתמש עם ה-GOOGLEID, מחזירים את IMAGEID שלו
    return user.pphId.toString(); // זה משתמש בשמות השדות מהסכמה שהגדרת במודל שלך
  } catch (error) {
    console.error('שגיאה בשליפת IMAGEID:', error);
    return null;
  } finally {
    // תבצע פריסת התחברות ממסד הנתונים בסיום הפונקציה
    if (client) {
      client.close();
    }
  }
};



async function getImageFromDatabase(imageId) {
  let client; // הגדרת משתנה client
  
  try {
    // התחבר למסד הנתונים
    const client = new MongoClient(mongoUrl, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    const db = client.db('social');
    // מחפשים את התמונה במסד הנתונים לפי ה-imageID
    const image = await db.collection('images').findOne({ _id: new ObjectId(imageId) });

    // אם לא נמצא משתמש עם ה-GOOGLEID, מחזירים ערך ריק
    if (!image) {
      return null;
    }
    console.log('image id',image._id);

    const imageBuffer = Buffer.from(image.data.toString(), 'base64'); // המרת התמונה ל Buffer
console.log(imageBuffer.length);
    return imageBuffer;
    //RETURNING PICTUR IN Buffer
  } catch (error) {
    console.error('שגיאה בשליפת תמונה:', error);
    return null;
  }
  finally {
    // תבצע פריסת התחברות ממסד הנתונים בסיום הפונקציה
    if (client) {
      client.close();
    }
}};








app.get('/getProImgdByUserId', async (req, res) => {
  // השג את ה- userId מהבקשה
  const userId = req.query.userId;

  try {
    // השג את ה-imageId לפי ה-GoogleId
    const imageId = await getImageIdByGoogleId(userId);
    console.log(userId);

    console.log(imageId);
    console.log(userId);


    if (!imageId) {
      res.status(404).json({ message: 'למשתמש אין תמונת פרופיל' });
      return;
    }

    // השג את התמונה ממסד הנתונים לפי ה-imageId
    console.log(imageId.toString());

    const imageBuffer = await getImageFromDatabase(imageId.toString());
    console.log('image buffer',imageBuffer);

    if (!imageBuffer) {
      res.status(404).json({ message: 'התמונה לא נמצאה' });
      return;
    }

    // שלח את התמונה כתשובה
    res.setHeader('Content-Type', 'image/jpeg'); // הגדר את סוג התוכן של התמונה (בדוגמה זו, JPEG)
    console.log('image buffer',imageBuffer);

    res.end(imageBuffer);

return;

  } catch (error) {
    console.error('שגיאה בשליפת תמונה:', error);
    res.status(500).json({ message: 'שגיאה בשליפת התמונה' });
  }
});












app.listen(3000, () => console.log("newApp is listening on port 3000!"));







