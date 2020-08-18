const express = require("express");
const router = express.Router({mergeParams: true});
const User = require("../modules/user");
const Unit = require("../modules/unit");
const Project = require("../modules/project");
const Tree = require('../modules/projectTree');
const Mail = require('../modules/mail');
const Message = require('../modules/message');
const mongoose = require('mongoose');

const conn = require('../modules/connection');
const path = require('path');
// const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');





// init gfs
let gfsMail;
conn.once('open', () => {
  // init stream
  gfsMail = Grid(conn.db ,mongoose.mongo);
  gfsMail.collection('mailFiles');    //gfsMail is now like a mongoose model
});

// Storage
const mailFilesStorage = new GridFsStorage({
	url: "mongodb://localhost:27017/companydb",
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const fileInfo = {
                filename: file.originalname,
                bucketName: "mailFiles"
              };
              resolve(fileInfo);
        });
      }
});

//init upload
const mailFilesUpload = multer({
    storage: mailFilesStorage,
    fileFilter: function(req ,file ,cb){
    	checkFileType(file ,cb);
    }
});
//upload array of files midware
const arrUpload = mailFilesUpload.array('files', 12); // 'files' is the name of the input[type="file"] that contains the file


//check file type
function checkFileType(file ,cb){;
	//allowed extentions
	const allowedExtentions = /pdf|txt|tif|tiff|bmp|jpg|jpeg|gif|png|eps|raw|cr2|nef|orf|sr2|webm|mpg|mp2|mpeg|mpe|mpv|ogg|mp4|m4p|m4v|avi|wmv|mov|qt|flv|swf|avchd|flac|mpa|mp3|wav|wma|aac|pptx|ppsx|ppt|pps|pptm|potm|ppa|pot|mpotx|ppsm|potx|potm|doc|dot|docx|dotx|docm|dotm|rtf|xls|xlsx|xlsm|xlsb|xlt|xltx|xltm|xla|xlam|csv|vsd|pub/;
	//check extention
    const extname = allowedExtentions.test(path.extname(file.originalname).toLowerCase());
    //allowed mime types
    //check mime type
    const allowedMimeTypes = [
        "application/msword"
        ,"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ,"application/vnd.openxmlformats-officedocument.wordprocessingml.template"
        ,"application/vnd.ms-word.document.macroEnabled.12"
        ,"application/vnd.ms-excel"
        ,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ,"application/vnd.openxmlformats-officedocument.spreadsheetml.template"
        ,"application/vnd.ms-excel.sheet.macroEnabled.12"
        ,"application/vnd.ms-excel.template.macroEnabled.12"
        ,"application/vnd.ms-excel.addin.macroEnabled.12"
        ,"application/vnd.ms-excel.sheet.binary.macroEnabled.12"
        ,"application/vnd.ms-powerpoint"
        ,"application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ,"application/vnd.openxmlformats-officedocument.presentationml.template"
        ,"application/vnd.openxmlformats-officedocument.presentationml.slideshow"
        ,"application/vnd.ms-powerpoint.addin.macroEnabled.12"
        ,"application/vnd.ms-powerpoint.presentation.macroEnabled.12"
        ,"application/vnd.ms-powerpoint.template.macroEnabled.12"
        ,"application/vnd.ms-powerpoint.slideshow.macroEnabled.12"
        ,"application/vnd.visio"
        ,"text/csv"
        ,"application/pdf"
        ,"application/zip"
        ,"application/x-rar-compressed"
        ,"application/x-7z-compressed"
    ]
    var mimetype = false;
    if(file.mimetype.split("/")[0] == "video" ||file.mimetype.split("/")[0] == "image" || file.mimetype.split("/")[0] == "audio"){
        mimetype = true;
    }else{
        mimetype = (allowedMimeTypes.indexOf(file.mimetype) > -1) ? true : false;
    }

	//returning
	if(extname && mimetype){
		return cb(null ,true);
	}else{
		cb('ERROR : file not allowed !');
	}
}

//Read file
router.get('/mails/:mailId/files/:fileId' ,(req ,res)=>{
    const fileIdObj = new mongoose.mongo.ObjectId(req.params.fileId);
	gfsMail.exist({_id: fileIdObj ,root: 'mailFiles'} ,(err ,found)=>{
		if(err){throw err;}
		if(found){
            const readstream = gfsMail.createReadStream(fileIdObj);
			readstream.pipe(res);
		}else{
			console.log('file not found ............ ' + req.params.fileId);
		}
	});
});
//this one is for audios only cuz 'howl->src' must end with an extention ,and the audio name has an extention attached to it in the end.
router.get('/mails/:mailId/files/:fileId/:audioName' ,(req ,res)=>{
    const fileIdObj = new mongoose.mongo.ObjectId(req.params.fileId);
	gfsMail.exist({_id: fileIdObj ,root: 'mailFiles'} ,(err ,found)=>{
		if(err){throw err;}
		if(found){
            const readstream = gfsMail.createReadStream(fileIdObj);
			readstream.pipe(res);
		}else{
			console.log('file not found ............ ' + req.params.fileId);
		}
	});
});

// router.get('/mails/:mailId/files/:filename' ,(req ,res)=>{
//     gfsMail.files.findOne({filename: req.params.filename} ,(err ,file)=>{
//         if(err){throw err;}
//         if(file){
//             const readstream = gfsMail.createReadStream(req.params.filename);
//             readstream.pipe(res);
//         }else{
//             console.log('file not found ............ ' + req.params.fileId);
//             throw err;
//         }
//     });
// });





//play video
router.get("/mails/:mailId/files/videos/:fileId/play" ,(req ,res)=>{
	res.render("users/videoPlayer" ,{iddd: req.params.mailId ,offf: 'mails' ,fileId: req.params.fileId ,filename: req.query.videoName});
});

