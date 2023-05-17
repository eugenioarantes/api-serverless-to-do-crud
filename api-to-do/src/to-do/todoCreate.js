const uuid = require('uuid')

class Handler {
  constructor({ dynamoDbSvc }) {
    this.dynamoDbSvc = dynamoDbSvc
    this.dynamodbToDoTable = process.env.DYNAMODB_TO_DO_TABLE
  }

  async createToDo(params) {
    return this.dynamoDbSvc.put(params).promise();
  }
  
  prepareData(data, user) {
    const params = {
        TableName: this.dynamodbToDoTable,
        Item: {
          id: uuid.v1(),
          ownerId: user.id,
          ...data,
        }
    }
    return params
  }
  handlerSuccess(data) {
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
    return response;
  }
  handleError(data) {
    return {
      statusCode: data.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Couldn\'t create to-do!!'
    }
  }
    async main(event) {
        try {
          const data = JSON.parse(event.body);

          const user = JSON.parse(event.requestContext.authorizer.user);

          const dbParams = this.prepareData(data, user);

          await this.createToDo(dbParams);

          return this.handlerSuccess(data);
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