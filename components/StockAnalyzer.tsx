import React, { useState } from 'react';
import { Search, Sparkles, TrendingUp, AlertCircle, Calendar, BarChart3 } from 'lucide-react';
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { generateAnalysis } from '../services/geminiService';

// Mock Data Generator for different stocks
const getMockStockData = (ticker: string, timeFrame: string) => {
  const base = ticker === 'AAPL' ? 170 : ticker === 'TSLA' ? 240 : 3000;
  const data = [];
  const points = timeFrame === '1Y' ? 50 : 30;
  
  for (let i = 0; i < points; i++) {
    const randomChange = Math.random() * 20 - 8;
    const price = base + randomChange + (i * 2); // Upward trend
    data.push({
      day: timeFrame === '1D' ? `${9+Math.floor(i/2)}:${i%2===0?'00':'30'}` : `T-${points-i}`,
      price: price,
      volume: Math.floor(Math.random() * 5000) + 1000,
      forecast: i > points - 6 ? price + Math.random() * 30 - 5 : null
    });
  }
  return data;
};

const StockAnalyzer: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [aiPrediction, setAiPrediction] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState('日K');

  const timeFrames = ['分时', '日K', '周K', '月K', '年K'];

  const handleAnalyze = async () => {
    if (!ticker) return;
    setAnalyzing(true);
    setAiPrediction(null);
    
    // Simulate fetching data
    const mockData = getMockStockData(ticker.toUpperCase(), '1M');
    setData(mockData);

    // Call AI (DeepSeek)
    const prediction = await generateAnalysis(ticker, 'stock');
    setAiPrediction(prediction);
    
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-2xl font-bold text-slate-800">个股分析预测</h2>
        <p className="text-slate-500 mt-1">融合技术指标与 DeepSeek 深度推理的趋势预测系统</p>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
         <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="输入股票代码 (如: 600519, NVDA)"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            />
         </div>
         <button 
           onClick={handleAnalyze}
           disabled={analyzing}
           className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 transition-all shadow-md shadow-blue-200"
         >
           {analyzing ? (
              <>
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>DeepSeek 思考中...</span>
              </>
           ) : (
             <>
               <BarChart3 className="w-5 h-5" />
               <span>开始分析</span>
             </>
           )}
         </button>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Chart Area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-baseline space-x-3">
                 <h3 className="text-xl font-bold text-slate-800">{ticker}</h3>
                 <span className="text-2xl font-bold text-red-500">{(data[data.length-1].price).toFixed(2)}</span>
                 <span className="text-sm font-medium text-red-500">+2.45%</span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {timeFrames.map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeFrame(tf)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      timeFrame === tf ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-96 p-4 relative">
               {/* Price Chart */}
               <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    labelStyle={{color: '#64748b', marginBottom: '5px'}}
                  />
                  
                  {/* Simulated Forecast Area */}
                  <ReferenceLine x="T-5" stroke="#94a3b8" strokeDasharray="3 3" label={{ value: "AI 预测区间", position: 'top', fill: '#64748b', fontSize: 12 }} />
                  
                  <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fill="url(#colorPrice)" name="股价" />
                  <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="AI预测" />
                  
                  {/* Volume Bar at bottom (Simulated by right Y-axis trick or separate chart, keeping simple here) */}
                  <Bar dataKey="volume" barSize={20} fill="#e2e8f0" yAxisId={1} name="成交量" />
                  <YAxis yAxisId={1} hide domain={[0, 'dataMax * 4']} /> {/* Push bars to bottom */}
                  
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analysis Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center pb-3 border-b border-slate-50">
              <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
              DeepSeek 智能诊断
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
               {aiPrediction ? (
                 <div className="prose prose-sm prose-slate">
                   <p className="text-slate-600 leading-7 text-justify whitespace-pre-line">
                     {aiPrediction}
                   </p>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm space-y-3">
                   <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                     <TrendingUp className="w-6 h-6 text-slate-300" />
                   </div>
                   <span>等待分析数据...</span>
                 </div>
               )}
            </div>
            
            {aiPrediction && (
              <div className="mt-6 space-y-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">支撑位</span>
                    <span className="font-mono font-medium text-slate-700">{(data[data.length-1].price * 0.95).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">阻力位</span>
                    <span className="font-mono font-medium text-slate-700">{(data[data.length-1].price * 1.05).toFixed(2)}</span>
                 </div>
                 <div className="pt-4 border-t border-slate-50">
                   <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-tight">
                      <strong>模型声明：</strong> 由 DeepSeek-V3 提供分析支持。投资有风险，入市需谨慎。
                    </p>
                  </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAnalyzer;