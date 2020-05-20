/* eslint-disable no-underscore-dangle */
// @ts-nocheck
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const axios = require('axios').default;
const qs = require('querystring');

const app = express();
const crypto = require('crypto');
const cors = require('cors');
const passport = require('passport');
const socketio = require('socket.io');
const session = require('express-session');
const bcrypt = require('bcrypt');
const expressMongoDb = require('express-mongo-db');
const { introspectionQuery } = require('graphql');
const MongoStore = require('connect-mongo')(session);
const asyncHandler = require('express-async-handler');
const validator = require('./validator.js');
const { getNextSequenceValue, client } = require('./mongodb_util');
const toGraphQLQueryString = require('./graphql_util');
const query = require('./sql');
const authController = require('./lib/auth.controller');
const passportInit = require('./lib/passport.init');
const { CLIENT_ORIGIN } = require('./config');
const {
  makeGeneralError, makeSuccess, checkUser,
} = require('./util');

app.use(express.json());
app.use(passport.initialize());
passportInit();

app.use(expressMongoDb('mongodb://localhost:27017/listenonline'));

app.use(cors({
  origin: CLIENT_ORIGIN,
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ client }),
}));

app.all('*', checkUser);

client.connect(async () => {
  const db = client.db('listenonline');

  try {
    const counter = await db.collection('counters').findOne({ _id: 'server_id' });

    if (!counter) {
      db.collection('counters').insertOne({ _id: 'server_id', sequence_value: 0 });
    }
  } catch (error) {
    console.log(error);
  }
});

/* POTENTIAL REFACTOR TO ONE ENDPOINT */
app.get('/auth/twitter/callback', passport.authenticate('twitter'), authController.twitter);

app.get('/auth/youtube/callback', passport.authenticate('youtube'), authController.youtube);

app.get('/auth/reddit/callback', passport.authenticate('reddit'), authController.reddit);

app.get('/app/api/social-media-socket/:name', asyncHandler(async (req, res, next) => {
  req.session.name = req.params.name;
  req.session.socketId = req.query.socketId;

  const source = await req.db.collection('graphql_servers').findOne({ name: req.params.name });

  if (source.slug === 'reddit') {
    req.session.state = crypto.randomBytes(32).toString('hex');
    passport.authenticate('reddit', { state: req.session.state, duration: 'permanent' })(req, res, next);
  } else {
    passport.authenticate(source.slug)(req, res, next);
  }
}));

// //   Authentication Check    ////
app.post('/app/api/auth/login', validator.loginValidationRules(), validator.validate, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = (await query('select id, email, name, isAdmin, password from users where email = ?', [email]))[0];

  // check for invalid email
  if (!user) {
    throw new Error('Email or Password is incorrect');
  }

  // check for invalid password
  if (!(await bcrypt.compare(password, user.password))) {
    throw new Error('Email or Password is incorrect');
  }

  user.isAdmin = !!parseInt(user.isAdmin, 10);
  req.session.user_id = user.id;
  req.session.isAdmin = user.isAdmin;

  res.send(makeSuccess({ email: user.email, name: user.name, isAdmin: user.isAdmin }));
}));

app.post('/app/api/auth/register', validator.registerValidationRules(), validator.validate, asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;

  query('insert into users(name, email, password) values (?,?,?)',
    [name, email, await bcrypt.hash(password, 12)]);

  const user = (await query('select id, isAdmin from users where email = ?', [email]))[0];

  user.isAdmin = !!parseInt(user.isAdmin, 10);
  req.session.user_id = user.id;
  req.session.isAdmin = user.isAdmin;

  res.send(makeSuccess({ email: user.email, name: user.name, isAdmin: user.isAdmin }));
}));

app.get('/app/api/auth/logout', asyncHandler(async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500);
      return res.send(err.message);
    }
    return res.send(makeSuccess('Success logging out'));
  });
}));

app.get('/app/api/servers', asyncHandler(async (req, res) => {
  const servers = await req.db.collection('graphql_servers').find({}, {
    _id: 0,
    name: 1,
    url: 1,
    slug: 1,
    description: 1,
    requireAuthentication: 1,
    requireAuthorization: 1,
  }).toArray();

  res.send(makeSuccess(servers));
}));

app.put('/app/api/server/update', validator.serverValidationRules(), validator.validate, asyncHandler(async (req, res) => {
  const { data, type } = req.body;
  const schema = (await axios.post(data.url, { query: introspectionQuery })).data;

  if (type === 0) {
    // ADD
    req.db.collection('graphql_servers').insertOne({ _id: await getNextSequenceValue('server_id', req.db), ...data, schema });
  } else if (type === 1) {
    // DELETE (with cascading)
    req.db.collection('graphql_servers').deleteOne({ name: data.name });
  } else if (type === 2) {
    // UPDATE
    req.db.collection('graphql_servers').updateOne({ name: data.name }, { ...data, schema });
  }

  res.send(makeSuccess(data));
}));

app.get('/app/api/server/refresh', asyncHandler(async (req, res) => {
  const { name } = req.query;

  const server = await req.db.collection('graphql_servers').findOne({ name });

  const newSchema = (await axios.post(server.url, { query: introspectionQuery })).data;

  req.db.collection('graphql_servers').updateOne({ _id: server._id }, { $set: { schema: newSchema } });

  res.send(makeSuccess(name));
}));

