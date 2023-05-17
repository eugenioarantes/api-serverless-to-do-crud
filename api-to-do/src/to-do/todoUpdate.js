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

        throw new Error('You don\'t have access to update this to-do');
      }

      throw new Error('Not found this to-do');
  } catch (error) {
    throw new Error(error.message);
  }
  }

  async updateToDo(params) {
    return this.dynamoDbSvc.update(params).promise();
  }
  
  prepareData(data, todoId) {
    const params = {
        TableName: this.dynamodbToDoTable,
        Key: {
          id: todoId,
        },
        UpdateExpression: 'set #name = :name, #description = :description',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#description': 'description'
        },
        ExpressionAttributeValues: {
            ':name': data.name,
            ':description': data.description,
        },
        ReturnValues: "UPDATED_NEW"
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
      statusCode: data.statusCode || 400,
      headers: { 'Content-Type': 'text/plain' },
      body: data.message || 'Couldn\'t update to-do!!'
    }
  }

    async main(event) {
        try {
          const loggedUser = JSON.parse(event.requestContext.authorizer.user);
          const data = JSON.parse(event.body);
          const todoId = event.pathParameters.id;

          await this.verifyUserOwnerPermission(loggedUser, todoId);

          const dbParams = this.prepareData(data, todoId);

          const response = await this.updateToDo(dbParams);

          return this.handlerSuccess(response);
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