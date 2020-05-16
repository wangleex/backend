const passport = require('passport')
const TwitterStrategy = require('passport-twitter').Strategy
const YoutubeV3Strategy = require('passport-youtube-v3').Strategy
const RedditStrategy = require('passport-reddit').Strategy
const con = require('../sql');
const client = require('../mongodb_util');
const { TWITTER_CONFIG, YOUTUBE_CONFIG, REDDIT_CONFIG } = require('../config')

module.exports = () => {  

  // Allowing passport to serialize and deserialize users into sessions
  passport.serializeUser((user, cb) => cb(null, user))
  passport.deserializeUser((obj, cb) => cb(null, obj))
  
  // The callback that is invoked when an OAuth provider sends back user 
  // information. Normally, you would save the user to the database 
  // in this callback and it would be customized for each provider
  const callback = async (req, accessToken, refreshToken, params, profile, cb) => {
    try {
      const server = await req.db.collection('graphql_servers').findOne({name: req.session.name});

      con.query("insert into authorizations(access_token, refresh_token, user_id, meta, server_id) \
                  values (?,?,?,?,?)", 
                  [accessToken, refreshToken, req.session.user_id, JSON.stringify({expires_in: params.expires_in}),server._id])
      return cb(null, profile);
    } catch (err) {
      // TODO
    }

  }

  // Adding each OAuth provider's strategy to passport
  passport.use(new TwitterStrategy(TWITTER_CONFIG, callback))
  passport.use(new YoutubeV3Strategy(YOUTUBE_CONFIG, callback))
  passport.use(new RedditStrategy(REDDIT_CONFIG, callback))
}