import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT
});

export const handler = async (event: { 
  startDate: string;
  endDate: string;
}): Promise<any> => {
  try {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid date format. Use ISO string (e.g., YYYY-MM-DDTHH:MM:SSZ)' 
        })
      };
    }

    if (start > end) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Start date must be before end date' 
        })
      };
    }

    const params = {
      TableName: process.env.DYNAMODB_TABLE || 'Transactions',
      IndexName: 'GSI01',
      KeyConditionExpression: '#pk = :pk AND #sk BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#pk': 'GSI01PK',
        '#sk': 'GSI01SK'
      },
      ExpressionAttributeValues: {
        ':pk': 'TRANSACTION', 
        ':start': `TIMESTAMP#${start.toISOString()}`,
        ':end': `TIMESTAMP#${end.toISOString()}`
      },
      ScanIndexForward: false 
    };

    const result = await dynamoDB.query(params).promise();

    const transactions = result.Items?.map(item => ({
      id: item.SK.replace('ID#', ''),
      amount: item.amount,
      type: item.type,
      sourceAccount: item.sourceAccount,
      destinationAccount: item.destinationAccount,
      timestamp: item.timestamp,
      status: item.status,
      metadata: item.metadata || {}
    })) || [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        count: transactions.length,
        transactions
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch transactions',
        details: error.message 
      })
    };
  }
};