const express = require("express");
const router = express.Router({mergeParams: true});
const mongoose = require('mongoose');
const Unit = require("../modules/unit");
const User = require("../modules/user");


//get the company's full orgchart
router.get("/orgchart" ,(req ,res)=>{
    User.GetFullArrayTree(function(err ,tree){
        if(err){throw err;}
        else{
            var dataa = JSON.stringify(tree[0]);
            res.render("charts/orgchart" ,{dataa: dataa});
        }
    });
});

//get a specific department orgchart
router.get("/orgchart/:departmentId" ,(req ,res)=>{
    Unit.findById(req.params.departmentId ,(err ,unit)=>{
        if(err){throw err;}
        else{
            User.GetArrayTree(unit.currentHead, (err ,tree)=>{
                if(err){throw err;}
                else{
                    var dataa =JSON.stringify(tree[0]);
                    res.render("charts/orgchart" ,{dataa: dataa});
                }
            });
        }
    });
});




module.exports = router;