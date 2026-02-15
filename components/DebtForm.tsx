
import React, { useState } from 'react';
import { Debt } from '../types';

interface DebtFormProps {
  onAdd: (debt: Omit<Debt, 'id'>) => void;
}

export const DebtForm: React.FC<DebtFormProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [rate, setRate] = useState('');
  const [minPay, setMinPay] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance || !rate || !minPay) return;

    onAdd({
      name,
      balance: parseFloat(balance),
      interestRate: parseFloat(rate),
      minimumPayment: parseFloat(minPay),
    });

    setName('');
    setBalance('');
    setRate('');
    setMinPay('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </span>
        Add New Debt
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Debt Name</label>
          <input
            type="text"
            placeholder="e.g. Visa Credit Card"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 font-medium"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Balance ($)</label>
          <input
            type="number"
            placeholder="0.00"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 font-medium"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Interest Rate (%)</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 18.99"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 font-medium"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Min. Payment ($)</label>
          <input
            type="number"
            placeholder="0.00"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 font-medium"
            value={minPay}
            onChange={(e) => setMinPay(e.target.value)}
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 w-full bg-slate-800 text-white font-bold text-xs uppercase tracking-[0.1em] py-3 rounded-xl hover:bg-slate-900 transition-all shadow-md"
      >
        Record Debt
      </button>
    </form>
  );
};
