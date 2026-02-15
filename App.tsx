
import React, { useState, useEffect, useMemo } from 'react';
import { Strategy, Debt, PayoffStep, MotivationalMessage, PaymentEntry } from './types';
import { DebtForm } from './components/DebtForm';
import { VisualProgress } from './components/VisualProgress';
import { MonthlyLog } from './components/MonthlyLog';
import { SpreadsheetUpload } from './components/SpreadsheetUpload';
import { getEncouragement } from './services/geminiService';

const App: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [strategy, setStrategy] = useState<Strategy>(Strategy.SNOWBALL);
  const [extraPayment, setExtraPayment] = useState<number>(100);
  const [encouragement, setEncouragement] = useState<MotivationalMessage | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [view, setView] = useState<'dashboard' | 'log'>('dashboard');
  const [highestBalanceSeen, setHighestBalanceSeen] = useState(0);

  // Add sample debt on initial load if empty
  useEffect(() => {
    if (debts.length === 0) {
      const samples = [
        { id: '1', name: 'Credit Card A', balance: 5000, interestRate: 22, minimumPayment: 150 },
        { id: '2', name: 'Personal Loan', balance: 12000, interestRate: 6.5, minimumPayment: 320 }
      ];
      setDebts(samples);
      setHighestBalanceSeen(samples.reduce((sum, d) => sum + d.balance, 0));
    }
  }, []);

  useEffect(() => {
    const currentTotal = debts.reduce((sum, d) => sum + d.balance, 0);
    if (currentTotal > highestBalanceSeen) {
      setHighestBalanceSeen(currentTotal);
    }
  }, [debts, highestBalanceSeen]);

  const totalMinPayments = useMemo(() => {
    return debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  }, [debts]);

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => {
      if (strategy === Strategy.SNOWBALL) return a.balance - b.balance;
      return b.interestRate - a.interestRate;
    });
  }, [debts, strategy]);

  const fullPayoffData = useMemo(() => {
    if (debts.length === 0) return [];
    
    let currentDebts = debts.map(d => ({ ...d }));
    let steps: PayoffStep[] = [];
    let month = 0;
    let totalPaid = 0;
    let totalInterest = 0;
    const maxMonths = 360;

    while (currentDebts.some(d => d.balance > 0) && month < maxMonths) {
      month++;
      let monthlyInterest = 0;
      let monthlyPayments: PaymentEntry[] = [];
      const date = new Date();
      date.setMonth(date.getMonth() + month);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      // Apply interest and minimum payments
      currentDebts.forEach(d => {
        if (d.balance > 0) {
          const interest = (d.balance * (d.interestRate / 100)) / 12;
          d.balance += interest;
          monthlyInterest += interest;
          
          const pay = Math.min(d.balance, d.minimumPayment);
          if (pay > 0) {
            d.balance -= pay;
            totalPaid += pay;
            monthlyPayments.push({ debtName: d.name, amount: pay });
          }
        }
      });

      // Apply extra payment to focus debt
      const focusDebt = currentDebts.sort((a, b) => {
        if (strategy === Strategy.SNOWBALL) return a.balance - b.balance;
        return b.interestRate - a.interestRate;
      }).find(d => d.balance > 0);

      if (focusDebt && extraPayment > 0) {
        const payExtra = Math.min(focusDebt.balance, extraPayment);
        if (payExtra > 0) {
          focusDebt.balance -= payExtra;
          totalPaid += payExtra;
          
          // Add to existing payment entry or create new one for extra
          const existingEntry = monthlyPayments.find(p => p.debtName === focusDebt.name);
          if (existingEntry) {
            existingEntry.amount += payExtra;
            existingEntry.isExtra = true;
          } else {
            monthlyPayments.push({ debtName: focusDebt.name, amount: payExtra, isExtra: true });
          }
        }
      }

      totalInterest += monthlyInterest;
      let endOfMonthBalance = currentDebts.reduce((sum, d) => sum + d.balance, 0);
      
      steps.push({
        month,
        date: dateStr,
        remainingBalance: Math.max(0, endOfMonthBalance),
        totalPaid,
        totalInterest,
        payments: monthlyPayments
      });

      if (endOfMonthBalance <= 0) break;
    }
    return steps;
  }, [debts, strategy, extraPayment]);

  const chartData = useMemo(() => {
    if (fullPayoffData.length <= 20) return fullPayoffData;
    return fullPayoffData.filter((_, i) => i % Math.ceil(fullPayoffData.length / 20) === 0 || i === fullPayoffData.length - 1);
  }, [fullPayoffData]);

  const interestAvoided = useMemo(() => {
    if (debts.length === 0) return 0;
    
    let currentDebtsMin = debts.map(d => ({ ...d }));
    let minOnlyInterest = 0;
    let month = 0;

    while (currentDebtsMin.some(d => d.balance > 0) && month < 600) {
      month++;
      currentDebtsMin.forEach(d => {
        if (d.balance > 0) {
          const interest = (d.balance * (d.interestRate / 100)) / 12;
          d.balance += interest;
          minOnlyInterest += interest;
          const pay = Math.min(d.balance, d.minimumPayment);
          d.balance -= pay;
        }
      });
    }

    const currentTotalInterest = fullPayoffData[fullPayoffData.length - 1]?.totalInterest || 0;
    return Math.max(0, minOnlyInterest - currentTotalInterest);
  }, [debts, strategy, extraPayment, fullPayoffData]);

  const fetchEncouragement = async () => {
    if (debts.length === 0) return;
    setLoadingAI(true);
    try {
      const msg = await getEncouragement(debts, 0); 
      setEncouragement(msg);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAddDebt = (newDebt: Omit<Debt, 'id'>) => {
    setDebts(prev => [...prev, { ...newDebt, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const handleBulkImport = (newDebts: Omit<Debt, 'id'>[]) => {
    const identified = newDebts.map(d => ({ ...d, id: Math.random().toString(36).substr(2, 9) }));
    setDebts(prev => [...prev, ...identified]);
  };

  const totalCurrentDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const payoffDate = fullPayoffData[fullPayoffData.length - 1]?.date || 'N/A';
  const progressPercent = highestBalanceSeen > 0 ? ((highestBalanceSeen - totalCurrentDebt) / highestBalanceSeen) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans']">
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Debt Freedom Planner</h1>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
               <button 
                onClick={() => setView('dashboard')}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${view === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
               >
                 Planner
               </button>
               <button 
                onClick={() => setView('log')}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${view === 'log' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
               >
                 Schedule
               </button>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interest Saved</p>
                <p className="text-sm font-bold text-emerald-600">+${Math.round(interestAvoided).toLocaleString()}</p>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Remaining Debt</p>
                <p className="text-sm font-bold text-slate-900">${totalCurrentDebt.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="relative pt-4 pb-2">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                 style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
               />
            </div>
            <div 
              className="absolute -top-4 transition-all duration-1000 ease-out flex flex-col items-center"
              style={{ left: `calc(${Math.max(0, Math.min(100, progressPercent))}% - 12px)` }}
            >
              <div className="bg-white text-indigo-600 p-1 rounded-full shadow-md border-2 border-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
              <span>Start</span>
              <span>Debt Free</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 pb-12">
        {view === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  Payoff Strategy
                </h3>
                
                <div className="mb-8">
                  <div className="flex p-1 bg-slate-100 rounded-2xl mb-4 border border-slate-200">
                    <button 
                      onClick={() => setStrategy(Strategy.SNOWBALL)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${strategy === Strategy.SNOWBALL ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Snowball
                    </button>
                    <button 
                      onClick={() => setStrategy(Strategy.AVALANCHE)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${strategy === Strategy.AVALANCHE ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Avalanche
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      Total Monthly Commitment
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl font-bold text-slate-900">$</span>
                      <input 
                        type="number"
                        className="bg-transparent text-3xl font-bold text-slate-900 w-full outline-none"
                        value={totalMinPayments + extraPayment}
                        onChange={(e) => setExtraPayment(Math.max(0, (Number(e.target.value) || 0) - totalMinPayments))}
                      />
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="10000" 
                      step="100" 
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="mt-4 flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                      <span>Minimums: ${totalMinPayments}</span>
                      <span className="text-indigo-600 font-bold">Extra: +${extraPayment}</span>
                    </div>
                  </div>
                </div>
              </section>

              <DebtForm onAdd={handleAddDebt} />
              <SpreadsheetUpload onImport={handleBulkImport} />

              <section className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="font-bold flex items-center gap-2 text-indigo-300 uppercase tracking-widest text-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Advisor Insights
                  </h3>
                  <button onClick={fetchEncouragement} disabled={loadingAI} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${loadingAI ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                
                {encouragement ? (
                  <div className="space-y-4 relative z-10">
                    <p className="text-xs font-medium text-slate-300 leading-relaxed italic">"{encouragement.pepTalk}"</p>
                    <div className="grid grid-cols-1 gap-3 pt-4 border-t border-white/10">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1 tracking-widest">Objective</p>
                        <p className="text-xs font-medium">{encouragement.nextMilestone}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1 tracking-widest">Strategy Tip</p>
                        <p className="text-xs font-medium">{encouragement.financialTip}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-2xl">
                     <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Generate Insights...</p>
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <VisualProgress data={chartData} />

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Active Debts
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setDebts([])}
                      className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                    >
                      Clear All
                    </button>
                    <span className="text-xs font-bold text-slate-500 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">
                      {debts.length} {debts.length === 1 ? 'Account' : 'Accounts'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sortedDebts.map((debt, index) => (
                    <div key={debt.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:border-indigo-100 transition-all relative">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priority {index + 1}</p>
                          <h4 className="font-bold text-slate-800 text-lg">{debt.name}</h4>
                        </div>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          {debt.interestRate}% APR
                        </span>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold text-slate-900 tracking-tight">${debt.balance.toLocaleString()}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase">Proj. {Math.ceil(debt.balance / (debt.minimumPayment + (index === 0 ? extraPayment : 0)))} months remaining</p>
                        </div>
                        <button 
                          onClick={() => setDebts(prev => prev.filter(d => d.id !== debt.id))}
                          className="p-2.5 text-slate-300 hover:text-rose-500 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Interest Saved</p>
                    <p className="text-3xl font-bold text-emerald-600 tracking-tight">${Math.round(interestAvoided).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Freedom Date</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{payoffDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Estimated Lifetime Cost</p>
                    <p className="text-3xl font-bold text-slate-400 tracking-tight">${Math.round(fullPayoffData[fullPayoffData.length-1]?.totalInterest || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MonthlyLog data={fullPayoffData} />
        )}
      </main>
    </div>
  );
};

export default App;
