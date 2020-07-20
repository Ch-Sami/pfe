const express = require("express");
const router = express.Router({mergeParams: true});
const User = require("../modules/user");
const Unit = require("../modules/unit");
const Project = require("../modules/project");
const Tree = require('../modules/projectTree');
const Mail = require('../modules/mail');
const Message = require('../modules/message');
const mongoose = require('mongoose');

//show the user's calendar
router.get("/users/:id/events" ,(req ,res)=>{
    User.findById(req.params.id).exec((err ,user)=>{
        if(err){throw err;}
        else{
            //clearing events notifs
            const promise = new Promise((resolve ,reject) => {
                var removedCount = 0;
                var updatedBellNotificationsArray = user.bellNotifications.array.filter(notification => {
                    if(notification.notifType != 'newEvent'){
                        return true;
                    }else{
                        removedCount = removedCount + notification.count;
                    }
                });
                var updatedBellNotificationsCount = user.bellNotifications.count;
                if(user.bellNotifications.count >= removedCount){
                    updatedBellNotificationsCount = updatedBellNotificationsCount - removedCount;
                }
                const updatedBellNotifications = {
                    count: updatedBellNotificationsCount,
                    array: updatedBellNotificationsArray
                }
                resolve(updatedBellNotifications);
            });
            
            promise
            .then(updatedBellNotifications => {
                User.findByIdAndUpdate(user._id ,{$set:{bellNotifications:updatedBellNotifications}} ,{new: true} ,(err ,user) => {
                    if(err){throw err;}
                    res.render("users/events" ,{user: user});
                });
            });
        }
    });
});

//shows the templet of adding an event to the calendar
router.get("/users/:id/events/new" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            User.find({} ,'-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit' ,(err ,usersList)=>{
                if(err){throw err;}
                else{
                    if(req.query.addTo == 'self&others'){
                        res.render("users/newEvent" ,{user: user ,addTo: 'self' ,usersList: usersList});//JSON.stringify(usersList)
                    }else{
                        User.findById(req.query.addTo ,'-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit' ,(err ,addTo)=>{
                            if(err){throw err;}
                            res.render("users/newEvent" ,{user: user ,addTo: addTo ,usersList: usersList});//JSON.stringify(usersList)
                        });
                    }
                }
            });
        }
    });
});



//adding a new event to the calendar
router.post("/users/:id/events" ,(req ,res)=>{
    var io = req.app.get('io');
    User.findById(req.params.id ,(err ,planner) => {
        if(err){throw err;}
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
        //pushing the event to the users & handling notification

        const notification = {
            count: 1,
            notifType: 'newEvent',
            plannerId: planner.id,
            plannerUsername: planner.username,
            eventId: event.id,
            eventTitle: event.title,
            start: event.start,
            end: event.end,
            url: '',
            at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        }

        plannedFor.forEach(function(pfid){
            User.findById(pfid ,(err ,pf)=>{
                if(err){throw err}
                else{
                    pf.events.push(event);
                    pf.events[pf.events.length - 1].url = ('/users/'+pf._id+'/events/'+pf.events[pf.events.length - 1]._id);
                    notification.url = pf.events[pf.events.length - 1].url;
                    io.to(pf._id).emit('newEventNotification' ,notification);
                    var count = 1;
	    		    pf.bellNotifications.array.forEach(notificationn => {
	    		    	if(notificationn.plannerId == notification.plannerId && notificationn.notifType == 'newEvent'){
                            count = notificationn.count + 1;
	    		    		pf.bellNotifications.array.splice(pf.bellNotifications.array.indexOf(notificationn) ,1);
	    		    	}
                    });
                    notification.count = count;
                    pf.bellNotifications.array.push(notification);
	    		    pf.bellNotifications.count = pf.bellNotifications.count + 1;
                    pf.save();
                }
            });
        });
        if(req.body.redirect == 'events'){
            res.redirect("/users/"+req.params.id+"/events");
        }else if(req.body.redirect == 'contacts'){
            res.redirect("/users/"+req.params.id+"/contacts");
        }
    })
});


//show a specific event
router.get("/users/:id/events/:evtId" ,(req ,res)=>{
    User.findById(req.params.id).populate({
        path: 'events.planner',
        select: '-events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
    }).exec((err , user)=>{
        if(err){throw err}
        else{
            var myEvent;
            user.events.forEach(function(event){
                if(event._id == req.params.evtId){
                    myEvent = event;
                }
            });
            //clearing the event notif if exist
            const promise = new Promise((resolve ,reject) => {
                var updatedBellNotificationsArray = user.bellNotifications.array.filter(notification => {
                    if(notification.eventId != req.params.evtId || notification.notifType != 'newEvent'){
                        return true;
                    }
                });
                var updatedBellNotificationsCount = user.bellNotifications.count;
                if(user.bellNotifications.count > 0){
                    updatedBellNotificationsCount = updatedBellNotificationsCount - 1;
                }
                const updatedBellNotifications = {
                    count: updatedBellNotificationsCount,
                    array: updatedBellNotificationsArray
                }
                resolve(updatedBellNotifications);
            });
            
            promise
            .then(updatedBellNotifications => {
                User.findByIdAndUpdate(user._id ,{$set:{bellNotifications:updatedBellNotifications}} ,{new: true} ,(err ,user) => {
                    if(err){throw err;}
                    console.log(myEvent.planner);
                    res.render("users/showEvent" ,{user: user ,event: myEvent});
                });
            });
        }
    });
});

//shows the templet of updating a specific event
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
            res.render("users/updateEvent" ,{user: user ,event: myEvent});
        }
    });
});


//updating a specific event
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
                    }else{
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

//deleting a specific event
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
