import { Injectable } from '@nestjs/common';
import { LambdaClient, InvokeCommand, InvokeCommandInput } from '@aws-sdk/client-lambda';
import { ConfigService } from '@nestjs/config';
import type { AwsCredentialIdentity } from '@aws-sdk/types';

@Injectable()
export class LambdaService {
  private readonly lambdaClient: LambdaClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const endpoint = this.configService.get<string>('LOCALSTACK_ENDPOINT');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS configuration');
    }

    const credentials: AwsCredentialIdentity = {
      accessKeyId,
      secretAccessKey,
    };

    this.lambdaClient = new LambdaClient({
      region,
      endpoint, 
      credentials,
    });
  }

  async invokeFunction(functionName: string, payload: any): Promise<any> {
    try {
        const input: InvokeCommandInput = {
            FunctionName: functionName,
            Payload: JSON.stringify(payload),
        };

        const command = new InvokeCommand(input);
        const response = await this.lambdaClient.send(command);

        if (!response.Payload) {
            throw new Error('Lambda response payload is empty');
        }

        const payloadString = new TextDecoder().decode(response.Payload);
        const result = JSON.parse(payloadString);

        if (response.FunctionError) {
            throw new Error(result.errorMessage || 'Lambda function error');
        }

        return result;
    } catch (error) {
        throw new Error(`Failed to invoke Lambda function: ${error.message}`);
    }
}
}