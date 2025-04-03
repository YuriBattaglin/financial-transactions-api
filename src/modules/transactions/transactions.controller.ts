import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new transaction',
    description: 'Creates a financial transaction and initiates processing'
  })
  @ApiBody({ 
    type: CreateTransactionDto,
    description: 'Transaction data without system-generated fields'
  })
  @ApiCreatedResponse({ 
    description: 'Transaction created and queued for processing',
    type: Transaction
  })
  @ApiBadRequestResponse({ 
    description: 'Validation error in input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'amount must be a positive number',
          'type must be either credit or debit'
        ],
        error: 'Bad Request'
      }
    }
  })
  async create(@Body() transaction: CreateTransactionDto): Promise<Transaction> {
    return this.transactionsService.create(transaction);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get transaction details',
    description: 'Retrieves complete transaction information by ID'
  })
  @ApiParam({ 
    name: 'id', 
    required: true, 
    description: 'Unique transaction identifier',
    example: 'txn_abc123xyz456',
    type: String
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction details',
    type: Transaction 
  })
  @ApiNotFoundResponse({ 
    description: 'Transaction not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Transaction with ID txn_abc123xyz456 not found',
        error: 'Not Found'
      }
    }
  })
  async findOne(@Param('id') id: string): Promise<Transaction> {
    return this.transactionsService.findOne(id);
  }
}