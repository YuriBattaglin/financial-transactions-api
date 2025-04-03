"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const localstackEndpoint = process.env.AWS_ENDPOINT || 'http://host.docker.internal:4566';
const awsConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: localstackEndpoint,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
};
const dynamoDB = new aws_sdk_1.default.DynamoDB.DocumentClient(awsConfig);
const handler = async (event) => {
    try {
        for (const record of event.Records) {
            const message = JSON.parse(record.body);
            const { transactionId } = message;
            await updateTransactionStatus(transactionId, 'processing');
            try {
                await new Promise(resolve => setTimeout(resolve, 8000));
                await updateTransactionStatus(transactionId, 'completed');
            }
            catch (error) {
                await updateTransactionStatus(transactionId, 'failed');
            }
        }
    }
    catch (error) {
        throw error;
    }
};
exports.handler = handler;
async function updateTransactionStatus(transactionId, status) {
    const params = {
        TableName: 'Transactions',
        Key: {
            PK: `TRANSACTION#${transactionId}`,
            SK: 'METADATA'
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
