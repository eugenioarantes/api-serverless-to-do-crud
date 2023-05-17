const { sign } = require('jsonwebtoken');
const { compareHash } = require('../utils/cryptoHash');

const JWT_KEY = process.env.JWT_KEY;

const EXPIRY_TIME = 900; // 15 minutos

class Handler {
  constructor({ dynamoDbSvc }) {
    this.dynamoDbSvc = dynamoDbSvc
    this.dynamodbUsersTable = process.env.DYNAMODB_USERS_TABLE
  }

    async searchByEmailPassword(email, password) {
      try {
          const params = {
              TableName: this.dynamodbUsersTable,
              FilterExpression: "email = :email",
              ExpressionAttributeValues: {
                  ":email": email
              }
          }

          const responseData = await this.dynamoDbSvc.scan(params).promise();

          if (responseData && responseData.Items) {
              const user = responseData.Items[0];
              const passwordMatched = await compareHash(password, user.password);
              return passwordMatched ? user : null
          }

          return null;
      } catch (err) {
          return null;
      }
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
      const {
        email,
        password
      } = JSON.parse(event.body);

      const isValidUser = await this.searchByEmailPassword(email, password);

      if(!isValidUser) {
        return {
          statusCode: 401,
          body: JSON.stringify({
            message: 'Unauthorized'
          })
        }
      }

      const user = {
        id: isValidUser.id,
        email,
      }

      const token = sign(
      {
        user,
      },
        JWT_KEY,
      {
        expiresIn: EXPIRY_TIME,
      }
      );

      console.log('jwt key is: ', JWT_KEY);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({token, user })
      }
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