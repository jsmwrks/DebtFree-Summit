
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

export interface PayoffStep {
  month: number;
  date: string;
  remainingBalance: number;
  totalPaid: number;
  totalInterest: number;
}

export interface MotivationalMessage {
  pepTalk: string;
  nextMilestone: string;
  financialTip: string;
}
