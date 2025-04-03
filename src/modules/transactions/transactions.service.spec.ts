import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { LambdaService } from '../../providers/lambda/lambda.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let lambdaService: jest.Mocked<LambdaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: LambdaService,
          useValue: {
            invokeFunction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    lambdaService = module.get(LambdaService);
  });

  describe('create', () => {
    it('should create a transaction successfully', async () => {
      const mockTransaction: CreateTransactionDto = {
        amount: 100,
        type: 'credit',
        sourceAccount: 'acc1',
        destinationAccount: 'acc2',
      };

      lambdaService.invokeFunction.mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({
          id: 'txn123',
          ...mockTransaction,
          status: 'pending',
          timestamp: '2023-01-01T00:00:00Z'
        })
      });

      const result = await service.create(mockTransaction);
      expect(result).toHaveProperty('id');
      expect(result.status).toBe('pending');
      expect(lambdaService.invokeFunction).toHaveBeenCalledWith(
        'create-transaction',
        expect.objectContaining({
          transactionData: expect.objectContaining({
            type: 'credit',
            amount: 100
          })
        })
      );
    });

    it('should throw BadRequestException for invalid amount', async () => {
      await expect(service.create({
        amount: -100,
        type: 'credit',
        sourceAccount: 'acc1',
        destinationAccount: 'acc2',
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid type', async () => {

        interface InvalidTransactionDto extends Omit<CreateTransactionDto, 'type'> {
            type: string; 
          }
          
          const invalidDto: InvalidTransactionDto = {
            amount: 100,
            type: 'abc',
            sourceAccount: 'acc1',
            destinationAccount: 'acc2'
          };
          
          await expect(service.create(invalidDto as CreateTransactionDto))
            .rejects.toThrow(BadRequestException);
    });

    it('should throw Error when Lambda fails', async () => {
      lambdaService.invokeFunction.mockRejectedValue(new Error('Lambda error'));
      await expect(service.create({
        amount: 100,
        type: 'credit',
        sourceAccount: 'acc1',
        destinationAccount: 'acc2',
      })).rejects.toThrow('Failed to create transaction');
    });
  });

  describe('findOne', () => {
    it('should return a transaction', async () => {
      const mockTransaction = {
        id: 'txn123',
        status: 'completed',
        amount: 100,
        type: 'credit'
      };

      lambdaService.invokeFunction.mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ transaction: mockTransaction })
      });

      const result = await service.findOne('txn123');
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException for non-existent transaction', async () => {
      lambdaService.invokeFunction.mockResolvedValue({
        statusCode: 404,
        body: JSON.stringify({ error: 'Not found' })
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on Lambda error', async () => {
      lambdaService.invokeFunction.mockRejectedValue(new Error('Lambda error'));
      await expect(service.findOne('txn123')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByPeriod', () => {
    it('should return transactions within period', async () => {
      const mockTransactions = [
        { id: 'txn1', timestamp: '2023-01-01T00:00:00Z' },
        { id: 'txn2', timestamp: '2023-01-02T00:00:00Z' }
      ];

      lambdaService.invokeFunction.mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ transactions: mockTransactions })
      });

      const result = await service.findByPeriod(
        '2023-01-01T00:00:00Z',
        '2023-01-31T23:59:59Z'
      );
      expect(result).toHaveLength(2);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(service.findByPeriod(
        'invalid-date',
        '2023-01-31T23:59:59Z'
      )).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on Lambda error', async () => {
      lambdaService.invokeFunction.mockRejectedValue(new Error('Lambda error'));
      await expect(service.findByPeriod(
        '2023-01-01T00:00:00Z',
        '2023-01-31T23:59:59Z'
      )).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findStatus', () => {
    it('should return transaction status', async () => {
      const mockTransaction = {
        id: 'txn123',
        status: 'completed'
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTransaction as any);
      
      const result = await service.findStatus('txn123');
      expect(result).toEqual({ status: 'completed' });
    });
  });
});