import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { LambdaService } from 'src/providers/lambda/lambda.service';

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
      PK: `TRANSACTION#${id}`,  
      SK: 'METADATA',               
      GSI01PK: `TYPE#${transaction.type}`,     
      GSI01SK: timeStamp      
    };

    try {
      const response = await this.lambdaService.invokeFunction(
        'create-transaction',
        transactionPayload
      );
      if (response.error) {
        throw new Error(response.error);
      }

      return response.body;
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

      if (!response.transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      return response.transaction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}