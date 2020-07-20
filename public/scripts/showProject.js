/**
     * Saving button
     */
    const saveButton = document.getElementById('saveButton');

    /**
     * To initialize the Editor, create a new instance with configuration object
     * @see docs/installation.md for mode details
     */
    
    var editor = new EditorJS({
      /**
       * Wrapper of Editor
       */
      holder: 'showProjectEditorjs',

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
        blocks: JSON.parse($('#projectDoc').text()).blocks
      }
      // onReady: function(){
      //   saveButton.click();
      // },
    });



$('#progress').progress({
  percent: $('#projectProgress').attr('value'),
  limitValues: true
});
  
$('#progressDown').on('click' ,function(){
  var oldVal = parseInt($('#eventProgress').attr('value'));
  if(oldVal > 9){
    var newVal = oldVal - 9;
    $('#eventProgress').attr('value' ,newVal.toString());
    $('#progress').progress({
      percent: $('#eventProgress').attr('value'),
      limitValues: true
    });
  }
});
  
$('#progressUp').on('click' ,function(){
  var oldVal = parseInt($('#eventProgress').attr('value'));
  if(oldVal < 100){
    var newVal = oldVal + 9;
    $('#eventProgress').attr('value' ,newVal.toString());
    $('#progress').progress({
    percent: $('#eventProgress').attr('value'),
    limitValues: true
  });
  }
});

//resending project
$('#resentProjectBtn').on('click' ,function(){
  if($('#assignedToInput').val() == ''){
    $('#assignedToInput').attr('name' ,'');
  }else{
    $('#assignedToInput').attr('name' ,'assignedTo');
  }
  if($('#sentToInput').val() == ''){
    $('#sentToInput').attr('name' ,'');
  }else{
    $('#sentToInput').attr('name' ,'sentTo');
  }
  if($('#assignedToInput').val() != '' || $('#sentToInput').val() != ''){
    $('#resendProjectFrm').submit();
  }else{
    $('#receiversSelectionWarning').removeClass('d-none');
  }
});


//files deleting and cancel deleting
for(let i = 0 ; i < $('#filesArrayLength').val() ; i++){
  $('#deleteFile'+i).on('click' ,function(){
      $('#fileToDelete'+i).attr('name' ,'filesToDelete[]');
      $(this).addClass('d-none');
      $('#addFile'+i).removeClass('d-none');
  });
  $('#addFile'+i).on('click' ,function(){
      $('#fileToDelete'+i).attr('name' ,'');
      $(this).addClass('d-none');
      $('#deleteFile'+i).removeClass('d-none');
  });
}
//project update form submiting
$('#updateSentProjectFrm').submit(function(){
  editor.save().then((savedData) => {
    $('#projectDoc').text(JSON.stringify(savedData));
  });
  return true;
});