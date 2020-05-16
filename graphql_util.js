const fetch = require('node-fetch');

module.exports =  async function get_graphql_data(url, query) {
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({query}),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    
    return await response.json();
}