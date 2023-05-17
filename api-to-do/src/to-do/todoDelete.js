class Handler {
  constructor({ dynamoDbSvc }) {
    this.dynamoDbSvc = dynamoDbSvc
    this.dynamodbToDoTable = process.env.DYNAMODB_TO_DO_TABLE
  }

  async verifyUserOwnerPermission(loggedUser, todoId) {
    try {
      const params = {
          TableName: this.dynamodbToDoTable,
          FilterExpression: "id = :id",
          ExpressionAttributeValues: {
              ":id": todoId
          }
      }

      const responseToDo = await this.dynamoDbSvc.scan(params).promise();

      if (responseToDo && responseToDo.Items[0]) {
        const toDo = responseToDo.Items[0];
        if (loggedUser.id === toDo.ownerId) return;

        throw new Error('You don\'t have access to remove this to-do');
      }

      throw new Error('Not found this to-do');
  } catch (error) {
    throw new Error(error.message);
  }
  }

  async deleteToDo(params) {
    return this.dynamoDbSvc.delete(params).promise();
  }
  
  prepareData(data) {
    const params = {
      TableName: this.dynamodbToDoTable,
      Key: {
        id: data.id,
      },
    }
    return params
  }

  handlerSuccess() {
    const response = {
      statusCode: 200,
      body: 'To Do deleted successfully'
    }
    return response;
  }

  handleError(data) {
    return {
      statusCode: data.statusCode || 500,
      headers: { 'Content-Type': 'text/plain' },
      body: data.message || 'Couldn\'t delete to do!!'
    }
  }

    async main(event) {
        try {
          const loggedUser = JSON.parse(event.requestContext.authorizer.user);
          const data = JSON.parse(event.body);

          await this.verifyUserOwnerPermission(loggedUser, data.id);

          const dbParams = this.prepareData(data);

          await this.deleteToDo(dbParams);

          return this.handlerSuccess();
        } catch (error) {
            console.error('Deu erro**', error.stack);

            return this.handleError({ message: error.message});
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