import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet } from 'lucide-react';

const data = [
  { name: '科技 (Technology)', value: 45, color: '#3b82f6' },
  { name: '医疗 (Healthcare)', value: 20, color: '#10b981' },
  { name: '金融 (Finance)', value: 15, color: '#f59e0b' },
  { name: '能源 (Energy)', value: 10, color: '#6366f1' },
  { name: '现金 (Cash)', value: 10, color: '#94a3b8' },
];

const holdings = [
  { symbol: 'AAPL', name: '苹果公司', shares: 150, avg: 145.00, price: 178.30, gain: '+22.9%' },
  { symbol: 'MSFT', name: '微软', shares: 80, avg: 280.50, price: 330.10, gain: '+17.6%' },
  { symbol: 'JPM', name: '摩根大通', shares: 200, avg: 135.00, price: 148.50, gain: '+10.0%' },
  { symbol: '600519', name: '贵州茅台', shares: 300, avg: 1800.00, price: 1650.50, gain: '-8.3%' },
];

const PortfolioAnalysis: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">持仓分析</h2>
        <p className="text-slate-500 mt-1">资产配置概览与个股盈亏追踪</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-blue-600" />
            资产配置
          </h3>
          <div className="h-64 relative flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center">
                 <span className="block text-2xl font-bold text-slate-800">¥245万</span>
                 <span className="text-xs text-slate-400">总资产</span>
               </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center text-slate-600">
                  <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: item.color}}></span>
                  {item.name}
                </div>
                <span className="font-medium text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Holdings Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-slate-800">核心持仓详情</h3>
             <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">今日 +1.2%</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="pb-3 pl-4 pt-3">标的 (Symbol)</th>
                  <th className="pb-3 pt-3">持仓数量</th>
                  <th className="pb-3 pt-3">持仓均价</th>
                  <th className="pb-3 pt-3">现价</th>
                  <th className="pb-3 pr-4 pt-3 text-right">累计盈亏</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {holdings.map((row) => (
                  <tr key={row.symbol} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{row.symbol}</span>
                        <span className="text-xs text-slate-400">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-600">{row.shares}</td>
                    <td className="py-4 text-slate-600">{row.avg.toFixed(2)}</td>
                    <td className="py-4 text-slate-600 font-medium">{row.price.toFixed(2)}</td>
                    <td className={`py-4 pr-4 text-right font-bold ${row.gain.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                      {row.gain}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalysis;