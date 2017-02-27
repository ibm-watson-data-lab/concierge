# concierge

A utilty that allows a small business owner to create a Watson-powered chatbot to answer
questions about their business and publish it to their web page. The chatbot can answer questions about
your business's contact details, directions and can even help take bookings.

![screenshots](https://github.com/ibm-cds-labs/concierge/raw/master/img/concierge.png "Schematic")

See a live demo [here](https://glynnbird.github.io/pretendhotel/) showing Concierge in action - the 
concierge chatbot can be found in the bottom right corner of the page.

## Pre-requisites

1) Node.js - this is a Node.js script, so you'll need [Node.js](https://nodejs.org/en/) installed.
2) Bluemix - [Bluemix](https://bluemix.net) is IBM's cloud platform. Sign up for a free acount. This will give you
   the ability to provision cloud services such as *Watson Conversation* and use the *OpenWhisk* platoform (see below).
3) Watson Conversation API - The [Watson Conversation service](https://www.ibm.com/watson/developercloud/conversation.html) has a free demo account and
   is provisioned in your Bluemix dashboard. Simply add the service and make a note of your service username/password.
4) OpenWhisk - IBM's [OpenWhisk](https://developer.ibm.com/openwhisk/) Serverless platform is part of Bluemix. Download and configure the `wsk` command-line tool.
5) Cloudant - if you want to store your chatbot questions and responses, then also provision a Cloudant service in your Bluemix dashboard.
   Make a note of your Cloudant URL.

## Running the concierge tool

Install the concierge tool

```sh
npm install -g concierge-chatbot
```

Then simply run the command-line tool with your Watson Conversation API credentials to hand:

```sh
concierge-chatbot
```

and answer the questions as prompted.

![terminal](https://github.com/ibm-cds-labs/concierge/raw/master/img/concierge-terminal.png "Terminal")

At the end of the process, the `concierge-chatbot` tool will 

- configure a chatbot in your Watson Conversation service (it may take a minute or so for Watson to learn your configuration)
- configure an OpenWhisk API endpoint that gives your chatbot a web interface
- tells you the HTML to paste into your own web page to add the chatbot to your website

It's that simple!

## Storing your conversations

The concierge tool will also prompt you for a Cloudant URL and Cloudant Database name. If they are supplied then the converation will be
stored in that database as it happens (don't forget to create the database in the Cloudant dashbaord first). This will allow you to 
perform analytics on your chats. How many people used it? What questions did they ask? What bookings have I collected today?

## Using this library programmatically

As well as the *concierge-chatbot* command-line tool, you may also use this as a library within your own applications. Simply
use `npm install --save concierge-chatbot` to add it to your project and `require` it into your own code:

```js
  var concierge = require('concierge-chatbot');
```

The concierge object then has the following functions

### interactive()

Call `interactive` to initiate an command-line session where the user will be prompted for the business data on the command line.

```js
concierge.interactive();
```

### createWorkspace(data)

The `createWorkspace` function creates a Watson Conversation configuration given the business data:

```js
var data = {
	"username": "MYWATSONCONVERSATIONUSERNAME",
	"password": "MYWATSONCONVERSATIONPASSWORD",
	"cloudanturl": "https://MYUSERNAME:MYPASSWORD@MYHOST.cloudant.com",
	"cloudantdbname": "concierge",
	"name": "The Pretend Hotel",
	"address": "18 Front Street, London",
	"postcode": "W1A1AA",
	"phone": "01818118181",
	"website": "http://pretendhotel.com",
	"email": "enquiries@pretendhotel.com",
	"twitter": "pretendhotel",
	"facebook": "https://facebook.com/pretendhotel",
	"opening": "24 Hours",
	"id": "The_Pretend_Hotel"
};
concierge.createWorkspace(data).then(function(reply) {
  console.log('Watson Conversation Bot created', reply);
});
```

### createWhiskActions(data)

The `createWhiskActions` function creates a public-facing API call to allow your chatbot to be seen by the outside world. It creates
a Node.js OpenWhisk action in your Bluemix account using the `wsk` command-line tool and then exposes that code as an API call
that can be used by any web page.

```js
var data = {
	"username": "MYWATSONCONVERSATIONUSERNAME",
	"password": "MYWATSONCONVERSATIONPASSWORD",
	"cloudanturl": "https://MYUSERNAME:MYPASSWORD@MYHOST.cloudant.com",
	"cloudantdbname": "concierge"
};
concierge.createWhiskActions(data).then(function(reply) {
  console.log('OpenWhisk action created', reply);
});
```

### getTemplateHTML(url, workspace)

The `getTemplateHTML` function creates a snippet of HTML code to be pasted into your website given 

- url - the URL of the OpenWhisk action
- workspace - the id of the Watson Conversation workspace 

```js
var html = getTemplateHTML('http://myurl.com/concierge/chat', 'abc123');
console.log('HTML generated', html);
```

## Stored configuration

To save your typing, the `concierge-chatboot` tool stores a copy of the configuration it used in a file at `~/.concierge.json`. If
you want to remove this saved data, simply delete the file.





