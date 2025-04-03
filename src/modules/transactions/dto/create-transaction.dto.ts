import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsEnum, IsString, MinLength, MaxLength, IsOptional, IsObject } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ 
    example: 100.50, 
    description: 'Transaction amount',
    minimum: 0.01 
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be a positive number' })
  amount: number;
  
  @ApiProperty({ 
    example: 'credit', 
    description: 'Transaction type',
    enum: ['credit', 'debit'] 
  })
  @IsEnum(['credit', 'debit'], { message: 'Type must be either credit or debit' })
  type: 'credit' | 'debit';
  
  @ApiProperty({ 
    example: 'ACC123456', 
    description: 'Source account number',
    minLength: 5,
    maxLength: 20
  })
  @IsString({ message: 'Source account must be a string' })
  @MinLength(5, { message: 'Source account must be at least 5 characters' })
  @MaxLength(20, { message: 'Source account must be at most 20 characters' })
  sourceAccount: string;
  
  @ApiProperty({ 
    example: 'ACC654321', 
    description: 'Destination account number',
    minLength: 5,
    maxLength: 20
  })
  @IsString({ message: 'Destination account must be a string' })
  @MinLength(5, { message: 'Destination account must be at least 5 characters' })
  @MaxLength(20, { message: 'Destination account must be at most 20 characters' })
  destinationAccount: string;

  @ApiProperty({ 
    description: 'Additional metadata', 
    required: false,
    example: { description: 'Monthly payment' }
  })
  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  metadata?: Record<string, any>;
}
