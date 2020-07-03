const mongoose = require("mongoose");
const User = require("./user");
const conn = require('./connection');

const unitSchema = mongoose.Schema({
    type: String,
    value: String,
    desc: String,
    currentHead: {type: mongoose.Schema.Types.ObjectId, ref:'User'},
});


module.exports = conn.model('Unit',unitSchema);