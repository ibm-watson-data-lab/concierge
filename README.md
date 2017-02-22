# concierge

A setup script that allows a small business owner to create a Watson-powered chatbot to answer
questions about their business and publish it to their web page. It can answer questions about
your business's contact details, directions and even help take bookings.

![screenshots](https://github.com/ibm-cds-labs/concierge/raw/master/img/concierge.png "Schematic")

## Pre-requisites

1) Node.js - this is a Node.js script, so you'll need [Node.js](https://nodejs.org/en/) installed.
2) Bluemix - [Bluemix](https://bluemix.net) is IBM's cloud platform. Sign up for a free acount.
3) Watson Conversation API - the [Watson Conversation service](https://www.ibm.com/watson/developercloud/conversation.html) also has a free demo account
4) OpenWhisk - IBM's [OpenWhisk](https://developer.ibm.com/openwhisk/) Serverless platform is part of Bluemix. Download and configure the `wsk` command-line tool.

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

At the end of the process, the `concierge-chatbot` tool will 

- configure a chatbot in your Watson Conversation service (it may take a minute or so for Watson to learn your configuration)
- configure an OpenWhisk API endpoint that gives your chatbot a web interface
- tells you the HTML to paste into your own web page to add the chatbot to your requisites

It's that simple!

## Storing your conversations

The concierge tool will also prompt you for a Cloudant URL and Cloudant Database name. If they are supplied then the converation will be
stored in the that database as it happens. This will allow you to perform analytics on your chats. How many people used it? What 
questions did they ask? What bookings have I collected today?

