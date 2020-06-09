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

$('#searchTextbox').on('input' ,function(){
  if($(this).val() == ''){
    setTimeout(function(){
      $('#projectsSearchResults').text('');
      $('#projectsSearchResults').addClass('d-none');
      $('#ProjectsContainer').removeClass('d-none');
    } ,300);
  }else{
      setTimeout(function(){
        $('#ProjectsContainer').addClass('d-none');
        $('#projectsSearchResults').text('');
        $('#projectsSearchResults').removeClass('d-none');
        var results = JSON.parse($('#resultTextArea').text());
        var userId = $('#userId').text();
        var projectType = $('#projectType').val();
        var i = 0;
        results.forEach(function(result){
          $('#projectsSearchResults').append([
            '<div onclick=\'location.href="/users/'+userId+'/projects/'+projectType+'/'+result._id+'/detail"\' class="hoverableDiv py-2 px-5 m-2">',
            '      <p class="mb-2"><span class="inputsTitles">'+result.title+'</span></p>',
            '      <div class="row">',
            '          <div class="column col-sm-5"><p class="mb-0">Start : '+result.start+'</p></div>',
            '          <div class="column col-sm-7"><p class="mb-0">End : '+result.end+'</p></div>',
            '      </div>',
            '      <div class="row">',
            '          <div class="column col-sm-2"><p class="mb-0">Progress :</p></div>',
            '          <div class="column col-sm-10">',
            '              <div class="miniProgressDiv">',
            '                  <div class="ui indicating progress d-inline" id="miniProgress'+i+'S">',
            '                      <div class="bar"></div>',
            '                  </div>',
            '              </div>',
            '              <div class="ui input d-none">',
            '                  <input  id="projectProgress'+i+'S" type="text" value="'+result.progress+'">',
            '              </div>  ',
            '          </div>',
            '      </div>',
            '  </div>'
          ].join('\n'));
          $('#miniProgress'+i+'S').progress({
            percent: $('#projectProgress'+i+'S').attr('value'),
            limitValues: true
          });
          i++;
        });
      } ,300);
    }
});

$('#projectHistory').dropdown();
$('#projectHistory').on('mouseover' ,function(){
  $('#projectHistoryMenu').addClass('d-block');
  $('#projectHistoryHeader').addClass('bitraf');
});
$('#projectHistory').on('mouseout' ,function(){
  $('#projectHistoryMenu').removeClass('d-block');
  $('#projectHistoryHeader').removeClass('bitraf');
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





