import { SQSHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

const localstackEndpoint = process.env.AWS_ENDPOINT || 'http://host.docker.internal:4566';
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: localstackEndpoint,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
};

const dynamoDB = new AWS.DynamoDB.DocumentClient(awsConfig);

export const handler: SQSHandler = async (event) => {
  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      const { transactionId } = message;

      await updateTransactionStatus(transactionId, 'processing');
      
      try {
        console.log(`Processing transaction ${transactionId}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        
        await updateTransactionStatus(transactionId, 'completed');
      } catch (error) {
        await updateTransactionStatus(transactionId, 'failed');
        console.error(`Failed to process transaction ${transactionId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing SQS messages:', error);
    throw error;
  }
};

async function updateTransactionStatus(transactionId: string, status: string) {
  const params = {
    TableName: 'Transactions',
    Key: {
      PK: `TRANSACTION#${transactionId}`,
      SK: 'METADATA'
    },
    UpdateExpression: 'SET #status = :status, updatedAt = :now',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': status,
      ':now': new Date().toISOString()
    },
    ReturnValues: 'UPDATED_NEW'
  };
  
  return dynamoDB.update(params).promise();
}