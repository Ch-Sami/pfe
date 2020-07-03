const mongoose = require('mongoose');
const User = require('./user');
const conn = require('./connection');

const messageSchema = mongoose.Schema({
    text: String,
    sent_by: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
    sent_to: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
    sent_at: String
});
module.exports = conn.model('Message' ,messageSchema);