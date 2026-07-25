import { Injectable } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { CustomerRepository } from '../infrastructure/customer.repository';

@Injectable()
export class ListCustomersUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(): Promise<Customer[]> {
    return this.customerRepository.findAll();
  }
}
