const express = require("express");
const router = express.Router({mergeParams: true});
const User = require("../modules/user");
const Unit = require("../modules/unit");
const Project = require("../modules/project");
const Tree = require('../modules/projectTree');
const Mail = require('../modules/mail');
const Message = require('../modules/message');
const mongoose = require('mongoose');


//show profil
router.get("/users/:id/profil" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            res.render("users/profil" ,{user: user});
        }
    });
});



module.exports = router;