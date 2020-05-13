
/**
     * Saving button
     */
    /**
     * To initialize the Editor, create a new instance with configuration object
     * @see docs/installation.md for mode details
     */
    
    var editor = new EditorJS({
      /**
       * Wrapper of Editor
       */
      holder: 'editorjs',

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
        blocks: JSON.parse($('#evtDesc').text()).blocks
      }
      // onReady: function(){
      //   saveButton.click();
      // },
    });
    
    $('#updateEventFrm').submit(function(){
      editor.save().then((savedData) => {
          $('#evtDesc').text(JSON.stringify(savedData));
        });
      return true;
    });

    $('#deleteEventBtn').on('click' ,function(){
      $('#deleteEventFrm').submit();
    });
