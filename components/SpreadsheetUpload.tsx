
import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Debt } from '../types';

interface SpreadsheetUploadProps {
  onImport: (debts: Omit<Debt, 'id'>[]) => void;
}

export const SpreadsheetUpload: React.FC<SpreadsheetUploadProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const importedDebts: Omit<Debt, 'id'>[] = [];
        const data = results.data as any[];

        try {
          data.forEach((row) => {
            const keys = Object.keys(row);
            
            // Utility to find a value by checking if any keyword exists in the column header
            const findValue = (keywords: string[]) => {
              const key = keys.find(k => 
                keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase()))
              );
              return key ? row[key] : undefined;
            };

            const rawName = findValue(['name', 'debt', 'description', 'label', 'account']);
            const rawBalance = findValue(['balance', 'amount', 'total', 'current', 'debt']);
            const rawRate = findValue(['rate', 'interest', 'apr', 'percent']);
            const rawMinPayment = findValue(['minimum', 'min', 'payment', 'monthly']);

            const name = String(rawName || "").trim();
            const balance = parseFloat(String(rawBalance || "").replace(/[^0-9.-]+/g, ""));
            const rate = parseFloat(String(rawRate || "").replace(/[^0-9.-]+/g, ""));
            const minPayment = parseFloat(String(rawMinPayment || "").replace(/[^0-9.-]+/g, ""));

            if (name && !isNaN(balance) && !isNaN(rate) && !isNaN(minPayment)) {
              importedDebts.push({
                name,
                balance,
                interestRate: rate,
                minimumPayment: minPayment
              });
            }
          });

          if (importedDebts.length > 0) {
            onImport(importedDebts);
            if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
            setError("Could not find required columns. Please ensure your CSV has headers for Name, Balance, Interest Rate, and Minimum Payment.");
          }
        } catch (err) {
          setError("Error parsing the file content. Please check your CSV format.");
        }
      },
      error: () => setError("Failed to read the file. Please try a different CSV.")
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        processFile(file);
      } else {
        setError("Please upload a valid CSV file.");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </span>
          Batch Import
        </h3>
        <button 
          onClick={() => {
            const csvContent = "Name,Balance,Interest Rate,Minimum Payment\nVisa Card,5000,18.99,150\nCar Loan,12000,4.5,350";
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', 'debt_template.csv');
            a.click();
          }}
          className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
        >
          Download Template
        </button>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${isDragging ? 'text-indigo-500' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-semibold text-slate-600">
            Drop your CSV spreadsheet here or <span className="text-indigo-600">browse</span>
          </p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Requires Name, Balance, and Interest columns
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-start gap-2 border border-rose-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};
