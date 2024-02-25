const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require('express-session');
const bcrypt = require('bcrypt');
ongoose = require("mongoose");

const cookieSession = require("cookie-session");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const UserModel = require("./models/userModel");
const GroupModel = require("./models/groupModel");
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const PostModel = require("./models/postModel");

app.use(cors());
app.use(express.static('public'));

app.use('/views', express.static(path.join(__dirname, 'views')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/controller', express.static(path.join(__dirname, 'controller')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieSession({
  name: "tuto-session",
  keys: ["key1", "key2"]
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport setup
require("./passport-setup");

// Define the images directory
const imagesDirectory = path.join(__dirname, 'images');

// Middleware for checking if the user is authenticated and retrieving user details
const isLoggedIn = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }

  const googleId = req.user.id;
  try {
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ googleId: googleId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Attach user details to the request object
    req.userDetails = user;

    next();
  } catch (error) {
    console.error('Error retrieving user details:', error);
    res.status(500).json({ message: 'Error retrieving user details' });
  }
};


// Middleware for checking if the user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
};



// Connect to MongoDB and ping
class MongoDBClient {
  static client = null;

  static async getClient() {
    if (!MongoDBClient.client) {
      await MongoDBClient.connectToMongoDB();
    }
    return MongoDBClient.client;
  }

  static async connectToMongoDB() {
    const mongoUrl = '***REMOVED***';
    const mongoClientOptions = {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    };
    MongoDBClient.client = new MongoClient(mongoUrl, mongoClientOptions);
    try {
      await MongoDBClient.client.connect();
      console.log("Successfully connected to MongoDB");
    } catch (err) {
      console.error("Error connecting to MongoDB:", err);
      throw err; // Rethrow the error to be handled where getClient is called
    }
  }
}


// Helper function to get profile or cover image name by userId
async function getImageNameById(Id, fieldName) {
  let client;
  try {
    client = await MongoDBClient.getClient();
    const db = client.db('social');
    const user = await db.collection('users').findOne({ _id: ObjectId(Id) });
    if (!user) {
      return null;
    }
    return user[fieldName] ? user[fieldName].toString() : null;
  } catch (error) {
    console.error(`Error getting ${fieldName} for Id ${Id}:`, error);
    return null;
  } 
}

// Define storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/'); // Define the directory where files will be stored
  },
  filename: (req, file, cb) => {
    const uniqueFileName = Date.now() + '-' + file.originalname;
    req.uniqueFileName = uniqueFileName;
    cb(null, uniqueFileName);
  }
});

// Create multer instance with defined storage
const upload = multer({ storage: storage });

// Get image by image name
app.get('/getImage', async (req, res) => {
  let imageName = req.query.imageName;
  if (imageName == 'null'|| imageName == 'undefined') {
    imageName = 'blank-profile-picture-973460_960_720.png'
  };
  
  const imagePath = path.join(__dirname, 'images', imageName);
  const imageBuffer = fs.readFileSync(imagePath);
  res.json({ image: imageBuffer.toString('base64') });
  
});

// Get profile image by user ID
app.get('/getProfileImageByUserId', async (req, res) => {
  const userId = req.query.userId;


  try {
    imageName = await getImageNameById(userId, 'pphId');

    if (!imageName|| imageName == null) {
      imageName = 'blank-profile-picture-973460_960_720.png'
    }
    const imagePath = path.join(__dirname, 'images', imageName);
    const imageBuffer = fs.readFileSync(imagePath);
    res.json({ image: imageBuffer.toString('base64') });
  } catch (error) {
    console.error('Error getting profile image:', error);
    res.status(500).send('Error getting profile image');
  }
});

// Get cover image by user ID
app.get('/getCoverImageByUserId', async (req, res) => {
  const userId = req.query.userId;
  try {
    imageName = await getImageNameById(userId, 'cphId');
    if (!imageName) {
      imageName = 'blank-profile-picture-973460_960_720.png'
    }
    const imagePath = path.join(__dirname, 'images', imageName);
    const imageBuffer = fs.readFileSync(imagePath);
    res.json({ image: imageBuffer.toString('base64') });
  } catch (error) {
    console.error('Error getting cover image:', error);
    res.status(500).send('Error getting cover image');
  }
});

// Authentication routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/login.html");
});

app.get("/failed", (req, res) => res.redirect("/"));

app.get("/good", isLoggedIn, (req, res) => {
  const userEmail = req.user.emails[0].value;
  const userName = req.user.displayName;
  res.redirect("/home");
});

