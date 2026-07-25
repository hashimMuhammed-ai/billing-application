import { Injectable } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { CustomerRepository } from '../infrastructure/customer.repository';

export interface FindCustomerResult {
  matchCount: number;
  customers: Customer[];
  status: 'EXACT_ONE' | 'NO_MATCH' | 'MULTIPLE_MATCHES';
}

@Injectable()
export class FindCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(name: string): Promise<FindCustomerResult> {
    const customers = await this.customerRepository.findByNamePartial(name);
    const count = customers.length;

    let status: FindCustomerResult['status'] = 'NO_MATCH';
    if (count === 1) {
      status = 'EXACT_ONE';
    } else if (count > 1) {
      status = 'MULTIPLE_MATCHES';
    }

    return {
      matchCount: count,
      customers,
      status,
    };
  }
}
