const userId = $('#userId').val();
const userImg = $('#userImg').val();
const username = $('#username').val();

//notifications content container always scrolled down initially
var notificationDropdownContent = $('.notificationDropdownContent');
notificationDropdownContent.scrollTop = notificationDropdownContent.scrollHeight - notificationDropdownContent.clientHeight;

// scroll down after sending new message
if($('#currentPage').val() == 'projectDiscussion' || $('#currentPage').val() == 'chatPage'){
    scrollDown();
}




//connecting
const socket = io();

//joining room
socket.emit('joinRoom' ,{room: userId});


//receiving new private message
socket.on('privateMessage' ,privateMessage => {
    if($('#currentPage').val() == 'chatPage' && $('#contactId').val() == privateMessage.sender){
        appendNewReceivedPrivateMessage(privateMessage);
        scrollDown();
    }else{
        handleNewReceivedPrivateMessageNotification(privateMessage);
    }
});


socket.on('projectDiscussionMessage' ,projectDiscussionMessage => {
    if($('#currentPage').val() == 'projectDiscussion'){
        appendNewProjectDiscussionMessage(projectDiscussionMessage);
        scrollDown();
    }else{
        //handle notification
    }
});


socket.on('newMail' ,newMailInfos =>{
    if($('#currentPage').val() == 'receivedMailsPage'){
        appendNewMail(newMailInfos);
        calculateNewStoragePer(newMailInfos.mailSize);
    }else{
        handleNewMailNotification(newMailInfos);
    }
});


socket.on('newReply' ,newMailReplyInfos =>{
    if($('#currentPage').val() == 'repliesPage'){
        appendNewMailReply(newMailReplyInfos);
    }else if($('#currentPage').val() == 'sentMailsPage' && userId == newMailReplyInfos.parentMailSender){
        appendReplyInSentMailRepliesMenu(newMailReplyInfos);
    }else{
        handleNewMailReplyNotification(newMailReplyInfos);
    }
});


socket.on('mailRead' ,readerId =>{
    if($('#currentPage').val() == 'repliesPage' || $('#currentPage').val() == 'sentMailsPage'){
        $('[sentToRead="'+readerId+'"]').html('<span class="float-right" style="color: #09ed1c; white-space:pre;">done   </span>');
    }
});


socket.on('newReceivedProject' ,newReceivedProject =>{
    if($('#currentPage').val() == 'receivedProjectsPage'){
        appendNewReceivedProject(newReceivedProject);
    }else{
        handleNewReceivedProjectNotification(newReceivedProject);
    }
});

socket.on('newAssignedProject' ,newAssignedProject =>{
    if($('#currentPage').val() == 'assignedProjectsPage'){
        appendNewAssignedProject(newAssignedProject);
    }else{
        handleNewAssignedProjectNotification(newAssignedProject);
    }
});

socket.on('projectUpdateNotification' ,notification => {
    handleProjectUpdateNotification(notification);
});

socket.on('projectUnassignNotification' ,notification => {
    handleProjectUnassignNotification(notification);
});

socket.on('newEventNotification' ,notification => {
    handleNewEventNotification(notification);
});

socket.on('eventUpdateNotification' ,notification => {
    handleEventUpdateNotification(notification);
});

socket.on('eventCancellationNotification' ,notification => {
    handleEventCancellationNotification(notification);
});

socket.on('receivedMailsStorageAlmostFullNotification' ,() => {
    handleReceivedMailsStorageAlmostFullNotification();
});

socket.on('sentMailsStorageAlmostFullNotification' ,() => {
    handleSentMailsStorageAlmostFullNotification();
});

socket.on('missedMailNotification' ,notification => {
    handleMissedMailNotification(notification);
});

socket.on('notAbleToSendMailCuzFullSentMailsStorageNotification' ,notification => {
    handleNotAbleToSendMailCuzFullSentMailsStorageNotification(notification);
});







