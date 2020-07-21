const mongoose = require('mongoose');
const User = require('./user');
//
const conn = require('./connection');

const eventSchema = mongoose.Schema({
    title: String,
    type: String,
    start: String,
    end: String,
    backgroundColor: String,
    detail: String,
    url: String,
    planner: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
    lastUpdateAt: String,
    usersThatDidNotDelete: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}],
    plannedFor: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}]
  });

  
  // module.exports = eventSchema;
  module.exports = conn.model('Event' ,eventSchema);