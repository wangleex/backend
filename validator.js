const { body, validationResult } = require('express-validator');
const { makeFieldError } = require('./util');
const query = require('./sql');

const findUserByEmail = async (email) => {
  const user = await query('SELECT * FROM users WHERE email=?', [email]);
  if (user.length) {
    throw new Error();
  }
};

const findApplicationByName = async (name) => {
  const application = await query('SELECT * FROM applications WHERE name=?', [name]);
  if (application.length) {
    throw new Error();
  }
};

const findServerByName = async (name, req) => {
  const server = await req.db.collection('graphql_servers').findOne({ name });
  if (server) {
    throw new Error();
  }
};

const findQueryByName = async (name, req) => {
  const queryResult = await req.db.collection('queries').findOne({ name });
  if (queryResult) {
    throw new Error();
  }
};

module.exports = {
  loginValidationRules: () => [
    body('email').not().isEmpty().normalizeEmail()
      .withMessage('Email must not be empty')
      .isEmail()
      .withMessage('Must be an email address'),
    body('password').not().isEmpty().withMessage('Password must not be empty'),
  ],

  registerValidationRules: () => [
    body('name').trim().escape(),
    body('email').isEmail().normalizeEmail().withMessage('Email must be valid')
      .custom((email) => findUserByEmail(email))
      .withMessage('Email already in use'),
    body('password', 'Password must be a minimum of eight characters and contain at least uppercase, one lowercase, one number, and one special character')
      .isLength({ min: 8 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, 'i'),
    body('invitationCode', 'Incorrect Invitation Code').equals(process.env.INVITATION_CODE),
  ],

  serverValidationRules: () => [
    body('data.name').if(body('type').equals('0')).custom((name, { req }) => findServerByName(name, req)).withMessage('Server name already in use'),
    body('data.slug').isIn(['reddit', 'youtube', 'twitter', 'nytimes']).withMessage('Slug must be one of reddit, youtube, or twitter'),
    body('data.url').isURL({ protocols: ['http', 'https'], require_protocol: true, require_tld: false }).withMessage('Server URL is invalid (Must include http or https at beginning)'),
    body('data.description').trim().escape(),
  ],

  applicationValidationRules: () => [
    body('data.name').if(body('type').equals('2')).custom((name) => findApplicationByName(name)).withMessage('Application name already in use'),
    body('data.callbackURL').isURL({ protocols: ['http', 'https'], require_protocol: true, require_tld: false }).withMessage('Callback URL is invalid (Must include http or https at beginning)'),
    body('data.home').trim().escape(),
    body('data.description').optional().trim().escape(),
  ],

  queryValidationRules: () => [
    body('data.name').if(body('type').equals('0')).custom((name, { req }) => findQueryByName(name, req)).withMessage('Query name already in use'),
  ],

  validate: (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const fieldErr = Object.assign({}, ...errors.array().map((err) => {
      const field = err.param.substring(err.param.indexOf('.') + 1);
      return { [field]: err.msg };
    }));

    return res.send(makeFieldError(fieldErr));
  },
};
