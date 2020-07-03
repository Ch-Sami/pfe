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
    storage: mailFilesStorage
});
//upload array of files midware
const arrUpload = mailFilesUpload.array('files', 12); // 'files' is the name of the input[type="file"] that contains the file
// multer({
// 	storage: storage,
// 	//limits: {fileSize: [size in bytes]},      //sets the max size , if larger than that ,upload func will throw an error.
// 	fileFilter: function(req ,file ,cb){        //to allow only a certaine type of files/images
// 		checkFileType(file ,cb);
// 	}
// });


//check file type
function checkFileType(file ,cb){;
	//allowed extentions
	const filetypes = /txt|webm|mpg|mp2|mpeg|mpe|mpv|ogg|mp4|m4p|m4v|avi|wmv|mov|qt|flv|swf|avchd|tif|tiff|bmp|jpg|jpeg|gif|png|eps|raw|cr2|nef|orf|sr2|flac|m4a|mp3|wav|wma|aac|pptx|ppsx|ppt|pps|pptm|potm|ppa|mpotx|ppsm|doc|dot|docx|dotx|docm|dotm|rtf|wpd|xls|xlsx|xlsm|xlsb|xlt|xltx|xltm|csv|ppt|pptx|pptm|pps|ppsx|ppsm|pot|potx|potm|vsd|vsdx|vsdm|svg|pub|msg|vcf|ics|mpp|odt|odp|ods/;
	//check extention
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	//check mime type
	const mimetype = filetypes.test(file.mimetype);
	//returning
	if(extname && mimetype){
		return cb(null ,true);
	}else{
		cb('ERROR : file extention not allowed !');
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
            var totalMailsSize = 0;
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
                        receivedMail.read = elt.read;
                    }
                });
                totalMailsSize += rm.mailSize;
                receivedMails.push(receivedMail);
            });
            user.depopulate('receivedMails');
            var storagePer = ((totalMailsSize * 100) / 50000000000).toFixed(2);;
            // if(storagePer < 0.5){
            //     storagePer = 0.5;
            // }
            res.render("users/receivedMails" ,{user: user ,receivedMails: receivedMails ,storagePer: storagePer});
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
            var totalMailsSize = 0;
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
                totalMailsSize += sm.mailSize;
                sentMails.push(sentMail);
            });

            user.depopulate('sentMails');
            var storagePer = ((totalMailsSize * 100) / 50000000000).toFixed(2);
            // if(storagePer < 0.5){
            //     storagePer = 0.5;
            // }
            res.render("users/sentMails" ,{user: user ,sentMails: sentMails ,storagePer: storagePer});
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
const powerPointExt = /pptx|ppsx|ppt|pps|pptm|potm|ppa|mpotx|ppsm|odp/;
const wordExt = /doc|dot|docx|dotx|docm|dotm|rtf|wpd|odt/;
const excelExt = /xls|xlsx|xlsm|xlsb|xlt|xltx|xltm|csv|ods/;
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
                        res.render("users/sentMailContent" ,{user: user ,mail: mail ,files: files ,usersList: JSON.stringify(usersList)});
                    });
                    
                });
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
                    populateMailFiles(receivedMail.files)
                    .then(files => {
                        res.render("users/receivedMailContent" ,{user: user ,mail: mail ,files: files ,usersList: JSON.stringify(usersList)});
                    });
                });
            });
        }
    });
});

//sending new mail
router.post("/users/:id/mails/sent"  ,arrUpload ,(req ,res)=>{
    var receivers = req.body.sentTo.split(",");
    if(req.body.CCs !== undefined){
        var CCs = req.body.CCs.split(",");
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
    var textSize = Buffer.byteLength(req.body.text);
    var filesSize = 0;
    req.files.forEach(function(file){
        mail.files.push(file.id);
        filesSize += file.size;
    });
    mail.mailSize = textSize + filesSize;
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
router.post("/users/:id/mails/received/:mailId/replies" ,arrUpload ,(req ,res)=>{
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
    var textSize = Buffer.byteLength(req.body.text);
    var filesSize = 0;
    req.files.forEach(function(file){
        mail.files.push(file.id);
        filesSize += file.size;
    });
    mail.mailSize = textSize + filesSize;
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
                        if(reply.sent_by != req.params.id){
                            var index2 = reply.usersThatDidNotDelete.indexOf(req.params.id);
                            if(index2 > -1){
                                reply.usersThatDidNotDelete.splice(index, 1);
                                if(reply.usersThatDidNotDelete.length == 0){
                                    const filesToDelete = reply.files;
                                    deleteMailFiles(filesToDelete);
                                    Mail.findByIdAndRemove(reply._id);
                                }else{
                                    reply.save();
                                }
                            }
                        }
                    });
                });
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