
export enum Strategy {
  SNOWBALL = 'SNOWBALL',
  AVALANCHE = 'AVALANCHE'
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

export interface PaymentEntry {
  debtName: string;
  amount: number;
  isExtra?: boolean;
}

export interface PayoffStep {
  month: number;
  date: string;
  remainingBalance: number;
  totalPaid: number;
  totalInterest: number;
  payments: PaymentEntry[];
}

export interface MotivationalMessage {
  pepTalk: string;
  nextMilestone: string;
  financialTip: string;
  budgetAdvice?: string;
  healthScore?: number;
}
