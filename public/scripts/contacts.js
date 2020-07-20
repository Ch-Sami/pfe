$('.menuItem').removeClass('active menuItemColor');
$('#showContacts').addClass('active menuItemColor');

//Contacts
$('#withinContacts').checkbox('set checked');
$('#withinContacts').checkbox({
  onChecked: function() {
    $('#outsideContacts').checkbox('set unchecked');
    $('#itemsTextArea').text($('#contactsForSearchData').text());
    $('#searchTextbox').val('');
    $('#contactsList').removeClass('d-none');
    $('#resultsWithinContacts').text('');
    $('#resultsOutsideContacts').text('');
    $('#itemsTextArea').trigger('change');
  }
});
$('#outsideContacts').checkbox({
  onChecked: function() {
    $('#withinContacts').checkbox('set unchecked');
    $('#itemsTextArea').text($('#usersListData').text());
    $('#searchTextbox').val('');
    $('#contactsList').addClass('d-none');
    $('#resultsWithinContacts').text('');
    $('#resultsOutsideContacts').text('');
    $('#itemsTextArea').trigger('change');
  }
});


$('#searchTextbox').on('input' ,function(){
    if(($(this).val() == '')&&($('#withinContacts').checkbox('is checked'))){
      $('#resultsWithinContacts').text('');
      $('#resultsWithinContacts').addClass('d-none');
      $('#resultsOutsideContacts').addClass('d-none');
      $('#contactsList').removeClass('d-none');
    }else{
      if($('#withinContacts').checkbox('is checked')){
        //search within the user's contacts
        setTimeout(function(){
          $('#contactsList').addClass('d-none');
          $('#resultsWithinContacts').text('');
          $('#resultsWithinContacts').removeClass('d-none');
          $('#resultsOutsideContacts').text('');
          $('#resultsOutsideContacts').addClass('d-none');
          var results = JSON.parse($('#resultTextArea').text());
          var userId = $('#userId').val();
          results.forEach(function(result){
              $('#resultsWithinContacts').append([                  
                '<div class="normalDiv row py-2 px-5 m-2">',
                '  <div class="column col-9 d-flex">',
                '      <img class="ui avatar image" src="'+ result.imageUrl+'">',
                '      <p class="mt-1 ml-5"><span class="inputsTitles">'+ result.username+'</span></p>',
                '  </div>',
                '  <div class="column col-3 d-flex justify-content-around text-align-center">',
                '      <form action="/users/'+userId+'/mails/sent/new" method="get">',
                '          <input type="text" value="'+result._id+'" class="d-none" name="sendTo">',
                '          <button  class="contactsIcons" data-inverted="" data-tooltip="Send mail" data-position="top center"><i class="fas fa-envelope mt-1"></i></button>',
                '      </form>',
                '      <a href="/users/'+userId+'/contacts/'+result._id+'/chat" class="contactsIcons" data-inverted="" data-tooltip="Chat" data-position="top center"><i class="fas fa-comments"></i></a>',
                '      <form action="/users/'+userId+'/events/new" method="get">',
                '          <input type="text" value="'+result._id+'" class="d-none" name="addTo">',
                '          <button  class="contactsIcons" data-inverted="" data-tooltip="Plan an event" data-position="top center"><i class="fas fa-calendar-alt"></i></button>',
                '      </form>',
                '      <a href="/users/'+result._id+'/profil" class="contactsIcons" data-inverted="" data-tooltip="Visit profil" data-position="top center"><i class="fas fa-address-card mt-1"></i></a>',
                '      <form action="/users/'+userId+'/contacts/'+result._id+'?_method=DELETE" method="post">',
                '           <button  class="contactsIcons" data-inverted="" data-tooltip="Delete contact" data-position="top center"><i class="fas fa-times" ></i></button>',
                '      </form>',
                '  </div>',
                '</div>'
              ].join('\n'));
          });
        } ,300);
        /* <i class="far fa-envelope mt-1"></i>
           <i class="far fa-calendar-alt"></i> */
      }else if($('#outsideContacts').checkbox('is checked')){
        //search outside my contacts
        setTimeout(function(){
          $('#contactsList').addClass('d-none');
          $('#resultsOutsideContacts').text('');
          $('#resultsOutsideContacts').removeClass('d-none');
          $('#resultsWithinContacts').text('');
          $('#resultsWithinContacts').addClass('d-none');
          var results = JSON.parse($('#resultTextArea').text());
          results.forEach(function(result){
            //checking if the searched user is already in the searcher's contacts
            var contactsArray = JSON.parse($('#contactsForSearchData').text());
            var trv = false;
            for(var i = 0 ; i< contactsArray.length ;i++){
              if(contactsArray[i]._id == result._id){
                trv = true;
              }
            }
            // console.log(trv);
            var userId = $('#userId').val();
            if((result._id !== $('#userId').val())&&(trv == false)){
              $('#resultsOutsideContacts').append([                  
                '<div class="normalDiv row py-2 px-5 m-2">',
                '  <div class="column col-9 d-flex">',
                '      <img class="ui avatar image" src="'+ result.imageUrl+'">',
                '      <p class="mt-1 ml-5"><span class="inputsTitles">'+ result.username+'</span></p>',
                '  </div>',
                '  <div class="column col-3 d-flex justify-content-around text-align-center">',
                '      <form action="/users/'+userId+'/mails/sent/new" method="get">',
                '          <input type="text" value="'+result._id+'" class="d-none" name="sendTo">',
                '          <button  class="contactsIcons" data-inverted="" data-tooltip="Send mail" data-position="top center"><i class="fas fa-envelope mt-1"></i></button>',
                '      </form>',
                '      <a href="/users/'+userId+'/contacts/'+result._id+'/chat" class="contactsIcons" data-inverted="" data-tooltip="Chat" data-position="top center"><i class="fas fa-comments"></i></a>',
                '      <form action="/users/'+userId+'/events/new" method="get">',
                '          <input type="text" value="'+result._id+'" class="d-none" name="addTo">',
                '          <button  class="contactsIcons" data-inverted="" data-tooltip="Plan an event" data-position="top center"><i class="fas fa-calendar-alt"></i></button>',
                '      </form>',
                '      <a href="/users/'+result._id+'/profil" class="contactsIcons" data-inverted="" data-tooltip="Visit profil" data-position="top center"><i class="fas fa-address-card mt-1"></i></a>',
                '      <form action="/users/'+ $('#userId').val()+'/contacts" method="post">',
                '        <input type="text" class="d-none" name="newContactId" value="'+result._id+'">',
                '        <button class="contactsIcons" data-inverted="" data-tooltip="Add to contacts" data-position="top center"><i class="fas fa-plus mt-1"></i></button>',
                '      </form>',
                '  </div>',
                '</div>'
              ].join('\n'));
            }  
          });
        } ,300);
      }
    }
});
