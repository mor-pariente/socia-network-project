const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  originType: {
    type: String,
    enum: ['homepage', 'group', 'plant'],
    required: true
},
groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: function() { return this.originType === 'group'; }
},
  content: String,
  media: Array, // שדה לתמונה, כאשר הערך הוא מזהה התמונה במסד הנתונים או URL
  created: { type: Date, default: Date.now },
  location: {
    type: {
      type: String, 
      enum: ['Point'], 
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  plantDetails: {
    type: {
      plantName: { type: String, required: function() { return this.originType === 'plant'; } },
      plantAge: { type: Number, required: function() { return this.originType === 'plant'; } },
      city: { type: String, required: function() { return this.originType === 'plant'; } },
      seasonality: { type: String, enum: ['perennial', 'seasonal'], required: function() { return this.originType === 'plant'; } },
      growthConditions: { type: String, enum: ['full sun', 'partial shade', 'full shade', 'indoor'], required: function() { return this.originType === 'plant'; } },
      difficultyLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: function() { return this.originType === 'plant'; } },
      watering: { type: String, enum: ['low', 'medium', 'high'], required: function() { return this.originType === 'plant'; } },
      price: { type: Number, required: function() { return this.originType === 'plant'; } },

    },
    required: function() { return this.originType === 'plant'; }
  },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: { type: String },
      content: { type: String },
      created: { type: Date, default: Date.now }
    }
  ],
  
  likes: [{ // מערך של מזהי יוצרי הלייקים
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: { type: String }

}]
});



const PostModel = mongoose.model("Post", postSchema);

module.exports = PostModel;