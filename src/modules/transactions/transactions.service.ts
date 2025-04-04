import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { LambdaService } from '../../providers/lambda/lambda.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly lambdaService: LambdaService,
  ) {
  }
  
  async create(transaction: CreateTransactionDto): Promise<Transaction> {
    if (transaction.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
  
    if (!['credit', 'debit'].includes(transaction.type)) {
      throw new BadRequestException('Type must be either credit or debit');
    }

    const id = this.generateId();
    const timeStamp = new Date().toISOString();
    
    const transactionPayload = {
      ...transaction,
      id: id,          
      timestamp: timeStamp,  
      status: 'pending',              
      PK: `TRANSACTIONS`,  
      SK: `ID#${id}`,
      GSI01PK: `TRANSACTION`,     
      GSI01SK: `TIMESTAMP#${timeStamp}`,       
    };

    const enhancedPayload = {
      transactionData: transactionPayload,
  };

    try {
      const response = await this.lambdaService.invokeFunction(
        'create-transaction',
        enhancedPayload
      );
      if (response.error) {
        throw new Error(response.error);
      }

      return JSON.parse(response.body);
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  } 

  async findOne(id: string): Promise<Transaction> {
    try {
      const response = await this.lambdaService.invokeFunction(
        'get-transaction',
        { id }
      );
  
      if (response.statusCode === 404) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
  
      if (response.statusCode !== 200) {
        throw new Error(response.body?.error || 'Failed to fetch transaction');
      }
  
      return JSON.parse(response.body).transaction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to fetch transaction: ${error.message}`);
    }
  }

  async findByPeriod(startDate: string, endDate: string): Promise<Transaction[]> {
    const isoUtcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    
    if (!isoUtcRegex.test(startDate)) {
      throw new BadRequestException('startDate must be in ISO format (e.g., 2023-01-01T00:00:00Z)');
    }
    
    if (!isoUtcRegex.test(endDate)) {
      throw new BadRequestException('endDate must be in ISO format (e.g., 2023-01-01T00:00:00Z)');
    }
  
    try {
      const response = await this.lambdaService.invokeFunction(
        'get-transactions-by-period',
        { startDate, endDate }
      );
  
      if (response.statusCode !== 200) {
        throw new Error(response.body?.error || 'Failed to fetch transactions');
      }
  
      return JSON.parse(response.body).transactions;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch transactions by period: ${error.message}`
      );
    }
  }

  async findStatus(id: string): Promise<{ status: string }> {
    const transaction = await this.findOne(id); 
    return { status: transaction.status }; 
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}