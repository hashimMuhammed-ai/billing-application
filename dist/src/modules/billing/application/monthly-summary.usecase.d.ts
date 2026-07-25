import { BillRepository } from '../infrastructure/bill.repository';
export interface MonthlySummaryResult {
    month: string;
    year: number;
    startDate: Date;
    endDate: Date;
    totalSales: number;
    totalCgst: number;
    totalSgst: number;
    totalGst: number;
    billCount: number;
    cancelledCount: number;
}
export declare class MonthlySummaryUseCase {
    private readonly billRepository;
    constructor(billRepository: BillRepository);
    execute(targetDate?: Date): Promise<MonthlySummaryResult>;
}
