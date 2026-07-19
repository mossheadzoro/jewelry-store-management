"use client";

import React from "react";
import { Landmark, IndianRupee, CreditCard, Smartphone, Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#8B5CF6'];

export function FinanceOverview({ data }: any) {
  if (!data) return null;

  const collectionData = [
    { name: 'Cash', value: data.todayCollection.cash },
    { name: 'UPI', value: data.todayCollection.upi },
    { name: 'Card', value: data.todayCollection.card },
    { name: 'Wallet', value: data.todayCollection.wallet },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border h-full flex flex-col">
      <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2 mb-4">
        <Landmark className="w-4 h-4 text-gold" /> Finance & Collections
      </h3>

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-3 flex-1 pr-4 border-r border-onyx-border/50">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-platinum-muted flex items-center gap-1.5"><IndianRupee className="w-3 h-3 text-emerald-400" /> Cash</span>
              <span className="text-[12px] font-medium text-white">₹{data.todayCollection.cash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-platinum-muted flex items-center gap-1.5"><Smartphone className="w-3 h-3 text-indigo-400" /> UPI</span>
              <span className="text-[12px] font-medium text-white">₹{data.todayCollection.upi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-platinum-muted flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-amber-400" /> Card</span>
              <span className="text-[12px] font-medium text-white">₹{data.todayCollection.card.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-platinum-muted flex items-center gap-1.5"><Wallet className="w-3 h-3 text-purple-400" /> Wallet</span>
              <span className="text-[12px] font-medium text-white">₹{data.todayCollection.wallet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <div className="w-[100px] h-[100px] shrink-0 ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={collectionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {collectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '8px', fontSize: '11px', padding: '4px 8px' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
            <span className="text-[11px] text-rose-300 flex items-center gap-1 mb-1">
              <ArrowDownCircle className="w-3 h-3" /> Outstanding
            </span>
            <span className="text-[13px] font-bold text-rose-400">₹{data.outstandingPayments.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <span className="text-[11px] text-emerald-300 flex items-center gap-1 mb-1">
              <ArrowUpCircle className="w-3 h-3" /> Advances
            </span>
            <span className="text-[13px] font-bold text-emerald-400">₹{data.advanceCollected.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