//handling notifs' icons click events
$('#msgNotificationsDropdown').on('click' ,function(){
    $('#mailNotificationsContent,#bellNotificationsContent').removeClass('d-block');
    $('#msgNotificationsContent').toggleClass('d-block');
    socket.emit('clearMsgNotifCount' ,userId);
    $('#msgNotifsCount').text('');
});
$('#mailNotificationsDropdown').on('click' ,function(){
    $('#msgNotificationsContent,#bellNotificationsContent').removeClass('d-block');
    $('#mailNotificationsContent').toggleClass('d-block');
    socket.emit('clearMailNotifCount' ,userId);
    $('#mailNotifsCount').text('');
});
$('#bellNotificationsDropdown').on('click' ,function(){
    $('#mailNotificationsContent,#msgNotificationsContent').removeClass('d-block');
    $('#bellNotificationsContent').toggleClass('d-block');
    socket.emit('clearBellNotifCount' ,userId);
    $('#bellNotifsCount').text('');
});

//sending new private message
$('#sendPrivateMessageBtn').on('click' ,function(e){
    if($('#privateMessageText').val() != ''){
        const privateMessage = {
            sender: userId,
            senderUsername: username,
            receiver: $('#contactId').val(),
            text: $('#privateMessageText').val(),
            at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        }
        socket.emit('privateMessage' ,privateMessage);
        $('#chatContainer').append(`
            <div class="row justify-content-end">
                <div class="row messageContainer darker">
                    <div class="column col-11 pr-3">
                        <span class="bitraf" style="font-size: 1.4em; font-weight: 500;">${username}</span>
                        <p>${privateMessage.text}</p>
                        <span class="time-left">${privateMessage.at}</span>
                    </div>
                    <div class="column col-1 p-0">
                        <img src="${userImg}" class="ui mini circular image m-0" alt="Avatar" style="width: 40px; height: 40px;">
                    </div>
                </div>
            </div>
        `);
        $('#privateMessageText').val('');
        scrollDown();
    }
});

//sending new project discussion message
$('#sendProjectDiscussionMessageBtn').on('click' ,function(e){
    if($('#projectDiscussionMessageText').val() != ''){
        const projectDiscussionMessage = {
            userId: userId,
            userName: username,
            userImage: userImg,
            text: $('#projectDiscussionMessageText').val(),
            at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            projectId: $('#projectId').val()
        }
        socket.emit('projectDiscussionMessage' ,projectDiscussionMessage);
        $('#projectDiscussion').append(`
            <div class="row justify-content-end">
                <div class="row messageContainer darker">
                    <div class="column col-11 pr-3">
                        <span class="bitraf" style="font-size: 1.4em; font-weight: 500;">${projectDiscussionMessage.userName}</span>
                        <p>${projectDiscussionMessage.text}</p>
                        <span class="time-left">${projectDiscussionMessage.at}</span>
                    </div>
                    <div class="column col-1 p-0">
                        <img src="${projectDiscussionMessage.userImage}" class="ui mini circular image m-0" alt="Avatar" style="width: 40px; height: 40px;">
                    </div>
                </div>
            </div>
        `);
        $('#projectDiscussionMessageText').val('');
        scrollDown();
    }
});




// $('#sendMailBtn').on('click' ,function(){
//     $('#totalMailSize').val();
//     if($('#CCs').val() == ''){
//       $('#CCs').attr('name' ,'');
//     }
//     newMailEditor.save().then((savedData) => {
//         $('#mailText').text(JSON.stringify(savedData));
//         totalMailSize =+ JSON.stringify(savedData);
//         var receivers = de_duplicate([...$('#sentTo').val().split(","), ...$('#CCs').val().split(",")]);
//         var xhr = new XMLHttpRequest();
//         xhr.open("POST", "/users/"+userId+"/mails/sent");
//         xhr.onload = function(event){
//             if(this.status == 200){   //200 means everything is ok
//                  const mail = JSON.parse(this.responseText);
//                  mail.receivers = receivers;
//                  socket.emit('newMail' ,mail);
//                  window.location.replace('/users/'+userId+'/mails/sent');
//             }else if(this.status == 404){ //optional
//                 //handle not found
//             }
//         };
//         var formData = new FormData(document.getElementById("#newMailFrm"));
//         xhr.send(formData);
//     });
// });







//functions for cleaner code

