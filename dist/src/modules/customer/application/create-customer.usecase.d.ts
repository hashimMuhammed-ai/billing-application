import { Customer } from '@prisma/client';
import { CustomerRepository } from '../infrastructure/customer.repository';
import { CreateCustomerDto } from '../domain/customer.entity';
export declare class CreateCustomerUseCase {
    private readonly customerRepository;
    constructor(customerRepository: CustomerRepository);
    execute(dto: CreateCustomerDto): Promise<Customer>;
}