//play audio
router.get("/mails/:mailId/files/audios/:fileId/play" ,(req ,res)=>{
	res.render("users/audioPlayer" ,{iddd: req.params.mailId ,offf: 'mails' ,fileId: req.params.fileId ,filename: req.query.audioName});
});

//preview images and texts
// router.get("/mails/:mailId/files/:fileId/preview" ,(req ,res)=>{
// 	res.render("users/filePreview" ,{fileId: req.params.fileId});
// });


//delete mail files
function deleteMailFiles(filesToDelete){
    filesToDelete.forEach(function(fileId){
        const fileIdObj = new mongoose.mongo.ObjectId(fileId);
        gfsMail.remove({_id: fileIdObj ,root:'mailFiles'}, function (err) {
            if (err) {throw err;}
          });
    });
}   















//show the templet of sending new mail
router.get("/users/:id/mails/sent/new" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            User.find({} ,'-events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl' ,(err ,usersList)=>{
                if(err){throw err;}
                if(req.query.sendTo == undefined){
                    res.render("users/newMail" ,{user: user ,sendTo: undefined,usersList: usersList});//JSON.stringify(usersList)
                }else{
                    User.findById(req.query.sendTo ,(err ,sendTo)=>{
                        if(err){throw err}
                        res.render("users/newMail" ,{user: user ,sendTo: sendTo,usersList: usersList});//JSON.stringify(usersList)
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
            // var totalMailsSize = 0;
            user.receivedMails.forEach(function(rm){
                var receivedMail = {
                    _id: rm._id,
                    title: rm.title,
                    sent_by: rm.sent_by.username,
                    senderImage: rm.sent_by.imageUrl,
                    size: rm.mailSize
                }
                rm.sending_history.forEach(function(elt){
                    if(elt.sent_to == user.id){
                        receivedMail.received_at = elt.sent_at;
                        receivedMail.sending_type = elt.sending_type;
                        receivedMail.read = elt.read;
                    }
                });
                // totalMailsSize += rm.mailSize;
                receivedMails.push(receivedMail);
            });
            //sort the mails from newest to oldest
            var sortedReceivedMails = receivedMails.sort( (a ,b) => {
                return (a.received_at < b.received_at) ? 1 : -1;
            });

            //depopulate user.receuvedMails
            user.depopulate('receivedMails');

            const promise = new Promise((resolve ,reject) => {
                var removedCount = 0;
                var updatedMailNotificationsArray = user.mailNotifications.array.filter(notification => {
                    if(notification.notifType != 'newMail'){
                        return true;
                    }else{
                        removedCount = removedCount + notification.count;
                    }
                });
                var updatedMailNotificationsCount = user.mailNotifications.count;
                if(user.mailNotifications.count >= removedCount){
                    updatedMailNotificationsCount = updatedMailNotificationsCount - removedCount;
                }
                const updatedMailNotifications = {
                    count: updatedMailNotificationsCount,
                    array: updatedMailNotificationsArray
                }
                resolve(updatedMailNotifications);
            });
            
            promise
            .then(updatedMailNotifications => {
                User.findByIdAndUpdate(user._id ,{$set:{mailNotifications:updatedMailNotifications}} ,{new: true} ,(err ,user) => {
                    if(err){throw err;}
                    res.render("users/receivedMails" ,{user: user ,receivedMails: sortedReceivedMails});// ,totalMailsSize: totalMailsSize
                });
            });
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
            // var totalMailsSize = 0;
            user.sentMails.forEach(function(sm){
                var sentMail = {
                    _id: sm._id,
                    title: sm.title,
                    sending_history: sm.sending_history,
                    replies: [],
                    size: sm.mailSize
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
                // totalMailsSize += sm.mailSize;
                sentMails.push(sentMail);
            });

            //sort the mails from newest to oldest
            var sortedSentMails = sentMails.sort( (a ,b) => {
                return (a.created_at < b.created_at) ? 1 : -1;
            });

            //depopulate user.receuvedMails
            user.depopulate('sentMails');
            res.render("users/sentMails" ,{user: user ,sentMails: sortedSentMails});// ,totalMailsSize: totalMailsSize
        }
    });
});



//////////////manipulating files
//files extentions
const pdfExt = /pdf/;
const txtExt = /txt/;
const imageExt = /tif|tiff|bmp|jpg|jpeg|gif|png|eps|raw|cr2|nef|orf|sr2/;
const videoExt = /webm|mpg|mp2|mpeg|mpe|mpv|ogg|mp4|m4p|m4v|avi|wmv|mov|qt|flv|swf|avchd/;
const audioExt = /flac|mpa|mp3|wav|wma|aac/;
const powerPointExt = /pptx|ppsx|ppt|pps|pptm|potm|ppa|mpotx|ppsm|pot|ppa/;
const wordExt = /doc|dot|docx|dotx|docm|dotm|/;
const excelExt = /xls|xlsx|xlsm|xlsb|xlt|xltx|xltm|xla|xlam/;
const visioExt = /vsd|vsdx|vsdm|svg/;
const publisherExt = /pub/;
//get file and determine its extention
function getMailFile(fileId){
    return new Promise((resolve ,reject) => {
        const fileIdObj = new mongoose.mongo.ObjectId(fileId);
        gfsMail.files.findOne({_id: fileIdObj} ,(err ,file)=>{
            if(err){reject(err);}
            if(file){
                switch(true){
                    case pdfExt.test(path.extname(file.filename).toLowerCase()):
                        file.fileType = 'pdf';
                        break;
                    case txtExt.test(path.extname(file.filename).toLowerCase()):
                        file.fileType = 'text';
                        break;
                    case imageExt.test(path.extname(file.filename).toLowerCase()):
                        file.fileType = 'image';
                        break;
                    case videoExt.test(path.extname(file.filename).toLowerCase()):
                        file.fileType = 'video';
                        break;
                    case audioExt.test(path.extname(file.filename).toLowerCase()):
                        file.fileType = 'audio';
                        break;
                    case powerPointExt.test(path.extname(file.filename).toLowerCase()):
                        file.fileType = 'powerPoint';
                        break;
                    case wordExt.test(path.extname(file.filename).toLowerCase()):
                        file.fileType = 'word';
                        break;
                    case excelExt.test(path.extname(file.filename).toLowerCase()):
                        file.fileType = 'excel';
                        break;
                    case visioExt.test(path.extname(file.filename).toLowerCase()):
                        file.fileType = 'visio';
                        break;
                    case publisherExt.test(path.extname(file.filename).toLowerCase()):
                        file.fileType = 'publisher';
                        break;
                    default:
                        file.fileType = 'other';
                        break;
                }
                resolve(file);
            }
        });
    });
}
//populate files array
async function populateMailFiles(mailFiles){
    try{
        var files = [];
        const n = mailFiles.length;
        for(var i = 0 ; i < n ; i++){
            file = await getMailFile(mailFiles[i]);
            files.push(file);
        };
        return files;
    }catch(err){
        throw err;
    }
}

//show a sent mail's content
router.get("/users/:id/mails/sent/:mailId/content" ,(req ,res)=>{
    User.findById(req.params.id ,'-children -events' ,(err ,user)=>{
        if(err){throw err;}
        else{
            Mail.findById(req.params.mailId).populate({
                path: 'sending_history.sent_to',
                select: '-children -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
            }).exec((err , mail)=>{
                if(err){throw err;}
                User.find({} ,'-children -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl' ,(err ,usersList)=>{
                    if(err){throw err;}

                    populateMailFiles(mail.files)
                    .then(files => {
                        res.render("users/sentMailContent" ,{user: user ,mail: mail ,files: files ,usersList: usersList});//JSON.stringify(usersList)
                    });
                    
                });
            });
            
        }
    });
});

//show a received mail's content
router.get("/users/:id/mails/received/:mailId/content" ,(req ,res)=>{
    var io = req.app.get('io');
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
                                receivedMail.save(() => {
                                    io.to(receivedMail.sent_by._id).emit('mailRead' ,req.params.id);
                                });
                            }
                            break;
                        }
                    }
                    populateMailFiles(receivedMail.files)
                    .then(files => {
                        const promise = new Promise((resolve ,reject) => {
                            var updatedMailNotificationsArray = user.mailNotifications.array.filter(notification => {
                                if(notification.mailId != req.params.mailId && notification.replyId != req.params.mailId){
                                    return true;
                                }
                            });
                            var updatedMailNotificationsCount = user.mailNotifications.count;
                            if(user.mailNotifications.count > 0){
                                updatedMailNotificationsCount = updatedMailNotificationsCount - 1;
                            }
                            const updatedMailNotifications = {
                                count: updatedMailNotificationsCount,
                                array: updatedMailNotificationsArray
                            }
                            resolve(updatedMailNotifications);
                        });
                        
                        promise
                        .then(updatedMailNotifications => {
                            User.findByIdAndUpdate(user._id ,{$set:{mailNotifications:updatedMailNotifications}} ,{new: true} ,(err ,user) => {
                                if(err){throw err;}
                                res.render("users/receivedMailContent" ,{user: user ,mail: mail ,files: files ,usersList: JSON.stringify(usersList)});
                            });
                        });
                    });
                });
            });
        }
    });
});

