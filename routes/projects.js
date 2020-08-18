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

const conn = require('../modules/connection');
const path = require('path');
// const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');





// init gfs
let gfsProject;
conn.once('open', () => {
  // init stream
  gfsProject = Grid(conn.db ,mongoose.mongo);
  gfsProject.collection('projectFiles');    //gfsProject is now like a mongoose model
});

// Storage
const projectFilesStorage = new GridFsStorage({
	url: "mongodb://localhost:27017/companydb",
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const fileInfo = {
                filename: file.originalname,
                bucketName: "projectFiles"
              };
              resolve(fileInfo);
        });
      }
});

//init upload
const projectFilesUpload = multer({
    storage: projectFilesStorage,
    fileFilter: function(req ,file ,cb){
    	checkFileType(file ,cb);
    }
});
//upload array of files midware
const arrUpload = projectFilesUpload.array('files', 12); // 'files' is the name of the input[type="file"] that contains the file


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
router.get('/projects/:prjId/files/:fileId' ,(req ,res)=>{
    const fileIdObj = new mongoose.mongo.ObjectId(req.params.fileId);
	gfsProject.exist({_id: fileIdObj ,root: 'projectFiles'} ,(err ,found)=>{
		if(err){throw err;}
		if(found){
            const readstream = gfsProject.createReadStream(fileIdObj);
			readstream.pipe(res);
		}else{
			console.log('file not found ............ ' + req.params.fileId);
		}
	});
});
//this one is for audios only cuz 'howl->src' must end with an extention ,and the audio name has an extention attached to it in the end.
router.get('/projects/:prjId/files/:fileId/:audioName' ,(req ,res)=>{
    const fileIdObj = new mongoose.mongo.ObjectId(req.params.fileId);
	gfsProject.exist({_id: fileIdObj ,root: 'projectFiles'} ,(err ,found)=>{
		if(err){throw err;}
		if(found){
            const readstream = gfsProject.createReadStream(fileIdObj);
			readstream.pipe(res);
		}else{
			console.log('file not found ............ ' + req.params.fileId);
		}
	});
});

//play video
router.get("/projects/:prjId/files/videos/:fileId/play" ,(req ,res)=>{
	res.render("users/videoPlayer" ,{iddd: req.params.prjId ,offf: 'projects' ,fileId: req.params.fileId ,filename: req.query.videoName});
});

//play audio
router.get("/projects/:prjId/files/audios/:fileId/play" ,(req ,res)=>{
	res.render("users/audioPlayer" ,{iddd: req.params.prjId ,offf: 'projects' ,fileId: req.params.fileId ,filename: req.query.audioName});
});

//preview images and texts
// router.get("/projects/:prjId/files/:fileId/preview" ,(req ,res)=>{
// 	res.render("users/filePreview" ,{fileId: req.params.fileId});
// });



//delete project files
function deleteProjectFiles(filesToDelete){
    filesToDelete.forEach(function(fileId){
        const fileIdObj = new mongoose.mongo.ObjectId(fileId);
        gfsProject.remove({_id: fileIdObj ,root:'projectFiles'}, function (err) {
            if (err) {throw err;}
          });
    });
}   







//adding a function that get rid of duplicates values in an array to the js prototype
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j]){
                
                a.splice(j--, 1);
            }
        }
    }
    return a;
};

