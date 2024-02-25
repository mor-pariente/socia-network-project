const mongoose = require("mongoose");
const PostModel = require("./postModel");

const groupSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },//for number of admins per group 
  adminLogInData: {
    username: { type: String },  
    password: { type: String }  
  },
  groupName: { type: String },
  cphId: { type: String , default: 'null'}, 
  created: { type: Date, default: Date.now },
  participants: [
    {
      userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }
  ],
  
 
 


});



const GroupModel = mongoose.model("group", groupSchema);

module.exports = GroupModel;