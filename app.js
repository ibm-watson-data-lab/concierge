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
    return data.data
  })
  .catch(function(err) {
    throw new Error('Invalid ID')
  })

}

const createWorkspace = function(entity_id) {

  var t = JSON.parse(JSON.stringify(template));
  t.name = `ws-${entity_id}`

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

const getWorkspace = function(workspace_id) {

  const r = {
    method: 'POST',
    url: `${watson}/workspaces/${workspace_id}?version=2016-09-20`,
    json: true,
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

var e = null;
fetchBusiness('438237054242817')
.then(function(entity) {
  e = entity;
  return createWorkspace('438237054242817')
})
.then(console.log)
.catch(console.error);



