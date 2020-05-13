const express = require("express");
const router = express.Router({mergeParams: true});
const mongoose = require('mongoose');
const Unit = require("../modules/unit");
const User = require("../modules/user");


router.get("/companystructure" ,(req ,res)=>{
    res.render("charts/companystructure");
});

router.get("/orgchart" ,(req ,res)=>{
    User.findOne({name: "Ian Devling"}).exec(function(err ,users){
        if(err){throw err;}
        else{
            Unit.find({type: 'department'} ,'-desc' ,(err ,units)=>{
                if(err){throw err;}
                else{
                    var dataa = JSON.stringify(users);
                    res.render("charts/orgchart" ,{dataa: dataa ,units: units});
                }
            });
        }
    });
});


router.get("/orgchart/:value" ,(req ,res)=>{
    Unit.findOne({value: req.params.value}).exec(function(err ,unit){
        if(err){throw err;}
        else{
            User.findById(unit.currentHead, (err ,user)=>{
                if(err){throw err;}
                else{
                    Unit.find({type: 'department'} ,'-desc' ,(err ,units)=>{
                        if(err){throw err;}
                        else{
                            var dataa =JSON.stringify(user);
                            res.render("charts/orgchart" ,{dataa: dataa ,units: units});
                        }
                    });
                }
            });
            
            // <a href="/orgchart/<%= infodepid%>">link to departement of info</a>
        }
    });
});




module.exports = router;