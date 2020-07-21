const express = require("express");
const router = express.Router({mergeParams: true});
const User = require("../modules/user");
const Unit = require("../modules/unit");
const Project = require("../modules/project");
const Tree = require('../modules/projectTree');
const Mail = require('../modules/mail');
const Message = require('../modules/message');
const Event = require("../modules/event");
const mongoose = require('mongoose');



//show the user's calendar
router.get("/users/:id/events/calendar" ,(req ,res)=>{
    User.findById(req.params.id).populate('events assignedProjects').exec((err ,user)=>{
        if(err){throw err;}
        else{
            var events = user.events;
            var assignedProjects = user.assignedProjects;
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
                    events.forEach(event => {
                        event.url = '/users/'+user._id+'/events/'+event._id;
                    });
                    assignedProjects.forEach(ap => {
                        var event = {
                            title: ap.title,
                            backgroundColor: '#ff6b1c',
                            start: ap.start.replace(/\//g, "-"),
                            end: ap.end.replace(/\//g, "-"),
                            url: '/users/'+user._id+'/projects/assigned/'+ap._id+'/detail',
                        }
                        events.push(event);
                    });
                    res.render("users/calendar" ,{user: user ,events: events});
                });
            });
        }
    });
});

//show the user's planned events
router.get("/users/:id/events/planned" ,(req ,res)=>{
    User.findById(req.params.id,(err ,user)=>{
        if(err){throw err;}
        Event.find({planner: req.params.id}).populate({
            path: 'plannedFor',
            select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
        }).exec((err ,events)=>{
            if(err){throw err;}
            events.forEach(event => {
                event.url = '/users/'+user._id+'/events/'+event._id;
            });
            var sortedEvents = events.sort((a ,b)=>{
                return (a.lastUpdateAt < b.lastUpdateAt) ? 1 : -1;
            });
            res.render("users/plannedEvents" ,{user: user ,events: sortedEvents});
        });
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
                        res.render("users/newEvent" ,{user: user ,addTo: 'self' ,usersList: usersList});
                    }else{
                        User.findById(req.query.addTo ,'-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit' ,(err ,addTo)=>{
                            if(err){throw err;}
                            res.render("users/newEvent" ,{user: user ,addTo: addTo ,usersList: usersList});
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
        var event = new Event(req.body.event);
        var dateTime = req.body.dateTime.split(" - ");
        event.start = dateTime[0].replace(/\//g, "-")+':00';
        event.end = dateTime[1].replace(/\//g, "-")+':00';
        event.lastUpdateAt = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        if(event.type == 'absence'){
            event.backgroundColor = '#ff2e2e';
        }else if(event.backgroundColor == ''){
            event.backgroundColor = '#4289cf';
        }
        event.plannedFor = req.body.addTo.split(",");
        event.usersThatDidNotDelete = req.body.addTo.split(",");
        const index = event.usersThatDidNotDelete.indexOf(req.params.id);
        if(index <= -1){
            event.usersThatDidNotDelete.push(req.params.id);
        }
        var plannedFor = event.plannedFor;

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

        event.save((err ,event)=>{
            if(err){throw err;}
            plannedFor.forEach(function(pfid){
                User.findById(pfid ,(err ,pf)=>{
                    if(err){throw err}
                    else{
                        pf.events.push(event);
                        if(pf.id != event.planner){
                            //handle notification
                            notification.url = '/users/'+pf._id+'/events/'+event._id;
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
                        }
                        pf.save();
                    }
                });
            });
            planner.save(() => {
                if(req.body.redirect == 'events'){
                    res.redirect("/users/"+req.params.id+"/events/planned");
                }else if(req.body.redirect == 'contacts'){
                    res.redirect("/users/"+req.params.id+"/contacts");
                }
            });
        });
    });
});

router.post("/users/:id/events/:evtId/rePlan" ,(req ,res)=>{
    var io = req.app.get('io');
    User.findById(req.params.id ,(err ,planner) => {
        if(err){throw err;}
        Event.findById(req.params.evtId ,(err ,event) => {
            if(err){throw err;}
            event.lastUpdateAt = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            var plannedFor = req.body.addTo.split(",");
            // var updatedPlannedFor = event.plannedFor;
            // var updatedUsersThatDidNotDelete = event.usersThatDidNotDelete;
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
            plannedFor.forEach(pfid => {
                var index = event.usersThatDidNotDelete.indexOf(pfid);
                if(index <= -1){
                    event.usersThatDidNotDelete.push(pfid);
                }
                var indexPf = event.plannedFor.indexOf(pfid);
                if(indexPf <= -1){
                    event.plannedFor.push(pfid);
                }
                User.findById(pfid ,(err ,pf)=>{
                    if(err){reject(err);}
                    var indexEvt = pf.events.indexOf(event._id);
                    if(indexEvt <= -1){
                        pf.events.push(event);
                        if(pf.id != event.planner){
                            //handle notification
                            notification.url = '/users/'+pf._id+'/events/'+event._id;
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
                        }
                        pf.save();
                    }
                });
            });

            event.save(() => {
                res.redirect("/users/"+req.params.id+"/events/planned");
            });
            
        })
    });
});


//show a specific event
router.get("/users/:id/events/:evtId" ,(req ,res)=>{
    User.findById(req.params.id ,(err , user)=>{
        if(err){throw err}
        Event.findById(req.params.evtId).populate([{
            path: 'planner',
            select: '-events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
        },{
            path: 'plannedFor',
            select: '-events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
        }]).exec((err ,myEvent)=>{
            if(err){throw err;}
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
                    User.find({} ,'-events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts' ,(err ,usersList)=>{
                        if(err){throw err;}
                        var filtredUsersList = [];
                        usersList.forEach(elt =>{
                            var trv = false
                            myEvent.plannedFor.forEach(pf =>{
                                if(elt.id == pf.id){
                                    trv = true;
                                }
                            });
                            if(trv == false){
                                filtredUsersList.push(elt);
                            }
                        });
                        res.render("users/showEvent" ,{user: user ,event: myEvent ,usersList: filtredUsersList});
                    }); 
                });
            });
        });
    });
});

