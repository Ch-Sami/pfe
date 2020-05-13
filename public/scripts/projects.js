//Project Editor js
var newProjectEditor = new EditorJS({
    /**
     * Wrapper of Editor
     */
    holder: 'newProjectEditorjs',

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

//Projects js
$('.menuItem').removeClass('active menuItemColor');
$('#showProjects').addClass('active menuItemColor');

for(var i = 0 ;i < $('#arrayLength').val() ;i++){
  $('#miniProgress'+i).progress({
    percent: $('#projectProgress'+i).attr('value'),
    limitValues: true
  });
}

$('#progress').progress({
  percent: $('#projectProgress').attr('value'),
  limitValues: true
});

$('#progressDown').on('click' ,function(){
  var oldVal = parseInt($('#projectProgress').attr('value'));
  if(oldVal > 9){
    var newVal = oldVal - 9;
    $('#projectProgress').attr('value' ,newVal.toString());
    $('#progress').progress({
    percent: $('#projectProgress').attr('value'),
    limitValues: true
  });
  }
});

$('#progressUp').on('click' ,function(){
  var oldVal = parseInt($('#projectProgress').attr('value'));
  if(oldVal < 100){
    var newVal = oldVal + 9;
    $('#projectProgress').attr('value' ,newVal.toString());
    $('#progress').progress({
    percent: $('#projectProgress').attr('value'),
    limitValues: true
  });
  }
});
$('#saveProgress').on('click' ,function(){
  $('#projectProgress2').val($('#projectProgress').val());
  $('#saveProgressFrm').submit();
});

$('#progressUpdateInfo')
  .popup({
    popup : $('#progressUpdateInfoPopup'),
    on    : 'hover',
    position : 'right center'
  });


$('#sendToList').dropdown();
$('#clearSendToBtn').on('click', function () {
	$('#sendToList').dropdown('restore defaults')
});

$('#assignToList').dropdown();
$('#clearAssignToBtn').on('click', function () {
	$('#assignToList').dropdown('restore defaults')
});

$('#newProjectFrm,#showSentProjectFrm,#showReceivedProjectFrm,#showAssignedProjectFrm').submit(function(){
  if($('#sentToInput').val() == ''){
    $('#sentToInput').attr('name' ,'');
  }
  if($('#assignedToInput').val() == ''){
    $('#assignedToInput').attr('name' ,'');
  }
  newProjectEditor.save().then((savedData) => {
    $('#projectDoc').text(JSON.stringify(savedData));
  });
  return true;
});
$('#updateSentProjectFrm').submit(function(){
  newProjectEditor.save().then((savedData) => {
    $('#projectDoc').text(JSON.stringify(savedData));
  });
  return true;
});

$('#unassignBtn').on('click' ,function(){
  $('#unassignFrm').submit();
});

$('#deleteProjectBtn').on('click' ,function(){
  $('#deleteProjectFrm').submit();
});

//Project date Picker
$(function() {
  $('#startDate,#endDate').daterangepicker({
    singleDatePicker: true,
    showDropdowns: true,
    minYear: 1930,
    maxYear: 2100,
    locale: {
      format: 'YYYY/MM/DD'
  }
  });
});














//always last
var projectDiscussion = document.querySelector('#projectDiscussion');
projectDiscussion.scrollTop = projectDiscussion.scrollHeight - projectDiscussion.clientHeight;





