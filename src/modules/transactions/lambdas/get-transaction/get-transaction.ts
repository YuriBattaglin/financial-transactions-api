import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT
});

export const handler = async (event: { id: string }): Promise<any> => {
  try {

    const params = {
      TableName: process.env.DYNAMODB_TABLE || 'Transactions',
      Key: {
        PK: `TRANSACTIONS`,
        SK: `ID#${event.id}`,
      }
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: `Transaction with ID ${event.id} not found` 
        })
      };
    }

    const transaction = {
      id: event.id,
      ...result.Item
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ transaction })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch transaction',
        details: error.message 
      })
    };
  }
};