import { CreateCustomerUseCase } from './create-customer.usecase';
import { FindCustomerUseCase } from './find-customer.usecase';
import { ListCustomersUseCase } from './list-customers.usecase';
import { CustomerRepository } from '../infrastructure/customer.repository';
import { Customer } from '@prisma/client';

describe('Customer UseCases', () => {
  let customerRepository: jest.Mocked<CustomerRepository>;
  let createCustomerUseCase: CreateCustomerUseCase;
  let findCustomerUseCase: FindCustomerUseCase;
  let listCustomersUseCase: ListCustomersUseCase;

  const mockCustomer: Customer = {
    id: 1,
    name: 'Moreland Ply&Boards',
    address: 'Muvattupuzha',
    gstin: '32ACCFM3093K1Z7',
    state: 'Kerala',
    phone: '9847000000',
    createdAt: new Date(),
  };

  beforeEach(() => {
    customerRepository = {
      create: jest.fn(),
      findByNamePartial: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<CustomerRepository>;

    createCustomerUseCase = new CreateCustomerUseCase(customerRepository);
    findCustomerUseCase = new FindCustomerUseCase(customerRepository);
    listCustomersUseCase = new ListCustomersUseCase(customerRepository);
  });

  describe('CreateCustomerUseCase', () => {
    it('should create customer via repository', async () => {
      customerRepository.create.mockResolvedValue(mockCustomer);

      const result = await createCustomerUseCase.execute({
        name: 'Moreland Ply&Boards',
        address: 'Muvattupuzha',
        state: 'Kerala',
      });

      expect(customerRepository.create).toHaveBeenCalledWith({
        name: 'Moreland Ply&Boards',
        address: 'Muvattupuzha',
        state: 'Kerala',
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('FindCustomerUseCase', () => {
    it('should return EXACT_ONE when exactly one customer matches', async () => {
      customerRepository.findByNamePartial.mockResolvedValue([mockCustomer]);

      const result = await findCustomerUseCase.execute('Moreland');

      expect(result.status).toBe('EXACT_ONE');
      expect(result.matchCount).toBe(1);
      expect(result.customers).toEqual([mockCustomer]);
    });

    it('should return NO_MATCH when no customer matches', async () => {
      customerRepository.findByNamePartial.mockResolvedValue([]);

      const result = await findCustomerUseCase.execute('Unknown');

      expect(result.status).toBe('NO_MATCH');
      expect(result.matchCount).toBe(0);
      expect(result.customers).toEqual([]);
    });

    it('should return MULTIPLE_MATCHES when multiple customers match', async () => {
      customerRepository.findByNamePartial.mockResolvedValue([
        mockCustomer,
        { ...mockCustomer, id: 2, name: 'Moreland Timbers' },
      ]);

      const result = await findCustomerUseCase.execute('Moreland');

      expect(result.status).toBe('MULTIPLE_MATCHES');
      expect(result.matchCount).toBe(2);
    });
  });

  describe('ListCustomersUseCase', () => {
    it('should return list of all customers', async () => {
      customerRepository.findAll.mockResolvedValue([mockCustomer]);

      const result = await listCustomersUseCase.execute();

      expect(result).toEqual([mockCustomer]);
      expect(customerRepository.findAll).toHaveBeenCalled();
    });
  });
});
