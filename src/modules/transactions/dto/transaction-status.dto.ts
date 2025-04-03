import { ApiProperty } from '@nestjs/swagger';

export class TransactionStatusDto {
  @ApiProperty({
    description: 'Current status of the transaction',
    example: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed']
  })
  status: string;
}