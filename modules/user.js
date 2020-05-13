const mongoose = require("mongoose");
const Unit = require("./unit");
const Project = require("./project");
const Mail = require("./mail");
const Message = require("./message");
const eventSchema = require("./event");
// const receivedMailsSchema = require('./receivedMails');
const passportLocalMongoose = require("passport-local-mongoose");

// const receivedMailsSchema =  mongoose.Schema({
//   body: {type: mongoose.Schema.Types.ObjectId, ref:'Mail'},
//   received_at: String
// });


const userSchema = mongoose.Schema({
  username: String,
  firstName: String,
  lastName: String,
  name: String,
  imageUrl: {type: String ,default: "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQMDZH1hAZTs5H364fQPBj33spP6P8mi_CkfmHKcOUYArZ3LYTt"},
  area: {type: String ,default: "Corporate"},
  profileUrl: {type: String ,default: ""},
  office: String,
  tags: String,
  isLoggedUser: {type: Boolean , default: false},
  unit: {type: mongoose.Schema.Types.ObjectId, ref:'Unit'},
  positionName: String,
  children: [{ type: mongoose.Schema.Types.ObjectId, ref:'User'}],

  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref:'User'}],

  events: [eventSchema],

  sentProjects: [{ type: mongoose.Schema.Types.ObjectId, ref:'Project'}],
  assignedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref:'Project'}],
  receivedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref:'Project'}],

  sentMails: [{ type: mongoose.Schema.Types.ObjectId, ref:'Mail'}],
  receivedMails: [{type: mongoose.Schema.Types.ObjectId, ref:'Mail'}],

  sentMessages: [{ type: mongoose.Schema.Types.ObjectId, ref:'Message'}],
  receivedMessages: [{type: mongoose.Schema.Types.ObjectId, ref:'Message'}]
});

var autoPopulateChildren = function(next) {
  this.populate('children');
  next();
};
var autoPopulateUnits = function(next) {
  this.populate('unit' ,'-desc');
  next();
};

userSchema
.pre('findOne', autoPopulateChildren)
.pre('find', autoPopulateChildren)
.pre('findOne', autoPopulateUnits)
.pre('find', autoPopulateUnits);

userSchema.plugin(passportLocalMongoose);


module.exports = new mongoose.model('User' ,userSchema);