const express = require("express");
const router = express.Router({mergeParams: true});
const User = require("../modules/user");
const Unit = require("../modules/unit");
const Project = require("../modules/project");
const Tree = require('../modules/projectTree');
const Mail = require('../modules/mail');
const Message = require('../modules/message');
const mongoose = require('mongoose');


//show the templet of sending new mail
router.get("/users/:id/mails/sent/new" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            User.find({} ,'-events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl' ,(err ,usersList)=>{
                if(err){throw err;}
                if(req.query.sendTo == undefined){
                    res.render("users/newMail" ,{user: user ,units: units ,sendTo: undefined,usersList: JSON.stringify(usersList)});
                }else{
                    User.findById(req.query.sendTo ,(err ,sendTo)=>{
                        if(err){throw err}
                        res.render("users/newMail" ,{user: user ,sendTo: sendTo,usersList: JSON.stringify(usersList)});
                    });
                }
            });
        }
    });
});


//shows the user's received mails
router.get("/users/:id/mails/received" ,(req ,res)=>{
    User.findById(req.params.id ,'-events')
    .populate({
        path: 'receivedMails',
        populate: {
            path: 'sent_by',
            select: ' -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
        }
    })
    .exec((err ,user)=>{
        if(err){throw err;}
        else{
            var receivedMails = [];
            user.receivedMails.forEach(function(rm){
                var receivedMail = {
                    _id: rm._id,
                    title: rm.title,
                    sent_by: rm.sent_by.username,
                    senderImage: rm.sent_by.imageUrl
                }
                rm.sending_history.forEach(function(elt){
                    if(elt.sent_to == user.id){
                        receivedMail.received_at = elt.sent_at;
                        receivedMail.read = elt.read;
                    }
                });
                receivedMails.push(receivedMail);
            });
            res.render("users/receivedMails" ,{user: user ,receivedMails: receivedMails});
        }
    });
});

//shows the user's sent mails
router.get("/users/:id/mails/sent" ,(req ,res)=>{
    User.findById(req.params.id ,'-events')
    .populate({
        path: 'sentMails',
        select: '-text',
        populate: {
            path: 'sending_history.sent_to',
            select: '-events -sentMessages -receivedMessages -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
        }
    })
    .exec((err ,user)=>{
        if(err){throw err;}
        else{
            res.render("users/sentMails" ,{user: user});
        }
    });
});

//show a sent mail's content
router.get("/users/:id/mails/sent/:mailId/content" ,(req ,res)=>{
    User.findById(req.params.id ,'-children -events' ,(err ,user)=>{
        if(err){throw err;}
        else{
            Unit.find().exec((err ,units)=>{
                if(err){throw err;}
                else{
                    Mail.findById(req.params.mailId).populate({
                        path: 'sending_history.sent_to',
                        select: '-children -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
                    }).exec((err , mail)=>{
                        if(err){throw err;}
                        User.find({} ,'-children -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl' ,(err ,usersList)=>{
                            if(err){throw err;}
                            res.render("users/sentMailContent" ,{user: user ,units: units ,mail: mail ,usersList: JSON.stringify(usersList)});
                        });
                        // console.log(mail);
                    });
                }
            });
        }
    });
});

//show a received mail's content
router.get("/users/:id/mails/received/:mailId" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            User.find({} ,'-events -sentMessages -receivedMessages -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl' ,(err ,usersList)=>{
                if(err){throw err;}
                Mail.findById(req.params.mailId).populate({
                    path: 'sent_by',
                    select: '-events -sentMessages -receivedMessages -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
                }).exec((err , receivedMail)=>{
                    if(err){throw err;}
                    var mail = {
                        _id: receivedMail._id,
                        title: receivedMail.title,
                        text: receivedMail.text,
                        sent_by: receivedMail.sent_by
                    }
                    for(var i = 0 ;i < receivedMail.sending_history.length ;i++){
                        if(receivedMail.sending_history[i].sent_to._id == req.params.id){
                            mail.sending_type = receivedMail.sending_history[i].sending_type;
                            mail.received_at = receivedMail.sending_history[i].sent_at;
                            if(receivedMail.sending_history[i].read == false){
                                receivedMail.sending_history[i].read = true;
                                receivedMail.save();
                            }
                            break;
                        }
                    }
                    res.render("users/receivedMailContent" ,{user: user ,mail: mail ,usersList: JSON.stringify(usersList)});
                });
            });
        }
    });
});

//sending new mail
router.post("/users/:id/mails/sent" ,(req ,res)=>{
    var receivers = req.body.sentTo.split(",");
    if(req.body.CCs !== undefined){
        var CCs = req.body.CCs.split(",");
    }
    var mail = new Mail({
        sent_by: req.params.id,
        title: req.body.title,
        text: req.body.text,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    });
    receivers.forEach(function(receiver){
        var elt = {
            sending_type: 'send',
            sent_to: receiver,
            sent_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            read: false
        }
        mail.sending_history.push(elt);
    });
    if(req.body.CCs !== undefined){
        CCs.forEach(function(CC){
            var elt = {
                sending_type: 'CC',
                sent_to: CC,
                sent_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                read: false
            }
            mail.sending_history.push(elt);
        });
    }
    mail.save((err ,mail)=>{
        if(err){throw err}
        receivers.forEach(function(receiverId){
            User.findById(receiverId ,(err ,receiver)=>{
                if(err){throw err}
                receiver.receivedMails.push(mail);
                receiver.save();
            });
        });
        if(req.body.CCs !== undefined){
            CCs.forEach(function(ccId){
                User.findById(ccId ,(err ,CC)=>{
                    if(err){throw err}
                    CC.receivedMails.push(mail);
                    CC.save();
                });
            });
        }
        User.findById(req.params.id ,(err ,sender)=>{
            if(err){throw err}
            sender.sentMails.push(mail);
            sender.save(()=>{
                res.redirect("/users/"+req.params.id+"/mails/sent");
            });
        });
    });
});


