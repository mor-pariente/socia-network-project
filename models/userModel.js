const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  googleId: String,
  pphId: { type: String, default: null }, //profile photo
  cphId: { type: String, default: null }, //cover photo
  friends: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // for incoming friend requests
  isDeleted: {
    type: Boolean,
    default: false
  }
});




const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
