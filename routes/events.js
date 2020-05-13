const express = require("express");
const router = express.Router({mergeParams: true});
const User = require("../modules/user");
const Unit = require("../modules/unit");
const Project = require("../modules/project");
const Tree = require('../modules/projectTree');
const Mail = require('../modules/mail');
const Message = require('../modules/message');
const mongoose = require('mongoose');


router.get("/users/:id/events" ,(req ,res)=>{
    User.findById(req.params.id).exec((err ,user)=>{
        if(err){throw err;}
        else{
            Unit.find().exec((err ,units)=>{
                if(err){throw err;}
                else{
                    res.render("users/events" ,{user: user ,units: units});
                }
            });
        }
    });
});
router.get("/users/:id/events/new" ,(req ,res)=>{
    User.findById(req.params.id).exec((err ,user)=>{
        if(err){throw err;}
        else{
            Unit.find().exec((err ,units)=>{
                if(err){throw err;}
                else{
                    User.find({} ,'-children -events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit' ,(err ,usersList)=>{
                        if(err){throw err;}
                        else{
                            if(req.query.addTo == 'self&others'){
                                res.render("users/newEvent" ,{user: user ,units: units ,addTo: 'self' ,usersList: JSON.stringify(usersList)});
                            }else{
                                User.findById(req.query.addTo ,'-children -events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit' ,(err ,addTo)=>{
                                    if(err){throw err;}
                                    res.render("users/newEvent" ,{user: user ,units: units ,addTo: addTo ,usersList: JSON.stringify(usersList)});
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});




router.post("/users/:id/events" ,(req ,res)=>{
    //initializing event
    var event = req.body.event;
    var dateTime = req.body.dateTime.split(" - ");
    event.start = dateTime[0].replace(/\//g, "-")+':00';
    event.end = dateTime[1].replace(/\//g, "-")+':00';
    if(event.type == 'absence'){
        event.backgroundColor = '#ff2e2e';
    }else if(event.backgroundColor == ''){
        event.backgroundColor = '#4289cf';
    }
    var plannedFor = req.body.addTo.split(",");
    //pushing the event to the users
    plannedFor.forEach(function(pfid){
        User.findById(pfid ,(err ,pf)=>{
            if(err){throw err}
            else{
                pf.events.push(event);
                pf.save(function(){
                    //adding an URL to the event
                    pf.events[pf.events.length - 1].url = ('/users/'+pf._id+'/events/'+pf.events[pf.events.length - 1]._id);
                    pf.save();
                });
            }
        });
    });
    if(req.body.redirect == 'events'){
        res.redirect("/users/"+req.params.id+"/events");
    }else if(req.body.redirect == 'contacts'){
        res.redirect("/users/"+req.params.id+"/contacts");
    }
});

router.get("/users/:id/events/:evtId" ,(req ,res)=>{
    User.findById(req.params.id).populate({
        path: 'events.planner',
        select: '-children -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
    }).exec((err , user)=>{
        if(err){throw err}
        else{
            var myEvent;
            user.events.forEach(function(event){
                if(event._id == req.params.evtId){
                    myEvent = event;
                }
            });
            Unit.find().exec((err ,units)=>{
                if(err){throw err;}
                else{
                    res.render("users/showEvent" ,{user: user ,event: myEvent , units: units});
                }
            });
        }
    });
});

router.get("/users/:id/events/:evtId/edit" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err}
        else{
            var myEvent;
            user.events.forEach(function(event){
                if(event._id == req.params.evtId){
                    myEvent = event;
                }
            });
            Unit.find().exec((err ,units)=>{
                if(err){throw err;}
                else{
                    // console.log(myEvent);
                    res.render("users/updateEvent" ,{user: user ,event: myEvent , units: units});
                }
            });
        }
    });
});


router.put("/users/:id/events/:evtId" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err}
        else{
            for(var i = 0 ;i < user.events.length ;i++){
                if(user.events[i]._id == req.params.evtId){
                    user.events[i].title = req.body.title;
                    user.events[i].type = req.body.type;
                    user.events[i].detail = req.body.detail;
                    user.events[i].planner = user;
                    var dateTime = req.body.dateTime.split(" - ");
                    user.events[i].start = dateTime[0].replace(/\//g, "-")+':00';
                    user.events[i].end = dateTime[1].replace(/\//g, "-")+':00';
                    if(user.events[i].type == 'absence'){
                        user.events[i].backgroundColor = '#ff2e2e';
                    }else if(user.events[i].backgroundColor == ''){
                        user.events[i].backgroundColor = '#4289cf';
                    }
                    break;
                }
            }
            user.save((err ,user)=>{
                if(err){throw err;}
                res.redirect("/users/"+req.params.id+"/events/"+req.params.evtId);
            });
        }
    });
});
router.delete("/users/:id/events/:evtId" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err}
        else{
            for(var i = 0 ;i < user.events.length ;i++){
                if(user.events[i]._id == req.params.evtId){
                    user.events.splice(i ,1);
                    break;
                }
            }
            user.save((err ,user)=>{
                if(err){throw err;}
                res.redirect("/users/"+req.params.id+"/events");
            });
        }
    });
});


module.exports = router;