// function unique(array){
//     var a = array;
//     var ai = "";
//     var aj = "";
//     for(var i=0; i<a.length-1; ++i) {
//         for(var j=i+1; j<a.length; ++j) {
//             ai = a[i];
//             console.log('ai: '+ai);
//             aj = a[j];
//             console.log('aj: '+aj);
//             if(ai == aj){
//                 console.log('equal');
//                 a.splice(j--, 1);
//             }
//         }
//     }
//     return a;
// }






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
function getProjectFile(fileId){
    return new Promise((resolve ,reject) => {
        const fileIdObj = new mongoose.mongo.ObjectId(fileId);
        gfsProject.files.findOne({_id: fileIdObj} ,(err ,file)=>{
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
async function populateProjectFiles(projectFiles){
    try{
        var files = [];
        const n = projectFiles.length;
        for(var i = 0 ; i < n ; i++){
            file = await getProjectFile(projectFiles[i]);
            files.push(file);
        };
        return files;
    }catch(err){
        throw err;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//Assigned projects

//show the user's assigned projects
router.get("/users/:id/projects/assigned" ,(req ,res)=>{
    User.findById(req.params.id).populate('assignedProjects').exec((err ,user)=>{
        if(err){throw err;}
        else{
            const assignedProjects = user.assignedProjects;
            user.getChildren(function(err ,children){
                if(err){throw err;}
                var isLeaf;
                if(children.length > 0){
                    isLeaf = false;
                }else{
                    isLeaf = true;
                }
                const promise = new Promise((resolve ,reject) => {
                    var removedCount = 0;
                    var updatedBellNotificationsArray = user.bellNotifications.array.filter(notification => {
                        if(notification.notifType != 'assignedProject'){
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
                        var sortedAssignedProjects = assignedProjects.sort( (a ,b) => {
                            return (a.lastProjectUpdateAt < b.lastProjectUpdateAt) ? 1 : -1;
                        });
                        res.render("users/assignedProjects" ,{user: user ,isLeaf: isLeaf ,assignedProjects: sortedAssignedProjects});
                    });
                });
            });
        }
    });
});

//shows a specific assigned project's detail
router.get("/users/:id/projects/assigned/:prjId/detail" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            User.find({parentId: req.params.id} ,function(err ,children){
                if(err){throw err;}
                Project.findById(req.params.prjId ,'-discussion -tree -sentTo -assignedTo -createdBy').populate([{
                    path: 'lastProgressUpdateBy',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                },{
                    path: 'history.actor',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                },{
                    path: 'history.receiver',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                }]).exec((err ,project)=>{
                    if(err){throw err;}

                    populateProjectFiles(project.files)
                    .then(files => {
                        const promise = new Promise((resolve ,reject) => {
                            var updatedBellNotificationsArray = user.bellNotifications.array.filter(notification => {
                                if(notification.projectId != req.params.prjId || notification.notifType != 'assignedProject'){
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
                                res.render("users/assignedProjectDetail" ,{user: user ,children: children ,project: project ,files: files ,projectType: 'assigned'});
                            });
                        });
                    });
                    
                });
            });
        }
    });
});

//shows a specific assigned project's discussion
router.get("/users/:id/projects/assigned/:prjId/discussion" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            Project.findById(req.params.prjId ,'-tree -sentTo -assignedTo -createdBy' ,(err ,project)=>{
                if(err){throw err;}
                user.bellNotifications.array.forEach(notification =>{
                    if(notification.notifType == 'projectDiscussion' && notification.projectId == project.id){
                        user.bellNotifications.count -= notification.count;
                        user.bellNotifications.array.splice(user.bellNotifications.array.indexOf(notification) ,1);
                    }
                });
                user.save(() => {
                    res.render("users/assignedProjectDiscussion" ,{user: user ,project: project});
                });
            });
        }
    });
});

//shows a specific assigned project's tree
router.get("/users/:id/projects/assigned/:prjId/tree" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            Project.findById(req.params.prjId ,'-discussion -sentTo -assignedTo -createdBy' ,(err ,project)=>{
                if(err){throw err;}
                Tree.GetArrayTree(project.tree ,function(err ,tree){
                    if(err){throw err;}
                    res.render("users/assignedProjectTree" ,{user: user ,project: project ,tree: JSON.stringify(tree[0])});
                });
            });  
        }
    });
});

//unassign a project
router.delete("/users/:id/projects/assigned/:prjId" ,(req ,res)=>{
    var io = req.app.get('io');
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            var index = user.assignedProjects.indexOf(req.params.prjId);
            if (index > -1) {
                user.assignedProjects.splice(index, 1);
                user.save(()=>{
                    Project.findById(req.params.prjId ,(err ,project)=>{
                        if(err){throw err;}
                        project.history.push({
                            action: 'unassign',
                            actor: req.params.id,
                            at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                        });
                        //notify parent 
                        User.findById(user.parentId ,(err ,parent) => {
                            if(err){throw err;}
                            const notification = {
                                notifType: 'unassignProject',
                                userId: user._id,
                                username: user.username,
                                projectTitle: project.title,
                                at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                            }
                            io.to(parent._id).emit('projectUnassignNotification' ,notification);
                            parent.bellNotifications.array.push(notification);
                            parent.bellNotifications.count = parent.bellNotifications.count + 1;
                            parent.save();
                        });
                        project.save(()=>{
                            Tree.findOne({user :req.params.id ,project: req.params.prjId} ,(err ,treeNode)=>{
                                if(err){throw err;}
                                if(treeNode.sentTo == false){
                                    Tree.findByIdAndRemove(treeNode._id ,(err)=>{
                                        if(err){throw err;}
                                        res.redirect("/users/"+req.params.id+"/projects/assigned");
                                    });
                                }
                                else{
                                    treeNode.assigned = false;
                                    treeNode.save((err)=>{
                                        if(err){throw err;}
                                        res.redirect("/users/"+req.params.id+"/projects/assigned");
                                    });
                                }
                            });
                        });
                    });
                });
            }
        }
    });  
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//Received projects