function appendNewReceivedPrivateMessage(privateMessage){
    const contactImg = $('#contactImg').val();
    const contactUsername = $('#contactUsername').val();
    $('#chatContainer').append(`
        <div class="row">
            <div class="row messageContainer">
                <div class="column col-1 p-0">
                    <img src="${contactImg}" class="ui mini circular image m-0" alt="Avatar" style="width: 40px; height: 40px;">
                </div>
                <div class="column col-11 pl-3">
                    <span class="bitraf" style="font-size: 1.4em; font-weight: 500;">${contactUsername}</span>
                    <p>${privateMessage.text}</p>
                    <span class="time-right">${privateMessage.at}</span>
                </div>
            </div>
        </div>
    `);
}

function appendNewProjectDiscussionMessage(projectDiscussionMessage){
    $('#projectDiscussion').append(`
        <div class="row">
            <div class="row messageContainer">
                <div class="column col-1 p-0">
                    <img src="${projectDiscussionMessage.userImage}" class="ui mini circular image m-0" alt="Avatar" style="width: 40px; height: 40px;">
                </div>
                <div class="column col-11 pl-3">
                    <span class="bitraf" style="font-size: 1.4em; font-weight: 500;">${projectDiscussionMessage.userName}</span>
                    <p>${projectDiscussionMessage.text}</p>
                    <span class="time-right">${projectDiscussionMessage.at}</span>
                </div>
            </div>
        </div>
    `);
}

function appendNewMail(newMailInfos){
    var CCicon = '';
    if(newMailInfos.mailType == 'CC'){
        CCicon = '<i class="far fa-closed-captioning"></i>'
    }
    $('#mailsList').prepend(`
        <div onclick='location.href="/users/${userId}/mails/received/${newMailInfos.mailId}/content"' class="hoverableDiv row d-flex py-2 px-5 m-2">
            <div class="column col-5 d-flex align-items-center px-0">
              <span class="bitraf mr-2" style="font-size: 1.5em;">
                <i class="fas fa-envelope"></i>
              </span>
              <span class="bitraf pt-0 ml-2" style="font-size: 1.2em; line-height: 5px;">
                <span class="bitraf pt-0 mb-4">
                Title : ${newMailInfos.title} ${CCicon}
              </span>
            </div>
            <div class="column col-7 px-0">
              <div class="float-right d-flex justify-content-between text-align-center">
                <form action="/users/${userId}/mails/received/${newMailInfos.mailId}?_method=DELETE" method="POST">
                  <input type="hidden" name="mailSize" value="${newMailInfos.mailSize}">
                  <button  class="contactsIcons" data-inverted="" data-tooltip="Delete" data-position="top center"><i class="fas fa-trash-alt"></i></button>
                </form>
              </div>
              <div class="fromAndAt float-right">
                <span>At : <span class="bitraf">${newMailInfos.at}</span></span>
              </div>
              <div class="fromAndAt float-right"> 
                <div class="d-flex">
                  <div class="mr-1">From :</div> 
                  <div>
                    <img class="ui avatar image" src="${newMailInfos.senderImage}">
                    <span class="bitraf">${newMailInfos.senderUsername}</span>
                  </div>
                </div>
              </div>
            </div>
        </div>
    `);
}

function appendNewMailReply(newMailReplyInfos){
    $('#repliesList').append(`
        <div onclick='location.href="/users/${userId}/mails/received/${newMailReplyInfos.replyId}/content"' class="hoverableDiv row d-flex py-2 px-5 m-2">
            <div class="column col-5 d-flex align-items-center px-0">
              <span class="bitraf mr-2" style="font-size: 1.5em;">
                  <i class="fas fa-envelope"></i>
              </span>
              <span class="bitraf pt-0 ml-2" style="font-size: 1.2em; line-height: 5px;">
                <span class="bitraf pt-0 mb-4">
                Title : ${newMailReplyInfos.replyTitle}
              </span>
            </div>
            <div class="column col-7 px-0">
              <div class="float-right d-flex justify-content-between text-align-center ml-1">
                <form action="/users/${userId}/mails/sent/${newMailReplyInfos.parentMail}/replies/${newMailReplyInfos.replyId}?_method=DELETE" method="POST">
                  <input type="hidden" name="mailSize" value="${newMailReplyInfos.mailSize}">
                  <input type="hidden" name="replyType" value="receivedReply">
                  <button  class="contactsIcons" data-inverted="" data-tooltip="Delete" data-position="top center"><i class="fas fa-trash-alt"></i></button>
                </form>
              </div>
              <div class="fromAndAt float-right">
                <span>At : <span class="bitraf">${newMailReplyInfos.at}</span></span>
              </div>  
              <div class="fromAndAt float-right"> 
                <div class="d-flex">
                  <div class="mr-1">From :</div> 
                  <div>
                    <img class="ui avatar image" src="${newMailReplyInfos.senderImage}">
                    <span class="bitraf">${newMailReplyInfos.senderUsername}</span>
                  </div>
                </div>
              </div>
            </div>
        </div>
    `);
}

