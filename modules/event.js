const mongoose = require('mongoose');
const User = require('./user');

const eventSchema = mongoose.Schema({
    title: String,
    type: String,
    start: String,
    end: String,
    backgroundColor: String,
    detail: String,
    url: String,
    planner: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
    comments : [{
      userName : String,
      comment : String
    }]
  });

  
  //module.exports = new mongoose.model('Event' ,eventSchema);
  module.exports = eventSchema;