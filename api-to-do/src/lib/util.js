const buildIAMPolicy = (effect, resource, context) => {
  const policy = {
    policyDocument: {
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    },
    context
  };

  return policy;
}

module.exports = {
  buildIAMPolicy
};