// Re-Sending a sent mail
router.post("/users/:id/mails/sent/:mailId/reSent" ,(req ,res)=>{
    Mail.findById(req.params.mailId ,(err ,mail)=>{
        if(err){throw err;}
        var receivers = req.body.sentTo.split(",");
        if(req.body.CCs !== undefined){
            var CCs = req.body.CCs.split(",");
        }
        receivers.forEach(function(receiver){
            var elt = {
                sending_type: 'send',
                sent_to: receiver,
                sent_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                read: false
            }
            mail.sending_history.push(elt);
            User.findById(receiver ,(err ,receiver)=>{
                if(err){throw err;}
                receiver.receivedMails.push(mail);
                receiver.save();
            });
        });
        if(req.body.CCs !== undefined){
            CCs.forEach(function(CC){
                var elt = {
                    sending_type: 'CC',
                    sent_to: CC,
                    sent_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                    read: false
                }
                mail.sending_history.push(elt);
                User.findById(CC ,(err ,CC)=>{
                    if(err){throw err;}
                    CC.receivedMails.push(mail);
                    CC.save();
                });
            });
        }
        mail.save((err)=>{
            if(err){throw err;}
            res.redirect("/users/"+req.params.id+"/mails/sent");
        })
        
    });
});

//show the templet for replying to a mail
router.get("/users/:id/mails/received/:mailId/replies/new" ,(req ,res)=>{
    User.findById(req.params.id ,'-children' ,(err ,user)=>{
        if(err){throw err;}
        else{
            Mail.findById(req.params.mailId).populate([{
                path: 'sent_by',
                select: '-children -sentMessages -receivedMessages -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
            },{
                path: 'sending_history.sent_to',
                select: '-children -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
            }]).exec((err , receivedMail)=>{
                if(err){throw err;}
                var mail = {
                    _id: receivedMail._id,
                    title: receivedMail.title,
                    sent_by: receivedMail.sent_by,
                    receivers: []
                }
                for(var i = 0 ;i < receivedMail.sending_history.length ;i++){
                    if(receivedMail.sending_history[i].sent_to._id != req.params.id){
                        mail.receivers.push({
                            _id: receivedMail.sending_history[i].sent_to._id,
                            username: receivedMail.sending_history[i].sent_to.username,
                            imageUrl: receivedMail.sending_history[i].sent_to.imageUrl
                        });
                    }
                }
                res.render("users/newMailReply" ,{user: user ,mail: mail});
            });
        }
    });
});


//sending a reply
router.post("/users/:id/mails/received/:mailId/replies" ,(req ,res)=>{
    if(req.body.visibleTo !== undefined){
        var visibleTo = req.body.visibleTo.split(",");
    }
    var mail = new Mail({
        sent_by: req.params.id,
        title: req.body.title,
        text: req.body.text,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    });
    if(req.body.visibleTo !== undefined){
        visibleTo.forEach(function(vt){
            var elt = {
                sending_type: 'visible',
                sent_to: vt,
                sent_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                read: false
            }
            mail.sending_history.push(elt);
        });
    }
    mail.save((err ,mail)=>{
        if(err){throw err}
        if(req.body.visibleTo !== undefined){
            visibleTo.forEach(function(vtId){
                User.findById(vtId ,(err ,vt)=>{
                    if(err){throw err}
                    vt.receivedMails.push(mail);
                    vt.save();
                });
            });
        }
        User.findById(req.params.id ,(err ,sender)=>{
            if(err){throw err}
            sender.sentMails.push(mail);
            sender.save(()=>{
                Mail.findById(req.params.mailId ,(err ,parentMail)=>{
                    if(err){throw err;}
                    parentMail.replies.push(mail);
                    parentMail.save(()=>{
                        res.redirect("/users/"+req.params.id+"/mails/sent");
                    });
                });
            });
        });
    });
});


//show a sent mail's replies
router.get("/users/:id/mails/sent/:mailId/replies" ,(req ,res)=>{
    User.findById(req.params.id ,'-events' ,(err ,user)=>{
        if(err){throw err;}
        else{
            Mail.findById(req.params.mailId)
            .populate({
                path: 'replies',
                populate: [{
                    path: 'sent_by',
                    select: '-children -sentMessages -receivedMessages -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
                },{
                    path: 'sending_history.sent_to',
                    select: '-children -sentMessages -receivedMessages -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
                }]
            })
            .exec((err , mail)=>{
                if(err){throw err;}
                var replies = [];
                mail.replies.forEach(function(mr){
                    var reply = {
                        _id: mr._id,
                        title: mr.title,
                        sent_by: mr.sent_by.username,
                        senderImage: mr.sent_by.imageUrl
                    }
                    mr.sending_history.forEach(function(elt){
                        if(elt.sent_to._id == req.params.id){
                            reply.received_at = elt.sent_at;
                            reply.read = elt.read;
                        }
                    });
                    replies.push(reply);
                });
                res.render("users/sentMailReplies" ,{user: user ,mailId: req.params.mailId ,replies: replies});
            });
        }
    });
});



module.exports = router;