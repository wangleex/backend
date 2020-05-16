const providers = ['twitter', 'youtube', 'reddit']

const callbacks = providers.map(provider => {
  return process.env.NODE_ENV === 'production'
    ? `http://listen.online/auth/${provider}/callback`
    : `http://localhost:3000/auth/${provider}/callback`
})

const [twitterURL, youtubeURL, redditURL] = callbacks

exports.CLIENT_ORIGIN = process.env.NODE_ENV === 'production'
  ? 'http://listen.online'
  : ['http://127.0.0.1:3001', 'http://localhost:3001']

exports.TWITTER_CONFIG = {
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: twitterURL,
  passReqToCallback: true
}

exports.YOUTUBE_CONFIG = {
  clientID: process.env.YOUTUBE_KEY,
  clientSecret: process.env.YOUTUBE_SECRET,
  callbackURL: youtubeURL,
  scope: ['https://www.googleapis.com/auth/youtube.readonly'],
  passReqToCallback: true
}

exports.REDDIT_CONFIG = {
  clientID: process.env.REDDIT_KEY,
  clientSecret: process.env.REDDIT_SECRET,
  callbackURL: redditURL,
  passReqToCallback: true,
  scope: ['identity', 'edit', 'flair', 'history', 'modconfig', 'modflair', 'modlog', 'modposts', 'modwiki', 'mysubreddits', 'privatemessages', 'read', 'report', 'save', 'submit', 'subscribe', 'vote', 'wikiedit', 'wikiread']
}