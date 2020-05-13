const mongoose = require('mongoose');
const User = require('./user');
const Tree = require('./projectTree');
// const treeSchema = require('./projectTree');

const projectSchema = mongoose.Schema({
    title: String,
    type: {type: String ,default: 'project'},
    start: String,
    end: String,
    backgroundColor: {type: String ,default: '#ff6b1c'},
    detail: String,
    url: String,
    progress: {type: Number ,default: 1},
    lastUpdateBy: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
    lastUpdateAt: String,
    discussion : [{
      userName : String,
      userId: String,
      userImage: String,
      created_at: String,
      text : String
    }],
    createdBy: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
    sentToList: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}],
    assignedToList: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}],
    sentTo: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}],
    assignedTo: [{type: mongoose.Schema.Types.ObjectId ,ref: 'User'}],
    tree: {type: mongoose.Schema.Types.ObjectId ,ref: 'Tree'}
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

  module.exports = new mongoose.model('Project' ,projectSchema);