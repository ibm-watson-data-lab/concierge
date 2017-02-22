"use strict"

// npm modules
const request = require('request-promise');
const prompt = require('prompt');
const os = require('os');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

// ask for business data, return an object
const generateData = function() {

  /*let obj = {
    id: 'CFYM268',
    name: "Wainstones Hotel",
    address: "31 High Street, Great Broughton, Cleveland TS9 7EW",
    postcode: "TS97EW", //remeber to remove the space
    phone: "01642-712-268",
    website: "http://www.wainstoneshotel.co.uk/",
    twitter: "wainstoneshotel",
    facebook: "https://www.facebook.com/wainstoneshotel/",
    email: "enquiries@wainstoneshotel.co.uk",
    description: "Hotel"
  }*/

  var configfile = path.join(os.homedir(),'.concierge.json');
  var config = {
    name: '',
    address: '',
    postcode: '',
    phone: '',
    website: '',
    twitter: '', 
    facebook: '',
    email: '',
    description: '',
    username: '',
    password: ''
  };
  if (fs.existsSync(configfile)) {
    console.log('Found previous configuration - using as default values');
    config = require(configfile);
  }
  
  var schema = {
    properties: {
      username: {
        description: 'Watson Conversation username',
        required: true,
        default: config.username
      },
      password: {
        description: 'Watson Conversation password',
        hidden: true,
        default: config.password
      },
      cloudanturl: {
        message: 'Cloudant URL',
        hidden: true,
        default: config.cloudanturl || '',
        required: false
      },
      cloudantdbname: {
        message: 'Cloudant Database Name',
        default: config.cloudantdbname || '',
        required: false     
      },
      name: {
        description: 'Business name',
        required: true,
        default: config.name
      },
      address: {
        description: 'Business address',
        required: true,
        default: config.address
      },
      postcode: {
        description: 'Postcode/zipcode',
        required: true,
        default: config.postcode
      },
      phone: {
        description: 'Phone number',
        required: true,
        default: config.phone
      },
      website: {
        description: 'Website URL',
        required: true,
        format: 'url',
        default: config.website
      },
      email: {
        message: 'Email address',
        required: true,
        format: 'email',
        default: config.email
      },
      twitter: {
        message: 'Twitter handle',
        required: true,
        default: config.twitter
      },
      facebook: {
        message: 'Facebook profile URL',
        required: true,
        format: 'url',
        default: config.facebook
      },
      opening: {
        message: 'Opening hours',
        default: config.opening || '24 hours',
        required: true
      }
    }
  };

  prompt.start();

  return new Promise(function(resolve, reject) {
    prompt.get(schema, function(err, result) {
      if (err) {
        return reject(err);
      }
      result.id = result.name.replace(/ /g,'_').substring(0,20);
      fs.writeFileSync(configfile, JSON.stringify(result));
      resolve(result);
    });
  });
};


// create a Watson conversation workspace, given the business data
const createWorkspace = function(data) {
  // load the template
  let t = require('./template.json');
  t.name = `concierge-${data.id}`;

  // search and replace placeholders with values
  for (let ni in t.dialog_nodes) {
    let n = t.dialog_nodes[ni];
    if (!n.output || !n.output.text || !n.output.text.values) continue;
    for (let i in n.output.text.values) {
      Object.keys(data).forEach(function(k) {
        var exp = new RegExp('{{' + k + '}}', 'g')
        t.dialog_nodes[ni].output.text.values[i] = t.dialog_nodes[ni].output.text.values[i].replace(exp, data[k]);
      });
    }
  };

  // create POST /workspace request
  const watson = 'https://gateway.watsonplatform.net/conversation/api/v1';
  const username = data.username || '';
  const password = data.password || '';
  const r = {
    method: 'POST',
    url: `${watson}/workspaces?version=2016-09-20`,
    json: true,
    body: t,
    auth: {
      user: username,
      pass: password
    }
  }

  // perform the request
  return request(r).then(function(data) {
    return data
  }).catch(function(err) {
    throw new Error(err)
  });
};

// create OpenWhisk API calls
const createWhiskActions = function(config) {
  return new Promise(function(resolve, reject) {

    // spawn a child process (synchronous)
    var spawn = child_process.spawnSync;

    // create OpenWhisk action
    var createParams = ['action', 'update', 'concierge', 'openwhisk/action.js', '--param', 'CONVERSATION_USERNAME', config.username,'--param', 'CONVERSATION_PASSWORD', config.password];
    if (config.cloudanturl && config.cloudantdbname) {
      // add Cloudant parameters, if supplied
      createParams.push('--param', 'url', config.cloudanturl, '--param', 'dbname', config.cloudantdbname);
    }
    console.log('wsk', createParams.join(' '));
    var actionCreate = spawn( 'wsk', createParams);

    // create POST API call to map to the action
    var apiCreate1 = spawn( 'wsk', ['api-experimental', 'create', '/concierge', '/message', 'post', 'concierge']);
    
    // create OPTIONS API call to make it CORS compatible
    var apiCreate2 = spawn( 'wsk', ['api-experimental', 'create', '/concierge', '/message', 'options', '/whisk.system/utils/echo']);

    // if there were errors
    if (actionCreate.error || apiCreate1.error || apiCreate2.error) {
      console.error(actionCreate.error || apiCreate1.error || apiCreate2.error);
      return reject('OpenWhisk actions failed to deploy. Please ensure you have wsk installed and configured.');
    }
    resolve(apiCreate1.stdout);

  });
};

// extract URL from the OpenWhisk command-line reply
var extractURL = function(str) {
  var re = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, 'g');
  var matches = str.match(re);
  if (matches) {
    return matches[0]
  } else {
    return null;
  }
};

// get HTML to put into the user's web page
var getTemplateHTML = function(url, workspace_id) {
  var html = '<script src="https://ibm-cds-labs.github.io/concierge/widget/chat-widget.js"></script>\n';
  html +='<script>\n';
  html +='var Concierge = new Concierge({\n';
  html +='  url:"{{url}}",\n';
  html +='  workspace_id:"{{workspace_id}}"\n';
  html +='});\n';
  html +='</script>\n';

  html = html.replace(/{{url}}/g, url);
  html = html.replace(/{{workspace_id}}/g, workspace_id);
  return html;
};


// collect business data interactively and build the Concierge service
var interactive = function() {
  // welcome
  console.log('');
  console.log('Welcome to the Concierge Demo');
  console.log('Enter your business details below to get started: ')
  console.log('');

  // get the data, make API call, return the workspace_id
  var config = null;
  var workspace_id = null;
  var openwhiskurl = null;
  generateData().then(function(data) {
    config = data;
    console.log('Generating Watson Conversation workspace...')
    return createWorkspace(config);
  }).then(function(data) {
    console.log('Done');
    console.log('Generating OpenWhisk actions...')
    workspace_id = data.workspace_id;
    return createWhiskActions(config);
  }).then(function(data) {
    console.log('Done');
    openwhiskurl = extractURL(data.toString('utf8'))
    console.log('Paste this HTML into your web page:');
    console.log();
    console.log(getTemplateHTML(openwhiskurl, workspace_id));
    console.log();
    return process.exit(0);
  }).catch(function(err) {
    console.error(err);
    return process.exit(1);
  });
};

module.exports = {
  interactive: interactive,
  createWorkspace: createWorkspace,
  createWhiskActions: createWhiskActions,
  getTemplateHTML: getTemplateHTML
}

