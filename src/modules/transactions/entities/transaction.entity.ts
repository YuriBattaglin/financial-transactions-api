import { ApiProperty } from '@nestjs/swagger';

export class Transaction {
  @ApiProperty({ description: 'Unique transaction ID', example: 'abc123' })
  id: string;

  @ApiProperty({ description: 'Transaction amount', example: 100.50 })
  amount: number;

  @ApiProperty({ 
    description: 'Transaction type', 
    enum: ['credit', 'debit'],
    example: 'credit'
  })
  type: 'credit' | 'debit';

  @ApiProperty({ description: 'Source account number', example: 'ACC123456' })
  sourceAccount: string;

  @ApiProperty({ description: 'Destination account number', example: 'ACC654321' })
  destinationAccount: string;

  @ApiProperty({ 
    description: 'Transaction timestamp', 
    example: '2023-01-01T00:00:00Z' 
  })
  timestamp: string;

  @ApiProperty({ 
    description: 'Transaction status', 
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'pending'
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ 
    description: 'Additional metadata', 
    required: false,
    example: { description: 'Monthly payment' } 
  })
  metadata?: Record<string, any>;
}