app.get("/profile", ensureAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/views/profile.html");
});

app.get("/group", ensureAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/views/groupPage.html");
});

app.get("/home", ensureAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/views/home.html");
});

app.get("/group-form", ensureAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/views/groupForm.html");
});
app.get("/statistics", ensureAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/views/statistics.html");
});
app.get("/plantStore", ensureAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/views/plantStore.html");
});
app.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/api/auth/google/callback", passport.authenticate("google", { failureRedirect: "/failed" }), async (req, res) => {
  if (req.user) {
    const userEmail = req.user.emails[0].value;
    const userName = req.user.displayName;
    const googleId = req.user.id;
    const user = new UserModel({
      name: userName,
      email: userEmail,
      googleId: googleId,
      pphId: null,
      cphId: null,
    });
    try {
      const client = await MongoDBClient.getClient();
      const db = client.db('social');
      const existingUser = await db.collection('users').findOne({ googleId: googleId });
      if (!existingUser) {
        const result = await db.collection('users').insertOne(user);
        console.log(`Inserted user with ID: ${result.insertedId}`);
      }
    } catch (err) {
      console.error("Error inserting user into MongoDB:", err);
    }
  }
  res.redirect("/good");
});

app.get("/logout", (req, res) => {
  req.session = null;
  req.logout();
  res.redirect("/");
});

