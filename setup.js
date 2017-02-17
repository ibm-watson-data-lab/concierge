"use strict"

const request = require('request-promise');

const username = process.env.CONVERSATION_USERNAME || '';
const password = process.env.CONVERSATION_PASSWORD || '';
const apiKey = process.env.CI_API || '';
const ci = 'https://api.centralindex.com/v1/entity'
const watson = 'https://gateway.watsonplatform.net/conversation/api/v1';
const template = require('./template.json')

const fetchBusiness = function(entity_id) {

  const r = {
    method: 'GET',
    url: ci,
    qs: {
      entity_id: entity_id,
      api_key: apiKey
    },
    json: true
  }

  return request(r)
  .then(function(data) {
    return generateData(data.data)
  })
  .catch(function(err) {
    throw new Error('Invalid ID')
  })

}

const generateData = function() {

  let obj = {
    id: '438237054242817',
    name: "Google",
    address: "6 Pancras Square, 6 King's Blvd, Kings Cross, London, N1C 4AG",
    postcode: "N1C4AG", //remeber to remove the space
    phone: "020 7031 3000",
    website: "https://www.google.co.uk",
    twitter: "https://twitter.com/google",
    facebook: "https://twitter.com/google",
    email: "contact@google.co.uk",
    lat: 51.5332408,
    lon: -0.1260016,
    description: "We find things on the Internet"
  }

  return obj;

}

const processAddress = function(address) {

  if (!address) {
    return "";
  }

  let fields = ["building_numer", "address1", "address2", "address3", "district", "town", "county", "province", "postcode"];
  let a = [];

  fields.forEach(function(f) {

    if (!address[f]) return;

    a.push(address[f]);

  });

  return a.join(", ")

}

const createWorkspace = function() {

  let t = JSON.parse(JSON.stringify(template));

  let data = generateData();
  t.name = `ws-${data.id}`

  for (let ni in t.dialog_nodes) {

    let n = t.dialog_nodes[ni]

    if (!n.output || !n.output.text || !n.output.text.values) continue;

    for (let i in n.output.text.values) {

      Object.keys(data).forEach(function(k) {

        var exp = new RegExp('{{' + k + '}}', 'g')
        t.dialog_nodes[ni].output.text.values[i] = t.dialog_nodes[ni].output.text.values[i].replace(exp, data[k]);

      })

    }

  };

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

  return request(r)
  .then(function(data) {
    return data
  })
  .catch(function(err) {
    throw new Error(err)
  })

}

// var e = null;
// fetchBusiness('438237054242817')
// .then(function(entity) {
//   e = entity;
//   return createWorkspace('438237054242817')
// })
// .then(console.log)
// .catch(console.error);

createWorkspace()
.then(console.log)
.catch(console.error);