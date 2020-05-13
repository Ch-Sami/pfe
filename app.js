//requiring
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const Unit = require("./modules/unit");
const User = require("./modules/user");
const Project = require('./modules/project');
const seed = require("./seeds");
const passport = require("passport");
const localStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const expressSession = require("express-session");

//import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const contactRoutes = require("./routes/contacts");
const projectRoutes = require("./routes/projects");
const mailsRoutes = require("./routes/mails");
const unitRoutes = require("./routes/units");
const chartsRoutes = require("./routes/charts");

//app config
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine" ,"ejs");
app.use(methodOverride("_method"));

app.use(expressSession({
	secret: "Achbek w nechbek ya lBekBek",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());  
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req ,res ,next)=>{
	res.locals.currentUser = req.user;   //(adds {currentUser = req.user} to all render params);
	next();
});

//use routes
app.use(authRoutes);
app.use(userRoutes);
app.use(eventRoutes);
app.use(contactRoutes);
app.use(projectRoutes);
app.use(mailsRoutes);
app.use(unitRoutes);
app.use(chartsRoutes);

//to get rid of the annoying deprecation warning
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
//connecting to database
mongoose.connect("mongodb://localhost:27017/companydb" ,{useNewUrlParser: true, useUnifiedTopology: true ,useFindAndModify: false} , ()=>{
    console.log("connected to mongodb !");
	// seed();
});


















app.listen(3000 ,()=>{
    console.log("the server has started !");
});
