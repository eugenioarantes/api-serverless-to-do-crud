class Handler {
  constructor({ dynamoDbSvc }) {
    this.dynamoDbSvc = dynamoDbSvc
    this.dynamodbToDoTable = process.env.DYNAMODB_TO_DO_TABLE
  }

  async getToDoList(params) {
    return this.dynamoDbSvc.scan(params).promise();
  }
  
  prepareData(loggedUser) {
    const params = {
        TableName: this.dynamodbToDoTable,
        FilterExpression: "ownerId = :ownerId",
        ExpressionAttributeValues: {
            ":ownerId": loggedUser.id
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
      body: 'Couldn\'t read items!!'
    }
  }
    async main(event) {
        try {
          const loggedUser = JSON.parse(event.requestContext.authorizer.user);
          
          const dbParams = this.prepareData(loggedUser);

          const responseData = await this.getToDoList(dbParams);

          if(responseData && responseData.Items) {
            const items = responseData.Items;

            const toDoList = items.map(({ name, description }) => {
              return { name, description };
            })

            return this.handlerSuccess(toDoList);
          }

          return null;
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