// /   social media platforms    ////
app.get('/app/api/social-media-platforms', asyncHandler(async (req, res) => {
  const allServers = [];

  const authorizations = await query('SELECT server_id FROM authorizations WHERE user_id = ?', [req.session.user_id]);

  const servers = await req.db.collection('graphql_servers').find({}).toArray();
  servers.forEach((server) => {
    allServers.push({
      name: server.name,
      imageURL: '',
      isAuthenticated: authorizations.some((auth) => auth.server_id === server._id),
    });
  });

  res.send(makeSuccess(allServers));
}));

app.get('/app/api/queries', asyncHandler(async (req, res) => {
  const queries = await req.db.collection('queries').find({ user_id: req.session.user_id }, {
    _id: 0, name: 1, source: 1, schedule: 1, schema: 1,
  }).toArray();
  res.send(makeSuccess(queries));
}));

app.get('/app/api/query/sources', asyncHandler(async (req, res) => {
  const sources = await req.db.collection('graphql_servers').find({}, { _id: 0, name: 1 }).toArray();
  res.send(makeSuccess(sources.map((source) => source.name)));
}));

app.get('/app/api/query/full-schema', asyncHandler(async (req, res) => {
  const { source } = req.query;
  const result = await req.db.collection('graphql_servers').findOne({ name: source }, { _id: 0, schema: 1 });
  res.send(makeSuccess(result.schema));
}));

app.put('/app/api/query/update', asyncHandler(async (req, res) => {
  const { data, type } = req.body;

  const { _id, url, slug } = await req.db.collection('graphql_servers').findOne({ name: data.source }, { url: 1, slug: 1 });
  const serverId = _id;

  if (type === 0) {
    // ADD
    req.db.collection('queries').insertOne({ ...data, serverId, user_id: req.session.user_id });
  } else if (type === 1) {
    // DELETE
    // TODO
  } else if (type === 2) {
    // EXECUTE
    const accessToken = (await query('SELECT access_token FROM authorizations WHERE user_id = ? AND server_id = ?', [req.session.user_id, serverId]))[0].access_token;

    let json = (await axios.post(url, {
      accessToken,
      query: toGraphQLQueryString(data.schema),
    })).data;

    if (json.errors && json.errors[0].extensions.statusCode === 401) {
      const refreshToken = (await query('SELECT refresh_token FROM authorizations WHERE user_id = ? AND server_id = ?', [req.session.user_id, serverId]))[0].refresh_token;
      let newAccessToken = null;

      if (slug === 'youtube') {
        const youtubeURL = new URL('https://oauth2.googleapis.com/token');

        const params = {
          client_id: process.env.YOUTUBE_KEY,
          client_secret: process.env.YOUTUBE_SECRET,
          refreshToken,
          grant_type: 'refresh_token',
        };

        youtubeURL.search = new URLSearchParams(params).toString();

        newAccessToken = (await axios.post(youtubeURL)).data.access_token;
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

      json = (await axios.post(url, {
        accessToken: newAccessToken,
        query: toGraphQLQueryString(data.schema),
      })).data;
    }

    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    req.db.collection('query_histories').insertOne({
      query_name: data.name,
      executionTimestamp: timestamp,
      runtime: 1000,
      data: json,
      user_id: req.session.user_id,
    });
  }

  res.send(makeSuccess(data));
}));

app.get('/app/api/query/history-records', asyncHandler(async (req, res) => {
  const { queryName } = req.query;

  const history = await req.db.collection('query_histories').find({ query_name: queryName, user_id: req.session.user_id }, {
    _id: 0, executionTimestamp: 1, runtime: 1, data: 1,
  }).toArray();
  res.send(makeSuccess(history));
}));


app.get('/app/api/users', asyncHandler(async (_req, res) => {
  const users = await query('SELECT name, isAdmin, email, quota FROM users');

  res.send(makeSuccess(users.map((user) => ({ ...user, usedQuota: 0 }))));
}));

app.put('/app/api/user/update', asyncHandler(async (req, res) => {
  const { data, type } = req.body;

  if (type === 0) {
    // DELETE
    // emails are unique
    // delete cascade TODO
    await query('delete from users where email = ?', [data.name, data.email]);
  } else if (type === 1) {
    // UPDATE
    // emails are unique
    await query('update users set isAdmin = ?, quota = ? WHERE email = ?',
      [data.isAdmin, data.quota, data.name, data.email]);
  }
  res.send(makeSuccess(data));
}));

app.get('/app/api/applications', asyncHandler(async (req, res) => {
  const result = await query('select callback_url as callbackURL, home, name, description, cast(id as char) as id from applications WHERE user_id = ?', [req.session.user_id]);
  res.send(makeSuccess(result));
}));

app.put('/app/api/application/update', validator.applicationValidationRules(), validator.validate, asyncHandler(async (req, res) => {
  const { data, type } = req.body;

  if (type === 0) {
    // UPDATE
    query('update applications set name = ?, callback_url = ?, home = ?, description = ? WHERE name = ?',
      [data.name, data.callbackURL, data.home, data.description, parseInt(data.id, 10)]);
  } else if (type === 1) {
    // DELETE
    await query('delete from applications where id = ?', [parseInt(data.id, 10)]);
  } else if (type === 2) {
    // CREATE
    await query('insert into applications(name, callback_url, home, description, user_id) values (?,?,?,?,?)',
      [data.name, data.callbackURL, data.home, data.description, req.session.user_id]);
  }

  res.send(makeSuccess(data));
}));

// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, next) => {
  res.send(makeGeneralError([error.message]));
});


const server = app.listen(3000, () => {
  const host = server.address().address;
  const { port } = server.address();

  console.log('Example app listening at http://%s:%s', host, port);
});


const io = socketio(server);
app.set('io', io);


module.exports = server;