function de_duplicate(array){
    var a = array;
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j]){
                a.splice(j--, 1);
            }
        }
    }
    return a;
}
//sending new mail
router.post("/users/:id/mails/sent"  ,arrUpload ,(req ,res)=>{
    var io = req.app.get('io');
    User.findById(req.params.id ,(err ,sender)=>{
        if(err){throw err}
        var sentTo = [];
        var CCs = [];
        if(req.body.sentTo !== undefined){
            sentTo = req.body.sentTo.split(",");
        }
        if(req.body.CCs !== undefined){
            CCs = req.body.CCs.split(",");
        }
        var mail = new Mail({
            sent_by: req.params.id,
            title: req.body.title,
            text: req.body.text,
            created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            usersThatDidNotDelete: [],
            mailSize: 0
        });
        mail.usersThatDidNotDelete.push(req.params.id);

        //calculating mail size
        var textSize = Buffer.byteLength(req.body.text);
        var filesSize = 0;
        req.files.forEach(function(file){
            mail.files.push(file.id);
            filesSize += file.size;
        });
        mail.mailSize = textSize + filesSize;

        //checking the sender's sent mails storage
        if(Number(sender.usedSentMailsStorage) + mail.mailSize < Number(sender.sentMailsStorage)){
            //send mail
            sentTo.forEach(function(stid){
                var elt = {
                    sending_type: 'send',
                    sent_to: stid,
                    sent_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                    read: false
                }
                mail.sending_history.push(elt);
                mail.usersThatDidNotDelete.push(stid);
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
                var newMailInfos ={
                    notifType: 'newMail',
                    mailId: mail._id,
                    mailSize: mail.mailSize,
                    mailType: '',
                    senderId: sender.id,
                    count: 1,
                    senderUsername: sender.username,
                    senderImage: sender.imageUrl,
                    at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                }
                if(mail.title == ''){
                    newMailInfos.title = 'None';
                }else{
                    newMailInfos.title = mail.title;
                }
                sentTo.forEach(function(stId){
                    User.findById(stId ,(err ,st)=>{
                        if(err){throw err}
                        if(Number(st.usedReceivedMailsStorage) + Number(mail.mailSize) < Number(st.receivedMailsStorage)){
                            st.receivedMails.push(mail);
                            st.usedReceivedMailsStorage = st.usedReceivedMailsStorage + mail.mailSize;
                            //handle new received mail notification
                            io.to(st._id).emit('newMail' ,newMailInfos);
                            var count = 1;
			                st.mailNotifications.array.forEach(notification => {
			                	if(notification.senderId == newMailInfos.senderId && notification.notifType == 'newMail'){
                                    count = notification.count + 1;
			                		st.mailNotifications.array.splice(st.mailNotifications.array.indexOf(notification) ,1);
			                	}
                            });
                            newMailInfos.count = count;
                            st.mailNotifications.array.push(newMailInfos);
			                st.mailNotifications.count = st.mailNotifications.count + 1;
                            //handle almost full received mails storage notification
                            const per = Number(st.usedReceivedMailsStorage) * 100 / Number(st.receivedMailsStorage);
                            if(per > 95){
                                io.to(st._id).emit('receivedMailsStorageAlmostFullNotification');
                                const notification = {
                                    notifType: 'almostFullReceivedMailsStorage'
                                }
                                st.mailNotifications.count = st.mailNotifications.count + 1;
                                st.mailNotifications.array.push(notification);
                            }
                        }else{
                            //creating notif
                            const notification = {
                                notifType : 'mailSendFailed',
                                mailTitle: mail.title,
                                at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                senderId: sender.id,
                                senderUsername: sender.username,
                                userThatDidNotReceiveId: st.id,
                                userThatDidNotReceiveUsername: st.username
                            }
                            //notifiying the sender
                            var updatedMailNotifications = {
                                count: sender.mailNotifications.count + 1,
                                array: sender.mailNotifications.array,
                            }
                            updatedMailNotifications.array.push(notification);
                            User.findByIdAndUpdate(sender._id ,{$set:{mailNotifications:updatedMailNotifications}} ,{new: true} ,(err ,user) => {if(err){throw err;}});

                            //notifiying the user that did not receive
                            io.to(st._id).emit('missedMailNotification' ,notification);
                            st.mailNotifications.count = st.mailNotifications.count + 1;
                            st.mailNotifications.array.push(notification);

                            //edit usersThatDidNotDelete
                            var index = mail.usersThatDidNotDelete.indexOf(st._id);
                            if(index > -1){
                                mail.usersThatDidNotDelete.splice(index ,1);
                            }
                            mail.save();

                        }
                        st.save();
                    });
                });
                if(req.body.CCs !== undefined){
                    CCs.forEach(function(ccId){
                        User.findById(ccId ,(err ,CC)=>{
                            if(err){throw err}
                            if(Number(CC.usedReceivedMailsStorage) + Number(mail.mailSize) < Number(CC.receivedMailsStorage)){
                                CC.receivedMails.push(mail);
                                CC.usedReceivedMailsStorage = CC.usedReceivedMailsStorage + mail.mailSize;
                                
                                //handle new received mail notification
                                newMailInfos.mailType = 'CC';
                                io.to(CC._id).emit('newMail' ,newMailInfos);
                                var count = 1;
			                    CC.mailNotifications.array.forEach(notification => {
			                    	if(notification.senderId == newMailInfos.senderId && notification.notifType == 'newMail'){
                                        count = notification.count + 1;
			                    		CC.mailNotifications.array.splice(CC.mailNotifications.array.indexOf(notification) ,1);
			                    	}
                                });
                                newMailInfos.count = count;
                                CC.mailNotifications.array.push(newMailInfos);
			                    CC.mailNotifications.count = CC.mailNotifications.count + 1;
                                //handle almost full received mails storage notification
                                const per = Number(CC.usedReceivedMailsStorage) * 100 / Number(CC.receivedMailsStorage);
                                if(per > 95){
                                    io.to(CC._id).emit('receivedMailsStorageAlmostFullNotification');
                                    const notification = {
                                        notifType: 'almostFullReceivedMailsStorage'
                                    }
                                    CC.mailNotifications.count = CC.mailNotifications.count + 1;
                                    CC.mailNotifications.array.push(notification);
                                }     
                            }else{
                                //creating notif
                                const notification = {
                                    notifType : 'mailSendFailed',
                                    mailTitle: mail.title,
                                    at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                    senderId: sender.id,
                                    senderUsername: sender.username,
                                    userThatDidNotReceiveId: CC.id,
                                    userThatDidNotReceiveUsername: CC.username
                                }

                                //notifiying the sender
                                var updatedMailNotifications = {
                                    count: sender.mailNotifications.count + 1,
                                    array: sender.mailNotifications.array,
                                }
                                updatedMailNotifications.array.push(notification);
                                User.findByIdAndUpdate(sender._id ,{$set:{mailNotifications:updatedMailNotifications}} ,{new: true} ,(err ,user) => {if(err){throw err;}});
                                
                                //notifiying the user that did not receive
                                io.to(CC._id).emit('missedMailNotification' ,notification);
                                CC.mailNotifications.count = CC.mailNotifications.count + 1;
                                CC.mailNotifications.array.push(notification);

                                //edit usersThatDidNotDelete
                                var index = mail.usersThatDidNotDelete.indexOf(CC._id);
                                if(index > -1){
                                    mail.usersThatDidNotDelete.splice(index ,1);
                                }
                                mail.save();
                            }
                            CC.save();
                        });
                    });
                }
                sender.sentMails.push(mail);
                sender.usedSentMailsStorage = sender.usedSentMailsStorage + mail.mailSize;
                //handle almost full sent mails storage notification
                const per = Number(sender.usedSentMailsStorage) * 100 / Number(sender.sentMailsStorage);
                if(per > 95){
                    io.to(sender._id).emit('sentMailsStorageAlmostFullNotification');
                    const notification = {
                        notifType: 'almostFullSentMailsStorage'
                    }
                    sender.mailNotifications.count = sender.mailNotifications.count + 1;
                    sender.mailNotifications.array.push(notification);
                }
                sender.save(()=>{
                    res.redirect("/users/"+req.params.id+"/mails/sent");
                });
            });
        }else{
            //handle not Able To Send Mail Cuz Full sent mails Storage Notification
            const notification = {
                notifType: 'notAbleToSendMailCuzFullSentMailsStorage',
                mailTitle: mail.title
            }
            io.to(sender.id).emit('notAbleToSendMailCuzFullSentMailsStorageNotification' ,notification);
            sender.mailNotifications.count = sender.mailNotifications.count + 1;
            sender.mailNotifications.array.push(notification);
            sender.save(()=>{
                res.redirect("/users/"+req.params.id+"/mails/sent");
            });
        }
    });
});


