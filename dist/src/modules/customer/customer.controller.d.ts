import type { CreateCustomerDto } from './domain/customer.entity';
import { AddCustomerParser } from './parsers/addcustomer.parser';
import { CreateCustomerUseCase } from './application/create-customer.usecase';
import { FindCustomerUseCase } from './application/find-customer.usecase';
import { ListCustomersUseCase } from './application/list-customers.usecase';
export declare class CustomerController {
    private readonly addCustomerParser;
    private readonly createCustomerUseCase;
    private readonly findCustomerUseCase;
    private readonly listCustomersUseCase;
    constructor(addCustomerParser: AddCustomerParser, createCustomerUseCase: CreateCustomerUseCase, findCustomerUseCase: FindCustomerUseCase, listCustomersUseCase: ListCustomersUseCase);
    parseAndCreate(rawText: string): Promise<{
        customer: {
            id: number;
            name: string;
            address: string;
            phone: string | null;
            gstin: string | null;
            state: string;
            createdAt: Date;
        };
        warnings: string[];
    }>;
    create(dto: CreateCustomerDto): Promise<{
        id: number;
        name: string;
        address: string;
        phone: string | null;
        gstin: string | null;
        state: string;
        createdAt: Date;
    }>;
    findAll(): Promise<{
        id: number;
        name: string;
        address: string;
        phone: string | null;
        gstin: string | null;
        state: string;
        createdAt: Date;
    }[]>;
    findByName(name: string): Promise<import("./application/find-customer.usecase").FindCustomerResult>;
}
