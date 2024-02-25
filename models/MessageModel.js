const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User' // הנחה שיש לך מודל משתמש בשם 'User'
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User' // הנחה שיש לך מודל משתמש בשם 'User'
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { collection: 'messages' });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
