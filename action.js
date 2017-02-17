
var request = require('request');

var main = function(msg) {

  if (!msg.CONVERSATION_USERNAME) {
    throw new Error('Required parameter CONVERSATION_USERNAME missing');
  }

  if (!msg.CONVERSATION_PASSWORD) {
    throw new Error('Required parameter CONVERSATION_PASSWORD missing');
  }

  if (!msg.CONVERSATION_WORKSPACE) {
    throw new Error('Required parameter CONVERSATION_WORKSPACE missing');
  }

  if (!msg.text) {
    throw new Error('Required parameter "text" missing');
  }
 
  return new Promise(function(resolve, reject) {
    
    var body = {
      input: {
        text: msg.text
      }
    };
    if (msg.context) {
      body.context = msg.context
    };
    var req = {
      method: 'post',
      url: 'https://gateway.watsonplatform.net/conversation/api/v1/workspaces/' + msg.CONVERSATION_WORKSPACE + '/message?version=2016-09-20',
      json: true,
      body: body,
      auth: {
        user: msg.CONVERSATION_USERNAME,
        pass: msg.CONVERSATION_PASSWORD
      } 
    };

    request(req, function(e, r, b) {
      if (e) {
        return reject(new Error(e));
      }
      return resolve(b);
    });

  });

};


