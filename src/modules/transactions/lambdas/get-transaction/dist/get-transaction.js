"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = require("aws-sdk");
const dynamoDB = new aws_sdk_1.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT
});
const handler = async (event) => {
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
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fetch transaction',
                details: error.message
            })
        };
    }
};
exports.handler = handler;
