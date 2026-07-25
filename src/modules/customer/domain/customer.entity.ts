export interface CustomerEntity {
  id: number;
  name: string;
  address: string;
  gstin: string | null;
  state: string;
  phone: string | null;
  createdAt: Date;
}

export interface CreateCustomerDto {
  name: string;
  address: string;
  gstin?: string | null;
  state: string;
  phone?: string | null;
}

export interface ParseCustomerResult {
  success: boolean;
  dto?: CreateCustomerDto;
  errors: string[];
  warnings: string[];
}