function appendReplyInSentMailRepliesMenu(newMailReplyInfos){
    $('[replyMenuOf="'+newMailReplyInfos.parentMail+'"]').append(`
        <div class="item">
            <div class="row">
              <div class="column col-6 d-flex align-items-center">
                <span class="bitraf mr-4" style="font-size: 1.5em;">
                    <i class="fas fa-envelope"></i>
                </span>
                <span>From: </span>
                <img class="ui avatar image mr-1 ml-2 pr-0" src="${newMailReplyInfos.senderImage}">
                <span class="bitraf ml-0 pl-0 mr-4">${newMailReplyInfos.senderUsername}</span>
              </div>
              <div class="column col-6 d-flex align-items-center justify-content-end">
                <span>at :</span>
                <span class="bitraf"> ${newMailReplyInfos.at}</span>
              </div>
            </div>
        </div>
    `);
    //handle red number
}

function appendNewReceivedProject(newReceivedProject){
    const i = Number($('#iValue').val()) + 1;
    $('#iValue').val(i);
    $('#ProjectsContainer').prepend(`
        <div onclick='location.href="/users/${userId}/projects/received/${newReceivedProject.projectId}/detail"' class="hoverableDiv py-2 px-5 m-2">
            <p class="mb-2"><span class="inputsTitles">${newReceivedProject.title}</span></p>
            <div class="row">
                <div class="column col-sm-5"><p class="mb-0">Start : ${newReceivedProject.start}</p></div>
                <div class="column col-sm-7"><p class="mb-0">End : ${newReceivedProject.end}</p></div>
            </div>
            <div class="row">
                <div class="column col-sm-2"><p class="mb-0">Progress :</p></div>
                <div class="column col-sm-10">
                    <div class="miniProgressDiv">
                        <div class="ui indicating progress d-inline" id="miniProgress${i}">
                            <div class="bar"></div>
                        </div>
                    </div>
                    <div class="ui input d-none">
                        <input  id="projectProgress${i}" type="text" value="${newReceivedProject.progress}">
                    </div>  
                </div>
            </div>
        </div>
    `);
    $('#miniProgress'+i).progress({
        percent: $('#projectProgress'+i).attr('value'),
        limitValues: true
    });
}

function appendNewAssignedProject(newAssignedProject){
    const i = Number($('#iValue').val()) + 1;
    $('#iValue').val(i);
    $('#ProjectsContainer').prepend(`
        <div onclick='location.href="/users/${userId}/projects/assigned/${newAssignedProject.projectId}/detail"' class="hoverableDiv py-2 px-5 m-2">
            <p class="mb-2"><span class="inputsTitles">${newAssignedProject.title}</span></p>
            <div class="row">
                <div class="column col-sm-5"><p class="mb-0">Start : ${newAssignedProject.start}</p></div>
                <div class="column col-sm-7"><p class="mb-0">End : ${newAssignedProject.end}</p></div>
            </div>
            <div class="row">
                <div class="column col-sm-2"><p class="mb-0">Progress :</p></div>
                <div class="column col-sm-10">
                    <div class="miniProgressDiv">
                        <div class="ui indicating progress d-inline" id="miniProgress${i}">
                            <div class="bar"></div>
                        </div>
                    </div>
                    <div class="ui input d-none">
                        <input  id="projectProgress${i}" type="text" value="${newAssignedProject.progress}">
                    </div>  
                </div>
            </div>
        </div>
    `);
    $('#miniProgress'+i).progress({
        percent: $('#projectProgress'+i).attr('value'),
        limitValues: true
    });
}

