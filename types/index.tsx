// src/types/index.ts
export interface User {
    username: string;
    password: string;
    role: string;
  }
  
  export interface Package {
    id: string;
    name: string;
    status: 'in_process' | 'complete' | 'canceled';
    vendorCode: string;
    createdAt: Date;
    updatedAt: Date;
    description?: string;
    amount?: number;
  }
  
  export interface AuthUser {
    username: string;
    role: string;
  }
  