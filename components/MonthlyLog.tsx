
import React from 'react';
import { PayoffStep } from '../types';

interface MonthlyLogProps {
  data: PayoffStep[];
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const MonthlyLog: React.FC<MonthlyLogProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-slate-50/30">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Monthly Payoff Schedule
        </h3>
        <p className="text-sm text-slate-500 font-medium">Detailed month-by-month breakdown of balances, payments, and interest costs</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-widest font-bold">
              <th className="px-6 py-4">Month</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Payment Breakdown</th>
              <th className="px-6 py-4">Total Balance</th>
              <th className="px-6 py-4">Cumulative Paid</th>
              <th className="px-6 py-4">Total Interest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((step, idx) => {
              const isCleared = step.remainingBalance <= 0.01;
              const prevStep = idx > 0 ? data[idx - 1] : null;
              const justCleared = isCleared && prevStep && prevStep.remainingBalance > 0.01;

              return (
                <tr 
                  key={step.month} 
                  className={`group transition-colors hover:bg-slate-50/50 ${justCleared ? 'bg-emerald-50' : ''}`}
                >
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">Month {step.month}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-900 whitespace-nowrap">{step.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {step.payments.map((p, pIdx) => (
                        <span 
                          key={pIdx} 
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap border ${
                            p.isExtra 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {p.debtName}: {currencyFormatter.format(p.amount)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${isCleared ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isCleared ? 'DEBT FREE' : currencyFormatter.format(step.remainingBalance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">
                    {currencyFormatter.format(step.totalPaid)}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-rose-500">
                    {currencyFormatter.format(step.totalInterest)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {data.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No data available. Add debts to generate your schedule.</p>
        </div>
      )}
    </div>
  );
};
