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
                    res.render("users/newMail" ,{user: user ,sendTo: undefined,usersList: JSON.stringify(usersList)});
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
            user.depopulate('receivedMails');
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
        populate: [{
            path: 'sending_history.sent_to',
            select: '-events -sentMessages -receivedMessages -tags -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
        },{
            path: 'replies',
            select: '-title -text -replies',
            populate: {
                path: 'sent_by',
                select: '-events -sentMessages -receivedMessages -tags -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
            }
        }]
    })
    .exec((err ,user)=>{
        if(err){throw err;}
        else{
            var sentMails = [];


            user.sentMails.forEach(function(sm){
                var sentMail = {
                    _id: sm._id,
                    title: sm.title,
                    sending_history: sm.sending_history,
                    replies: []
                }
                sm.replies.forEach(function(r){
                    var reply = {
                        _id: r._id,
                        created_at: r.created_at,
                        senderUsername: r.sent_by.username,
                        senderImage: r.sent_by.imageUrl
                    }
                    r.sending_history.forEach(function(elt){
                        if(elt.sent_to == user.id){
                            reply.read = elt.read;
                        }
                    });
                    sentMail.replies.push(reply);
                });
                sentMails.push(sentMail);
            });

            user.depopulate('sentMails');
            res.render("users/sentMails" ,{user: user ,sentMails: sentMails});
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
                            res.render("users/sentMailContent" ,{user: user ,mail: mail ,usersList: JSON.stringify(usersList)});
                        });
                        // console.log(mail);
                    });
                }
            });
        }
    });
});

