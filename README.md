# Financial Transactions API

A complete serverless solution for financial transactions management using AWS serverless technologies with LocalStack for local development.

## 🌟 Features

- Transaction creation and processing
- Event-driven architecture
- Full local development environment
- Comprehensive API documentation

## 🛠️ Tech Stack

| Component       | Technology          |
|----------------|--------------------|
| API Layer      | Node.js + Swagger  |
| Compute        | AWS Lambda         |
| Database       | DynamoDB           |
| Queue          | SQS                |
| Local Emulation| LocalStack         |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- Docker Desktop

## 🏃 Running the Project

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/financial-transactions-api.git

# Navigate to project
cd financial-transactions-api

# Install dependencies
npm install
```

### Start API Server
```bash
# Production mode
npm run start

# Development mode (with live reload)
npm run start:dev
```

### Start LocalStack Services (Docker) (It's necessary to use Lambda, DynamoDB, and SQS)
```bash
docker-compose up --build
```

### Deploy AWS Infrastructure
Run the script after LocalStack is fully running (wait for health checks):
```bash
.\deploy-localstack.bat
```

### Access API Documentation
Open in your browser:
http://localhost:3000/docs/
