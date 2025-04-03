import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Financial Transactions API')
    .setDescription('An API for performing financial transactions with asynchronous processing, utilizing the AWS SQS queue system and storing data in AWS DynamoDB. This API allows you to: send new financial transactions, retrieve transactions by period, by ID, and check the status of a transaction.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha', 
      operationsSorter: 'alpha',
      docExpansion: 'none', 
    },
    customSiteTitle: 'Financial Transactions API Documentation',
  });
}