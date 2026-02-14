
import React, { useState, useEffect, useMemo } from 'react';
import { Strategy, Debt, PayoffStep, MotivationalMessage } from './types';
import { DebtForm } from './components/DebtForm';
import { VisualProgress } from './components/VisualProgress';
import { getEncouragement } from './services/geminiService';

const App: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [strategy, setStrategy] = useState<Strategy>(Strategy.SNOWBALL);
  const [extraPayment, setExtraPayment] = useState<number>(100);
  const [encouragement, setEncouragement] = useState<MotivationalMessage | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Add sample debt on initial load if empty
  useEffect(() => {
    if (debts.length === 0) {
      setDebts([
        { id: '1', name: 'Premium Credit Card', balance: 5000, interestRate: 22, minimumPayment: 150 },
        { id: '2', name: 'Car Loan', balance: 12000, interestRate: 6.5, minimumPayment: 320 }
      ]);
    }
  }, []);

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => {
      if (strategy === Strategy.SNOWBALL) return a.balance - b.balance;
      return b.interestRate - a.interestRate;
    });
  }, [debts, strategy]);

  const payoffData = useMemo(() => {
    if (debts.length === 0) return [];
    
    let currentDebts = debts.map(d => ({ ...d }));
    let steps: PayoffStep[] = [];
    let month = 0;
    let totalPaid = 0;
    let totalInterest = 0;
    const maxMonths = 360; // 30 years safety cap

    while (currentDebts.some(d => d.balance > 0) && month < maxMonths) {
      month++;
      let monthlyTotalBalance = currentDebts.reduce((sum, d) => sum + d.balance, 0);
      let monthlyInterest = 0;
      
      // Calculate dates
      const date = new Date();
      date.setMonth(date.getMonth() + month);
      // Fix: '2y' is not a valid year format for toLocaleDateString, changing to '2-digit'
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      // Apply interest and collect minimum payments
      let availableExtra = extraPayment;
      
      currentDebts.forEach(d => {
        if (d.balance > 0) {
          const interest = (d.balance * (d.interestRate / 100)) / 12;
          d.balance += interest;
          monthlyInterest += interest;
          
          const pay = Math.min(d.balance, d.minimumPayment);
          d.balance -= pay;
          totalPaid += pay;
        }
      });

      // Apply extra payment to focus debt
      const focusDebt = currentDebts.sort((a, b) => {
        if (strategy === Strategy.SNOWBALL) return a.balance - b.balance;
        return b.interestRate - a.interestRate;
      }).find(d => d.balance > 0);

      if (focusDebt) {
        const payExtra = Math.min(focusDebt.balance, availableExtra);
        focusDebt.balance -= payExtra;
        totalPaid += payExtra;
      }

      totalInterest += monthlyInterest;
      let endOfMonthBalance = currentDebts.reduce((sum, d) => sum + d.balance, 0);
      
      steps.push({
        month,
        date: dateStr,
        remainingBalance: Math.max(0, endOfMonthBalance),
        totalPaid,
        totalInterest
      });

      if (endOfMonthBalance <= 0) break;
    }

    return steps.filter((_, i) => i % 3 === 0 || i === steps.length - 1); // Sample for chart
  }, [debts, strategy, extraPayment]);

  const fetchEncouragement = async () => {
    setLoadingAI(true);
    try {
      const msg = await getEncouragement(debts, 0); // Simplified total paid for now
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

  const totalCurrentDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const payoffDate = payoffData[payoffData.length - 1]?.date || 'N/A';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">DebtFree Summit</h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500">
            <span>Summit Goal: ${totalCurrentDebt.toLocaleString()}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Est. Arrival: {payoffDate}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Expedition Controls</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Strategy</label>
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button 
                    onClick={() => setStrategy(Strategy.SNOWBALL)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${strategy === Strategy.SNOWBALL ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Snowball
                  </button>
                  <button 
                    onClick={() => setStrategy(Strategy.AVALANCHE)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${strategy === Strategy.AVALANCHE ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Avalanche
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Power-up ($)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="2000" 
                  step="50" 
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-2 font-mono text-emerald-600 font-bold">
                  <span>$0</span>
                  <span>+${extraPayment} extra</span>
                </div>
              </div>
            </section>

            <DebtForm onAdd={handleAddDebt} />

            {/* Motivational Card */}
            <section className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-xl shadow-emerald-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Base Camp Briefing
                </h3>
                <button 
                  onClick={fetchEncouragement}
                  disabled={loadingAI}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              
              {encouragement ? (
                <div className="space-y-4 text-sm">
                  <p className="italic leading-relaxed">"{encouragement.pepTalk}"</p>
                  <div className="pt-4 border-t border-white/20">
                    <p className="font-bold mb-1 text-xs uppercase tracking-widest text-emerald-100">Next Peak</p>
                    <p>{encouragement.nextMilestone}</p>
                  </div>
                  <div className="pt-2">
                    <p className="font-bold mb-1 text-xs uppercase tracking-widest text-emerald-100">Pro Tip</p>
                    <p>{encouragement.financialTip}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm opacity-90 space-y-4">
                  <p>Tap the refresh icon for your personalized climb strategy and a pep talk from your AI coach.</p>
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/30 rounded-xl">
                    <span className="text-xs uppercase font-bold tracking-widest">Awaiting Radio Signal...</span>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Visuals & Lists */}
          <div className="lg:col-span-2 space-y-8">
            <VisualProgress data={payoffData} />

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                Your Current Obstacles
                <span className="text-sm font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{debts.length}</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedDebts.map((debt, index) => (
                  <div key={debt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:border-emerald-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-1">{index === 0 ? 'Current Target' : `Obstacle ${index + 1}`}</p>
                        <h4 className="font-bold text-slate-800">{debt.name}</h4>
                      </div>
                      <div className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-mono">
                        {debt.interestRate}% APR
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">${debt.balance.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">Min: ${debt.minimumPayment}/mo</p>
                      </div>
                      <button 
                        onClick={() => setDebts(prev => prev.filter(d => d.id !== debt.id))}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-1/4 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Strategy Comparison / Summary */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-slate-400 text-sm mb-1 uppercase tracking-widest font-bold">Total Climb</p>
                  <p className="text-3xl font-bold">${totalCurrentDebt.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1 uppercase tracking-widest font-bold">Estimated Peak</p>
                  <p className="text-3xl font-bold">{payoffDate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1 uppercase tracking-widest font-bold">Months to Freedom</p>
                  <p className="text-3xl font-bold">{payoffData[payoffData.length-1]?.month || '...'}</p>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-slate-400 text-sm max-w-md">
                  Based on your current climb rate, you will pay approximately <span className="text-white font-bold">${Math.round(payoffData[payoffData.length-1]?.totalInterest || 0).toLocaleString()}</span> in trail fees (interest) over the entire expedition.
                </p>
                <div className="flex gap-2">
                   <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-xs font-bold uppercase tracking-widest">
                    Summit Ready
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Hint */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-12 h-12 bg-white text-slate-900 rounded-full shadow-2xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default App;
