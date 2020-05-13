const express = require("express");
const router = express.Router({mergeParams: true});
const passport = require("passport");
const User = require("../modules/user");
const Unit = require("../modules/unit");

//regestering:
router.get("/register" ,(req ,res)=>{
    Unit.find({} ,'-desc' ,(err ,units)=>{
        res.render("auth/register" ,{units: units});
    });
});
router.post("/register" , (req ,res)=>{
	var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        name: req.body.firstName+" "+req.body.lastName,
        unit: req.body.unit
    });
	User.register(newUser ,req.body.password ,(err ,user)=>{
		if(err){
			throw err;
			res.render("auth/register");
		}else{
			passport.authenticate("local")(req ,res ,()=>{
				res.redirect("/companystructure");
			});
		}
	});
});

//logging in:
router.get("/login" ,(req ,res)=>{
	res.render("auth/login");
});
router.post("/login" ,passport.authenticate("local" ,{
	successRedirect: "/companystructure",
	failureRedirect: "/login"
}) ,(req ,res)=>{
});

//logging out:
router.get("/logout" ,(req ,res)=>{
	req.logout();
	res.redirect("/login");
});

module.exports = router;