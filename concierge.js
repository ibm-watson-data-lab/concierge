"use strict"

// npm modules
const request = require('request-promise');
const prompt = require('prompt');
const os = require('os');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const colors = require('colors');

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
    console.log('Found previous configuration - using as default values'.grey);
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
  
  // clone
  data = JSON.parse(JSON.stringify(data));

  if (data.email) {
    data.email = data.email.replace('@', '\\@')
  }

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
    var packageCreateParams = ['wsk', 'package', 'update', 'concierge', '--param', 'CONVERSATION_USERNAME', config.username,'--param', 'CONVERSATION_PASSWORD', config.password];
    if (config.cloudanturl && config.cloudantdbname) {
      // add Cloudant parameters, if supplied
      packageCreateParams.push('--param', 'url', config.cloudanturl, '--param', 'dbname', config.cloudantdbname);
    }
    var packageCreate = spawn('bx', packageCreateParams);
    var p = path.join(__dirname, 'openwhisk', 'action.js');
    var createParams = ['wsk', 'action', 'update', 'concierge/chat', p, '-a', 'web-export','true'];
    var actionCreate = spawn('bx', createParams);

    // if there were errors
    if (actionCreate.status || packageCreate.status) {
      if (packageCreate.stderr) {
        console.error(packageCreate.stderr.toString('utf8'));
      }
      if (actionCreate.stderr) {
        console.error(actionCreate.stderr.toString('utf8'));
      }
      return reject('OpenWhisk actions failed to deploy. Please ensure you have wsk installed and configured.');
    }
    resolve(true);
  });
};

const calculateOpenWhiskNamespace= function() {
  return new Promise(function(resolve, reject) {

    // spawn a child process (synchronous)
    var spawn = child_process.spawnSync;

    var ns = spawn( 'bx', ['wsk', 'namespace', 'list']);
    var str = ns.stdout.toString('utf8');
    var bits = str.split('\n');
    var retval = null;
    if (bits.length >= 2 && bits[0] === 'namespaces') {
      retval = bits[1];
    }
    resolve(retval.trim());
  });
};

// get HTML to put into the user's web page
var getTemplateHTML = function(url, workspace_id) {
  var html = '<script src="https://ibm-watson-data-lab.github.io/concierge/widget/chat-widget.js"></script>\n';
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
  console.log('Welcome to Watson Concierge Chatbot generator.'.bold.blue);
  console.log('Enter your business details below to get started: '.grey)
  console.log('');

  // get the data, make API call, return the workspace_id
  var config = null;
  var workspace_id = null;
  var openwhiskurl = null;
  var namespace = null;
  generateData().then(function(data) {
    config = data;
    console.log();
    console.log('Generating Watson Conversation workspace...'.grey)
    return createWorkspace(config);
  }).then(function(data) {
    console.log('Done'.grey.bold);
    console.log();
    console.log('Generating OpenWhisk actions...'.grey)
    workspace_id = data.workspace_id;
    return calculateOpenWhiskNamespace();
  }).then(function(ns) {
    namespace = ns;
    return createWhiskActions(config);
  }).then(function(data) {
    console.log('Done'.grey.bold);
    openwhiskurl = 'https://openwhisk.ng.bluemix.net/api/v1/web/' + namespace + '/' + 'concierge/chat';
    console.log();
    console.log('Paste this HTML into your web page:'.grey);
    console.log();
    console.log(getTemplateHTML(openwhiskurl, workspace_id).white.bold);
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

