module.exports = {
  makeGeneralError: (err) => ({ data: null, error: { generalError: err } }),

  makeFieldError: (err) => ({ data: null, error: { fieldError: err } }),

  makeSuccess: (data) => ({ data }),

  checkUser: (req, res, next) => {
    if (req.path.startsWith('/app/api/auth')) {
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
