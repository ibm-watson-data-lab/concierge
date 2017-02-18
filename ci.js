const apiKey = process.env.CI_API || '';
const ci = 'https://api.centralindex.com/v1/entity';

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