function calculateNewStoragePer(newMailSize){
    const newTotalMailsSize = Number($('#totalMailsSize').val()) + Number(newMailSize);
    var storagePer = ((newTotalMailsSize * 100) / $('#userStorage').val()).toFixed(2);
    $('#storagePerLable').text(storagePer);
    if(storagePer < 0.5){
      storagePer = 0.5
    }
    $('#storagePer').val(storagePer);
    $('#progress').progress({
      percent: storagePer,
      limitValues: true
    });
    setBarColor(storagePer);
}

function setBarColor(storagePer){
    switch(true){
      case (storagePer <= 15):
        $('#storageUsedBar').css('background-color', '#00c21a');
        break;
      case (storagePer > 15 && storagePer <= 35):
        $('#storageUsedBar').css('background-color', '#aaf200');
        break;
      case (storagePer > 35 && storagePer <= 65):
        $('#storageUsedBar').css('background-color', '#f2de00');
        break;
      case (storagePer > 65 && storagePer < 90):
        $('#storageUsedBar').css('background-color', '#f77c00');
        break;
      case (storagePer >= 90):
        $('#storageUsedBar').css('background-color', '#c70000');
        $('#storageWarning').removeClass('d-none');
        break;
    }
}

function scrollDown(){
    var discussionContainer = document.querySelector('.discussionContainer');
    discussionContainer.scrollTop = discussionContainer.scrollHeight - discussionContainer.clientHeight;
}

//handling notifications
function handleNewReceivedPrivateMessageNotification(privateMessage){
    $('#msgEmptyNotifications').remove();
    var i = Number($('#msgNotifsCount').text());
    $('#msgNotifsCount').text(i+1);
    const count = $('[msgfrom="'+privateMessage.sender+'"]');
    if(count.length == 0){
        $('#msgNotificationsContent').append(`
            <a href="/users/${userId}/contacts/${privateMessage.sender}/chat"><strong class="bitraf mr-2"><i class="far fa-comment"></i></strong>You have received <strong class="bitraf" msgfrom="${privateMessage.sender}">1</strong> new private message from <strong class="bitraf">${privateMessage.senderUsername}</strong>.</a>
        `);
    }else{
        newNumber = Number(count.text()) + 1;
        count.parent().remove();
        $('#msgNotificationsContent').append(`
            <a href="/users/${userId}/contacts/${privateMessage.sender}/chat"><strong class="bitraf mr-2"><i class="far fa-comment"></i></strong>You have received <strong msgfrom="${privateMessage.sender}" class="bitraf">${newNumber}</strong> new private messages from <strong class="bitraf">${privateMessage.senderUsername}</strong>.</a>
        `);
    }
    // socket.emit('saveNewReceivedPrivateMessageNotification' ,privateMessage);
}

function incrementMailNotifsCount(){
    $('#mailEmptyNotifications').remove();
    var i = Number($('#mailNotifsCount').text());
    $('#mailNotifsCount').text(i+1);
}

function handleNewMailNotification(newMailInfos){
    incrementMailNotifsCount();
    const count = $('[mailfrom="'+newMailInfos.senderId+'"]');
    if(count.length == 0){
        $('#mailNotificationsContent').append(`
            <a href="/users/${userId}/mails/received/${newMailInfos.mailId}/content"><strong class="bitraf mr-2"><i class="far fa-envelope"></i></strong>You have received <strong class="bitraf" mailfrom="${newMailInfos.senderId}">1</strong> new mail from <strong class="bitraf">${newMailInfos.senderUsername}</strong>.</a>
        `);
    }else{
        newNumber = Number(count.text()) + 1;
        count.parent().remove();
        $('#mailNotificationsContent').append(`
            <a href="/users/${userId}/mails/received"><strong class="bitraf mr-2"><i class="far fa-envelope"></i></strong>You have received <strong mailfrom="${newMailInfos.senderId}" class="bitraf">${newNumber}</strong> new mails from <strong class="bitraf">${newMailInfos.senderUsername}</strong>.</a>
        `);
    }
}

