import { Customer } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCustomerDto } from '../domain/customer.entity';
export declare class CustomerRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateCustomerDto): Promise<Customer>;
    findByNamePartial(name: string): Promise<Customer[]>;
    findAll(): Promise<Customer[]>;
    findById(id: number): Promise<Customer | null>;
}