//shows the user's received projects
router.get("/users/:id/projects/received" ,(req ,res)=>{
    User.findById(req.params.id).populate('receivedProjects').exec((err ,user)=>{
        if(err){throw err;}
        else{
            const receivedProjects = user.receivedProjects;
            user.getChildren(function(err ,children){
                if(err){throw err;}
                var isLeaf;
                if(children.length > 0){
                    isLeaf = false;
                }else{
                    isLeaf = true;
                }
                const promise = new Promise((resolve ,reject) => {
                    var removedCount = 0;
                    var updatedBellNotificationsArray = user.bellNotifications.array.filter(notification => {
                        if(notification.notifType != 'receivedProject'){
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
                        var sortedReceivedProjects = receivedProjects.sort( (a ,b) => {
                            return (a.lastProjectUpdateAt < b.lastProjectUpdateAt) ? 1 : -1;
                        });
                        res.render("users/receivedProjects" ,{user: user ,isLeaf: isLeaf ,receivedProjects: sortedReceivedProjects});
                    });
                });
                
            });
        }
    });
});

//show a received project's detail
router.get("/users/:id/projects/received/:prjId/detail" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            User.find({parentId: req.params.id} ,function(err ,children){
                if(err){throw err;}
                Project.findById(req.params.prjId ,'-discussion -tree -sentTo -assignedTo -createdBy').populate([{
                    path: 'lastProgressUpdateBy',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                },{
                    path: 'history.actor',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                },{
                    path: 'history.receiver',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                }]).exec((err ,project)=>{
                    if(err){throw err;}

                    populateProjectFiles(project.files)
                    .then(files => {

                        const promise = new Promise((resolve ,reject) => {
                            var updatedBellNotificationsArray = user.bellNotifications.array.filter(notification => {
                                if(notification.projectId != req.params.prjId || notification.notifType != 'receivedProject'){
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
                                res.render("users/receivedProjectDetail" ,{user: user ,children: children ,project: project ,files: files ,projectType: 'received'});
                            });
                        });
                    });
                
                });  
            });
        }
    });
});
//show a received project's discussion
router.get("/users/:id/projects/received/:prjId/discussion" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            Project.findById(req.params.prjId ,'-tree -sentTo -assignedTo -createdBy' ,(err ,project)=>{
                if(err){throw err;}
                user.bellNotifications.array.forEach(notification =>{
                    if(notification.notifType == 'projectDiscussion' && notification.projectId == project.id){
                        user.bellNotifications.count -= notification.count;
                        user.bellNotifications.array.splice(user.bellNotifications.array.indexOf(notification) ,1);
                    }
                });
                user.save(() => {
                    res.render("users/receivedProjectDiscussion" ,{user: user ,project: project});
                });
            }); 
        }
    });
});

//show a received project's tree
router.get("/users/:id/projects/received/:prjId/tree" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            Project.findById(req.params.prjId ,'-discussion -sentTo -assignedTo -createdBy' ,(err ,project)=>{
                if(err){throw err;}
                Tree.GetArrayTree(project.tree ,function(err ,tree){
                    if(err){throw err;}
                    res.render("users/receivedProjectTree" ,{user: user ,project: project ,tree: JSON.stringify(tree[0])});
                });
            }); 
        }
    });
});

//adding a new message to the received project's discussion
router.post("/users/:id/projects/received/:prjId/discussion" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            Project.findById(req.params.prjId ,(err ,project)=>{
                if(err){throw err;}  
                var message = {
                    userName: user.username,
                    userImage: user.imageUrl,
                    userId: user._id,
                    created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                    text: req.body.text
                }
                project.discussion.push(message);
                project.save(()=>{
                    res.redirect("/users/"+user._id+"/projects/received/"+project._id+"/discussion");
                });
            });
        }
    });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//Sent projects