app.get("/api/getUser", isLoggedIn, async (req, res) => {
  const userId = req.query.userId;
  const client = await MongoDBClient.getClient();
  const db = client.db('social');
  const existingUser = await db.collection('users').findOne({ _id: ObjectId(userId) });

  if (existingUser) {
    res.json({ user: existingUser });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.get("/api/getGroup", ensureAuthenticated, async (req, res) => {
  const groupId = req.query.groupId;
  const userId= req.query.userId;
  if(IsUserParticipantInGroup(userId,groupId))
  {
  const client = await MongoDBClient.getClient();
  const db = client.db('social');
  const existingGroup = await db.collection('groups').findOne({ _id: ObjectId(groupId) });

  res.json({ group: existingGroup });
  }
  else{
    res.status(404).json({ message: 'not found' });
  }
});

// Route to get the user ID of the connected user
app.get("/api/getUserId", isLoggedIn, async (req, res) => {
  try {
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const existingUser = await db.collection('users').findOne({ googleId: req.user.id });
    
    if (existingUser) {
      res.json({ userId: existingUser._id.toString() });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get("/api/getConnectedUserName", isLoggedIn, async (req, res) => {
  try {
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const existingUser = await db.collection('users').findOne({ googleId: req.user.id });

    if (existingUser) {
      res.json({ userName: existingUser.name });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error getting connected user\'s name:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.post('/upload-profile-image', isLoggedIn, upload.single('image'), async (req, res) => {
  const userId = req.user.id;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image selected' });
    }
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const userCollection = db.collection('users');
    const existingUser = await userCollection.findOne({ googleId: userId });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const pphId = existingUser.pphId;
    if (pphId !== null) {
      const imagePath = path.join(imagesDirectory, pphId);
      try {
        await fs.promises.unlink(imagePath);
        console.log(`Image ${pphId} deleted successfully from "images" directory.`);
      } catch (error) {
        console.error(`Error deleting image ${pphId}:`, error);
      }
    }
    await userCollection.updateOne(
      { googleId: userId },
      { $set: { pphId: req.file.filename }}
    );
    res.status(200).json({ message: 'Profile image updated successfully' });
  } catch (err) {
    console.error('Error updating profile image:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/api/user-post-count', isLoggedIn, async (req, res) => {
  try {
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const postsCollection = db.collection('posts');

    const aggregation = [
      {
        $group: {
          _id: "$user", 
          postCount: { $sum: 1 } 
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id", 
          foreignField: "_id", 
          as: "userInfo" 
        }
      },
      {
        $unwind: "$userInfo" 
      },
      {
        $project: {
          _id: 1, 
          postCount: 1, 
          userName: "$userInfo.name" 
        }
      }
    ];

    const results = await postsCollection.aggregate(aggregation).toArray();
    console.log(results);
    res.json(results);
  } catch (error) {
    console.error('Error in aggregation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//auto posting a new plant to plantStore facebook group 
const fetch = require('node-fetch');

async function postToFacebookPage(message) {
  const pageId = '227505463783772';
  const accessToken = '***REMOVED***'; // החלף באסימון גישה של הדף

  const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
  const params = {
    message,
    access_token: accessToken,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    console.log(data); 
  } catch (error) {
    console.error('Error posting to Facebook Page:', error);
  }
}


// Route to upload multiple files with post content
app.post('/upload', isLoggedIn, upload.array('fileInput', 5), async (req, res) => {
  const originType = req.body.originType; // 'homepage' or 'group' or 'plant'

  if (!req.body.postContent && req.files.length === 0 && originType != 'plant') {
      res.status(400).send('WRITE SOMETHING!');
      return;
  } else if (req.files.length > 5) {
      res.status(400).send('MAX 5 FILES');
      return;
  }

  const postContent = req.body.postContent;
  const fileNames = req.files.map(file => file.filename);
  const groupId = req.body.groupId; // can be undefined if originType is 'homepage' or 'plant'
  // Validate originType
  if (!['homepage', 'group', 'plant'].includes(originType)) {
      res.status(400).send('Invalid origin type.');
      return;
  }

  // If originType is 'group', validate groupId
  if (originType === 'group' && !groupId) {
      res.status(400).send('Group ID is required for group posts.');
      return;
  }

  try {
      const client = await MongoDBClient.getClient();
      const db = client.db('social');
      const postCollection = db.collection('posts');
      const existingUser = await db.collection('users').findOne({ googleId: req.user.id });

      // Create a new post object
      const newPost = new PostModel({
          user: existingUser._id,
          content: postContent,
          media: fileNames,
          originType: originType,
      });

      // Add plantDetails to the post if it's a plant post
  if (originType === 'plant') {
    try {
        const plantDetails = JSON.parse(req.body.plantDetails); 
        newPost.plantDetails = plantDetails;
        const plantName= plantDetails.plantName;
        const message = `New ${plantName}plant in store! come check it out! `; 
    postToFacebookPage(message);
    } catch (err) {
        res.status(400).send('Invalid plant details format');
        return;
    }
}
      // Add groupId to the post if it's a group post
      if (originType === 'group') {
          newPost.groupId = groupId;
      }
      try {
        let location;
        if (req.body.location) {
            try {
                location = JSON.parse(req.body.location);
            } catch (err) {
                res.status(400).send('Invalid location format');
                return;
            }
        }
        if (location) {
          newPost.location = location;
      }
    } catch (err) {
  }
      // Insert the new post into the collection
      await postCollection.insertOne(newPost);

      res.status(200).json({ message: 'Post uploaded successfully' });
  } catch (err) {
      console.error('Error uploading post:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});




app.post('/upload-cover-image', isLoggedIn, upload.single('image'), async (req, res) => {
  const userId = req.user.id;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image selected' });
    }
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const userCollection = db.collection('users');
    const existingUser = await userCollection.findOne({ googleId: userId });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const cphId = existingUser.cphId;
    if (cphId !== null) {
      const imagePath = path.join(imagesDirectory, cphId);
      try {
        await fs.promises.unlink(imagePath);
        console.log(`Image ${cphId} deleted successfully from "images" directory.`);
      } catch (error) {
        console.error(`Error deleting image ${cphId}:`, error);
      }
    }
    await userCollection.updateOne(
      { googleId: userId },
      { $set: { cphId: req.file.filename }}
    );
    res.status(200).json({ message: 'Cover image updated successfully' });
  } catch (err) {
    console.error('Error updating cover image:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.get('/get-posts', isLoggedIn, async (req, res) => {
  const skip = parseInt(req.query.skip || 0);
  const limit = parseInt(req.query.limit || 10);
  const originType = req.query.originType; // 'homepage' or 'group' or 'profile' or 'plant'
  const groupId = req.query.groupId; 
  const connectedUserId = req.query.connectedUserId; 
  const profileId = req.query.profileId;
  try {
      const client = await MongoDBClient.getClient();
      const db = client.db('social');
      const query = {};

      if (originType === 'homepage' && connectedUserId) {
          const user = await db.collection('users').findOne({ _id: new ObjectId(connectedUserId) });
          if (!user) {
              return res.status(404).json({ message:'user not found' });
          }
          const friendsIds = user.friends ? user.friends.map(id => new ObjectId(id)) : [];
          query.user = { $in: [new ObjectId(connectedUserId), ...friendsIds] };
          query.groupId = { $exists: false }; 
          query.originType = { $in: ['homepage', 'profile'] };      }

      else if (originType === 'profile' && profileId) {
       
          query.user = { $in: [new ObjectId(profileId)] };
          
          query.groupId = { $exists: false }; 
          query.originType = { $in: ['homepage', 'profile'] };
    }
    
      else if (originType === 'group' && groupId) {
          query.groupId = new ObjectId (groupId);
      }
      else if (originType === 'plant') {
        query.originType = 'plant';
                }

      const cursor = db.collection('posts').find(query)
          .sort({ created: (1)})
          .skip(skip)
          .limit(limit);

      const posts = await cursor.toArray();
      console.log(posts);
      await Promise.all(posts.map(async (post) => {
          const postUser = await db.collection('users').findOne({ _id: post.user });
          

          if (postUser) {
              post.user = postUser;
              if(!postUser.pphId){
                postUser.pphId='blank-profile-picture-973460_960_720.png'
              }
             
                const profilePicPath = path.join(imagesDirectory, postUser.pphId);
                const profilePic = fs.readFileSync(profilePicPath);
                post.user.profilePicBase64 = profilePic.toString('base64');

            
          }

          post.mediaBase64 = [];
          for (const mediaFileName of post.media) {
              const imagePath = path.join(imagesDirectory, mediaFileName);
              const image = fs.readFileSync(imagePath);
              const base64Data = image.toString('base64');
              post.mediaBase64.push(base64Data);
          }
      }));

      res.status(200).json({ posts });
  } catch (err) {
      console.error('שגיאה בשליפת הפוסטים:', err);
      res.status(500).json({ message: 'שגיאה בשליפת הפוסטים' });
  }
});




app.get('/search', async (req, res) => {
  const { name } = req.query; // משיכת השם מהבקשה

  try {
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const userCollection = db.collection('users');
    const users = await userCollection.find({ name: { $regex: name, $options: 'i' } }).toArray();
    res.json({ users }); 
  } catch (error) {
    console.error('שגיאה בחיפוש המשתמשים:', error);
    res.status(500).json({ message: 'שגיאה בחיפוש המשתמשים' });
  }
});



app.get('/user-profile', (req, res) => {
  const userId = req.params.userId;


  fs.readFile(path.join(__dirname, '/views/user-profile.html'), 'utf8', (err, html) => {
    if (err) {
        res.status(500).send('Internal Server Error');
        return;
    }

    const updatedHtml = html.replace('{{user_id}}', userId);

    res.render(updatedHtml);
});
});
app.get("/profile-page", (req, res) => {
  if (req.user) {

    res.sendFile(path.join(__dirname + "/views/user-profile.html"));
  } else {
    res.sendStatus(401);
  }
});




app.post('/add-comment', async (req, res) => {
  try {
    const postId = req.body.postId;
    const content = req.body.content;
    const userId = req.body.userId;
    const userName = req.body.userName;


    client = await MongoDBClient.getClient();
    const db = client.db('social');
    const postsCollection = db.collection('posts');
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }

    const newComment = {
      user: userId,
      userName: userName,

      content: content,
      created: new Date()
    };

    
    if (!post.comments) {
      post.comments = []; 
    }
    
post.comments.push(newComment);

    await postsCollection.updateOne({ _id: post._id }, { $set: { comments: post.comments } });


    return res.status(201).json(newComment);
  } catch (error) {
    console.error(' error saving comment :', error);
    return res.status(500).json({ message: 'error saving comment  ' });
  }
});










app.post('/add-like', async (req, res) => {
  try {
    const postId = req.body.postId;
    const userId = req.body.userId;
    const userName = req.body.userName;


    client = await MongoDBClient.getClient();
    const db = client.db('social');
    const postsCollection = db.collection('posts');
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).json({ message: 'post not found  ' });
    }

    const newLike = {
      user: userId,
      userName: userName,
    };

    

    if (!post.likes) {
      post.likes = []; 
    }
    
   
post.likes.push(newLike);

    await postsCollection.updateOne({ _id: post._id }, { $set: { likes: post.likes } });


    return res.status(201).json(newLike);
  } catch (error) {
    console.error('שגיאה בשמירת התגובה:', error);
    return res.status(500).json({ message: 'שגיאה בשמירת התגובה' });
  }
});







app.post('/remove-like', async (req, res) => {
  try {
    const postId = req.body.postId;
    const userId = req.body.userId;

    client = await MongoDBClient.getClient();
    const db = client.db('social');
    const postsCollection = db.collection('posts');
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }

    // בודק אם המשתמש מחובר כבר או לא
    const userLiked = post.likes.some(like => like.user === userId);

    if (!userLiked) {
      return res.status(400).json({ message: 'המשתמש לא לייק את הפוסט' });
    }

    // מצא את הלייק שמשוייך למשתמש והסר אותו ממערך הלייקים
    post.likes = post.likes.filter(like => like.user !== userId);

    // עדכן את הפוסט במסד הנתונים
    await postsCollection.updateOne({ _id: post._id }, { $set: { likes: post.likes } });


    return res.status(200).json({ message: 'like removed' });
  } catch (error) {
    console.error('error removing like:', error);
    return res.status(500).json({ message: 'error removing like  ' });
  }
});




async function findPostInDatabase(postId) {
  let client;
  try {
    client = await MongoDBClient.getClient();
    const db = client.db('social');
    const postsCollection = db.collection('posts');
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    return post;
  } catch (error) {
    console.error('Error finding post in the database:', error);
    return null;
  } finally {
    if (client) {
    }
  }
}

// Function to save/update a post in the database
async function savePostInDatabase(post) {
  let client;
  try {
    client = await MongoDBClient.getClient();
    const db = client.db('social');
    const postsCollection = db.collection('posts');
    await postsCollection.updateOne(
      { _id: post._id },
      { $set: post }
    );
  } catch (error) {
    console.error('Error saving post in the database:', error);
  } 
}










app.post('/create-group', async (req, res) => {
  try {
    const groupName = req.body.groupName;
    const adminUserId = req.body.adminUserId;
    const adminUsername = req.body.adminUsername;
    const adminPassword = req.body.adminPassword;
    const participants = req.body.participants;

    const saltRounds = 10;
    const encryptedPassword = await bcrypt.hash(adminPassword, saltRounds);

   
   
    client = await MongoDBClient.getClient();
    const db = client.db('social');
    const groupCollection = db.collection('groups');

    const group = new GroupModel({
      admin: adminUserId,
      adminLogInData: { username: adminUsername, password: encryptedPassword },
      participants: [
        { userid: adminUserId },
        ...participants.map(participant => ({ userid: participant }))//////
      ],      groupName: groupName,
    });

    await groupCollection.insertOne(group);


    res.redirect("/home");

   // return res.status(201).json(group);

  } catch (error) {
    return res.status(500).json({ message: 'error creating group' });
  }
});



app.get("/getMyGroups", async (req, res) => {
  const userId = req.query.userId;
 
  try {
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const groupCollection = db.collection('groups');

    const groups = await groupCollection.find({ "participants.userid": new ObjectId(userId) }).toArray();
    const groupData = groups.map(group => ({ _id: group._id, groupName: group.groupName, coverPhoto: group.coverPhoto }));





    res.json(groupData);
  } catch (err) {
    res.json(null);

  }
});
app.get('/getGroupMembers/:groupId', async (req, res) => {
  try {
    const client = await MongoDBClient.getClient();

    const db = client.db('social');
    const groupCollection = db.collection('groups');
    const groupId = req.params.groupId;

    const group = await groupCollection.findOne({ _id: new ObjectId(groupId) });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const userIds = group.participants.map(participant => participant.userid);

    const usersCollection = db.collection('users');

    const members = await usersCollection.find({ _id: { $in: userIds } }).toArray();

    return res.status(200).json({ members });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/removeMember',isManager, async (req, res) => {
  const memberId = req.query.memberId;
  const groupId = req.query.groupId;

  try {
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const groupCollection = db.collection('groups');

    // חיפוש לפי המזהה של הקבוצה
    const groupObjectId = new ObjectId(groupId);
    const group = await groupCollection.findOne({ _id: groupObjectId });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    const adminId = group.admin.toString();
    if (memberId === adminId) {
      return res.status(400).json({ error: 'Cannot remove the admin user' });
    }
    const indexToRemove = group.participants.findIndex(participant => participant.userid.toString() === memberId);
    if (indexToRemove !== -1) {
      group.participants.splice(indexToRemove, 1);
    } else {
      return res.status(404).json({ error: 'Member not found in the group' });
    }

    // שמור את השינויים במסד הנתונים
    await groupCollection.updateOne({ _id: groupObjectId }, { $set: { participants: group.participants } });

    return res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.post('/add-members',isManager, async (req, res) => {
  try {
    const groupId = req.body.groupId;
    const participants = req.body.participants;


    client = await MongoDBClient.getClient();
   const db = client.db('social');
    const groupCollection = db.collection('groups');
    const groupObjectId = new ObjectId(groupId);
    const group = await groupCollection.findOne({ _id: groupObjectId });
    const formattedParticipants = participants.map(participant => ({ userid: new ObjectId(participant) }));

    await groupCollection.updateOne({ _id: groupObjectId }, { $push: { participants: { $each: formattedParticipants } } });

  } catch (error) {
    return res.status(500).json({ message: 'error creating group' });
  }
});


app.delete('/group/:groupId', isManager, async (req, res) => {
  try {
    
    const groupId = req.params.groupId;
    client = await MongoDBClient.getClient();
    const db = client.db('social');
     const groupCollection = db.collection('groups');
     const groupObjectId = new ObjectId(groupId);
console.log('the group id is ', groupObjectId);

    await groupCollection.deleteOne({ _id: groupObjectId });
    res.send('Group deleted successfully');
  } catch (error) {
    res.status(500).send('Error deleting group');
  }
});



async function IsUserParticipantInGroup(userId, groupId) {
  let client ;
  try {
    client = await MongoDBClient.getClient();
    const db = client.db('social');
    const groupCollection = db.collection('groups');

    const groupObjectId = new ObjectId(groupId);

    const group = await groupCollection.findOne({ _id: groupObjectId, participants: userId });

    return !!group; 
  } catch (error) {
    console.error(error);
    return false; 
  } 
}

app.post('/api/addFriend', isLoggedIn, async (req, res) => {
  const { friendId, userId } = req.body;
  let client;

  try {
      client = await MongoDBClient.getClient();
      const db = client.db('social');
      const usersCollection = db.collection('users');
      
      // Fetch both users to check their current friend and friend request status
      const requestingUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
      const receivingUser = await usersCollection.findOne({ _id: new ObjectId(friendId) });

      // Check if they are already friends
      if (requestingUser.friends.includes(new ObjectId(friendId)) || receivingUser.friends.includes(new ObjectId(userId))) {
          return res.status(400).json({ message: 'Users are already friends.' });
      }

      // Check if a friend request has already been sent
      if (requestingUser.friendRequests.includes(new ObjectId(friendId)) || receivingUser.friendRequests.includes(new ObjectId(userId))) {
          return res.status(400).json({ message: 'Friend request already sent.' });
      }

      // Add a friend request to the 'friendRequests' array of the user receiving the request
      await usersCollection.updateOne(
          { _id: new ObjectId(friendId) },
          { $addToSet: { friendRequests: new ObjectId(userId) } }
      );

      res.status(200).json({ message: 'Friend request sent successfully.' });
  } catch (error) {
      console.error('Error sending friend request:', error);
      res.status(500).json({ message: 'Error sending friend request.', error });
  } 
});


app.get('/getFriendsReq/:userId', async (req, res) => {
  let client; // Declare client variable outside the try block

  try {
      const client = await MongoDBClient.getClient();
      const db = client.db('social');
      const usersCollection = db.collection('users');
      const userId = req.params.userId;

      // Find the user by their ID
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Assuming the friend requests are stored as an array of ObjectIds in the 'friendRequests' field
      const friendRequestIds = user.friendRequests;
      // Fetch details of each user who sent a friend request
      const friendRequestDetails = await Promise.all(
          friendRequestIds.map(async (friendId) => {
              const friendUser = await usersCollection.findOne({ _id: friendId });
              return {
                  id: friendId,
                  name: friendUser.name // Adjust according to your user document structure
                  // Add more details as needed
              };
          })
      );

      res.json({ friendRequests: friendRequestDetails });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  } 
});



app.post('/api/confirmFriendRequest', isLoggedIn, async (req, res) => {
  const { requesterId, acceptorId } = req.body;
  let client;

  try {
      client = await MongoDBClient.getClient();
      const db = client.db('social');
      const usersCollection = db.collection('users');

      // Add each other to their respective friends arrays
      await usersCollection.updateOne({ _id: new ObjectId(requesterId) }, { $addToSet: { friends: new ObjectId(acceptorId) } });
      await usersCollection.updateOne({ _id: new ObjectId(acceptorId) }, {
          $addToSet: { friends: new ObjectId(requesterId) },
          $pull: { friendRequests: new ObjectId(requesterId) } // Also remove the request from the friendRequests array
      });

      res.status(200).json({ message: 'Friend request confirmed.' });
  } catch (error) {
      console.error('Error confirming friend request:', error);
      res.status(500).json({ message: 'Error confirming friend request.', error });
  } 
});


app.post('/api/deleteFriendRequest', isLoggedIn, async (req, res) => {
  const { requesterId, acceptorId } = req.body;
  let client;

  try {
      client = await MongoDBClient.getClient();
      const db = client.db('social');
      const usersCollection = db.collection('users');

      /// Convert to ObjectId and ensure they are valid
      const objRequesterId = new ObjectId(requesterId);
      const objAcceptorId = new ObjectId(acceptorId);

      // Debugging: Log the ObjectIds
    
      // Remove the friend request
      const result = await usersCollection.updateOne(
          { _id: objAcceptorId },
          { $pull: { friendRequests: objRequesterId } }
      );

      res.status(200).json({ message: 'Friend request deleted.' });
  } catch (error) {
      console.error('Error deleting friend request:', error);
      res.status(500).json({ message: 'Error deleting friend request.', error });
  } 
});


app.post('/edit-post/:postId', isLoggedIn, async (req, res) => {
  const postId = req.params.postId;
  const newContent = req.body.content;
  let client;

  try {
      client = await MongoDBClient.getClient();
      const db = client.db('social');
      const postsCollection = db.collection('posts');

      // Find the post by its ID
      const postObjectId = new ObjectId(postId);
      const post = await postsCollection.findOne({ _id: postObjectId });

      if (!post) {
          return res.status(404).json({ message: 'Post not found' });
      }

      // Check if the logged-in user is the one who created the post
    if (post.user._id.toString() !== req.userDetails._id.toString()) {
         return res.status(403).json({ message: 'You do not have permission to edit this post' });
     }

      // Update the post
      await postsCollection.updateOne(
          { _id: postObjectId },
          { $set: { content: newContent } }
      );

      res.status(200).json({ message: 'Post updated successfully' });
  } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ message: 'Error updating post' });
  } 
});
app.delete('/delete-post/:postId', isLoggedIn, async (req, res) => {
  const postId = req.params.postId;
  let client;

  try {
      client = await MongoDBClient.getClient();
      const db = client.db('social');
      const postsCollection = db.collection('posts');

      // Find the post by its ID
      const postObjectId = new ObjectId(postId);
      const post = await postsCollection.findOne({ _id: postObjectId });

      if (!post) {
          return res.status(404).json({ message: 'Post not found' });
      }

      // Check if the logged-in user is the one who created the post
      if (post.user._id.toString() !== req.userDetails._id.toString()) {
          return res.status(403).json({ message: 'You do not have permission to delete this post' });
      }

      // Delete the post
      const result = await postsCollection.deleteOne({ _id: postObjectId });
      if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Post not found' });
      }

      res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Error deleting post' });
  } 
});

app.post('/api/manager-login', async (req, res) => {
  const { groupId, username, password } = req.body;
  const manager = await findManagerByUsername(groupId, username);
  if (manager && bcrypt.compareSync(password, manager.password)) {
    req.session.managerId = manager.username; 

    res.json({ isManager: true }); 
  } else {
    res.status(401).json({ isManager: false }); 
  }
});

async function findManagerByUsername(groupId, username) {
  let client;
  try {
    client = await MongoDBClient.getClient();
    const db = client.db('social');
    const groupCollection = db.collection('groups');

    const groupObjectId = new ObjectId(groupId);

    const group = await groupCollection.findOne({ _id: groupObjectId, 'adminLogInData.username': username });
    return group ? group.adminLogInData : null;
  } catch (error) {
    console.error('Error in findManagerByUsername:', error);
    throw error;
  } 
}
function isManager(req, res, next) {
  if (req.session.managerId) {

    next();
  } else {
    res.status(403).send('Not authorized');
  }
}



////////chat



const MessageModel = require('./models/MessageModel'); 
const userSockets= new Map();

const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server);




io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('register', userId => {
    userSockets.set(userId, socket);
    console.log(`User ${userId} registered with socket id: ${socket.id}`);
  });

  socket.on('sendMessage', async ({ senderId, receiverId, text }) => {
    console.log(`Received message from ${senderId} to ${receiverId}: ${text}`);

    const message = new MessageModel({ senderId, receiverId, text });
    const client = await MongoDBClient.getClient();
    const collection = client.db('social').collection('messages');
    await collection.insertOne(message);
    console.log('Message saved to database');

if (userSockets.has(senderId)) {
  userSockets.get(senderId).emit('messageSent', text);
}
    if (userSockets.has(receiverId)) {
      console.log('has');
      userSockets.get(receiverId).emit('message', text);
    }
  });

  socket.on('disconnect', () => {
    userSockets.forEach((value, key) => {
      if (value === socket) {
        userSockets.delete(key);
        console.log(`User ${key} disconnected`);
      }
    });
  });
});


app.get('/chat-history/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const client = await MongoDBClient.getClient();
    const collection = client.db('social').collection('messages');
    const messages = await collection.find({
      $or: [
        { senderId: new ObjectId(userId), receiverId: new ObjectId(otherUserId) },
        { senderId: new ObjectId(otherUserId), receiverId: new ObjectId(userId) }
      ]
    }).sort({ timestamp: 1 }).toArray(); // סדר לפי תאריך
    console.log(messages);
    res.json(messages);
  } catch (error) {
    res.status(500).send("Error fetching chat history");
  }
});


app.get('/api/post-count-per-month', async (req, res) => {
  try {
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const results = await db.collection('posts').aggregate([
      {
        $match: { originType: 'homepage' } 
      },
      {
        $group: {
          postCount: { $sum: 1 }, 
          _id: {
            year: { $year: "$created" },
            month: { $month: "$created" }
          }
         
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 } 
      }
    ]).toArray();

    res.json(results);
  } catch (error) {
    console.error('Error in aggregation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});







app.get('/api/posts-with-location', async (req, res) => {
  try {
    const client = await MongoDBClient.getClient();
    const db = client.db('social');

    const posts = await db.collection('posts').find({ location: { $exists: true } }).toArray();
  
    res.json(posts);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.delete('/api/delete-account', isLoggedIn, async (req, res) => {
  try {
    const userId = req.userDetails._id;
    const client = await MongoDBClient.getClient();
    const db = client.db('social');
    const usersCollection = db.collection('users');

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) }, 
      { 
        $set: { 
          isDeleted: true, 
          pphId: undefined, 
          cphId: undefined, 
          googleId: null, 
          name: "Deleted Account" 
        } 
      }
    );

    res.status(200).json({ message: 'Your account has been deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account' });
  }
});

app.get('/search-plants', isLoggedIn, async (req, res) => {
  try {
      const { minPrice, maxPrice, plantName, plantAge, city, seasonality, growthConditions, difficultyLevel, watering } = req.query;
      const query = { originType: 'plant' }; 
      console.log("Received query parameters:", req.query);
      
      if (minPrice || maxPrice) {
          query['plantDetails.price'] = {};
          if (minPrice) query['plantDetails.price'].$gte = parseFloat(minPrice);
          if (maxPrice) query['plantDetails.price'].$lte = parseFloat(maxPrice);
          console.log("Price query constructed:", query['plantDetails.price']);
      }

      if (plantName) query['plantDetails.plantName'] = { $regex: new RegExp(plantName, 'i') };
      if (plantAge) query['plantDetails.plantAge'] = parseFloat(plantAge);
      if (city) query['plantDetails.city'] = { $regex: new RegExp(city, 'i') };
      if (seasonality) query['plantDetails.seasonality'] = seasonality;
      if (growthConditions) query['plantDetails.growthConditions'] = growthConditions;
      if (difficultyLevel) query['plantDetails.difficultyLevel'] = difficultyLevel;
      if (watering) query['plantDetails.watering'] = watering;


      const client = await MongoDBClient.getClient();
      const db = client.db('social');
      const posts = await db.collection('posts').find(query).toArray();


      await Promise.all(posts.map(async (post) => {
          const postUser = await db.collection('users').findOne({ _id: post.user });
          

          if (postUser) {
              post.user = postUser;
              if(!postUser.pphId){
                postUser.pphId='blank-profile-picture-973460_960_720.png'
              }
             
                const profilePicPath = path.join(imagesDirectory, postUser.pphId);
                const profilePic = fs.readFileSync(profilePicPath);
                post.user.profilePicBase64 = profilePic.toString('base64');

            
          }

          post.mediaBase64 = [];
          for (const mediaFileName of post.media) {
              const imagePath = path.join(imagesDirectory, mediaFileName);
              const image = fs.readFileSync(imagePath);
              const base64Data = image.toString('base64');
              post.mediaBase64.push(base64Data);
          }
      }));

      res.status(200).json({ posts });
  } catch (err) {
      console.error('Error searching plants:', err);
      res.status(500).json({ message: 'Error searching for plants' });
  }
});



server.listen(3000, () => {
  console.log('listening on *:3000');
});