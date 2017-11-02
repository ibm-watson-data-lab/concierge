/* ***************************************************************
   Concierge OpenWhisk Proxy

   This code runs on the IBM OpenWhisk framework. In the msg object
   it expects:
   - CONVERSATION_USERNAME - Watson Conversation API username 
   - CONVERSATION_PASSWORD - Watson Conversation API password 
   - workspace - the Watson conversation Workspace ID
   - text - the human message that needs a bot response
   - context - the conversation context

   Usually the CONVERSATION_USERNAME & CONVERSATION_PASSWORD are
   passed into OpenWhisk when the action is created and workspace,
   context  & text are passed in with each request.

   This script passed the incoming data to Watson Conversation API 
   and returns you the reply. It is designed to be exposed as a 
   public-facing API call that can be accessed from a web page.
   *************************************************************** */
var request = require('request');

var main = function(msg) {

  // check for mandatory parameters
  if (!msg.CONVERSATION_USERNAME) {
    throw new Error('Required parameter CONVERSATION_USERNAME missing');
  }
  if (!msg.CONVERSATION_PASSWORD) {
    throw new Error('Required parameter CONVERSATION_PASSWORD missing');
  }
  if (!msg.workspace) {
    throw new Error('Required parameter "workspace" missing');
  }
  if (!msg.text) {
    throw new Error('Required parameter "text" missing');
  }

  // optional parameters
  var cloudant = null;
  var db = null;
  if (msg.url && msg.dbname) {
    cloudant = require('cloudant')({url: msg.url, plugin:'promises'});
    db = cloudant.db.use(msg.dbname);
  }
 
  // return a promise
  return new Promise(function(resolve, reject) {
    
    // formulate a POST body
    var body = {
      input: {
        text: msg.text
      }
    };
    if (msg.context) {
      body.context = msg.context
    };

    // create a request object
    var req = {
      method: 'post',
      url: 'https://gateway.watsonplatform.net/conversation/api/v1/workspaces/' + msg.workspace + '/message?version=2017-05-26',
      json: true,
      body: body,
      auth: {
        user: msg.CONVERSATION_USERNAME,
        pass: msg.CONVERSATION_PASSWORD
      } 
    };

    // perform the HTTP request
    var reply = null;
    request(req, function(e, r, b) {
      if (e) {
        return reject(new Error(e));
      }
      reply = {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: new Buffer(JSON.stringify(b)).toString('base64'),
      };
      
      // if we have Cloudant credentials
      if (db) {
        // insert data into Cloudant
        b.timestamp = Math.floor((new Date().getTime())/1000);
        b.workspace = msg.workspace;
        db.insert(b).then(function(data) {
          return resolve(reply)
        });
      } else { 
        // otherwise just reply with what we have
        return resolve(reply);
      }
    });
  });
};