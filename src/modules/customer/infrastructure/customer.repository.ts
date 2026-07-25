import { Injectable } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCustomerDto } from '../domain/customer.entity';

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        address: data.address,
        gstin: data.gstin ?? null,
        state: data.state,
        phone: data.phone ?? null,
      },
    });
  }

  async findByNamePartial(name: string): Promise<Customer[]> {
    const searchTerm = name.trim();
    if (!searchTerm) {
      return [];
    }

    return this.prisma.customer.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findAll(): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: number): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { id },
    });
  }
}
