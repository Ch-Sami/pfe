//Mail Editor js
var newMailEditor = new EditorJS({
    /**
     * Wrapper of Editor
     */
    holder: 'newMailEditorjs',
    /**
     * Tools list
     */
    tools: {
      /**
       * Each Tool is a Plugin. Pass them via 'class' option with necessary settings {@link docs/tools.md}
       */
      header: {
        class: Header,
        inlineToolbar: ['link'],
        config: {
          placeholder: 'Header'
        },
        shortcut: 'CMD+SHIFT+H'
      },

      /**
       * Or pass class directly without any configuration
       */
      image: SimpleImage,

      list: {
        class: List,
        inlineToolbar: true,
        shortcut: 'CMD+SHIFT+L'
      },

      checklist: {
        class: Checklist,
        inlineToolbar: true,
      },

      quote: {
        class: Quote,
        inlineToolbar: true,
        config: {
          quotePlaceholder: 'Enter a quote',
          captionPlaceholder: 'Quote\'s author',
        },
        shortcut: 'CMD+SHIFT+O'
      },

      warning: Warning,

      marker: {
        class:  Marker,
        shortcut: 'CMD+SHIFT+M'
      },

      code: {
        class:  CodeTool,
        shortcut: 'CMD+SHIFT+C'
      },

      delimiter: Delimiter,

      inlineCode: {
        class: InlineCode,
        shortcut: 'CMD+SHIFT+C'
      },

      linkTool: LinkTool,

      embed: Embed,

      table: {
        class: Table,
        inlineToolbar: true,
        shortcut: 'CMD+ALT+T'
      },

    },
  //   onReady: function(){
  //     saveButton.click();
  //   }
  });
  /**
   * Saving Event Details
   */
  // saveButton.addEventListener('click', function () {
  //   editor.save().then((savedData) => {
  //     $('#evtDesc').text(JSON.stringify(savedData));
  //   });
  // });
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
//Mails js
$('.menuItem').removeClass('active menuItemColor');
$('#showMails').addClass('active menuItemColor');


//new mail
$('#sendToList').dropdown();
$('#clearSendToBtn').on('click', function () {
	$('#sendToList').dropdown('restore defaults')
});
$('#ccList').dropdown();
$('#clearCcBtn').on('click', function () {
	$('#ccList').dropdown('restore defaults')
});

// var toType = function(obj) {
//     return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
//   }

$('#searchTextbox').on('input' ,function(){
    setTimeout(function(){
        var usersList = JSON.parse($('#resultTextArea').text());
        $('#usersList').text('');
        usersList.forEach(function(elt){
            $('#usersList').append([                  
                '<div class="item" data-value="'+elt._id+'">',
                '   <img class="ui avatar image" src="'+elt.imageUrl+'">',
                '   <span class="bitraf">'+elt.username+'</span>',
                '</div>'
            ].join('\n'));
        });
    } ,300);
});
$('#searchTextbox1').on('input' ,function(){
  setTimeout(function(){
      var ccFound = JSON.parse($('#resultTextArea1').text());
      $('#ccMenu').text('');
      ccFound.forEach(function(elt){
          $('#ccMenu').append([                  
              '<div class="item" data-value="'+elt._id+'">',
              '   <img class="ui avatar image" src="'+elt.imageUrl+'">',
              '   <span class="bitraf">'+elt.username+'</span>',
              '</div>'
          ].join('\n'));
      });
  } ,300);
});

$('#newMailFrm').submit(function(){
    if($('#CCs').val() == ''){
      $('#CCs').attr('name' ,'');
    }
    newMailEditor.save().then((savedData) => {
      $('#mailText').text(JSON.stringify(savedData));
    });
  return true;
});

//show mail
$('#receiversList,#sentByInput,#sendingHistory').dropdown();


//sent mails
function addEvents(val){
  $('#sendingHistoryMenu'+val).addClass('d-block');
  $('#sendingHistoryHeader'+val).addClass('bitraf');
}
function removeEvents(val){
  $('#sendingHistoryMenu'+val).removeClass('d-block');
  $('#sendingHistoryHeader'+val).removeClass('bitraf');
}
for(var i = 0 ; i < $('#sentMailsLength').val() ;i++){
  $('#sendingHistory'+i).on('mouseover' ,addEvents.bind(null,i));
  $('#sendingHistory'+i).on('mouseout' ,removeEvents.bind(null,i));
}

//replies
$('#visibleToList').dropdown();

$('#newMailReplyFrm').submit(function(){
  if($('#visibleToInput').val() == ''){
    $('#visibleToInput').attr('name' ,'');
  }
  newMailEditor.save().then((savedData) => {
    $('#mailText').text(JSON.stringify(savedData));
  });
return true;
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//showMail
var showMailEditor = new EditorJS({
  /**
   * Wrapper of Editor
   */
  holder: 'showMailEditorjs',

  /**
   * Tools list
   */
  tools: {
    /**
     * Each Tool is a Plugin. Pass them via 'class' option with necessary settings {@link docs/tools.md}
     */
    header: {
      class: Header,
      inlineToolbar: ['link'],
      config: {
        placeholder: 'Header'
      },
      shortcut: 'CMD+SHIFT+H'
    },

    /**
     * Or pass class directly without any configuration
     */
    image: SimpleImage,

    list: {
      class: List,
      inlineToolbar: true,
      shortcut: 'CMD+SHIFT+L'
    },

    checklist: {
      class: Checklist,
      inlineToolbar: true,
    },

    quote: {
      class: Quote,
      inlineToolbar: true,
      config: {
        quotePlaceholder: 'Enter a quote',
        captionPlaceholder: 'Quote\'s author',
      },
      shortcut: 'CMD+SHIFT+O'
    },

    warning: Warning,

    marker: {
      class:  Marker,
      shortcut: 'CMD+SHIFT+M'
    },

    code: {
      class:  CodeTool,
      shortcut: 'CMD+SHIFT+C'
    },

    delimiter: Delimiter,

    inlineCode: {
      class: InlineCode,
      shortcut: 'CMD+SHIFT+C'
    },

    linkTool: LinkTool,

    embed: Embed,

    table: {
      class: Table,
      inlineToolbar: true,
      shortcut: 'CMD+ALT+T'
    }

  },

  /**
   * This Tool will be used as default
   */
  // initialBlock: 'paragraph',

  /**
   * Initial Editor data
   */
  
  data: {
    blocks: JSON.parse($('#showMailText').text()).blocks
  }
  // onReady: function(){
  //   saveButton.click();
  // },
});