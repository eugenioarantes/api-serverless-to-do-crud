const jwt = require('jsonwebtoken');
const { buildIAMPolicy } = require('../lib/util');
const JWT_KEY = process.env.JWT_KEY;

exports.handler = async event => {
  const [, token] = event.authorizationToken.split(" ");

  try {
    const decodedUser = jwt.verify(
      token, JWT_KEY
    );
      
    const user = decodedUser.user;

    const authorizerContext = {
      user: JSON.stringify(user)
    };

    const policyDocument = buildIAMPolicy(
      'Allow',
      event.methodArn,
      authorizerContext
    );

    return policyDocument;
  } catch (error) {
    console.log('Auth error***', error.stack);

    return {
      statusCode: 401,
      body: error.stack
    }
  }
}