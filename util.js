module.exports = {
  getCronPattern: (scheduleStr) => {
    const scheduleConversion = {
      'Once a minute': '* * * * *',
      'Once an hour': '0 * * * *',
      'Once a day': '0 0 * * *',
      'Once a week': '0 0 * * 0',
      'Once a month': '0 0 1 * *',
    };

    return scheduleConversion[scheduleStr];
  },

  makeGeneralError: (err) => ({ data: null, error: { generalError: err } }),

  makeFieldError: (err) => ({ data: null, error: { fieldError: err } }),

  makeSuccess: (data) => ({ data }),

  checkUser: (req, res, next) => {
    if (req.path === '/app/login' || req.path === '/app/register'
    || req.path === '/' || req.path === '/app'
    || req.path.startsWith('/app/api/auth' || req.path.startsWith('/auth'))
    || req.path.startsWith('/app/api/social-media-socket')) {
      return next();
    }

    if (req.session.user_id) {
      if ((req.path.startsWith('/app/api/user') || req.path.startsWith('/app/api/server')) && !req.session.isAdmin) {
        return res.sendStatus(403);
      }
      return next();
    }
    return res.sendStatus(401);
  },
};
