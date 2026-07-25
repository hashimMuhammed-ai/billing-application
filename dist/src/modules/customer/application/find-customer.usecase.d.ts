import { Customer } from '@prisma/client';
import { CustomerRepository } from '../infrastructure/customer.repository';
export interface FindCustomerResult {
    matchCount: number;
    customers: Customer[];
    status: 'EXACT_ONE' | 'NO_MATCH' | 'MULTIPLE_MATCHES';
}
export declare class FindCustomerUseCase {
    private readonly customerRepository;
    constructor(customerRepository: CustomerRepository);
    execute(name: string): Promise<FindCustomerResult>;
}