//show the user's sent projects
router.get("/users/:id/projects/sent" ,(req ,res)=>{
    User.findById(req.params.id).populate('sentProjects').exec((err ,user)=>{
        if(err){throw err;}
        else{
            user.getChildren(function(err ,children){
                if(err){throw err;}
                if(children.length > 0){
                    var sortedSentProjects = user.sentProjects.sort( (a ,b) => {
                        return (a.lastProjectUpdateAt < b.lastProjectUpdateAt) ? 1 : -1;
                    });
                    user.sentProjects = sortedSentProjects;
                    res.render("users/sentProjects" ,{user: user});
                }else{
                    res.redirect("/users/"+req.params.id+"/projects/assigned");
                }
            });
        }
    });
});

//shows the templet of sending new project
router.get("/users/:id/projects/new" ,(req ,res)=>{
    User.findById(req.params.id).exec((err ,user)=>{
        if(err){throw err;}
        else{
            User.find({parentId: req.params.id} ,function(err ,children){
                res.render("users/newProject" ,{user: user ,children: children});
            });
        }
    });
});

//show a specific sent project's detail
router.get("/users/:id/projects/sent/:prjId/detail" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            User.find({parentId: req.params.id} ,function(err ,children){
                if(err){throw err;}
                Project.findById(req.params.prjId ,'-discussion -tree -sentTo -assignedTo -createdBy').populate([{
                    path: 'lastProgressUpdateBy',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                },{
                    path: 'history.actor',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                },{
                    path: 'history.receiver',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                }]).exec((err ,project)=>{
                    if(err){throw err;}

                    populateProjectFiles(project.files)
                    .then(files => {
                        res.render("users/sentProjectDetail" ,{user: user ,children: children ,project: project ,files: files ,projectType: 'sent'});
                    });
                    
                });
            });
        }
    });
});

//show sent project's discussion
router.get("/users/:id/projects/sent/:prjId/discussion" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            Project.findById(req.params.prjId ,'-tree -sentTo -assignedTo -createdBy' ,(err ,project)=>{
                if(err){throw err;}
                if(err){throw err;}
                user.bellNotifications.array.forEach(notification =>{
                    if(notification.notifType == 'projectDiscussion' && notification.projectId == project.id){
                        user.bellNotifications.count -= notification.count;
                        user.bellNotifications.array.splice(user.bellNotifications.array.indexOf(notification) ,1);
                    }
                });
                user.save(() => {
                    res.render("users/sentProjectDiscussion" ,{user: user ,project: project});
                });
            });
        }
    });
});

//show sent project's tree
router.get("/users/:id/projects/sent/:prjId/tree" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            Unit.find().exec((err ,units)=>{
                if(err){throw err;}
                else{
                    Project.findById(req.params.prjId ,'-discussion -sentTo -assignedTo -createdBy' ,(err ,project)=>{
                        if(err){throw err;}
                        Tree.GetArrayTree(project.tree ,function(err ,tree){
                            if(err){throw err;}
                            res.render("users/sentProjectTree" ,{user: user ,project: project ,tree: JSON.stringify(tree[0])});
                        });
                    });  
                }
            });
        }
    });
});

//adding new message to the sent project's discussion
router.post("/users/:id/projects/sent/:prjId/discussion" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            Project.findById(req.params.prjId ,(err ,project)=>{
                if(err){throw err;}  
                var message = {
                    userName: user.username,
                    userImage: user.imageUrl,
                    userId: user._id,
                    created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                    text: req.body.text
                }
                project.discussion.push(message);
                project.save(()=>{
                    res.redirect("/users/"+user._id+"/projects/sent/"+project._id+"/discussion");
                });
            });
        }
    });
});

//deleting a project
router.delete("/users/:id/projects/sent/:prjId" ,(req ,res)=>{
    Project.findById(req.params.prjId ,(err ,project)=>{
        if(err){throw err;}
        project.assignedToList.forEach(function(atid){
            User.findById(atid ,(err ,at)=>{
                if(err){throw err;}
                for(var i = 0 ;i < at.events.length ;i++){
                    if(at.events[i]._id == req.params.prjId){
                        at.events.splice(i ,1);
                        break;
                    }
                }
                at.save();
            })
        });
        Tree.deleteMany({project: req.params.prjId} ,(err)=>{
            if(err){throw err;}
            Project.findByIdAndRemove(req.params.prjId ,(err)=>{
                if(err){throw err;}
                res.redirect("/users/"+req.params.id+"/projects/sent");
            });
        });
    });
});

