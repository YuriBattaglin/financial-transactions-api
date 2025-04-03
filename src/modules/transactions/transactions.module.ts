import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { LambdaService } from 'src/providers/lambda/lambda.service';
import { LambdaModule } from 'src/providers/lambda/lambda.module';

@Module({
  imports: [LambdaModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, LambdaService],
  exports: [TransactionsService],
})
export class TransactionsModule {}