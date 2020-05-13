const mongoose = require("mongoose");
const User = require("./user");

const unitSchema = mongoose.Schema({
    type: String,
    value: String,
    desc: String,
    currentHead: {type: mongoose.Schema.Types.ObjectId, ref:'User'},
});


module.exports = new mongoose.model('Unit',unitSchema);