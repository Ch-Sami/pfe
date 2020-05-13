const express = require("express");
const router = express.Router({mergeParams: true});
const Unit = require("../modules/unit");

router.get("/units/new" ,(req ,res)=>{
    res.render("units/new");
});
router.post("/units" ,(req ,res)=>{
    Unit.create(req.body.unit ,(err ,unit)=>{
        if(err){throw err;}
        else{
            res.redirect("/companystructure");
        }
    })
});

module.exports = router;