function handleNewMailReplyNotification(newMailReplyInfos){
    incrementMailNotifsCount();
    if(userId == newMailReplyInfos.parentMailSender){
        $('#mailNotificationsContent').append(`
            <a href="/users/${userId}/mails/received/${newMailReplyInfos.replyId}/content"><strong class="bitraf mr-2"><i class="far fa-envelope"></i></strong><strong class="bitraf">${newMailReplyInfos.senderUsername}</strong> has replied to the sent mail <strong class="bitraf">"${newMailReplyInfos.parentMailTitle}"</strong>.</a>
        `);
    }else{
        $('#mailNotificationsContent').append(`
            <a href="/users/${userId}/mails/received/${newMailReplyInfos.replyId}/content"><strong class="bitraf mr-2"><i class="far fa-envelope"></i></strong><strong class="bitraf">${newMailReplyInfos.senderUsername}</strong> has replied to the received mail <strong class="bitraf">"${newMailReplyInfos.parentMailTitle}"</strong>.</a>
        `);
    }
}

function handleMissedMailNotification(notification){
    incrementMailNotifsCount();
    $('#mailNotificationsContent').append(`
            <a href="/users/${userId}/mails/received"><span class="bitraf mr-2"><i class="fas fa-exclamation-triangle"></i></span> you were not able to receive a mail from <strong class="bitraf">${notification.senderUsername}</strong> at <strong class="bitraf">"${notification.at}"</strong> due to your full storage.</a>
    `);
}

function handleReceivedMailsStorageAlmostFullNotification(){
    incrementMailNotifsCount();
    $('#mailNotificationsContent').append(`
            <a href="/users/${userId}/mails/received"><span class="bitraf mr-2"><i class="fas fa-exclamation-triangle"></i></span> your received mails storage is almost full ,their is a risk of not being able to receive large mails in the future.</a>
    `);
}

function handleSentMailsStorageAlmostFullNotification(){
    incrementMailNotifsCount();
    $('#mailNotificationsContent').append(`
            <a href="/users/${userId}/mails/sent"><span class="bitraf mr-2"><i class="fas fa-exclamation-triangle"></i></span> your sent mails storage is almost full ,their is a risk of not being able to send large mails in the future.</a>
    `);
}

function handleNotAbleToSendMailCuzFullSentMailsStorageNotification(notification){
    incrementMailNotifsCount();
    $('#mailNotificationsContent').append(`
            <a href="/users/${userId}/mails/sent"><span class="bitraf mr-2"><i class="fas fa-exclamation-triangle"></i></span> the mail <strong class="bitraf">"${notification.mailTitle}"</strong> was not send due to your full sent mails storage.</a>
    `);
}

function incrementBellNotifsCount(){
    $('#bellEmptyNotifications').remove();
    var i = Number($('#bellNotifsCount').text());
    $('#bellNotifsCount').text(i+1);
}

function handleNewReceivedProjectNotification(newReceivedProject){
    incrementBellNotifsCount();
    const count = $('[projectType="received"]');
    if(count.length == 0){
        $('#bellNotificationsContent').append(`
            <a href="/users/${userId}/projects/received/${newReceivedProject.projectId}/detail"><strong class="bitraf mr-2"><i class="fas fa-clipboard-list"></i></strong>You have received <strong class="bitraf" projectType="received">1</strong> new project at <strong class="bitraf">${newReceivedProject.at}</strong>.</a>
        `);
    }else{
        newNumber = Number(count.text()) + 1;
        count.parent().remove();
        $('#bellNotificationsContent').append(`
            <a href="/users/${userId}/projects/received"><strong class="bitraf mr-2"><i class="fas fa-clipboard-list"></i></strong>You have received <strong class="bitraf" projectType="received">${newNumber}</strong> new projects.</a>
        `);
    }
}

