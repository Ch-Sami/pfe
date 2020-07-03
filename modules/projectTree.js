const mongoose = require('mongoose'),
      materializedPlugin = require('mongoose-materialized'),
      User = require('./user'),
      Project = require('./project'),
      conn = require('./connection');
var treeSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId ,ref: 'User'},
    project: {type: mongoose.Schema.Types.ObjectId ,ref: 'Project'},
    username: String,
    name: String,
    imageUrl: {type: String ,default: "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQMDZH1hAZTs5H364fQPBj33spP6P8mi_CkfmHKcOUYArZ3LYTt"},
    area: {type: String ,default: "Corporate"},
    profileUrl: {type: String ,default: ""},
    office: String,
    tags: String,
    isLoggedUser: {type: Boolean , default: false},
    unit: {type: mongoose.Schema.Types.ObjectId, ref:'Unit'},
    positionName: String,
    head: {type: Boolean ,default: false},
    assigned: {type: Boolean ,default: false},
    sentTo: Boolean
});
 

treeSchema.plugin(materializedPlugin);

module.exports = conn.model('Tree' ,treeSchema);
// module.exports = treeSchema;




    