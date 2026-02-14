
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PayoffStep } from '../types';

interface VisualProgressProps {
  data: PayoffStep[];
}

export const VisualProgress: React.FC<VisualProgressProps> = ({ data }) => {
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Your Descent to Freedom</h3>
          <p className="text-sm text-slate-500">Watch the mountain shrink as you climb</p>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 12}} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={formatCurrency}
              tick={{fill: '#94a3b8', fontSize: 12}}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => [formatCurrency(value), "Remaining Balance"]}
            />
            <Area 
              type="monotone" 
              dataKey="remainingBalance" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorBalance)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
