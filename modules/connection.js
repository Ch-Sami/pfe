const mongoose = require('mongoose');


// DB url
const mongoURI = "mongodb://localhost:27017/companydb";

// connection
module.exports =  mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});

