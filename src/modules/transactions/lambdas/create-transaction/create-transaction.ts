const AWSCreateLambda = require('aws-sdk');

const localstackEndpoint = process.env.AWS_ENDPOINT;

const awsConfig = {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3ForcePathStyle: true,
  endpoint: localstackEndpoint,
  maxRetries: 3,
  httpOptions: { timeout: 5000 }
};

const dynamoDBCreateLambda = new AWSCreateLambda.DynamoDB.DocumentClient(awsConfig);
const sqsCreateLambda = new AWSCreateLambda.SQS(awsConfig);

exports.handler = async (event) => {
  try {
    const payload = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    const { transactionData } = payload;

    if (!transactionData) {
      throw new Error('transactionData is required');
    }

    const requiredFields = ['id', 'type', 'amount'];
    const missingFields = requiredFields.filter(field => !transactionData[field]);
    
    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          missingFields
        })
      };
    }

    await dynamoDBCreateLambda.put({
      TableName: 'Transactions',
      Item: {
        ...transactionData,
      },
      ConditionExpression: 'attribute_not_exists(PK)'
    }).promise();

    await sqsCreateLambda.sendMessage({
      QueueUrl: process.env.SQS_QUEUE_URL || `${localstackEndpoint}/000000000000/TransactionsQueue`,
      MessageBody: JSON.stringify({
        transactionId: transactionData.id,
        type: transactionData.type,
        amount: transactionData.amount,
        timestamp: transactionData.timestamp || new Date().toISOString(),
        action: 'process-transaction'
      }),
      MessageAttributes: { 
        'TransactionType': {
          DataType: 'String',
          StringValue: transactionData.type
        }
      }
    }).promise();

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: transactionData.id,
        amount: transactionData.amount,
        type: transactionData.type,
        sourceAccount: transactionData.sourceAccount,
        destinationAccount: transactionData.destinationAccount,
        timestamp: transactionData.timestamp,
        status: transactionData.status,
        metadata: transactionData.metadata || {}
      })
    };

  } catch (error) {
    return {
      statusCode: error.code === 'ConditionalCheckFailedException' ? 409 : 500,
      body: JSON.stringify({ 
        error: error.code === 'ConditionalCheckFailedException' 
          ? 'Transaction ID already exists' 
          : 'Internal server error',
        details: error.message,
        stack: error.stack
      })
    };
  }
};