function handleNewAssignedProjectNotification(newAssignedProject){
    incrementBellNotifsCount();
    const count = $('[projectType="assigned"]');
    if(count.length == 0){
        $('#bellNotificationsContent').append(`
            <a href="/users/${userId}/projects/assigned/${newAssignedProject.projectId}/detail"><strong class="bitraf mr-2"><i class="fas fa-clipboard-list"></i></strong>You have been assigned to <strong class="bitraf" projectType="received">1</strong> project at <strong class="bitraf">${newAssignedProject.at}</strong>.</a>
        `);
    }else{
        newNumber = Number(count.text()) + 1;
        count.parent().remove();
        $('#bellNotificationsContent').append(`
            <a href="/users/${userId}/projects/assigned"><strong class="bitraf mr-2"><i class="fas fa-clipboard-list"></i></strong>You have been assigned to <strong class="bitraf" projectType="assigned">${newNumber}</strong> projects.</a>
        `);
    }
}

function handleProjectUpdateNotification(notification){
    incrementBellNotifsCount();
    if(notification.projectType == 'assigned'){
        $('#bellNotificationsContent').append(`
            <a href="/users/${userId}/projects/assigned/${notification.projectId}/detail"><strong class="bitraf mr-2"><i class="fas fa-exclamation-circle"></i></strong> <strong class="bitraf">${notification.username}</strong> has updated the project <strong class="bitraf">"${notification.projectTitle}"</strong> at <strong class="bitraf">${notification.at}</strong>.</a>
        `);
    }else{
        $('#bellNotificationsContent').append(`
            <a href="/users/${userId}/projects/received/${notification.projectId}/detail"><strong class="bitraf mr-2"><i class="fas fa-exclamation-circle"></i></strong> <strong class="bitraf">${notification.username}</strong> has updated the project <strong class="bitraf">"${notification.projectTitle}"</strong> at <strong class="bitraf">${notification.at}</strong>.</a>
        `);
    }
    
}

function handleProjectUnassignNotification(notification){
    incrementBellNotifsCount();
    $('#bellNotificationsContent').append(`
        <a><strong class="bitraf mr-2"><i class="fas fa-exclamation-circle"></i></strong> <strong class="bitraf">${notification.username}</strong> has unassigned the project <strong class="bitraf">"${notification.projectTitle}"</strong> at <strong class="bitraf">${notification.at}</strong>.</a>
    `);
}

function handleNewEventNotification(notification){
    incrementBellNotifsCount();
    const count = $('[eventFrom="'+notification.plannerId+'"]');
    if(count.length == 0){
        $('#bellNotificationsContent').append(`
            <a href="${notification.url}"><strong class="bitraf mr-2"><i class="far fa-star"></i></strong> <strong class="bitraf">${notification.plannerUsername}</strong> has planned <span class="bitraf" eventFrom="${notification.plannerId}">1</span> event <strong class="bitraf">"${notification.eventTitle}"</strong> for you at <strong class="bitraf">${notification.at}</strong>.</a>
        `);
    }else{
        newNumber = Number(count.text()) + 1;
        count.parent().remove();
        $('#bellNotificationsContent').append(`
            <a href="/users/${userId}/events"><strong class="bitraf mr-2"><i class="far fa-star"></i></strong> <strong class="bitraf">${notification.plannerUsername}</strong> has planned <span class="bitraf" eventFrom="${notification.plannerId}">${newNumber}</span> events for you.</a>
        `);
    }
}

function handleEventUpdateNotification(notification){
    incrementBellNotifsCount();
    $('#bellNotificationsContent').append(`
        <a href="${notification.url}"><strong class="bitraf mr-2"><i class="fas fa-exclamation-circle"></i></strong> <strong class="bitraf">${notification.plannerUsername}</strong> has updated <strong class="bitraf">"${notification.eventTitle}"</strong> at <strong class="bitraf">${notification.at}</strong>.</a>
    `);
}

function handleEventCancellationNotification(notification){
    incrementBellNotifsCount();
    $('#bellNotificationsContent').append(`
        <a><strong class="bitraf mr-2"><i class="fas fa-exclamation-circle"></i></strong> <strong class="bitraf">${notification.plannerUsername}</strong> has canceled your <strong class="bitraf">"${notification.eventTitle}"</strong> at <strong class="bitraf">${notification.at}</strong>.</a>
    `);
}



//
//
//
//
//
//
//
//
//
//presence & remplacant
//
//
//
//