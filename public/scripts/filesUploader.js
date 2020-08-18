(function( $ ) {
   
    $.fn.uploader = function( options ) {
      var settings = $.extend({
        MessageAreaText: "No files selected.",
        MessageAreaTextWithFiles: "File List:",
        DefaultErrorMessage: "Unable to open this file.",
        BadTypeErrorMessage: "We cannot accept this file type.",
        acceptedFileTypes: ['pdf', 'txt','tif','tiff','bmp','jpg','jpeg','gif','png','eps','raw','cr2','nef','orf','sr2','webm','mpg','mp2','mpeg','mpe','mpv','ogg','mp4','m4p','m4v','avi','wmv','mov','qt','flv','swf','avchd','flac','mpa','mp3','wav','wma','aac','pptx','ppsx','ppt','pps','pptm','potm','ppa' ,'pot','mpotx','ppsm','potx','potm','odp','doc','dot','docx','dotx','docm','dotm','rtf','xls','xlsx','xlsm','xlsb','xlt','xltx','xltm','xla','xlam','csv','ods','vsd']
      }, options );
   
      var uploadId = 1;
      //update the messaging 
       $('.file-uploader__message-area p').text(options.MessageAreaText || settings.MessageAreaText);
      
      //create and add the file list and the hidden input list
      var fileList = $('<ul class="file-list"></ul>');
      var hiddenInputs = $('<div class="hidden-inputs hidden"></div>');
      $('.file-uploader__message-area').after(fileList);
      $('.file-list').after(hiddenInputs);
      
     //when choosing a file, add the name to the list and copy the file input into the hidden inputs
      $('.file-chooser__input').on('change', function(){
         var file = $('.file-chooser__input').val();
         var fileName = (file.match(/([^\\\/]+)$/)[0]);
 
        //clear any error condition
        $('.file-chooser').removeClass('error');
        $('.error-message').remove();
        
        //validate the file
        var check = checkFile(fileName);
        if(check === "valid") {
          
          // move the 'real' one to hidden list 
          $('.hidden-inputs').append($('.file-chooser__input')); 

          //ADD GREY BORDER STYLE TO THE LIST
          if(! $('.file-list').hasClass('greyBorderStyle')){
            $('.file-list').addClass('greyBorderStyle');
          }
        
          //insert a clone after the hiddens (copy the event handlers too)
          $('.file-chooser').append($('.file-chooser__input').clone({ withDataAndEvents: true})); 
        
          //add the name and a remove button to the file-list
          $('.file-list').append('<li style="display: none;"><span class="file-list__name">' + fileName + '</span><button class="removal-button" data-uploadid="'+ uploadId +'"></button></li>');
          $('.file-list').find("li:last").show(800);
         
          //removal button handler
          $('.removal-button').on('click', function(e){
            e.preventDefault();

            //remove the corresponding hidden input
            $('.hidden-inputs input[data-uploadid="'+ $(this).data('uploadid') +'"]').remove(); 
          
            //remove the name from file-list that corresponds to the button clicked
            $(this).parent().hide("puff").delay(10).queue(function(){$(this).remove();});

            //REMOVE THE GREY BORDER STYLE
            if($('.file-list li').length < 2){
                $('.file-list').removeClass("greyBorderStyle");
            };

            //if the list is now empty, change the text back
            if($('.file-list li').length === 0) {
              $('.file-uploader__message-area').text(options.MessageAreaText || settings.MessageAreaText);
            }
          });
        
          //so the event handler works on the new "real" one
          $('.hidden-inputs .file-chooser__input').removeClass('file-chooser__input').attr('data-uploadId', uploadId); 
        
          //update the message area
          $('.file-uploader__message-area').text(options.MessageAreaTextWithFiles || settings.MessageAreaTextWithFiles);
          
          uploadId++;
          
        } else {
          //indicate that the file is not ok
          $('.file-chooser').addClass("error");
          var errorText = options.DefaultErrorMessage || settings.DefaultErrorMessage;
          
          if(check === "badFileName") {
            errorText = options.BadTypeErrorMessage || settings.BadTypeErrorMessage;
          }
          
          $('.file-chooser__input').after('<span class="error-message">'+ errorText +'</span>');
        }
      });
      
      var checkFile = function(fileName) {
        var accepted          = "invalid",
            acceptedFileTypes = this.acceptedFileTypes || settings.acceptedFileTypes,
            regex;
 
        for ( var i = 0; i < acceptedFileTypes.length; i++ ) {
          regex = new RegExp("\\." + acceptedFileTypes[i] + "$", "i");
 
          if ( regex.test(fileName) ) {
            accepted = "valid";
            break;
          } else {
            accepted = "badFileName";
          }
        }
 
        return accepted;
     };
   }; 
 }( jQuery ));
 
 //init 
 $(document).ready(function(){
   $('.fileUploader').uploader({
     MessageAreaText: "No files selected. Please select a file."
   });
 });
 
 
 $('#uploadLable').on('click' ,function(){
   $('.file-chooser__input').trigger("click");
 });