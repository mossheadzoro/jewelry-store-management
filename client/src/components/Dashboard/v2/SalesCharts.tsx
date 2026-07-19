"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, ShoppingCart, TrendingUp } from "lucide-react";

const COLORS = ['#D4A843', '#10B981', '#6366F1', '#F43F5E', '#8B5CF6'];

export function SalesCharts({ chartData, productIntelligence }: any) {
  if (!chartData || chartData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Revenue Trend Area Chart */}
      <div className="lg:col-span-2 bg-onyx-surface p-5 rounded-2xl border border-onyx-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" /> Revenue Trend
          </h3>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="date" stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
              }} />
              <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/1000)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '12px' }}
                itemStyle={{ color: '#D4A843' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => {
                  const d = new Date(label);
                  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D4A843" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales by Category Donut Chart */}
      <div className="bg-onyx-surface p-5 rounded-2xl border border-onyx-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-gold" /> Sales by Category
          </h3>
        </div>
        <div className="h-[250px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={productIntelligence?.bestSellers}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="percentage"
                stroke="none"
              >
                {productIntelligence?.bestSellers.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                formatter={(value: number) => [`${value}%`, 'Contribution']}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#888' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
