const uuid = require('uuid')
const { generateHash } = require('../utils/cryptoHash');

class Handler {
  constructor({ dynamoDbSvc }) {
    this.dynamoDbSvc = dynamoDbSvc
    this.dynamodbUserTable = process.env.DYNAMODB_USERS_TABLE
  }

  async createUser(params) {
    return this.dynamoDbSvc.put(params).promise();
  }
  
  async prepareData({ name, email, password }) {
    const passwordEncrypt = await generateHash(password);

    const preparedData = {
      name,
      email,
      password: passwordEncrypt
    }

    const params = {
        TableName: this.dynamodbUserTable,
        Item: {
          id: uuid.v1(),
          ...preparedData,
        }
    }
    return params
  }

  handlerSuccess(data) {
    const response = {
      statusCode: 200,
      body: JSON.stringify(data)
    }
    return response;
  }

  handleError(data) {
    return {
      statusCode: data.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Couldn\'t create user!!'
    }
  }

    async main(event) {
        try {
          const data = JSON.parse(event.body);

          const dbParams = await this.prepareData(data);

          await this.createUser(dbParams);

          const preparedResponse = {
            name: data.name,
            email: data.email,
          }

          return this.handlerSuccess(preparedResponse);
        } catch (error) {
            console.error('Deu erro**', error.stack);

            return this.handleError({ statusCode: 500});
        }
    }
}

//factory
const AWS = require( 'aws-sdk' )
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const handler = new Handler({
    dynamoDbSvc: dynamoDB
});

module.exports.main = handler.main.bind(handler);