//show a received mail's content
router.get("/users/:id/mails/received/:mailId/content" ,(req ,res)=>{
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
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        usersThatDidNotDelete: []
    });
    mail.usersThatDidNotDelete.push(req.params.id);
    receivers.forEach(function(receiver){
        var elt = {
            sending_type: 'send',
            sent_to: receiver,
            sent_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            read: false
        }
        mail.sending_history.push(elt);
        mail.usersThatDidNotDelete.push(receiver);
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
            mail.usersThatDidNotDelete.push(CC);
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
            mail.usersThatDidNotDelete.push(receiver);
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
                mail.usersThatDidNotDelete.push(CC);
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
                res.render("users/newMailReply" ,{user: user ,mail: mail ,type: 'received'});
            });
        }
    });
});
router.get("/users/:id/mails/sent/:mailId/replies/new" ,(req ,res)=>{
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
                res.render("users/newMailReply" ,{user: user ,mail: mail ,type: 'sent'});
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
            mail.usersThatDidNotDelete.push(vt);
        });
    }
    mail.usersThatDidNotDelete.push(req.params.id);
    mail.save((err ,mail)=>{
        if(err){throw err}
        if(req.body.visibleTo !== undefined){
            User.findById(visibleTo[0] ,(err ,vt)=>{
                if(err){throw err}
                vt.receivedMails.push(mail);
                vt.save();
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
                        res.redirect("/users/"+req.params.id+"/mails/received/"+req.params.mailId+"/replies");
                    });
                });
            });
        });
    });
});
router.post("/users/:id/mails/sent/:mailId/replies" ,(req ,res)=>{
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
        for(var i = 1 ; i < visibleTo.length ;i++){
            var elt = {
                sending_type: 'visible',
                sent_to: visibleTo[i],
                sent_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                read: false
            }
            mail.sending_history.push(elt);
            mail.usersThatDidNotDelete.push(visibleTo[i]);
        }
    }
    mail.usersThatDidNotDelete.push(req.params.id);
    mail.save((err ,mail)=>{
        if(err){throw err}
        User.findById(req.params.id ,(err ,sender)=>{
            if(err){throw err}
            sender.sentMails.push(mail);
            sender.save(()=>{
                Mail.findById(req.params.mailId ,(err ,parentMail)=>{
                    if(err){throw err;}
                    parentMail.replies.push(mail);
                    parentMail.save(()=>{
                        res.redirect("/users/"+req.params.id+"/mails/sent/"+req.params.mailId+"/replies");
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
                    select: '-sentMessages -receivedMessages -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
                },{
                    path: 'sending_history.sent_to',
                    select: '-sentMessages -receivedMessages -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
                }]
            })
            .exec((err , mail)=>{
                if(err){throw err;}
                var replies = [];
                mail.replies.forEach(function(mr){
                    if(mr.usersThatDidNotDelete.indexOf(user.id) > -1){
                        var reply = {
                            _id: mr._id,
                            title: mr.title,
                            senderId : mr.sent_by.id,
                            sent_by: mr.sent_by.username,
                            senderImage: mr.sent_by.imageUrl
                        }
                        if(reply.senderId == user._id){
                            reply.sending_history = mr.sending_history;
                        }else{
                            mr.sending_history.forEach(function(elt){
                                if(elt.sent_to._id == req.params.id){
                                    reply.received_at = elt.sent_at;
                                    reply.read = elt.read;
                                }
                            });
                        }
                        replies.push(reply);
                    }
                });
                // console.log(replies);
                res.render("users/sentMailReplies" ,{user: user ,mailId: req.params.mailId ,replies: replies});
            });
        }
    });
});

//show a received mail's replies
router.get("/users/:id/mails/received/:mailId/replies" ,(req ,res)=>{
    User.findById(req.params.id ,'-events' ,(err ,user)=>{
        if(err){throw err;}
        else{
            Mail.findById(req.params.mailId)
            .populate({
                path: 'replies',
                populate: [{
                    path: 'sent_by',
                    select: '-sentMessages -receivedMessages -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
                },{
                    path: 'sending_history.sent_to',
                    select: '-sentMessages -receivedMessages -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
                }]
            })
            .exec((err , mail)=>{
                if(err){throw err;}
                var replies = [];
                mail.replies.forEach(function(mr){
                    if(mr.usersThatDidNotDelete.indexOf(user.id) > -1){
                        var reply = {
                            _id: mr._id,
                            title: mr.title,
                            senderId : mr.sent_by.id,
                            sent_by: mr.sent_by.username,
                            senderImage: mr.sent_by.imageUrl
                        }
                        if(reply.senderId == user.id){
                            reply.sending_history = mr.sending_history;
                        }else{
                            mr.sending_history.forEach(function(elt){
                                if(elt.sent_to._id == req.params.id){
                                    reply.received_at = elt.sent_at;
                                    reply.read = elt.read;
                                }
                            });
                        }
                        replies.push(reply);
                    }
                });
                res.render("users/receivedMailReplies" ,{user: user ,mailId: req.params.mailId ,replies: replies});
            });
        }
    });
});

//delete sent Mail
router.delete("/users/:id/mails/sent/:mailId" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        var index = user.sentMails.indexOf(req.params.mailId);
        if (index > -1) {
            user.sentMails.splice(index, 1);
            user.save();
        }
        Mail.findById(req.params.mailId ,(err ,mail)=>{
            if(err){throw err;}
            var index = mail.usersThatDidNotDelete.indexOf(req.params.id);
            if (index > -1) {
                mail.usersThatDidNotDelete.splice(index, 1);
                if(mail.usersThatDidNotDelete.length  == 0){
                    Mail.findByIdAndRemove(req.params.mailId ,(err)=>{
                        if(err){throw err;}
                        res.redirect("/users/"+req.params.id+"/mails/sent/");
                    });
                }else{
                    mail.save(()=>{
                        res.redirect("/users/"+req.params.id+"/mails/sent/");
                    });
                }
            }
        });
    });
});

