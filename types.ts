export interface Expense {
  id: string;
  amount: number;
  merchant: string;
  date: string; // ISO String
  timestamp: number; // Metadata timestamp of creation
  imageUrl?: string;
  description?: string;
}

export interface ReceiptAnalysis {
  amount: number | null;
  merchant: string | null;
  date: string | null;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ADD = 'ADD',
  HISTORY = 'HISTORY'
}