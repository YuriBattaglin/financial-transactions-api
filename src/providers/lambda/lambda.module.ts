import { Module } from '@nestjs/common';
import { LambdaService } from './lambda.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], 
  providers: [LambdaService],
  exports: [LambdaService], 
})
export class LambdaModule {}