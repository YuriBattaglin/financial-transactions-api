import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: jest.Mocked<TransactionsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findStatus: jest.fn(),
            findByPeriod: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get(TransactionsService);
  });

  describe('create', () => {
    it('should create a transaction', async () => {
      const dto: CreateTransactionDto = {
        amount: 100,
        type: 'credit',
        sourceAccount: 'acc1',
        destinationAccount: 'acc2',
      };

      service.create.mockResolvedValue({
        id: 'txn123',
        ...dto,
        status: 'pending',
        timestamp: '2023-01-01T00:00:00Z'
      } as any);

      const result = await controller.create(dto);
      expect(result).toHaveProperty('id', 'txn123');
      expect(service.create).toHaveBeenCalledWith(dto);
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

      service.findOne.mockResolvedValue(mockTransaction as any);
      const result = await controller.findOne('txn123');
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('findStatus', () => {
    it('should return transaction status', async () => {
      service.findStatus.mockResolvedValue({ status: 'completed' });
      const result = await controller.findStatus('txn123');
      expect(result).toEqual({ status: 'completed' });
    });
  });

  describe('findByPeriod', () => {
    it('should return transactions within period', async () => {
      const mockTransactions = [
        { id: 'txn1', timestamp: '2023-01-01T00:00:00Z' },
        { id: 'txn2', timestamp: '2023-01-02T00:00:00Z' }
      ];

      service.findByPeriod.mockResolvedValue(mockTransactions as any);
      const result = await controller.findByPeriod(
        '2023-01-01T00:00:00Z',
        '2023-01-31T23:59:59Z'
      );
      expect(result).toHaveLength(2);
    });
  });
});