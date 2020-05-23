const axios = require('axios').default;
const qs = require('querystring');
const perf = require('execution-time')();
const query = require('./sql');
const { calculateQuotaUsed } = require('./mongodb_util');

const toGraphQLQueryString = (node) => {
  const graphqlQuery = { string: node.name };

  if (node.inputs.length) {
    graphqlQuery.string += '(';
    node.inputs.forEach((input, index, inputs) => {
      if (input.inputType === 'String') {
        if (input.value) {
          graphqlQuery.string += `${input.name}:${input.value ? JSON.stringify(input.value) : '""'}`;
          if (index !== inputs.length - 1) {
            graphqlQuery.string += ', ';
          }
        }
      } else {
        graphqlQuery.string += `${input.name}:${input.value}`;
        if (index !== inputs.length - 1) {
          graphqlQuery.string += ', ';
        }
      }
    });
    graphqlQuery.string += ') ';
  }

  if (node.children.length) {
    graphqlQuery.string += '{ ';

    node.children.forEach((child) => {
      if (child.selected) {
        graphqlQuery.string += `${toGraphQLQueryString(child)} `;
      }
    });
    graphqlQuery.string += '} ';
  }

  return graphqlQuery.string;
};

const submitGraphQLQuery = async (url, accessToken, schema, req) => {
  const { quota } = (await query('SELECT quota from users where id=?', [req.session.user_id]))[0];
  const usedQuota = await calculateQuotaUsed(req.session.user_id, req.db);

  if (usedQuota >= quota) {
    throw new Error(`You have used ${usedQuota} MB of storage out of your quota of ${quota} MB. Remove some stored data in order to continue to query.`);
  }

  perf.start();
  const result = (await axios.post(url, {
    accessToken,
    query: toGraphQLQueryString(schema),
  })).data;
  const duration = perf.stop().time;
  return { result, duration };
};

module.exports = {
  executeQuery: async (url, slug, schema, serverId, req, queryName) => {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let accessToken = await query('SELECT access_token FROM authorizations WHERE user_id = ? AND server_id = ?', [req.session.user_id, serverId]);
    let result;
    let duration;

    if (accessToken.length) {
      accessToken = accessToken[0].access_token;
    } else if (slug === 'nytimes') {
      accessToken = process.env.NYTIMES_KEY;
    }

    ({ result, duration } = await submitGraphQLQuery(url, accessToken, schema, req));

    if (result.errors && result.errors[0].extensions.statusCode === 401) {
      const refreshToken = (await query('SELECT refresh_token FROM authorizations WHERE user_id = ? AND server_id = ?', [req.session.user_id, serverId]))[0].refresh_token;
      let newAccessToken = null;

      if (slug === 'youtube') {
        const youtubeURL = 'https://oauth2.googleapis.com/token';

        newAccessToken = (await axios.post(youtubeURL, null, {
          params: {
            client_id: process.env.YOUTUBE_KEY,
            client_secret: process.env.YOUTUBE_SECRET,
            refreshToken,
            grant_type: 'refresh_token',
          },
        })).data.access_token;
      } else if (slug === 'reddit') {
        const auth = Buffer.from(`${process.env.REDDIT_KEY}:${process.env.REDDIT_SECRET}`).toString('base64');
        const redditURL = 'https://www.reddit.com/api/v1/access_token';

        const config = {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Test Client v/1.0 ',
          },
        };

        newAccessToken = (await axios.post(redditURL, qs.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }), config)).data.access_token;
      }

      query('update authorizations set access_token = ? WHERE user_id = ? AND server_id = ?',
        [newAccessToken, req.session.user_id, serverId]);

      ({ result, duration } = await submitGraphQLQuery(url, newAccessToken, schema, req));
    }

    req.db.collection('query_histories').insertOne({
      query_name: queryName,
      executionTimestamp: timestamp,
      runtime: duration,
      data: result,
      user_id: req.session.user_id,
    });


    const applications = await query('SELECT callback FROM applications WHERE user_id=?', [req.session.user_id]);

    applications.forEach((app) => {
      axios.post(app.callback, {
        executionTimestamp: timestamp,
        data: result,
        runtime: duration,
        name: queryName,
      });
    });
  },
};
