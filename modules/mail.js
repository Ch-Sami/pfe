const mongoose = require('mongoose');
const User = require('./user');
// materializedPlugin = require('mongoose-materialized');
const conn = require('./connection');


const mailSchema = mongoose.Schema({
    title: String,
    text: String,
    sent_by: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
    created_at: String,
    sending_history: [{
        sending_type: String,
        sent_to: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
        sent_at: String,
        read: Boolean
    }],
    replies: [{type: mongoose.Schema.Types.ObjectId ,ref: 'Mail'}],
    usersThatDidNotDelete: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}],
    files: [{type: mongoose.Schema.Types.ObjectId, ref: 'gfsMail' }],
    mailSize: Number
});
// mailSchema.plugin(materializedPlugin);
module.exports = conn.model('Mail' ,mailSchema);