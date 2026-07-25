import { Injectable } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { CustomerRepository } from '../infrastructure/customer.repository';
import { CreateCustomerDto } from '../domain/customer.entity';

@Injectable()
export class CreateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(dto: CreateCustomerDto): Promise<Customer> {
    return this.customerRepository.create(dto);
  }
}