//shows the templet of updating a specific event
router.get("/users/:id/events/:evtId/edit" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err}
        Event.findById(req.params.evtId ,(err ,myEvent)=>{
            if(err){throw err;}
            res.render("users/updateEvent" ,{user: user ,event: myEvent});
        });
    });
});


//updating a specific event
router.put("/users/:id/events/:evtId" ,(req ,res)=>{
    var io = req.app.get('io');
    Event.findById(req.params.evtId ,(err ,event)=>{
        if(err){throw err}
        event.title = req.body.title;
        event.type = req.body.type;
        event.detail = req.body.detail;
        event.lastUpdateAt = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        var dateTime = req.body.dateTime.split(" - ");
        event.start = dateTime[0].replace(/\//g, "-")+':00';
        event.end = dateTime[1].replace(/\//g, "-")+':00';
        if(event.type == 'absence'){
            event.backgroundColor = '#ff2e2e';
        }else{
            event.backgroundColor = '#4289cf';
        }

        //handling notification
        User.findById(event.planner ,(err ,planner)=>{
            if(err){throw err;}
            const notification = {
                count: 1,
                notifType: 'eventUpdate',
                plannerId: planner.id,
                plannerUsername: planner.username,
                eventId: event.id,
                eventTitle: event.title,
                url: '',
                at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            }
            event.plannedFor.forEach(pfid =>{
                User.findById(pfid ,(err ,pf) =>{
                    if(err){throw err;}
                    if(pf.id != event.planner){
                        notification.url = '/users/'+pf._id+'/events/'+event._id;
                        io.to(pf._id).emit('eventUpdateNotification' ,notification);
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
            event.save((err)=>{
                if(err){throw err;}
                res.redirect("/users/"+req.params.id+"/events/"+req.params.evtId);
            });
        });
    });
});

//deleting a specific event
router.delete("/users/:id/events/:evtId" ,(req ,res)=>{
    var io = req.app.get('io');
    Event.findById(req.params.evtId ,(err ,event) => {
        if(err){throw err;}
        const index = event.usersThatDidNotDelete.indexOf(req.params.id);
        if(index > -1){
            event.usersThatDidNotDelete.splice(index ,1);
        }
        const indexPF = event.plannedFor.indexOf(req.params.id);
        if(indexPF > -1){
            event.plannedFor.splice(indexPF ,1);
        }
        if(req.body.deleter == req.params.id){
            if(event.usersThatDidNotDelete.length < 1){
                console.log(1);////////////////////////////////////////////////////////////
                Event.findByIdAndRemove(req.params.evtId ,(err) => { 
                    if(err){throw err;}
                    res.redirect("/users/"+req.body.deleter+"/events/calendar");
                });
            }else{
                console.log(2);////////////////////////////////////////////////////////////
                event.save(()=>{
                    User.findById(req.params.id ,(err ,user)=>{
                        if(err){throw err}
                        const eventIndex = user.events.indexOf(event._id);
                        if(eventIndex > -1){
                            user.events.splice(eventIndex ,1);
                        }
                        user.save(() => {
                            res.redirect("/users/"+req.body.deleter+"/events/calendar");
                        });
                    });
                });
            }
        }else{
            console.log(3);////////////////////////////////////////////////////////////
            User.findById(event.planner ,(err ,planner)=>{
                if(err){throw err;}
                event.save((err ,event)=>{
                    if(err){throw err;}
                    User.findById(req.params.id ,(err ,user)=>{
                        if(err){throw err}
                        const eventIndex = user.events.indexOf(event._id);
                        if(eventIndex > -1){
                            user.events.splice(eventIndex ,1);
                        }
                        const notification = {
                            count: 1,
                            notifType: 'eventCancellation',
                            plannerId: planner.id,
                            plannerUsername: planner.username,
                            eventId: event.id,
                            eventTitle: event.title,
                            at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                        }
                        notification.url = '/users/'+user._id+'/events/'+event._id;
                        io.to(user._id).emit('eventCancellationNotification' ,notification);
                        var count = 1;
                        user.bellNotifications.array.forEach(notificationn => {
                            if(notificationn.plannerId == notification.plannerId && notificationn.notifType == 'newEvent'){
                                count = notificationn.count + 1;
                                user.bellNotifications.array.splice(user.bellNotifications.array.indexOf(notificationn) ,1);
                            }
                        });
                        notification.count = count;
                        user.bellNotifications.array.push(notification);
                        user.bellNotifications.count = user.bellNotifications.count + 1;
                        user.save(()=>{
                            if(event.usersThatDidNotDelete.length < 1){
                                console.log(4);////////////////////////////////////////////////////////////
                                Event.findByIdAndRemove(req.params.evtId ,(err) => { 
                                    if(err){throw err;}
                                    res.redirect("/users/"+req.body.deleter+"/events/planned");
                                });
                            }else{
                                console.log(5);////////////////////////////////////////////////////////////
                                event.save(() => {
                                    res.redirect("/users/"+req.body.deleter+"/events/"+event._id);
                                });
                            }
                        });
                    });
                });
            });
        }
    });
});


module.exports = router;









//handling notification