// Re-Sending a sent mail
router.post("/users/:id/mails/sent/:mailId/reSent" ,(req ,res)=>{
    var io = req.app.get('io');
    User.findById(req.params.id ,(err ,sender)=>{
        if(err){throw err}
        var sentTo = [];
        var CCs = [];
        if(req.body.sentTo !== undefined){
            sentTo = req.body.sentTo.split(",");
        }
        if(req.body.CCs !== undefined){
            CCs = req.body.CCs.split(",");
        }
        Mail.findById(req.params.mailId ,(err ,mail)=>{
            if(err){throw err;}
            var newMailInfos = {
                notifType: 'newMail',
                mailId: mail._id,
                mailSize: mail.mailSize,
                mailType: '',
                senderId: sender.id,
                count: 1,
                senderUsername: sender.username,
                senderImage: sender.imageUrl,
                at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            }
            if(mail.title == ''){
                newMailInfos.title = 'None';
            }else{
                newMailInfos.title = mail.title;
            }
            sentTo.forEach(function(stid){
                var elt = {
                    sending_type: 'send',
                    sent_to: stid,
                    sent_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                    read: false
                }
                mail.sending_history.push(elt);
                mail.usersThatDidNotDelete.push(stid);
                User.findById(stid ,(err ,st)=>{
                    if(err){throw err;}
                    if(Number(st.usedReceivedMailsStorage) + Number(mail.mailSize) < Number(st.receivedMailsStorage)){
                        st.receivedMails.push(mail);
                        st.usedReceivedMailsStorage = st.usedReceivedMailsStorage + mail.mailSize;
                        //handle new received mail notification
                        io.to(st._id).emit('newMail' ,newMailInfos);
                        var count = 1;
                        st.mailNotifications.array.forEach(notification => {
                            if(notification.senderId == newMailInfos.senderId && notification.notifType == 'newMail'){
                                count = notification.count + 1;
                                st.mailNotifications.array.splice(st.mailNotifications.array.indexOf(notification) ,1);
                            }
                        });
                        newMailInfos.count = count;
                        st.mailNotifications.array.push(newMailInfos);
                        st.mailNotifications.count = st.mailNotifications.count + 1;
                        //handle almost full received mails storage notification
                        const per = Number(st.usedReceivedMailsStorage) * 100 / Number(st.receivedMailsStorage);
                        if(per > 95){
                            io.to(st._id).emit('receivedMailsStorageAlmostFullNotification');
                            const notification = {
                                notifType: 'almostFullReceivedMailsStorage'
                            }
                            st.mailNotifications.count = st.mailNotifications.count + 1;
                            st.mailNotifications.array.push(notification);
                        }
                    }else{
                        //creating notif
                        const notification = {
                            notifType : 'mailSendFailed',
                            mailTitle: mail.title,
                            at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                            senderId: sender.id,
                            senderUsername: sender.username,
                            userThatDidNotReceiveId: st.id,
                            userThatDidNotReceiveUsername: st.username
                        }
                        //notifiying the sender
                        var updatedMailNotifications = {
                            count: sender.mailNotifications.count + 1,
                            array: sender.mailNotifications.array,
                        }
                        updatedMailNotifications.array.push(notification);
                        User.findByIdAndUpdate(sender._id ,{$set:{mailNotifications:updatedMailNotifications}} ,{new: true} ,(err ,user) => {if(err){throw err;}});
                        //notifiying the user that did not receive
                        io.to(st._id).emit('missedMailNotification' ,notification);
                        st.mailNotifications.count = st.mailNotifications.count + 1;
                        st.mailNotifications.array.push(notification);

                        //edit usersThatDidNotDelete
                        var index = mail.usersThatDidNotDelete.indexOf(st._id);
                        if(index > -1){
                            mail.usersThatDidNotDelete.splice(index ,1);
                        }
                        
                    }
                    st.save();
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
                        if(Number(CC.usedReceivedMailsStorage) + Number(mail.mailSize) < Number(CC.receivedMailsStorage)){
                            CC.receivedMails.push(mail);
                            CC.usedReceivedMailsStorage = CC.usedReceivedMailsStorage + mail.mailSize;
                            //handle new received mail notification
                            newMailInfos.mailType = 'CC';
                            io.to(CC._id).emit('newMail' ,newMailInfos);
                            var count = 1;
			                CC.mailNotifications.array.forEach(notification => {
			                	if(notification.senderId == newMailInfos.senderId && notification.notifType == 'newMail'){
                                    count = notification.count + 1;
			                		CC.mailNotifications.array.splice(CC.mailNotifications.array.indexOf(notification) ,1);
			                	}
                            });
                            newMailInfos.count = count;
                            CC.mailNotifications.array.push(newMailInfos);
			                CC.mailNotifications.count = CC.mailNotifications.count + 1;
                            //handle almost full received mails storage notification
                            const per = Number(CC.usedReceivedMailsStorage) * 100 / Number(CC.receivedMailsStorage);
                            if(per > 95){
                                io.to(CC._id).emit('receivedMailsStorageAlmostFullNotification');
                                const notification = {
                                    notifType: 'almostFullReceivedMailsStorage'
                                }
                                CC.mailNotifications.count = CC.mailNotifications.count + 1;
                                CC.mailNotifications.array.push(notification);
                            }
                        }else{
                            //creating notif
                            const notification = {
                                notifType : 'mailSendFailed',
                                mailTitle: mail.title,
                                at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                senderId: sender.id,
                                senderUsername: sender.username,
                                userThatDidNotReceiveId: CC.id,
                                userThatDidNotReceiveUsername: CC.username
                            }
                            //notifiying the sender
                            var updatedMailNotifications = {
                                count: sender.mailNotifications.count + 1,
                                array: sender.mailNotifications.array,
                            }
                            updatedMailNotifications.array.push(notification);
                            User.findByIdAndUpdate(sender._id ,{$set:{mailNotifications:updatedMailNotifications}} ,{new: true} ,(err ,user) => {if(err){throw err;}});
                            //notifiying the user that did not receive
                            io.to(CC._id).emit('missedMailNotification' ,notification);
                            CC.mailNotifications.count = CC.mailNotifications.count + 1;
                            CC.mailNotifications.array.push(notification);

                            //edit usersThatDidNotDelete
                            var index = mail.usersThatDidNotDelete.indexOf(CC._id);
                            if(index > -1){
                                mail.usersThatDidNotDelete.splice(index ,1);
                            }
                            
                        }
                        CC.save();
                    });
                });
            }
            mail.save((err)=>{
                if(err){throw err;}
                res.redirect("/users/"+req.params.id+"/mails/sent");
            });
        });
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
router.post("/users/:id/mails/received/:mailId/replies" ,arrUpload ,(req ,res)=>{
    var io = req.app.get('io');
    User.findById(req.params.id ,(err ,sender)=>{
        if(err){throw err}
        if(req.body.visibleTo !== undefined){
            var visibleTo = req.body.visibleTo.split(",");
        }
        var mail = new Mail({
            sent_by: req.params.id,
            title: req.body.title,
            text: req.body.text,
            created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            usersThatDidNotDelete: [],
            mailSize: 0
        });

        //calculating mail size
        var textSize = Buffer.byteLength(req.body.text);
        var filesSize = 0;
        req.files.forEach(function(file){
            mail.files.push(file.id);
            filesSize += file.size;
        });
        mail.mailSize = textSize + filesSize;

        //checking the sender's sent mails storage
        if(Number(sender.usedSentMailsStorage) + mail.mailSize < Number(sender.sentMailsStorage)){
            //send mail
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
                        if(Number(vt.usedReceivedMailsStorage) + Number(mail.mailSize) < Number(vt.receivedMailsStorage)){
                            vt.receivedMails.push(mail);
                            vt.usedReceivedMailsStorage = vt.usedReceivedMailsStorage + mail.mailSize;
                            //handle almost full received mails storage notification
                            const per = Number(vt.usedReceivedMailsStorage) * 100 / Number(vt.receivedMailsStorage);
                            if(per > 95){
                                io.to(vt._id).emit('receivedMailsStorageAlmostFullNotification');
                                const notification = {
                                    notifType: 'almostFullReceivedMailsStorage'
                                }
                                vt.mailNotifications.count = vt.mailNotifications.count + 1;
                                vt.mailNotifications.array.push(notification);
                            }
                        }else{
                            //creating notif
                            const notification = {
                                notifType : 'mailSendFailed',
                                mailTitle: mail.title,
                                at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                senderId: sender.id,
                                senderUsername: sender.username,
                                userThatDidNotReceiveId: vt.id,
                                userThatDidNotReceiveUsername: vt.username
                            }

                            //notifiying the sender
                            var updatedMailNotifications = {
                                count: sender.mailNotifications.count + 1,
                                array: sender.mailNotifications.array,
                            }
                            updatedMailNotifications.array.push(notification);
                            User.findByIdAndUpdate(sender._id ,{$set:{mailNotifications:updatedMailNotifications}} ,{new: true} ,(err ,user) => {if(err){throw err;}});
                            
                            //notifiying the user that did not receive
                            io.to(vt._id).emit('missedMailNotification' ,notification);
                            vt.mailNotifications.count = vt.mailNotifications.count + 1;
                            vt.mailNotifications.array.push(notification);

                            //edit visibleTo
                            visibleTo.splice(0 ,1);

                            //edit usersThatDidNotDelete
                            var index = mail.usersThatDidNotDelete.indexOf(vt._id);
                            if(index > -1){
                                mail.usersThatDidNotDelete.splice(index ,1);
                            }
                            mail.save();
                        }
                        vt.save();
                    });
                }
                sender.sentMails.push(mail);
                sender.usedSentMailsStorage = sender.usedSentMailsStorage + mail.mailSize;
                //handle almost full sent mails storage notification
                const per = Number(sender.usedReceivedMailsStorage) * 100 / Number(sender.receivedMailsStorage);
                if(per > 95){
                    io.to(sender._id).emit('sentMailsStorageAlmostFullNotification');
                    const notification = {
                        notifType: 'almostFullSentMailsStorage'
                    }
                    sender.mailNotifications.count = sender.mailNotifications.count + 1;
                    sender.mailNotifications.array.push(notification);
                }
                sender.save(()=>{
                    Mail.findById(req.params.mailId).populate({
                        path: 'sent_by',
                        select: '-children -events -sentProjects -assignedProjects -receivedProjects -unit -area -profileUrl -sentMails -receivedMails -contacts'
                    }).exec((err ,parentMail)=>{
                        if(err){throw err;}
                        //
                        const newMailReplyInfos ={
                            notifType: 'newReply',
                            replyId: mail._id,
                            replyTitle: mail.title,
                            parentMail: req.params.mailId,
                            parentMailTitle: parentMail.title,
                            parentMailSender: parentMail.sent_by.id,
                            senderId: sender._id,
                            senderUsername: sender.username,
                            senderImage: sender.imageUrl,
                            mailSize: mail.mailSize,
                            at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                        }
                        visibleTo.forEach(function(vtid){
                            User.findById(vtid ,(err ,vt) =>{
                                if(err){throw err;}
                                io.to(vt._id).emit('newReply' ,newMailReplyInfos);
                                vt.mailNotifications.count = vt.mailNotifications.count + 1;
                                vt.mailNotifications.array.push(newMailReplyInfos);
                                vt.save();
                            });
                        });
                        //
                        parentMail.replies.push(mail);
                        parentMail.save(()=>{
                            res.redirect("/users/"+req.params.id+"/mails/received/"+req.params.mailId+"/replies");
                        });
                    });
                });
            });
        }else{
            //handle not Able To Send Mail Cuz Full sent mails Storage Notification
            const notification = {
                notifType: 'notAbleToSendMailCuzFullSentMailsStorage',
                mailTitle: mail.title
            }
            io.to(sender.id).emit('notAbleToSendMailCuzFullSentMailsStorageNotification' ,notification);
            sender.mailNotifications.count = sender.mailNotifications.count + 1;
            sender.mailNotifications.array.push(notification);
            sender.save(()=>{
                res.redirect("/users/"+req.params.id+"/mails/received/"+req.params.mailId+"/replies");
            });
        }
    });
});
router.post("/users/:id/mails/sent/:mailId/replies" , arrUpload,(req ,res)=>{
    var io = req.app.get('io');
    User.findById(req.params.id ,(err ,sender)=>{
        if(err){throw err}
        var visibleTo = [];
        if(req.body.visibleTo !== undefined){
            visibleTo = req.body.visibleTo.split(",");
        }
        var mail = new Mail({
            sent_by: req.params.id,
            title: req.body.title,
            text: req.body.text,
            created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        });

        //calculating mail size
        var textSize = Buffer.byteLength(req.body.text);
        var filesSize = 0;
        req.files.forEach(function(file){
            mail.files.push(file.id);
            filesSize += file.size;
        });
        mail.mailSize = textSize + filesSize;
        //checking the sender's sent mails storage
        if(Number(sender.usedSentMailsStorage) + mail.mailSize < Number(sender.sentMailsStorage)){
            //send mail
            if(req.body.visibleTo !== undefined){
                visibleTo.forEach(vt => {
                    var elt = {
                        sending_type: 'visible',
                        sent_to: vt,
                        sent_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        read: false
                    }
                    mail.sending_history.push(elt);
                    mail.usersThatDidNotDelete.push(vt);
                })
            }
            mail.usersThatDidNotDelete.push(req.params.id);
            mail.save((err ,mail)=>{
                if(err){throw err}
                sender.sentMails.push(mail);
                sender.usedSentMailsStorage = sender.usedSentMailsStorage + mail.mailSize;
                //handle almost full sent mails storage notification
                const per = Number(sender.usedReceivedMailsStorage) * 100 / Number(sender.receivedMailsStorage);
                if(per > 95){
                    io.to(sender._id).emit('sentMailsStorageAlmostFullNotification');
                    const notification = {
                        notifType: 'almostFullSentMailsStorage'
                    }
                    sender.mailNotifications.count = sender.mailNotifications.count + 1;
                    sender.mailNotifications.array.push(notification);
                }
                sender.save(()=>{
                    Mail.findById(req.params.mailId ,(err ,parentMail)=>{
                        if(err){throw err;}
                        const newMailReplyInfos ={
                            notifType: 'newReply',
                            replyId: mail._id,
                            replyTitle: mail.title,
                            parentMail: req.params.mailId,
                            parentMailTitle: parentMail.title,
                            parentMailSender: parentMail.sent_by,
                            senderId: sender._id,
                            senderUsername: sender.username,
                            senderImage: sender.imageUrl,
                            mailSize: mail.mailSize,
                            at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                        }
                        visibleTo.forEach(function(vtid){
                            User.findById(vtid ,(err ,vt) =>{
                                if(err){throw err;}
                                io.to(vt._id).emit('newReply' ,newMailReplyInfos);
                                vt.mailNotifications.count = vt.mailNotifications.count + 1;
                                vt.mailNotifications.array.push(newMailReplyInfos);
                                vt.save();
                            });
                        });
                        parentMail.replies.push(mail);
                        parentMail.save(()=>{
                            res.redirect("/users/"+req.params.id+"/mails/sent/"+req.params.mailId+"/replies");
                        });
                    });
                });
            });
        }else{
            //handle not Able To Send Mail Cuz Full sent mails Storage Notification
            const notification = {
                notifType: 'notAbleToSendMailCuzFullSentMailsStorage',
                mailTitle: mail.title
            }
            io.to(sender.id).emit('notAbleToSendMailCuzFullSentMailsStorageNotification' ,notification);
            sender.mailNotifications.count = sender.mailNotifications.count + 1;
            sender.mailNotifications.array.push(notification);
            sender.save(() => {
                res.redirect("/users/"+req.params.id+"/mails/sent/"+req.params.mailId+"/replies");
            });
        }
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
                            senderImage: mr.sent_by.imageUrl,
                            size: mr.mailSize
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

                const promise = new Promise((resolve ,reject) => {
                    var removedCount = 0;
                    var updatedMailNotificationsArray = user.mailNotifications.array.filter(notification => {
                        if(notification.notifType != 'newReply' || notification.parentMail != req.params.mailId){
                            return true;
                        }else{
                            removedCount = removedCount + 1;
                        }
                    });
                    var updatedMailNotificationsCount = user.mailNotifications.count;
                    if(user.mailNotifications.count >= removedCount){
                        updatedMailNotificationsCount = updatedMailNotificationsCount - removedCount;
                    }
                    const updatedMailNotifications = {
                        count: updatedMailNotificationsCount,
                        array: updatedMailNotificationsArray
                    }
                    resolve(updatedMailNotifications);
                });
                
                promise
                .then(updatedMailNotifications => {
                    User.findByIdAndUpdate(user._id ,{$set:{mailNotifications:updatedMailNotifications}} ,{new: true} ,(err ,user) => {
                        if(err){throw err;}
                        res.render("users/sentMailReplies" ,{user: user ,mailId: req.params.mailId ,replies: replies});
                    });
                });

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
                            senderImage: mr.sent_by.imageUrl,
                            size: mr.mailSize
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

                const promise = new Promise((resolve ,reject) => {
                    var removedCount = 0;
                    var updatedMailNotificationsArray = user.mailNotifications.array.filter(notification => {
                        if(notification.notifType != 'newReply' || notification.parentMail != req.params.mailId){
                            return true;
                        }else{
                            removedCount = removedCount + 1;
                        }
                    });
                    var updatedMailNotificationsCount = user.mailNotifications.count;
                    if(user.mailNotifications.count >= removedCount){
                        updatedMailNotificationsCount = updatedMailNotificationsCount - removedCount;
                    }
                    const updatedMailNotifications = {
                        count: updatedMailNotificationsCount,
                        array: updatedMailNotificationsArray
                    }
                    resolve(updatedMailNotifications);
                });
                
                promise
                .then(updatedMailNotifications => {
                    User.findByIdAndUpdate(user._id ,{$set:{mailNotifications:updatedMailNotifications}} ,{new: true} ,(err ,user) => {
                        if(err){throw err;}
                        res.render("users/receivedMailReplies" ,{user: user ,mailId: req.params.mailId ,replies: replies});
                    });
                });
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
            user.usedSentMailsStorage = user.usedSentMailsStorage - req.body.mailSize;
            user.save();
        }
        Mail.findById(req.params.mailId ,(err ,mail)=>{
            if(err){throw err;}
            var index = mail.usersThatDidNotDelete.indexOf(req.params.id);
            if (index > -1) {
                mail.usersThatDidNotDelete.splice(index, 1);
                if(mail.usersThatDidNotDelete.length == 0){
                    const filesToDelete = mail.files;
                    deleteMailFiles(filesToDelete);
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
            user.usedReceivedMailsStorage = user.usedReceivedMailsStorage - req.body.mailSize;
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
                        //
                        if(reply != null){
                            if(reply.sent_by != req.params.id){
                                var index2 = reply.usersThatDidNotDelete.indexOf(req.params.id);
                                if(index2 > -1){
                                    reply.usersThatDidNotDelete.splice(index, 1);
                                    if(reply.usersThatDidNotDelete.length == 0){
                                        const filesToDelete = reply.files;
                                        deleteMailFiles(filesToDelete);
                                        Mail.findByIdAndRemove(reply._id ,err => {
                                            if(err){throw err;}
                                        });
                                    }else{
                                        reply.save();
                                    }
                                }
                            }
                        }
                        //
                    });
                });
                //clearing deleted replies notifs
                const promise = new Promise((resolve ,reject) => {
                    var removedCount = 0;
                    var updatedMailNotificationsArray = user.mailNotifications.array.filter(notification => {
                        if(repliesIds.indexOf(notification.replyId) == -1){
                            return true;
                        }else{
                            removedCount = removedCount + 1;
                        }
                    });
                    var updatedMailNotificationsCount = user.mailNotifications.count;
                    if(user.mailNotifications.count >= removedCount){
                        updatedMailNotificationsCount = updatedMailNotificationsCount - removedCount;
                    }
                    const updatedMailNotifications = {
                        count: updatedMailNotificationsCount,
                        array: updatedMailNotificationsArray
                    }
                    resolve(updatedMailNotifications);
                });
                
                promise
                .then(updatedMailNotifications => {
                    User.findByIdAndUpdate(user._id ,{$set:{mailNotifications:updatedMailNotifications}} ,{new: true} ,(err ,user) => {
                        if(err){throw err;}
                        //if all users deleted the mail , then delete it from database
                        if(mail.usersThatDidNotDelete.length == 0){
                            const filesToDelete = mail.files;
                            deleteMailFiles(filesToDelete);
                            Mail.findByIdAndRemove(req.params.mailId ,(err)=>{
                                if(err){throw err;}
                                res.redirect("/users/"+req.params.id+"/mails/received/");
                            });
                        }else{
                            mail.save(()=>{
                                res.redirect("/users/"+req.params.id+"/mails/received/");
                            });
                        }
                    });
                });
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
                const filesToDelete = mail.files;
                deleteMailFiles(filesToDelete);
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
                                user.usedSentMailsStorage = user.usedSentMailsStorage - req.body.mailSize;
                            }
                        }else if(req.body.replyType == 'receivedReply'){
                            var index = user.receivedMails.indexOf(req.params.replyId);
                            if (index > -1) {
                                user.receivedMails.splice(index, 1);
                                user.usedReceivedMailsStorage = user.usedReceivedMailsStorage - req.body.mailSize;
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
                const filesToDelete = mail.files;
                deleteMailFiles(filesToDelete);
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
                                user.usedSentMailsStorage = user.usedSentMailsStorage - req.body.mailSize;
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









module.exports = router;