import { SQSHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

const localstackEndpoint = process.env.AWS_ENDPOINT;
const awsConfig = {
  region: process.env.AWS_REGION,
  endpoint: localstackEndpoint,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY 
};

const dynamoDB = new AWS.DynamoDB.DocumentClient(awsConfig);

export const handler: SQSHandler = async (event) => {
  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      const { transactionId } = message;

      await updateTransactionStatus(transactionId, 'processing');
      
      try {
        await new Promise(resolve => setTimeout(resolve, 8000)); 
        
        await updateTransactionStatus(transactionId, 'completed');
      } catch (error) {
        await updateTransactionStatus(transactionId, 'failed');
      }
    }
  } catch (error) {
    throw error;
  }
};

async function updateTransactionStatus(transactionId: string, status: string) {

  const params = {
    TableName: 'Transactions',
    Key: {
      PK: `TRANSACTIONS`,
      SK: `ID#${transactionId}`
    },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': status
    },
    ReturnValues: 'UPDATED_NEW'
  };
  
  return dynamoDB.update(params).promise();
}