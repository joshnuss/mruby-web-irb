var history = [], history_index = 0;

(function () {
  var lines = [], printed = false, webruby, load_string_func;

  if (localStorage) {
    history = JSON.parse(localStorage.history || '[]');
    history_index = history.length;
  }

  var INPUT_HEIGHT = 21;
  var ENTER_KEY = 13;
  var UP_KEY    = 38;
  var DOWN_KEY  = 40;

  window.Module = {};
  window.Module['print'] = function (x) {
    lines.push(x);
    printed = true;
  };

  $(document).ready(function() {
    $(window).resize(function() {
      var $window = $(window);

      $('#shell').height($window.height()-10);
      $('#editor').width($window.width()-60);
    });

    $('#shell').click(function() {
      focus_editor();
    });

    $(window).trigger('resize');

    $('#try-it-now').live('click', function(e) {
      e.preventDefault();
      $.modal.close();
    });

    webruby = new WEBRUBY({print_level: 2});
    webruby.run_source($('script[type="text/ruby"]').text());

    var run_command = function(source) {
      lines = [];
      printed = false;

      if (source != history[history.length-1])
        history.push(source);

      history_index = history.length;

      webruby.run_source(source);

      if (!printed) {
        window.Module['print']('nil');
      }

      add_output(source, lines);
    };

    var add_output = function(source, lines) {
      var element = $("#output");
      var value   = lines.slice(-1)[0];

      var session = element.append('<div class="session"><div class="command"><span class="prompt">&gt;&gt;</span><div class="source editor"/></div><div class="response"></div></div>').find('.session:last');
      var response = session.find('.response');

      $(lines.slice(0, -1)).each(function(_, line) {
        response.append('<p>');
        response.find('p:last').text(line);
      });

      var size = $('.session').size();
      var id = 'editor' + size;
      session.find('.command .source').attr('id', id).text(source);
      var viewer = configure_editor(id);
      viewer.setReadOnly(true);
      resize_textarea(viewer, '#' + id);
      viewer.resize();
      focus_editor();

      if (value) {
        response.append('<span class="value-prompt">=&gt;</span><span class="value" />');
        response.find('.value').text(value);
      }

      var source_height = $('#' + id).height();
      session.find('.command').height(source_height);

      if (value && value.match(/\S*Error: /))
        response.addClass('error');

      scroll_to_end();

      history_index = history.length;
    };

    var scroll_to_end = function() {
      $('#container').scrollTop($('#output').height() + $('#command').height());
    };

    var set_command = function(cmd) {
      editor.getSession().setValue(cmd);
      editor.getSelection().moveCursorFileEnd();
      resize_textarea(editor, '#editor');
      
    };

    var resize_textarea = function(editor, selector) {
      var lines = editor.session.getLength();

      $(selector).height(lines * INPUT_HEIGHT);
      scroll_to_end();
    };

    $('#editor').keyup(function() {
      resize_textarea(editor, '#editor');
    });

    $('#editor').keydown(function(e) {
      var cmd, found = true;

      switch (e.which) {
        case UP_KEY:
          history_index--;
          cmd = history[history_index];

          if (history_index < 0)
            history_index = 0;
          else
            set_command(cmd);

          break;

        case DOWN_KEY:
          history_index++;
          cmd = history[history_index];

          if (history_index >= history.length) {
            history_index = history.length;
            set_command('');
          }
          else
            set_command(cmd);

          break;

        case ENTER_KEY:
          if (e.shiftKey) {
            editor.getSession().insert(editor.selection.getCursor(), "\n");
            resize_textarea(editor, '#editor');
            editor.resize();
          }
          else {
            var val = editor.getValue().trim();
            if (val)
              run_command(val);
            else {
              add_output('', []);
              scroll_to_end();
            }

            set_command('');
            $(this).height(INPUT_HEIGHT).focus();
          }
          break;

        default:
          found = false;
          break;
      }

      if (found) e.preventDefault();
    });

    window.onbeforeunload = function () {
      webruby.close();

      if (localStorage) {
        localStorage.history = JSON.stringify(history);
      }
    };

    var configure_editor = function(selector) {
      var editor = ace.edit(selector);
      editor.renderer.setShowGutter(false);
      editor.setTheme("ace/theme/monokai");
      editor.setHighlightActiveLine(false);
      editor.setShowPrintMargin(false);
      editor.getSession().setMode("ace/mode/ruby");
      editor.getSession().setUseSoftTabs(true);
      editor.getSession().setTabSize(2);
      return editor;
    };

    var editor = configure_editor('editor');
    window.ed = editor;
    editor.commands.addCommand({
      name: 'up',
      bindKey: 'Up',
      exec: function(editor) {
        return false;
      }
    });

    editor.commands.addCommand({
      name: 'down',
      bindKey: 'Down',
      exec: function(editor) {
        return false;
      }
    });

    var focus_editor = function() {
      editor.focus();
      $('textarea:last').focus();
    };

    if (localStorage.saw_welcome != 'yes') {
      editor.session.setValue('puts "hello world"');
      localStorage.saw_welcome = 'yes';
      $('#welcome').modal({onClose: function(dialog) {
        dialog.data.fadeOut('fast', function () {
          $.modal.close();
          focus_editor();
        });
      }});
    }

    focus_editor();
  });
}());
