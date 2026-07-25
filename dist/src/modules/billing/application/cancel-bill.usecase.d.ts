import { BillRepository } from '../infrastructure/bill.repository';
import { Bill } from '@prisma/client';
export declare class CancelBillUseCase {
    private readonly billRepository;
    constructor(billRepository: BillRepository);
    execute(invoiceNo: string): Promise<Bill>;
}
