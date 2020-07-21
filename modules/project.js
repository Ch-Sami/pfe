const mongoose = require('mongoose');
const User = require('./user');
const Tree = require('./projectTree');
// const treeSchema = require('./projectTree');
const conn = require('./connection');

const projectSchema = mongoose.Schema({
    title: String,
    type: {type: String ,default: 'project'},
    start: String,
    end: String,
    backgroundColor: {type: String ,default: '#ff6b1c'},
    detail: String,
    url: String,
    progress: {type: Number ,default: 1},
    progressHistory: [{
      progressUpdateBy: String,
      progressUpdateAt: String,
      oldProgress: Number,
      newProgress: Number
    }],
    lastProjectUpdateAt: String,
    discussion : [{
      userName : String,
      userId: String,
      userImage: String,
      created_at: String,
      text : String
    }],
    files: [{type: mongoose.Schema.Types.ObjectId, ref: 'gfsProject' }],
    createdBy: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
    sentToList: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}],
    assignedToList: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}],
    sentTo: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}],
    assignedTo: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}],
    tree: {type: mongoose.Schema.Types.ObjectId ,ref: 'Tree'},
    history: [{
      action: String,
      actor: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
      receiver: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
      at: String
    }]
  });

  var autoPopulateCreatedBy = function(next) {
    this.populate('createdBy' ,'_id username name imageUrl area profileUrl office tags isLoggedUser unit positionName');
    next();
  };

  var autoPopulateSentTo = function(next) {
    this.populate('sentTo' ,'_id username name imageUrl area profileUrl office tags isLoggedUser unit positionName');
    next();
  };
  var autoPopulateAssignedTo = function(next) {
    this.populate('assignedTo' ,'_id username name imageUrl area profileUrl office tags isLoggedUser unit positionName');
    next();
  };
  
  projectSchema
  .pre('findOne', autoPopulateCreatedBy)
  .pre('find', autoPopulateCreatedBy)
  .pre('findOne', autoPopulateSentTo)
  .pre('find', autoPopulateSentTo)
  .pre('findOne', autoPopulateAssignedTo)
  .pre('find', autoPopulateAssignedTo);

  module.exports = conn.model('Project' ,projectSchema);