//delete received mail
router.delete("/users/:id/mails/received/:mailId" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        var index = user.receivedMails.indexOf(req.params.mailId);
        if (index > -1) {
            user.receivedMails.splice(index, 1);
            user.save();
        }
        Mail.findById(req.params.mailId ,(err ,mail)=>{
            if(err){throw err;}
            var index = mail.usersThatDidNotDelete.indexOf(req.params.id);
            if (index > -1) {
                mail.usersThatDidNotDelete.splice(index, 1);
                //deleting replies of the deleted received mail
                var repliesIds = mail.replies;
                repliesIds.forEach(function(replyId){
                    Mail.findById(replyId ,(err ,reply)=>{
                        if(err){throw err;}
                        if(reply.sent_by == req.params.id){
                            var index2 = reply.usersThatDidNotDelete.indexOf(req.params.id);
                            if(index2 > -1){
                                reply.usersThatDidNotDelete.splice(index, 1);
                                if(reply.usersThatDidNotDelete.length == 0){
                                    Mail.findByIdAndRemove(reply._id);
                                }else{
                                    reply.save();
                                }
                            }
                        }
                    });
                });
                //if all users deleted the mail , then delete it from database
                if(mail.usersThatDidNotDelete.length  == 0){
                    Mail.findByIdAndRemove(req.params.mailId ,(err)=>{
                        if(err){throw err;}
                        res.redirect("/users/"+req.params.id+"/mails/received/");
                    });
                }else{
                    mail.save(()=>{
                        res.redirect("/users/"+req.params.id+"/mails/received/");
                    });
                }
            }
        });
    });
});

//delete sent mail reply
router.delete("/users/:id/mails/sent/:mailId/replies/:replyId" ,(req ,res)=>{
    Mail.findById(req.params.replyId ,(err ,mail)=>{
        if(err){throw err;}
        var index = mail.usersThatDidNotDelete.indexOf(req.params.id);
        if (index > -1) {
            mail.usersThatDidNotDelete.splice(index, 1);
            if(mail.usersThatDidNotDelete.length  == 0){
                Mail.findByIdAndRemove(req.params.replyId ,(err)=>{
                    if(err){throw err;}
                    res.redirect("/users/"+req.params.id+"/mails/sent/"+req.params.mailId+"/replies");
                });
            }else{
                mail.save(()=>{
                    User.findById(req.params.id ,(err ,user)=>{
                        if(err){throw err;}
                        if(req.body.replyType == 'sentReply'){
                            var index = user.sentMails.indexOf(req.params.replyId);
                            if (index > -1) {
                                user.sentMails.splice(index, 1);
                            }
                        }else if(req.body.replyType == 'receivedReply'){
                            var index = user.receivedMails.indexOf(req.params.replyId);
                            if (index > -1) {
                                user.receivedMails.splice(index, 1);
                            }
                        }
                        user.save(()=>{
                            res.redirect("/users/"+req.params.id+"/mails/sent/"+req.params.mailId+"/replies");
                        })
                    });
                });
            }
        }
    });
});


//delete received mail reply
router.delete("/users/:id/mails/received/:mailId/replies/:replyId" ,(req ,res)=>{
    Mail.findById(req.params.replyId ,(err ,mail)=>{
        if(err){throw err;}
        var index = mail.usersThatDidNotDelete.indexOf(req.params.id);
        if (index > -1) {
            mail.usersThatDidNotDelete.splice(index, 1);
            if(mail.usersThatDidNotDelete.length == 0){
                Mail.findByIdAndRemove(req.params.replyId ,(err)=>{
                    if(err){throw err;}
                    res.redirect("/users/"+req.params.id+"/mails/received/"+req.params.mailId+"/replies");
                });
            }else{
                mail.save(()=>{
                    if(req.body.replyType == 'sentReply'){
                        User.findById(req.params.id ,(err ,user)=>{
                            if(err){throw err;}
                            var index = user.sentMails.indexOf(req.params.replyId);
                            if (index > -1) {
                                user.sentMails.splice(index, 1);
                            }
                            user.save();
                        });
                    }
                    res.redirect("/users/"+req.params.id+"/mails/received/"+req.params.mailId+"/replies");
                });
            }
        }
    });
});


//remove user from all usersThatDidNotDelete of replies that he deleted their
//      parent mail (only if he didnt receive the reply)(the parent mail was not sent by him)


module.exports = router;