//show the tempet of updating a project
router.get("/users/:id/projects/sent/:prjId/edit" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            Project.findById(req.params.prjId ,'-discussion -tree -sentTo -assignedTo -createdBy').populate({
                path: 'lastProgressUpdateBy',
                select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
            }).exec((err ,project)=>{
                if(err){throw err;}
                populateProjectFiles(project.files)
                .then(files => {
                    res.render("users/updateProject" ,{user: user ,project: project ,files: files});
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

//updating a project
router.put("/users/:id/projects/sent/:prjId" ,arrUpload ,(req ,res)=>{
    var io = req.app.get('io');
    Project.findById(req.params.prjId).populate('createdBy').exec((err ,project)=>{
        if(err){throw err;}
        project.title = req.body.project.title;
        project.detail = req.body.project.detail;
        project.lastProjectUpdateAt = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        ///////////////updating project files
        //deleting
        if(req.body.filesToDelete != undefined){
            req.body.filesToDelete.forEach(function(fileId){
                var index = project.files.indexOf(fileId);
                if (index > -1) {
                    project.files.splice(index ,1);
                }
                const fileIdObj = new mongoose.mongo.ObjectId(fileId);
                gfsProject.remove({_id: fileIdObj ,root: 'projectFiles'});
            });
        }
        
        //adding
        if(req.files){
            req.files.forEach(function(file){
                project.files.push(file.id);
            });
        }
        

        //updating project start & end ,and the assigned users' event.
        if((project.start != req.body.project.start) || (project.end != req.body.project.end)){
            project.start = req.body.project.start;
            project.end = req.body.project.end;
            project.assignedToList.forEach(function(atid){
                User.findById(atid ,(err ,at) => {
                    if(err){throw err;}
                    at.events.forEach(function(event){
                        if(event._id == project.id){
                            event.start = project.start.replace(/\//g, "-");
                            event.end = project.end.replace(/\//g, "-");
                            at.save();
                        }
                    });
                });
            });
        }
        project.history.push({
            action: 'update',
            actor: req.params.id,
            at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        });
        project.save(()=>{
            //notify concerned users
            
            
            Tree.find({project: req.params.prjId},(err ,concernedList)=>{
                if(err){throw err;}
                const notification = {
                    notifType: 'updateProject',
                    username : project.createdBy.username,
                    userId: project.createdBy._id,
                    projectId: project._id,
                    projectTitle: project.title,
                    at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                }
                var promises = [];
                concernedList.forEach(function(concernedTree){
                    if(concernedTree.user != req.params.id){
                        const promise = new Promise( (reject ,resolve) => {
                            User.findById(concernedTree.user ,(err ,concerned) => {
                                if(err){reject(err);}
                                io.to(concerned._id).emit('projectUpdateNotification' ,notification);
                                var updatedBellNotifications = {
                                    count: concerned.bellNotifications.count + 1,
                                    array: concerned.bellNotifications.array,
                                }
                                updatedBellNotifications.array.push(notification);
                                User.findByIdAndUpdate(concerned._id ,{$set:{bellNotifications:updatedBellNotifications}} ,{new: true} ,(err ,user) => {
                                    if(err){reject(err);}
                                    resolve(true)
                                });
                            });
                        });
                        promises.push(promise);
                    }
                });
                async function myAsncFunc(promises){
                    try{
                        for(var i = 0 ;i < promises.length ;i++){
                            await promises[i];
                        }
                    }catch(err){
                        return err;
                    }
                }
                myAsncFunc(promises)
                .then(() => {
                    res.redirect("/users/"+req.params.id+"/projects/sent/"+req.params.prjId+"/detail");
                })
                .catch(err => {
                    throw err;
                });
            });
            
        });
    });
});


//updating a project's progress
router.post("/users/:id/projects/:prjId/progress" ,(req ,res)=>{
    Project.findById(req.params.prjId ,(err ,project)=>{
        if(err){throw err;}
        const oldProgress = project.progress;
        const newProgress = req.body.updatedProgress;
        project.progress = req.body.updatedProgress;
        project.progressHistory.push({
            progressUpdateBy: req.body.lastProgressUpdateBy,
            progressUpdateAt: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            oldProgress: oldProgress,
            newProgress: newProgress
        });
        project.save(()=>{
            res.redirect("/users/"+req.params.id+"/projects/assigned/"+req.params.prjId+"/detail");
        });
    });
});

//sending new project
router.post("/users/:id/projects/sent" ,arrUpload ,(req ,res)=>{
    var io = req.app.get('io');
    var assignedTo = [];
    var sentTo = [];
    //initializing project
    var project = new Project(req.body.project);
    project.start = project.start.replace(/\//g, "-");
    project.end = project.end.replace(/\//g, "-");
    project.createdBy = req.params.id;
    project.lastProjectUpdateAt = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    req.files.forEach(function(file){
        project.files.push(file.id);
    });
    project.history.push({
        action: 'create',
        actor: req.params.id,
        at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    });
    if(req.body.sentTo !== undefined){
        sentTo = req.body.sentTo.split(",");
        project.sentTo = sentTo;
        project.sentToList = project.sentToList.concat(sentTo).unique();
        sentTo.forEach(function(st){
            project.history.push({
                action: 'send',
                actor: req.params.id,
                receiver: st,
                at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            });
        });  
    }
    if(req.body.assignedTo !== undefined){
        assignedTo = req.body.assignedTo.split(",");
        project.assignedTo = assignedTo;
        project.assignedToList = project.assignedToList.concat(assignedTo).unique();
        assignedTo.forEach(function(at){
            project.history.push({
                action: 'assign',
                actor: req.params.id,
                receiver: at,
                at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            });
        });  
    }
    project.save((err ,project)=>{
        if(err){throw err;}
        //handling received project notification
        if(req.body.sentTo !== undefined){
            const newReceivedProject = {
                count: 1,
                notifType: 'receivedProject',
                projectId: project.id,
                title: project.title,
                start: project.start,
                end: project.end,
                progress: project.progress,
                at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            }
            sentTo.forEach(function(stid){
                User.findById(stid ,(err ,st) => {
                    if(err){throw err;}
                    io.to(st._id).emit('newReceivedProject' ,newReceivedProject);
                    var count = 1;
			        st.bellNotifications.array.forEach(notification => {
			        	if(notification.notifType == 'receivedProject'){
                            count = notification.count + 1;
			        		st.bellNotifications.array.splice(st.bellNotifications.array.indexOf(notification) ,1);
			        	}
                    });
                    newReceivedProject.count = count;
                    st.bellNotifications.array.push(newReceivedProject);
                    st.bellNotifications.count = st.bellNotifications.count + 1;
                    st.save();
                });
            });
        }
        //handling assigned project notification
        if(req.body.assignedTo !== undefined){
            const newAssignedProject = {
                count: 1,
                notifType: 'assignedProject',
                projectId: project._id,
                title: project.title,
                start: project.start,
                end: project.end,
                progress: project.progress,
                at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            }
            assignedTo.forEach(function(atid){
                User.findById(atid ,(err ,at) => {
                    if(err){throw err;}
                    io.to(at._id).emit('newAssignedProject' ,newAssignedProject);
                    var count = 1;
			        at.bellNotifications.array.forEach(notification => {
			        	if(notification.notifType == 'assignedProject'){
                            count = notification.count + 1;
			        		at.bellNotifications.array.splice(at.bellNotifications.array.indexOf(notification) ,1);
			        	}
                    });
                    newAssignedProject.count = count;
                    at.bellNotifications.array.push(newAssignedProject);
                    at.bellNotifications.count = at.bellNotifications.count + 1;
                    at.save();
                });
            });
        }
        //
        Project.findById(project._id ,(err ,project)=>{
            if(err){throw err;}
            var tree = new Tree({
                user: project.createdBy._id,
                project: project._id,
                username: project.createdBy.username,
                name: project.createdBy.name,
                imageUrl: project.createdBy.imageUrl,
                area: project.createdBy.area,
                profileUrl: project.createdBy.profileUrl,
                office: project.createdBy.office,
                tags: project.createdBy.tags,
                isLoggedUser: project.createdBy.isLoggedUser,
                unit: project.createdBy.unit,
                positionName: project.createdBy.positionName,
                sentTo: false,
                head: true
            });
            User.findById(project.createdBy._id ,(err ,user)=>{
                if(err){throw err;}
                user.sentProjects.push(project);
                user.save();
            });
            tree.save((err ,tree)=>{
                if(err){throw err;}
                Tree.findById(tree._id ,(err ,tree)=>{
                    if(err){throw err;}
                    if(req.body.sentTo !== undefined){
                        project.sentTo.forEach(function(st){
                            tree.appendChild({
                                user: st.id,
                                project: project._id,
                                username: st.username,
                                name: st.name,
                                imageUrl: st.imageUrl,
                                area: st.area,
                                profileUrl: st.profileUrl,
                                office: st.office,
                                tags: st.tags,
                                isLoggedUser: st.isLoggedUser,
                                unit: st.unit,
                                positionName: st.positionName,
                                sentTo: true
                            });
                            User.findById(st._id ,(err ,user)=>{
                                if(err){throw err;}
                                user.receivedProjects.push(project);
                                user.save();
                            });
                        });
                    }
                    tree.save((err ,tree)=>{
                        if(err){throw err;}
                        if(req.body.assignedTo !== undefined){
                            project.assignedTo.forEach(function(at){
                                Tree.findOne({user: at._id ,project: project._id} ,(err ,trv)=>{
                                    if(err){throw err;}
                                    else{
                                        if(trv == null){
                                            tree.appendChild({
                                                user: at.id,
                                                project: project._id,
                                                username: at.username,
                                                name: at.name,
                                                imageUrl: at.imageUrl,
                                                area: at.area,
                                                profileUrl: at.profileUrl,
                                                office: at.office,
                                                tags: at.tags,
                                                isLoggedUser: at.isLoggedUser,
                                                unit: at.unit,
                                                positionName: at.positionName,
                                                assigned: true,
                                                sentTo: false
                                            });
                                            tree.save();
                                            
                                            User.findById(at._id ,(err ,user)=>{
                                                if(err){throw err;}
                                                user.assignedProjects.push(project);
                                                user.save();
                                            });  
                                        }
                                        else{
                                            if(trv.assigned == false){
                                                trv.assigned = true;
                                                trv.save();
                                                User.findById(at._id ,(err ,user)=>{
                                                    if(err){throw err;}
                                                    else{
                                                        user.assignedProjects.push(project);
                                                        user.save();
                                                    }
                                                });  
                                            }
                                        }
                                    }
                                });    
                            });
                        }
                        tree.save((err ,tree)=>{
                            if(err){throw err;}
                            project.tree = tree
                            project.save(()=>{
                                res.redirect('/users/'+req.params.id+'/projects/sent');
                            });
                        });
                    });
                });
            });
        });
    });
});

//re-sending a sent project
router.post("/users/:id/projects/:prjId/send" ,(req ,res)=>{
    var io = req.app.get('io');
    var assignedTo = [];
    var sentTo = [];
    Project.findById(req.params.prjId ,(err ,project)=>{
        if(err){throw err;}
        project.lastProjectUpdateAt = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        if(req.body.sentTo !== undefined){
            sentTo = req.body.sentTo.split(",");
            project.sentTo = sentTo;
            project.sentToList = project.sentToList.concat(sentTo).unique();
            sentTo.forEach(function(st){
                project.history.push({
                    action: 'send',
                    actor: req.params.id,
                    receiver: st,
                    at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                });
            });
        }
        if(req.body.assignedTo !== undefined){
            assignedTo = req.body.assignedTo.split(",");
            project.assignedTo = assignedTo;
            project.assignedToList = project.assignedToList.concat(assignedTo).unique();
            assignedTo.forEach(function(at){
                project.history.push({
                    action: 'assign',
                    actor: req.params.id,
                    receiver: at,
                    at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                });
            });
        }
        project.save((err ,project)=>{
            if(err){throw err;}
            //handling received project notification
            if(req.body.sentTo !== undefined){
                const newReceivedProject = {
                    count: 1,
                    notifType: 'receivedProject',
                    projectId: project.id,
                    title: project.title,
                    start: project.start,
                    end: project.end,
                    progress: project.progress,
                    at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                }
                sentTo.forEach(function(stid){
                    User.findById(stid ,(err ,st) => {
                        if(err){throw err;}
                        io.to(st._id).emit('newReceivedProject' ,newReceivedProject);
                        var count = 1;
		    	        st.bellNotifications.array.forEach(notification => {
		    	        	if(notification.notifType == 'receivedProject'){
                                count = notification.count + 1;
		    	        		st.bellNotifications.array.splice(st.bellNotifications.array.indexOf(notification) ,1);
		    	        	}
                        });
                        newReceivedProject.count = count;
                        st.bellNotifications.array.push(newReceivedProject);
                        st.bellNotifications.count = st.bellNotifications.count + 1;
                        st.save();
                    });
                });
            }
            //handling assigned project notification
            if(req.body.assignedTo !== undefined){
                const newAssignedProject = {
                    count: 1,
                    notifType: 'assignedProject',
                    projectId: project._id,
                    title: project.title,
                    start: project.start,
                    end: project.end,
                    progress: project.progress,
                    at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                }
                assignedTo.forEach(function(atid){
                    User.findById(atid ,(err ,at) => {
                        if(err){throw err;}
                        io.to(at._id).emit('newAssignedProject' ,newAssignedProject);
                        var count = 1;
		    	        at.bellNotifications.array.forEach(notification => {
		    	        	if(notification.notifType == 'assignedProject'){
                                count = notification.count + 1;
		    	        		at.bellNotifications.array.splice(at.bellNotifications.array.indexOf(notification) ,1);
		    	        	}
                        });
                        newAssignedProject.count = count;
                        at.bellNotifications.array.push(newAssignedProject);
                        at.bellNotifications.count = at.bellNotifications.count + 1;
                        at.save();
                    });
                });
            }
            //
            Project.findById(req.params.prjId ,(err ,project)=>{
                if(err){throw err;}
                Tree.findOne({user: req.params.id ,project: req.params.prjId} ,(err ,tree)=>{
                    if(err){throw err;}
                    if(req.body.sentTo !== undefined){
                        project.sentTo.forEach(function(st){
                            Tree.findOne({user: st._id ,project: req.params.prjId} ,(err ,trv)=>{
                                if(err){throw err;}
                                else{
                                    if(trv == null){
                                        tree.appendChild({
                                            user: st.id,
                                            project: req.params.prjId,
                                            username: st.username,
                                            name: st.name,
                                            imageUrl: st.imageUrl,
                                            area: st.area,
                                            profileUrl: st.profileUrl,
                                            office: st.office,
                                            tags: st.tags,
                                            isLoggedUser: st.isLoggedUser,
                                            unit: st.unit,
                                            positionName: st.positionName,
                                            sentTo: true
                                        });
                                        tree.save();
                                        User.findById(st._id ,(err ,user)=>{
                                            if(err){throw err;}
                                            user.receivedProjects.push(project);
                                            user.save();
                                        });
                                    }else {
                                        //sending history
                                        if(trv.sentTo == false){
                                            User.findById(st._id ,(err ,user)=>{
                                                if(err){throw err;}
                                                user.receivedProjects.push(project);
                                                user.save(()=>{
                                                    trv.sentTo = true;
                                                    trv.save();
                                                });
                                            });
                                        }
                                    } 
                                }
                            });   
                        });
                    }
                    tree.save((err ,tree)=>{
                        if(err){throw err;}
                        if(req.body.assignedTo !== undefined){
                            project.assignedTo.forEach(function(at){
                                Tree.findOne({user: at._id ,project: req.params.prjId} ,(err ,trv)=>{
                                    if(err){throw err;}
                                    else{
                                        if(trv == null){
                                            tree.appendChild({
                                                user: at.id,
                                                project: req.params.prjId,
                                                username: at.username,
                                                name: at.name,
                                                imageUrl: at.imageUrl,
                                                area: at.area,
                                                profileUrl: at.profileUrl,
                                                office: at.office,
                                                tags: at.tags,
                                                isLoggedUser: at.isLoggedUser,
                                                unit: at.unit,
                                                positionName: at.positionName,
                                                assigned: true,
                                                sentTo: false
                                            });
                                            tree.save();
                                            User.findById(at._id ,(err ,user)=>{
                                                if(err){throw err;}
                                                else{
                                                    user.assignedProjects.push(project);
                                                    user.save();
                                                }
                                            });  
                                        }
                                        else{
                                            if(trv.assigned == false){
                                                trv.assigned = true;
                                                trv.save();
                                                User.findById(at._id ,(err ,user)=>{
                                                    if(err){throw err;}
                                                    else{
                                                        user.assignedProjects.push(project);
                                                        user.save();
                                                    }
                                                });  
                                            }
                                        }
                                    }
                                });    
                            });
                        }
                        tree.save((err ,tree)=>{
                            if(err){throw err;}
                            User.findById(req.params.id ,(err ,user)=>{
                                if(err){throw err;}
                                var trv = false;
                                user.sentProjects.forEach(function(prj){
                                    if(prj == req.params.prjId){
                                        trv = true;
                                    }
                                });
                                if(trv == false){
                                    user.sentProjects.push(project);
                                    user.save(function(){
                                        res.redirect('/users/'+req.params.id+'/projects/sent');
                                    });
                                }else{
                                    res.redirect('/users/'+req.params.id+'/projects/sent');
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});


module.exports = router;






//
//
//
//
//
// unique assignToList
//
//
//
//