@echo off
SETLOCAL

set "SCRIPT_DIR=%~dp0"
set "PROJECT_PATH=%SCRIPT_DIR%..\.."
cd /d "%PROJECT_PATH%"
set "PROJECT_PATH=%cd%"

set "ENDPOINT=http://localhost:4566"
set "REGION=us-east-1"
set "ROLE_ARN=arn:aws:iam::000000000000:role/any-role"

aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test
aws configure set region us-east-1

echo [1/7] Creating queue SQS...
aws --endpoint-url=%ENDPOINT% cloudformation deploy ^
  --template-file "%PROJECT_PATH%\src\sam\transactions-queue\transactions-queue.yaml" ^
  --stack-name transactions-sqs ^
  --capabilities CAPABILITY_IAM ^
  --no-fail-on-empty-changeset ^
  --parameter-overrides ^
    Environment=development ^
    AWSRegion=%REGION% ^
    AWSEndpoint=%ENDPOINT% ^
    QueueName=TransactionsQueue ^
    VisibilityTimeout=30

echo [2/7] Creating table DynamoDB...
aws --endpoint-url=%ENDPOINT% cloudformation deploy ^
  --template-file "%PROJECT_PATH%\src\sam\transactions-table\transactions-table.yaml" ^
  --stack-name transactions-dynamodb ^
  --capabilities CAPABILITY_IAM ^
  --no-fail-on-empty-changeset ^
  --parameter-overrides ^
    Environment=development ^
    AWSRegion=%REGION% ^
    AWSEndpoint=%ENDPOINT% ^
    BillingMode=PAY_PER_REQUEST ^
    TableName=Transactions ^
    PrimaryKey=id

echo [3/7] Creating Lambda create-transaction...
aws --endpoint-url=%ENDPOINT% lambda create-function ^
  --function-name create-transaction ^
  --runtime nodejs14.x ^
  --handler create-transaction.handler ^
  --role %ROLE_ARN% ^
  --zip-file "fileb://%PROJECT_PATH%\src\modules\transactions\lambdas\create-transaction\lambda-deploy.zip" ^
  --timeout 30 ^
  --query "StateReason" --output text ^
  --environment "Variables={NODE_ENV=development,AWS_ENDPOINT=http://host.docker.internal:4566,AWS_REGION=%REGION%,AWS_ACCESS_KEY_ID=test,AWS_SECRET_ACCESS_KEY=test,SQS_QUEUE_URL=http://host.docker.internal:4566/000000000000/TransactionsQueue,DYNAMODB_TABLE=Transactions}"

echo [4/7] Creating Lambda process-transaction...
aws --endpoint-url=%ENDPOINT% lambda create-function ^
  --function-name process-transaction ^
  --runtime nodejs14.x ^
  --handler process-transaction.handler ^
  --role %ROLE_ARN% ^
  --zip-file "fileb://%PROJECT_PATH%\src\modules\transactions\lambdas\process-transaction\lambda-deploy.zip" ^
  --timeout 30 ^
  --query "StateReason" --output text ^
  --environment "Variables={NODE_ENV=development,AWS_ENDPOINT=http://host.docker.internal:4566,AWS_REGION=%REGION%,AWS_ACCESS_KEY_ID=test,AWS_SECRET_ACCESS_KEY=test,DYNAMODB_TABLE=Transactions,SQS_QUEUE_URL=http://host.docker.internal:4566/000000000000/TransactionsQueue}"

echo [5/7] Creating trigger SQS...
aws --endpoint-url=%ENDPOINT% lambda create-event-source-mapping ^
  --function-name process-transaction ^
  --event-source-arn arn:aws:sqs:%REGION%:000000000000:TransactionsQueue ^
  --batch-size 1 ^
   --query "State" --output text ^
  --enabled

echo [6/7] Creating Lambda get-transaction...
aws --endpoint-url=%ENDPOINT% lambda create-function ^
  --function-name get-transaction ^
  --runtime nodejs14.x ^
  --handler get-transaction.handler ^
  --role %ROLE_ARN% ^
  --zip-file "fileb://%PROJECT_PATH%\src\modules\transactions\lambdas\get-transaction\lambda-deploy.zip" ^
  --timeout 30 ^
  --query "StateReason" --output text ^
  --environment "Variables={NODE_ENV=development,AWS_ENDPOINT=http://host.docker.internal:4566,AWS_REGION=%REGION%,AWS_ACCESS_KEY_ID=test,AWS_SECRET_ACCESS_KEY=test,DYNAMODB_TABLE=Transactions}"

echo [7/7] Creating Lambda get-transactions-by-period...
aws --endpoint-url=%ENDPOINT% lambda create-function ^
  --function-name get-transactions-by-period ^
  --runtime nodejs14.x ^
  --handler get-transactions-by-period.handler ^
  --role %ROLE_ARN% ^
  --zip-file "fileb://%PROJECT_PATH%\src\modules\transactions\lambdas\get-transactions-by-period\lambda-deploy.zip" ^
  --timeout 30 ^
  --query "StateReason" --output text ^
  --environment "Variables={NODE_ENV=development,AWS_ENDPOINT=http://host.docker.internal:4566,AWS_REGION=%REGION%,AWS_ACCESS_KEY_ID=test,AWS_SECRET_ACCESS_KEY=test,DYNAMODB_TABLE=Transactions}"

echo Configuration complete!