
export enum UserRole {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
}

export enum TransactionType {
  TRANSFER = 'Transfer',
  WITHDRAWAL = 'Withdrawal',
  AIRTIME = 'Airtime',
  UTILITIES = 'Utilities',
  DATA = 'Data',
  WITHDRAW_AND_TRANSFER = 'Withdraw and Transfer',
}

export interface User {
  id: string;
  fullName: string;
  address: string;
  phoneNumber: string;
  guardianPhoneNumber: string;
  password: string; // 4 digits
  role: UserRole;
  cashAtHand: number;
  cashInBank: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string; // Denormalized for easier display
  date: string; // ISO Date string YYYY-MM-DD
  type: TransactionType;
  amount: number;
  charge: number;
  description?: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  recipientId: string; // 'ADMIN' or specific userId
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type ViewState = 'LOGIN' | 'REGISTER' | 'DASHBOARD';