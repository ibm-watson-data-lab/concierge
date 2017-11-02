/******
  EXAMPLE CHAT WIDGET
  FOR SIMPLE NOTIFICATION SERVICE
******/
var _concierge_chat_host = document.currentScript.src.replace(/\/chat-widget.js$/, '');
function Concierge(opts) { 

  this.url = opts.url || "";
  this.workspace_id = opts.workspace_id || null;
  this.context = null;

  // dependencies
  if (typeof jQuery != "function") throw new Error("jQuery not detected and is required")

  /*** Code to async load JS ***/
  this.addScript = function(elm, evType, fn, useCapture) {
    //Credit: Function written by Scott Andrews
    //(slightly modified)
    var ret = 0;
  
    if (elm.addEventListener) {
        ret = elm.addEventListener(evType, fn, useCapture);
    } else if (elm.attachEvent) {
        ret = elm.attachEvent('on' + evType, fn);
    } else {
        elm['on' + evType] = fn;
    }
  
    return ret;
  };
  
  /*** async load ***/
  this.load = function(src, callback) {
    var a = document.createElement('link');
    a.rel = 'stylesheet';
    a.href = src;
    $("head").append(a)
    
    this.addScript(a, 'load', callback, false);
  }

  this.load(_concierge_chat_host + "/chat-widget.css", function() {

    // create the container for the chat system
    this.container = $("<div>", { class: "_concierge_chat_container _concierge_min"});
    $("body").append(this.container);

    // title bar
    var title_bar = $("<div>", { class: "_concierge_title" });
    var title_text = $("<p>", { class: "_concierge_title_text" }).text("Concierge")
    var min = $("<img>", { src: _concierge_chat_host + "/min.png" })
    title_bar.append(min);
    title_bar.append(title_text);
    this.container.append(title_bar);

    min.click(function() {
      this.container.toggleClass("_concierge_min")
    }.bind(this))


    // create the elements for the ID screen
    var id_div = $("<div>", { class: "_concierge_chat_id_screen", id: "_concierge_chat_id_screen"})
    var welcome = $("<p>").text("Welcome to Concierge, click 'Get Started' to speak to someone")
    var name_button = $("<button>", { name: "_concierge_chat_name_submit", id: "_concierge_chat_name_submit", type: "button" }).text("Get Started!")

    // add these elements
    id_div.append(welcome);
    id_div.append(name_button);
    this.container.append(id_div);

    // set name on button press
    name_button.click(function() {
      this.connect()
    }.bind(this));

    // what happens when you click the "enter your name" button
    this.connect = function() {

      this.renderChatWindow = function() {
        
        // hide ID screen
        $('div#_concierge_chat_id_screen').addClass("_concierge_chat_hidden");

        // chat window
        var chat_div = $("<div>", { class: "_concierge_chat_messages", id: "_concierge_chat_messages"})
        this.container.append(chat_div)

        // chat messages
        var messages_ul = $("<ul>", { class: "_concierge_chat_message_list", id: "_concierge_chat_message_list" })
        chat_div.append(messages_ul)

        // chat inputs
        var chat_input = $("<textarea>", { class: "_concierge_chat_msg", name: "_concierge_chat_msg", id: "_concierge_chat_msg", placeholder: "Enter your msg..." })
        var chat_button = $("<button>", { class: "_concierge_chat_btn", name: "_concierge_chat_btn", id: "_concierge_chat_btn", type: "button" }).text(">")
        this.container.append(chat_input);
        this.container.append(chat_button);
        
        // send msg on button click
        chat_button.click(function(e) {
          this.sendMessage();
        }.bind(this))

        // send msg on enter
        chat_input.keypress(function(e) {
          var keycode = (e.keyCode ? e.keyCode : e.which);
          if(keycode == '13'){
            e.preventDefault();
            this.sendMessage();
          }
        }.bind(this))

      }.bind(this);

      this.sendMessage = function(text) {

        var msg = text || $("textarea#_concierge_chat_msg").val();

        if (msg != "") {
          
          this.renderChatMessage({
            name: "You",
            msg: msg,
            align: "left"
          })

          var data = {
            text: msg,
            workspace: this.workspace_id
          }
          if (this.context) {
            data.context = this.context;
          }

          $.ajax({
            type: "POST",
            url: this.url,
            data: JSON.stringify(data),
            dataType: "json",
            contentType: "application/json; charset=utf-8"
          })
          .done(function(res) {
            if (res.context) {
              this.context = res.context
            }

            res.output.text.forEach(function(t) {
              this.renderChatMessage({
                name: "Concierge",
                msg: t,
                align: "right"
              })
            }.bind(this))

          }.bind(this))

          $("#_concierge_chat_msg").val("");
          return;
        }

      }.bind(this);

      this.renderChatMessage = function(m) {

        var list = $('#_concierge_chat_message_list')

        var name = $("<p>", { class: "_concierge_chat_msg_header" }).text(m.name)
        var msg = $("<p>").html(m.msg)

        var li = $("<li>", { class: m.align ? m.align : "left" })
        li.append(name);
        li.append(msg);

        list.append(li);

        $('#_concierge_chat_messages').scrollTop(3000);

      }

      // render chat window
      this.renderChatWindow();

      // initiate the conversation
      this.sendMessage("Hello")

    }

  }.bind(this));

}