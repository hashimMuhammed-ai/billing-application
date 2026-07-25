import { Customer } from '@prisma/client';
import { CustomerRepository } from '../infrastructure/customer.repository';
export declare class ListCustomersUseCase {
    private readonly customerRepository;
    constructor(customerRepository: CustomerRepository);
    execute(): Promise<Customer[]>;
}
