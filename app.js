//requiring
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const methodOverride = require("method-override");
const connection = require('./modules/connection'); ///////////////////////////////////////////////////
const Unit = require("./modules/unit");
const User = require("./modules/user");
const Project = require('./modules/project');//////////////////////////////////////////////////////////
const seed = require("./seeds");
const passport = require("passport");
const localStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const expressSession = require("express-session");


//import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const contactRoutes = require("./routes/contacts");
const projectRoutes = require("./routes/projects");
const mailsRoutes = require("./routes/mails");
const unitRoutes = require("./routes/units");
const chartsRoutes = require("./routes/charts");

//app config
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine" ,"ejs");
app.use(methodOverride("_method"));

//authentification
app.use(expressSession({
	secret: "Achbek w nechbek ya lBekBek",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());  
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//midware
app.use((req ,res ,next)=>{
	res.locals.currentUser = req.user;   //(adds {currentUser = req.user} to all render params);
	Unit.find({type: 'department'} ,'-desc' ,(err ,units)=>{
		if(err){throw err;}
		else{
			res.locals.units = units;
			next();
		}
	});
});

//use routes
app.use(authRoutes);
app.use(userRoutes);
app.use(eventRoutes);
app.use(contactRoutes);
app.use(projectRoutes);
app.use(mailsRoutes);
app.use(unitRoutes);
app.use(chartsRoutes);

//--------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------
//setting up socket.io
const http = require('http');
const socketio = require('socket.io');
const server = http.createServer(app);
let io = socketio(server);

//necessary requires
const Message = require('./modules/message');
const Tree = require('./modules/projectTree');
const { resolve } = require("path");
const { reject } = require("async");

//help functions
function savePrivateMessage(privateMessage){
	const promise = new Promise((resolve ,reject) => {
    	var message = new Message({
    	    sent_by: privateMessage.sender,
    	    sent_to: privateMessage.receiver,
    	    sent_at: privateMessage.at,
    	    text: privateMessage.text
    	});
    	message.save((err ,message)=>{
    	    if(err){reject(err);}
    	    User.findById(privateMessage.sender ,(err ,user)=>{
    	        if(err){reject(err);}
    	        user.sentMessages.push(message);
    	        user.save(()=>{
    	            User.findById(privateMessage.receiver ,(err ,contact)=>{
						if(err){throw err;}
						contact.receivedMessages.push(message);
						//save new private message notification
						var count = 1;
						contact.messageNotifications.array.forEach(notification => {
							if(notification.senderId == privateMessage.sender){
								count = notification.count + 1;
								contact.messageNotifications.array.splice(contact.messageNotifications.array.indexOf(notification) ,1);
							}
						});
						const newNotif = {
							senderId: privateMessage.sender,
							senderUsername: privateMessage.senderUsername,
							count: count,
							at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
						};
						contact.messageNotifications.array.push(newNotif);
						contact.messageNotifications.count = contact.messageNotifications.count + 1;
    	                contact.save( () =>{
							resolve(true);
						});
    	            });
    	        });
    	    });
		});
	});
}

function deleteNewReceivedPrivateMessageNotification(privateMessage){
	User.findById(privateMessage.receiver ,(err ,user) =>{
		if(err){throw err;}
		user.messageNotifications.array.forEach(notification =>{
			if(notification.senderId == privateMessage.sender){
				user.messageNotifications.count -= notification.count;
				user.messageNotifications.array.splice(user.messageNotifications.array.indexOf(notification) ,1);
			}
		});
		user.save();
	});
}

function saveProjectDiscussionMessage(projectDiscussionMessage){
	const myPromise = new Promise((resolve ,reject) => {
		User.findById(projectDiscussionMessage.userId ,(err ,user)=>{
			if(err){reject(err);}
			else{
				Project.findById(projectDiscussionMessage.projectId ,(err ,project)=>{
					if(err){reject(err);}  
					var message = {
						userName: projectDiscussionMessage.userName,
						userImage: projectDiscussionMessage.userImage,
						userId: projectDiscussionMessage.userId,
						created_at: projectDiscussionMessage.at,
						text: projectDiscussionMessage.text
					}
					project.discussion.push(message);
					project.save((err ,project)=>{
						if(err){reject(err);}
						Tree.find({project: project.id} ,'-username -name -project -imageUrl -area -profileUrl -office -tags -isLoggedUser -unit -positionName -head -assigned -sentTo' ,(err ,users) => {
							if(err){reject(err);}
							var receivers = [];
							users.forEach(function(user){
								receivers.push(user.user);
							});
							resolve(receivers);
						});
					});
				});
			}
		});
	});
	return myPromise;
}
function deleteNewProjectDiscussionMessageNotification(projectDiscussionMessage){
	User.findById(projectDiscussionMessage.receiver ,(err ,user) =>{
		if(err){throw err;}
		user.bellNotifications.array.forEach(notification =>{
			if(notification.notifType == 'projectDiscussion' && notification.projectId == projectDiscussionMessage.projectId){
				user.bellNotifications.count -= notification.count;
				user.bellNotifications.array.splice(user.bellNotifications.array.indexOf(notification) ,1);
			}
		});
		user.save();
	});
}

function clearMsgNotifCount(userId){
	User.findById(userId ,(err ,user) => {
		if(err){throw err;}
		user.messageNotifications.count = 0;
		user.save();
	});
}

function clearMailNotifCount(userId){
	User.findById(userId ,(err ,user) => {
		if(err){throw err;}
		user.mailNotifications.count = 0;
		user.mailNotifications.array.forEach(function(notification){
			if(notification.notifType == 'mailSendFailed' || notification.notifType == 'notAbleToSendMailCuzFullSentMailsStorage' || notification.notifType == 'almostFullReceivedMailsStorage' || notification.notifType == 'almostFullSentMailsStorage' ){
				user.mailNotifications.array.splice(user.mailNotifications.array.indexOf(notification) ,1);
			}
		});
		user.save();
	});
}

function deleteNewMailNotification(newMailInfos){
	User.findById(newMailInfos.receiver ,(err ,user) => {
		if(err){throw err;}
		user.mailNotifications.array.forEach(notification => {
			if(notification.notifType == 'newMail' && notification.senderId == newMailInfos.senderId){
				user.mailNotifications.count -= notification.count;
				user.mailNotifications.array.splice(user.mailNotifications.array.indexOf(notification) ,1);
			}
		});
		user.save();
	});
}

function deleteNewMailReplyNotification(newMailReplyInfos){
	User.findById(newMailReplyInfos.receiver ,(err ,user) => {
		if(err){throw err;}
		user.mailNotifications.array.forEach(notification => {
			if(notification.notifType == 'newReply' && notification.senderId == newMailReplyInfos.senderId){
				user.mailNotifications.count -= 1;
				user.mailNotifications.array.splice(user.mailNotifications.array.indexOf(notification) ,1);
			}
		});
		user.save();
	});
}

function deleteNewReceivedProjectNotification(newReceivedProject){
	User.findById(newReceivedProject.receiver ,(err ,user) => {
		if(err){throw err;}
		user.bellNotifications.array.forEach(notification => {
			if(notification.notifType == 'receivedProject'){
				user.bellNotifications.count -= notification.count;
				user.bellNotifications.array.splice(user.bellNotifications.array.indexOf(notification) ,1);
			}
		});
		user.save();
	});
}

function deleteNewAssignedProjectNotification(newAssignedProject){
	User.findById(newAssignedProject.receiver ,(err ,user) => {
		if(err){throw err;}
		user.bellNotifications.array.forEach(notification => {
			if(notification.notifType == 'assignedProject'){
				user.bellNotifications.count -= notification.count;
				user.bellNotifications.array.splice(user.bellNotifications.array.indexOf(notification) ,1);
			}
		});
		user.save();
	});
}

function clearBellNotifCount(userId){
	User.findById(userId ,(err ,user) => {
		if(err){throw err;}
		user.bellNotifications.count = 0;
		user.bellNotifications.array.forEach(function(notification){
			if(notification.notifType == 'unassignProject' || notification.notifType == 'updateProject' || notification.notifType == 'eventUpdate' || notification.notifType == 'eventCancellation'){
				user.bellNotifications.array.splice(user.bellNotifications.array.indexOf(notification) ,1);
			}
		});
		user.save();
	});
}


//working with socket.io
io.on('connection' ,socket => {
	socket.on('joinRoom' ,data => {
		socket.join(data.room);
	});

	//private message
	socket.on('privateMessage' ,privateMessage => {
		async function myAsyncFunc(){
			try{
				await savePrivateMessage(privateMessage);
			}catch(err){
				return err;
			}
		}
		myAsyncFunc()
		.then(result => {
			socket.to(privateMessage.receiver).emit('privateMessage' ,privateMessage);
		})
		.catch(err =>{
			throw err;
		});
	});
	
	socket.on('clearMsgNotifCount' ,userId => {
		clearMsgNotifCount(userId);
	});
	socket.on('deleteNewReceivedPrivateMessageNotification' ,privateMessage =>{
		deleteNewReceivedPrivateMessageNotification(privateMessage);
	});

	//mails
	socket.on('deleteNewMailNotification' ,newMailInfos =>{
		deleteNewMailNotification(newMailInfos);
	});
	socket.on('newReply' ,visibleTo => {
		visibleTo.forEach(function(vt){
			socket.to(vt).emit('newReply');
		});
	});
	socket.on('saveNewReceivedMailNotification' ,newMailInfos => {
		saveNewReceivedMailNotification(newMailInfos);
	});
	socket.on('saveNewMailReplyNotification' ,newMailReplyInfos =>{
		saveNewMailReplyNotification(newMailReplyInfos);
	});
	socket.on('deleteNewMailReplyNotification' ,newMailReplyInfos => {
		deleteNewMailReplyNotification(newMailReplyInfos);
	});
	socket.on('clearMailNotifCount' ,userId => {
		clearMailNotifCount(userId);
	});

	//events & projects
	socket.on('projectDiscussionMessage' ,projectDiscussionMessage => {
		saveProjectDiscussionMessage(projectDiscussionMessage)
		.then( receivers => {
			receivers.forEach(function(receiver){
				//
				//
				if(receiver == projectDiscussionMessage.userId){
					socket.to(receiver).emit('projectDiscussionMessage' ,projectDiscussionMessage);
				}else{
					User.findById(receiver ,(err ,user) => {
						var count = 0;
						user.bellNotifications.array.forEach(notification => {
							if(notification.projectId == projectDiscussionMessage.projectId && notification.notifType == 'projectDiscussion'){
								count = notification.count;
								user.bellNotifications.array.splice(user.bellNotifications.array.indexOf(notification) ,1);
							}
						});
						const newNotif = {
							count: count + 1,
							notifType: 'projectDiscussion',
							projectId: projectDiscussionMessage.projectId,
							projectTitle: projectDiscussionMessage.projectTitle,
							projectType: ''
						}
						if(user.sentProjects.indexOf(projectDiscussionMessage.projectId) > -1){
							newNotif.projectType = 'sent';
						}else if(user.assignedProjects.indexOf(projectDiscussionMessage.projectId) > -1){
							newNotif.projectType = 'assigned';
						}else if(user.receivedProjects.indexOf(projectDiscussionMessage.projectId) > -1){
							newNotif.projectType = 'received';
						}
						projectDiscussionMessage.projectType = newNotif.projectType;
						user.bellNotifications.count += 1;
						user.bellNotifications.array.push(newNotif);
						user.save(()=>{
							socket.to(receiver).emit('projectDiscussionMessage' ,projectDiscussionMessage);
						});
					});
				}
			});
		})
		.catch(err => {
			throw err;
		});
	});

	socket.on('deleteNewProjectDiscussionMessageNotification' ,projectDiscussionMessage =>{
		deleteNewProjectDiscussionMessageNotification(projectDiscussionMessage);
	});

	socket.on('deleteNewReceivedProjectNotification' ,newReceivedProject =>{
		deleteNewReceivedProjectNotification(newReceivedProject);
	});

	socket.on('deleteNewAssignedProjectNotification' ,newAssignedProject => {
		deleteNewAssignedProjectNotification(newAssignedProject);
	});

	socket.on('clearBellNotifCount' ,userId => {
		clearBellNotifCount(userId);
	});
	
	//disconnect
	io.on('disconnect' ,() => {
		console.log('user disconnected');
	});
});
app.set('io', io);


// seed();
//--------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------


server.listen(3000 ,()=>{
    console.log("the server has started !");
});

