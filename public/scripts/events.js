//Event Editor js
var newEventEditor = new EditorJS({
    /**
     * Wrapper of Editor
     */
    holder: 'newEventEditorjs',

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
//Events js
$('.menuItem').removeClass('active menuItemColor');
$('#showCalendar').addClass('active menuItemColor');

// $('#newEvtBtn').on('click' ,function(){
//     $(this).fadeOut(250 ,function(){
//         $('#calendar').fadeOut(200 ,function(){
//             $('#newEvtFrm').fadeIn(200);
//         });
//     });
// });

// $('#anlEvt').on('click' ,function(){
//     $('#newEvtFrm input[type="text"]').val('');
//     $('#evtDesc').val('');
//     $('#newEvtFrm').fadeOut(200 ,function(){
//         $('#newEvtBtn').fadeIn(200);
//         $('#calendar').fadeIn(200);
//     });
// });

$('#addToList').dropdown();
$('#clearAddToBtn').on('click', function () {
	$('#addToList').dropdown('restore defaults')
});

// $('#searchTextbox').on('input' ,function(){
//   setTimeout(function(){
//       var usersList = JSON.parse($('#resultTextArea').text());
//       $('#usersList').text('');
//       usersList.forEach(function(elt){
//           $('#usersList').append([
//               '<div class="item" data-value="'+elt._id+'">',
//               '   <img class="ui avatar image" src="'+elt.imageUrl+'">',
//               '   <span class="bitraf">'+elt.username+'</span>',
//               '</div>'
//           ].join('\n'));
//       });
//   } ,300);
// });


$('#addEvtBtn').on('click' ,function(){
  if($('#addToInput').val() == ''){
    $('#receiversSelectionWarning').removeClass('d-none');
  }else{
    newEventEditor.save().then((savedData) => {
      $('#evtDesc').text(JSON.stringify(savedData));
      $('#newEvtFrm').submit();
    });
  }
});

$('#deleteEventBtn').on('click' ,function(){
  $('#deleteEventFrm').submit();
});

$('#rePlanEventBtn').on('click' ,function(){
  if($('#addToInput').val() == ''){
    $('#receiversSelectionWarning').removeClass('d-none');
  }else{
    $('#rePlanEventFrm').submit();
  }
});

////////
$('.intervalDropdown').dropdown();
$('.plannedForDropdown').dropdown();
function addEvents(val){
  $('#plannedForMenu'+val).addClass('d-block');
  $('#plannedForHeader'+val).addClass('bitraf');
}
function removeEvents(val){
  $('#plannedForMenu'+val).removeClass('d-block');
  $('#plannedForHeader'+val).removeClass('bitraf');
}
function addEvents2(val){
  $('#intervalMenu'+val).addClass('d-block');
  $('#intervaleHeader'+val).addClass('bitraf');
}
function removeEvents2(val){
  $('#intervalMenu'+val).removeClass('d-block');
  $('#intervaleHeader'+val).removeClass('bitraf');
}
for(var i = 0 ; i < $('#plannedEventsLength').val() ;i++){
  $('#plannedForDropdown'+i).on('mouseover' ,addEvents.bind(null,i));
  $('#plannedForDropdown'+i).on('mouseout' ,removeEvents.bind(null,i));
  $('#intervalDropdown'+i).on('mouseover' ,addEvents2.bind(null,i));
  $('#intervalDropdown'+i).on('mouseout' ,removeEvents2.bind(null,i));
}
////////

$('#typeSelector')
  .dropdown()
;

//Event dateTime Picker
$(function() {
  $('#dateTimePicker').daterangepicker({
      timePicker: true,
      startDate: moment().startOf('hour'),
      endDate: moment().startOf('hour').add(32, 'hour'),
      locale: {
          format: 'YYYY/MM/DDTHH:mm'
      }
  });
});




