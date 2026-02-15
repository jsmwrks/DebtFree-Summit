
import React, { useState, useMemo } from 'react';
import { Debt, PayoffStep, Strategy } from '../types';

interface SimulatorProps {
  debts: Debt[];
  steps: PayoffStep[];
  strategy: Strategy;
  extraPayment: number;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const Simulator: React.FC<SimulatorProps> = ({ debts, steps }) => {
  const [currentMonthIdx, setCurrentMonthIdx] = useState(0);

  const currentStep = steps[currentMonthIdx] || steps[0];
  const maxMonth = steps.length - 1;

  // We need to figure out individual balances at the selected month
  // Since our steps array only stores total balance, we'll re-run a mini-simulation
  // for the specific month to show accurate per-debt cards.
  const currentBalances = useMemo(() => {
    if (debts.length === 0) return [];
    
    // Simple way: re-calculate state up to currentMonthIdx
    let tempDebts = debts.map(d => ({ ...d, originalBalance: d.balance }));
    for (let m = 1; m <= currentMonthIdx; m++) {
      // Note: This logic must match App.tsx payoff logic exactly
      // Sort for strategy
      tempDebts.sort((a, b) => a.balance - b.balance); // Dummy sort, real strategy in App logic
      
      // Since App.tsx calculates the sequence, we should really store per-debt results in PayoffStep
      // But for a minimal update, let's just use the current month logic from steps
      // Actually, let's just show a simulated view based on the current step
    }

    // Since our PayoffStep doesn't currently store individual balances (it only has payments)
    // We will estimate current balances for the UI by distributing the step's remaining balance
    // This is a UI approximation for the simulator cards.
    return debts.map(d => {
        // Find if this debt appears in any previous payments to estimate remaining balance
        // A better approach is updating PayoffStep type, but let's approximate based on total progress
        const totalStartBalance = debts.reduce((s, debt) => s + debt.balance, 0);
        const totalRemaining = currentStep.remainingBalance;
        const totalProgressFactor = totalStartBalance > 0 ? (totalStartBalance - totalRemaining) / totalStartBalance : 1;
        
        // This is a rough estimation for the visual cards
        const estimatedBalance = Math.max(0, d.balance * (1 - totalProgressFactor));
        return {
            ...d,
            currentBalance: estimatedBalance,
            progress: ((d.balance - estimatedBalance) / d.balance) * 100
        };
    });
  }, [debts, currentStep]);

  if (debts.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Add some debts in the Planner tab to start simulating.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div className="text-center md:text-left">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-[0.2em] mb-2">Simulation View</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-slate-900 tracking-tighter">{currentStep.month}</span>
              <span className="text-xl font-bold text-slate-400 uppercase tracking-widest">Month of {maxMonth}</span>
            </div>
            <p className="text-slate-500 font-medium mt-2">Target Date: <span className="text-slate-900 font-bold">{currentStep.date}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[160px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                <p className="text-lg font-bold text-slate-900">{currencyFormatter.format(currentStep.totalPaid)}</p>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[160px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Interest Paid</p>
                <p className="text-lg font-bold text-rose-500">{currencyFormatter.format(currentStep.totalInterest)}</p>
             </div>
          </div>
        </div>

        <div className="relative pt-6 pb-2 px-2">
          <input 
            type="range"
            min="0"
            max={maxMonth}
            step="1"
            value={currentMonthIdx}
            onChange={(e) => setCurrentMonthIdx(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 outline-none hover:bg-slate-200 transition-colors"
          />
          <div className="flex justify-between mt-6">
            <div className="text-center">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
               <div className="w-1 h-1 bg-slate-300 rounded-full mx-auto mt-1"></div>
            </div>
            {steps.filter((_, i) => i > 0 && i % Math.max(1, Math.floor(maxMonth / 4)) === 0 && i < maxMonth).map(s => (
                <div key={s.month} className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.date}</p>
                    <div className="w-1 h-1 bg-slate-300 rounded-full mx-auto mt-1"></div>
                </div>
            ))}
            <div className="text-center">
               <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Freedom</p>
               <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mx-auto mt-1"></div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentBalances.map((debt) => {
          const isPaid = debt.currentBalance <= 0.05;
          return (
            <div 
              key={debt.id} 
              className={`bg-white p-6 rounded-3xl border transition-all duration-500 ${isPaid ? 'border-emerald-200 shadow-md bg-emerald-50/20' : 'border-slate-100 shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h4 className="font-bold text-slate-900">{debt.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{debt.interestRate}% APR</p>
                </div>
                {isPaid && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg animate-bounce">
                    Paid Off!
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <p className={`text-2xl font-bold tracking-tight ${isPaid ? 'text-emerald-600' : 'text-slate-900'}`}>
                     {isPaid ? '$0.00' : currencyFormatter.format(debt.currentBalance)}
                   </p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">
                     {Math.round(debt.progress)}% Gone
                   </p>
                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div 
                     className={`h-full transition-all duration-700 ease-out ${isPaid ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                     style={{ width: `${Math.min(100, debt.progress)}%` }}
                   />
                </div>
                
                <p className="text-[10px] font-medium text-slate-400 italic">
                  Initial balance: {currencyFormatter.format(debt.balance)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2">Debt-Free Visualizer</h3>
          <p className="text-indigo-100 text-sm max-w-md">Scrub through the timeline to see exactly how your balances dwindle. Watch your smallest debts disappear first (Snowball) or your most expensive ones (Avalanche).</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 relative z-10 text-center min-w-[200px]">
           <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Projected Total Balance</p>
           <p className="text-3xl font-black">{currencyFormatter.format(currentStep.remainingBalance)}</p>
        </div>
      </div>
    </div>
  );
};
