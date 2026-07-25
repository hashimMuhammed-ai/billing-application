import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { AddCustomerParser } from './parsers/addcustomer.parser';
import { CreateCustomerUseCase } from './application/create-customer.usecase';
import { FindCustomerUseCase } from './application/find-customer.usecase';
import { ListCustomersUseCase } from './application/list-customers.usecase';
import { BadRequestException } from '@nestjs/common';

describe('CustomerController', () => {
  let controller: CustomerController;
  let addCustomerParser: AddCustomerParser;
  let createCustomerUseCase: CreateCustomerUseCase;
  let findCustomerUseCase: FindCustomerUseCase;
  let listCustomersUseCase: ListCustomersUseCase;

  const mockCustomer = {
    id: 1,
    name: 'Moreland Ply&Boards',
    address: 'Muvattupuzha',
    gstin: '32ACCFM3093K1Z7',
    state: 'Kerala',
    phone: '9847000000',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        AddCustomerParser,
        {
          provide: CreateCustomerUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue(mockCustomer),
          },
        },
        {
          provide: FindCustomerUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              matchCount: 1,
              customers: [mockCustomer],
              status: 'EXACT_ONE',
            }),
          },
        },
        {
          provide: ListCustomersUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue([mockCustomer]),
          },
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    addCustomerParser = module.get<AddCustomerParser>(AddCustomerParser);
    createCustomerUseCase = module.get<CreateCustomerUseCase>(CreateCustomerUseCase);
    findCustomerUseCase = module.get<FindCustomerUseCase>(FindCustomerUseCase);
    listCustomersUseCase = module.get<ListCustomersUseCase>(ListCustomersUseCase);
  });

  it('should parse rawText and create customer', async () => {
    const rawText = `/addcustomer
Moreland Ply&Boards
Manari P.O, Triveni, Muvattupuzha
32ACCFM3093K1Z7
Kerala
9847000000`;

    const res = await controller.parseAndCreate(rawText);
    expect(res.customer).toEqual(mockCustomer);
    expect(res.warnings).toEqual([]);
    expect(createCustomerUseCase.execute).toHaveBeenCalled();
  });

  it('should throw BadRequestException on parse failure', async () => {
    await expect(controller.parseAndCreate('Invalid input')).rejects.toThrow(BadRequestException);
  });

  it('should find customers by name', async () => {
    const res = await controller.findByName('Moreland');
    expect(res.status).toBe('EXACT_ONE');
    expect(findCustomerUseCase.execute).toHaveBeenCalledWith('Moreland');
  });

  it('should list all customers', async () => {
    const res = await controller.findAll();
    expect(res).toEqual([mockCustomer]);
    expect(listCustomersUseCase.execute).toHaveBeenCalled();
  });
});
