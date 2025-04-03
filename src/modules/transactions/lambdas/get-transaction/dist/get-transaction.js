"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = require("aws-sdk");
const dynamoDB = new aws_sdk_1.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT || 'http://host.docker.internal:4566'
});
const handler = async (event) => {
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE || 'Transactions',
            Key: {
                PK: `TRANSACTION#${event.id}`,
                SK: 'METADATA'
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
            ...result.Item,
            PK: undefined,
            SK: undefined,
            GSI01PK: undefined,
            GSI01SK: undefined
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
