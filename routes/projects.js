const express = require("express");
const router = express.Router({mergeParams: true});
const User = require("../modules/user");
const Unit = require("../modules/unit");
const Project = require("../modules/project");
const Tree = require('../modules/projectTree');
const Mail = require('../modules/mail');
const Message = require('../modules/message');
const mongoose = require('mongoose');


//adding a function that get rid of duplicates values in an array to the js prototype
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//Assigned projects

//show the user's assigned projects
router.get("/users/:id/projects/assigned" ,(req ,res)=>{
    User.findById(req.params.id).populate('assignedProjects').exec((err ,user)=>{
        if(err){throw err;}
        else{
            user.getChildren(function(err ,children){
                if(err){throw err;}
                var isLeaf;
                if(children.length > 0){
                    isLeaf = false;
                }else{
                    isLeaf = true;
                }
                res.render("users/assignedProjects" ,{user: user ,isLeaf: isLeaf});
            });
        }
    });
});

//shows a specific assigned project's detail
router.get("/users/:id/projects/assigned/:prjId/detail" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            user.getChildren(function(err ,children){
                if(err){throw err;}
                Project.findById(req.params.prjId ,'-discussion -tree -sentTo -assignedTo -createdBy').populate({
                    path: 'lastUpdateBy',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                }).exec((err ,project)=>{
                    if(err){throw err;}
                    res.render("users/assignedProjectDetail" ,{user: user ,children: children ,project: project});
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
                res.render("users/assignedProjectDiscussion" ,{user: user ,project: project});
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

//adding new message to the project's discussion
router.post("/users/:id/projects/assigned/:prjId/discussion" ,(req ,res)=>{
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
                    res.redirect("/users/"+user._id+"/projects/assigned/"+project._id+"/discussion");
                });
            });
        }
    });
});

//unassign a project
router.delete("/users/:id/projects/assigned/:prjId" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            var index = user.assignedProjects.indexOf(req.params.prjId);
            if (index > -1) {
                user.assignedProjects.splice(index, 1);
                for(var i = 0 ;i < user.events.length ;i++){
                    if(user.events[i]._id == req.params.prjId){
                        user.events.splice(i ,1);
                        break;
                    }
                }
                user.save(()=>{
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
            user.getChildren(function(err ,children){
                if(err){throw err;}
                var isLeaf;
                if(children.length > 0){
                    isLeaf = false;
                }else{
                    isLeaf = true;
                }
                res.render("users/receivedProjects" ,{user: user ,isLeaf: isLeaf});
            });
        }
    });
});

//show a received project's detail
router.get("/users/:id/projects/received/:prjId/detail" ,(req ,res)=>{
    User.findById(req.params.id ,(err ,user)=>{
        if(err){throw err;}
        else{
            user.getChildren(function(err ,children){
                if(err){throw err;}
                Project.findById(req.params.prjId ,'-discussion -tree -sentTo -assignedTo -createdBy').populate({
                    path: 'lastUpdateBy',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                }).exec((err ,project)=>{
                    if(err){throw err;}
                    res.render("users/receivedProjectDetail" ,{user: user ,children: children ,project: project});
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
                res.render("users/receivedProjectDiscussion" ,{user: user ,project: project});
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
            user.getChildren(function(err ,children){
                if(err){throw err;}
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
            user.getChildren(function(err ,children){
                if(err){throw err;}
                Project.findById(req.params.prjId ,'-discussion -tree -sentTo -assignedTo -createdBy').populate({
                    path: 'lastUpdateBy',
                    select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
                }).exec((err ,project)=>{
                    if(err){throw err;}
                    res.render("users/sentProjectDetail" ,{user: user ,children: children ,project: project});
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
                res.render("users/sentProjectDiscussion" ,{user: user ,project: project});
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
                path: 'lastUpdateBy',
                select: '-events -sentProjects -receivedProjects -tags -office -firstName -lastName -area -isLoggedUser -assignedProjects -sentMails -receivedMails -contacts -unit'
            }).exec((err ,project)=>{
                if(err){throw err;}
                res.render("users/updateProject" ,{user: user ,project: project});
            });  
        }
    });
});

//updating a project
router.put("/users/:id/projects/sent/:prjId" ,(req ,res)=>{
    Project.findById(req.params.prjId ,(err ,project)=>{
        if(err){throw err;}
        project.title = req.body.project.title;
        project.start = req.body.project.start;
        project.end = req.body.project.end;
        project.detail = req.body.project.detail;
        project.save(()=>{
            res.redirect("/users/"+req.params.id+"/projects/sent/"+req.params.prjId+"/detail");
        });
    });
});

//updating a project's progress
router.post("/users/:id/projects/:prjId/progress" ,(req ,res)=>{
    Project.findById(req.params.prjId ,(err ,project)=>{
        if(err){throw err;}
        project.progress = req.body.updatedProgress;
        project.lastUpdateBy = req.body.lastUpdateBy;
        project.lastUpdateAt = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        project.save(()=>{
            res.redirect("/users/"+req.params.id+"/projects/assigned/"+req.params.prjId+"/detail");
        });
    });
});

//sending new project
router.post("/users/:id/projects/sent" ,(req ,res)=>{
    //initializing project
    var project = new Project(req.body.project);
    project.start = project.start.replace(/\//g, "-");
    project.end = project.end.replace(/\//g, "-");
    project.createdBy = req.params.id;
    if(req.body.sentTo !== undefined){
        var sentTo = req.body.sentTo.split(",");
        project.sentTo = sentTo;
        project.sentToList = project.sentToList.concat(sentTo).unique();
    }
    if(req.body.assignedTo !== undefined){
        var assignedTo = req.body.assignedTo.split(",");
        project.assignedTo = assignedTo;
        project.assignedToList = project.assignedToList.concat(assignedTo).unique();
    }
    project.save((err ,project)=>{
        if(err){throw err;}
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
                                            //pushing the project to the user as an event
                                            User.findById(at._id ,(err ,user)=>{
                                                if(err){throw err;}
                                                else{
                                                    user.assignedProjects.push(project);
                                                    var event = project;
                                                    event.url = ('/users/'+user._id+'/projects/assigned/'+project._id+'/detail');
                                                    user.events.push(event);
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
                                                        var event = project;
                                                        event.url = ('/users/'+user._id+'/projects/assigned/'+project._id+'/detail');
                                                        user.events.push(event);
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
router.post("/users/:id/projects/sent/:prjId/reSend" ,(req ,res)=>{
    Project.findById(req.params.prjId ,(err ,project)=>{
        if(err){throw err;}
        if(req.body.sentTo !== undefined){
            var sentTo = req.body.sentTo.split(",");
            project.sentTo = sentTo;
            project.sentToList = project.sentToList.concat(sentTo).unique();
        }
        if(req.body.assignedTo !== undefined){
            var assignedTo = req.body.assignedTo.split(",");
            project.assignedTo = assignedTo;
            project.assignedToList = project.assignedToList.concat(assignedTo).unique();
        }
        project.save((err ,project)=>{
            if(err){throw err;}
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
                                            //pushing the project to the user as an event
                                            User.findById(at._id ,(err ,user)=>{
                                                if(err){throw err;}
                                                else{
                                                    user.assignedProjects.push(project);
                                                    var event = project;
                                                    event.url = ('/users/'+user._id+'/projects/assigned/'+project._id+'/detail');
                                                    user.events.push(event);
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
                                                        var event = project;
                                                        event.url = ('/users/'+user._id+'/projects/assigned/'+project._id+'/detail');
                                                        user.events.push(event);
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