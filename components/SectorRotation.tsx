import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateAnalysis } from '../services/geminiService';
import { Loader2, RefreshCw } from 'lucide-react';

const sectorData = [
  { name: '能源 (Energy)', performance: 12.5 },
  { name: '科技 (Tech)', performance: 8.2 },
  { name: '金融 (Fin)', performance: 5.1 },
  { name: '消费 (Cons)', performance: 2.4 },
  { name: '公用 (Util)', performance: -1.2 },
  { name: '地产 (REIT)', performance: -3.5 },
];

const SectorRotation: React.FC = () => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAI = async () => {
      const text = await generateAnalysis("科技与能源板块", "sector");
      setAnalysis(text);
      setLoading(false);
    };
    fetchAI();
  }, []);

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-2xl font-bold text-slate-800">行业轮动预测</h2>
        <p className="text-slate-500 mt-1">识别市场周期中的领涨与滞涨板块，优化资金配置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">本月板块表现排行</h3>
            <div className="text-xs text-slate-400">数据来源: 实时行情</div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px'}} />
                <Bar dataKey="performance" radius={[0, 4, 4, 0]} barSize={24}>
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.performance > 0 ? '#ef4444' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
           <h3 className="text-lg font-bold text-slate-800 mb-6">美林时钟周期分析</h3>
           
           <div className="relative pl-8 border-l-2 border-slate-200 space-y-8 mb-8">
             <div className="relative">
               <span className="absolute -left-[39px] top-1 w-5 h-5 bg-red-500 rounded-full border-4 border-white shadow-sm"></span>
               <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">领涨阶段 (Leading)</h4>
               <p className="text-sm text-slate-500 mt-1">能源, 科技半导体</p>
             </div>
             <div className="relative">
               <span className="absolute -left-[39px] top-1 w-5 h-5 bg-yellow-500 rounded-full border-4 border-white shadow-sm"></span>
               <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">转弱阶段 (Weakening)</h4>
               <p className="text-sm text-slate-500 mt-1">大金融, 银行</p>
             </div>
             <div className="relative">
               <span className="absolute -left-[39px] top-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-sm"></span>
               <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">滞涨阶段 (Lagging)</h4>
               <p className="text-sm text-slate-500 mt-1">公用事业, 房地产</p>
             </div>
           </div>

           <div className="mt-auto bg-indigo-50 rounded-xl p-5 border border-indigo-100">
             <div className="flex items-center justify-between mb-2">
               <h4 className="text-sm font-bold text-indigo-900">DeepSeek 趋势研判</h4>
               {loading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
             </div>
             {loading ? (
               <p className="text-xs text-indigo-400">正在调用 DeepSeek API 分析...</p>
             ) : (
               <p className="text-sm text-indigo-800 leading-relaxed text-justify">
                 {analysis}
               </p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SectorRotation;