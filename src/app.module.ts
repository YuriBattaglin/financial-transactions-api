import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { LambdaModule } from './providers/lambda/lambda.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TransactionsModule,
    LambdaModule
  ],
})
export class AppModule {}