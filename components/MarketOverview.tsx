
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { ArrowUpRight, ArrowDownRight, GripHorizontal, MoreHorizontal, Layers, Sun, Moon, Clock, BookOpen, Activity, RefreshCw, Zap, Info, MessageSquarePlus, Loader2 } from 'lucide-react';
import { generateAnalysis } from '../services/geminiService';

// Mock data for fallback chart
const marketData = [
  { name: '9:30', value: 3200 },
  { name: '10:30', value: 3250 },
  { name: '11:30', value: 3240 },
  { name: '13:00', value: 3260 },
  { name: '14:00', value: 3280 },
  { name: '15:00', value: 3310 },
];

const sectorVolume = [
  { name: '半导体', volume: 4500 },
  { name: '新能源', volume: 3800 },
  { name: '医药', volume: 2500 },
  { name: '消费', volume: 2100 },
  { name: '地产', volume: 1200 },
];

// Interfaces
interface MarketReport {
    title: string;
    time: string;
    content: string;
    indices?: {
        shanghai: { price: string | number; change: number };
        chinext: { price: string | number; change: number };
    };
}

interface ReportsData {
    date: string;
    early?: MarketReport;
    midday?: MarketReport;
    close?: MarketReport;
}

interface SentimentData {
    updated_at: string;
    score: number;
    level: string;
    stats: {
        up: number;
        down: number;
        flat: number;
        limit_up: number;
        limit_down: number;
    };
    market_volume?: number;
}

const MarketOverview: React.FC = () => {
  // Reports State
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [selectedReport, setSelectedReport] = useState<string>('midday');

  // Sentiment State
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  
  // AI Comment State (Frontend Generated)
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [generatingComment, setGeneratingComment] = useState(false);

  // Fetch Reports
  const fetchReports = async () => {
      try {
          const res = await fetch('/data/market_reports.json');
          if(res.ok) {
              const data = await res.json();
              setReports(data);
              
              // Auto select latest available
              if (data.close) setSelectedReport('close');
              else if (data.midday) setSelectedReport('midday');
              else if (data.early) setSelectedReport('early');
          }
      } catch (e) {
          console.error("Failed to load reports", e);
      }
  };

  // Fetch Real-time Sentiment (Numbers Only)
  const fetchSentiment = async (forceUpdate = false) => {
      setLoadingSentiment(true);
      try {
          // Add timestamp to prevent caching when forcing update
          const url = forceUpdate ? `/data/market_sentiment.json?t=${Date.now()}` : '/data/market_sentiment.json';
          const res = await fetch(url);
          if (res.ok) {
              const data = await res.json();
              setSentiment(data);
          }
      } catch (e) {
          console.error("Failed to load sentiment", e);
      } finally {
          setTimeout(() => setLoadingSentiment(false), 500);
      }
  };

  // Generate AI Comment On Demand
  const handleGenerateComment = async () => {
      if (!sentiment) return;
      setGeneratingComment(true);
      try {
          const context = `上涨: ${sentiment.stats.up}家, 下跌: ${sentiment.stats.down}家, 涨停: ${sentiment.stats.limit_up}家, 跌停: ${sentiment.stats.limit_down}家, 情绪分: ${sentiment.score}, 市场成交额: ${sentiment.market_volume || '-'}亿`;
          const comment = await generateAnalysis(context, 'sentiment');
          setAiComment(comment);
      } catch (e) {
          console.error("Failed to generate comment", e);
      } finally {
          setGeneratingComment(false);
      }
  };

  useEffect(() => {
      fetchReports();
      fetchSentiment();
      const interval = setInterval(() => {
          fetchSentiment(); 
      }, 120000);
      return () => clearInterval(interval);
  }, []);

  // Helper to render report card
  const ReportCard = ({ type, title, icon: Icon, colorClass }: any) => {
      const report = reports?.[type as keyof ReportsData] as MarketReport | undefined;
      const isActive = selectedReport === type;
      
      return (
          <button 
            onClick={() => report && setSelectedReport(type)}
            disabled={!report}
            className={`flex flex-col p-4 rounded-xl border transition-all text-left relative overflow-hidden w-full ${
                isActive 
                ? `bg-white border-${colorClass}-500 shadow-md ring-1 ring-${colorClass}-200`
                : report 
                    ? 'bg-white border-slate-100 hover:bg-slate-50' 
                    : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
            }`}
          >
              <div className="flex items-center justify-between mb-2 w-full z-10">
                  <div className={`p-2 rounded-lg bg-${colorClass}-50 text-${colorClass}-600`}>
                      <Icon className="w-5 h-5" />
                  </div>
                  {report && <span className="text-xs font-medium text-slate-400">{report.time}</span>}
              </div>
              <h4 className="text-sm font-bold text-slate-700 z-10">{title}</h4>
              {report ? (
                 <p className="text-xs text-slate-500 mt-1 line-clamp-2 z-10">{report.content}</p>
              ) : (
                 <p className="text-xs text-slate-400 mt-1 z-10">等待更新...</p>
              )}
              
              {isActive && (
                  <div className={`absolute bottom-0 left-0 h-1 bg-${colorClass}-500 w-full`}></div>
              )}
          </button>
      );
  };

  // Gauge Color Logic
  const getScoreColor = (score: number) => {
      if (score >= 60) return '#ef4444'; // Red (Optimistic/Hot)
      if (score <= 40) return '#22c55e'; // Green (Pessimistic/Cold) - In China Green is down/cold
      return '#3b82f6'; // Blue (Neutral)
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Top Indices Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {sentiment && sentiment.indices && sentiment.indices.length > 0 ? (
             sentiment.indices.map((idx: any, index: number) => (
                <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{idx.name}</p>
                    <MoreHorizontal className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-3">
                    <span className={`text-2xl font-bold ${idx.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {idx.price}
                    </span>
                    </div>
                    <div className={`flex items-center mt-1 text-sm font-medium ${idx.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {idx.change >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                        <span>{idx.change}%</span>
                    </div>
                </div>
             ))
        ) : (
            // Skeleton Loading for Indices
            [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-slate-100 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                </div>
            ))
        )}
      </div>

      {/* 2. Sentiment Monitor (A股情绪计算器) */}
      <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-1 relative">
            {/* Background Decoration Wrapper - Clips only the decoration */}
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                <div className="absolute right-0 top-0 opacity-10">
                   <Activity className="w-48 h-48 text-blue-600" />
                </div>
            </div>
            
            {/* Main Card Content - Using Grid for better proportions */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                
                {/* Left: Score Dashboard (3 cols - 25%) */}
                <div className="lg:col-span-3 flex flex-col items-center justify-center border-r border-blue-100/50 lg:border-blue-100 lg:pr-6 relative">
                    <div className="flex items-center space-x-1.5 mb-1 w-full justify-center">
                         <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">A股情绪计算器</h4>
                         <div className="group relative">
                            <Info className="w-4 h-4 text-slate-400 cursor-help" />
                            {/* Tooltip fixed to avoid clipping */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50 shadow-xl">
                                <p className="font-bold mb-2 text-slate-200">多因子情绪模型 (0-100):</p>
                                <ul className="list-disc pl-3 space-y-1.5 text-slate-300">
                                    <li><span className="text-red-300">指数趋势 (40%)</span>: 基于大盘指数涨跌幅</li>
                                    <li><span className="text-amber-300">量能配合 (30%)</span>: 基于成交量环比变化</li>
                                    <li><span className="text-blue-300">赚钱效应 (30%)</span>: 基于全市场上涨家数占比</li>
                                </ul>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800"></div>
                            </div>
                         </div>
                    </div>

                    <div className="relative w-40 h-20 mt-2">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[{ value: sentiment?.score || 50 }, { value: 100 - (sentiment?.score || 50) }]}
                                    cx="50%"
                                    cy="100%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius="75%"
                                    outerRadius="100%"
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill={getScoreColor(sentiment?.score || 50)} />
                                    <Cell fill="#e2e8f0" />
                                </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         {/* Center Text */}
                         <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end">
                            <span className="text-3xl font-black" style={{ color: getScoreColor(sentiment?.score || 50) }}>
                                {sentiment ? sentiment.score : '--'}
                            </span>
                         </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600 mt-2 bg-white/50 px-3 py-1 rounded-full">
                        {sentiment ? sentiment.level : '检测中...'}
                    </p>
                </div>

                {/* Middle: Stats Bar (3 cols - 25%) */}
                <div className="lg:col-span-3 flex flex-col justify-center space-y-5 pt-2">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-600">上涨家数</span>
                            <span className="text-red-500 font-bold">{sentiment?.stats.up || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-600">下跌家数</span>
                            <span className="text-green-500 font-bold">{sentiment?.stats.down || '-'}</span>
                        </div>
                    </div>
                    
                    <div className="h-3 w-full bg-green-100 rounded-full overflow-hidden flex shadow-inner">
                        <div 
                            className="h-full bg-red-500 transition-all duration-1000" 
                            style={{width: `${sentiment ? (sentiment.stats.up / (sentiment.stats.up + sentiment.stats.down)) * 100 : 50}%`}}
                        ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                         <span className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>涨停: {sentiment?.stats.limit_up || 0}</span>
                         <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>跌停: {sentiment?.stats.limit_down || 0}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-200/50">
                         <div className="flex items-center space-x-2">
                            <span>更新于: {sentiment?.updated_at || '--:--'}</span>
                            <button 
                                onClick={() => fetchSentiment(true)} 
                                disabled={loadingSentiment}
                                className={`p-1 rounded hover:bg-blue-50 text-blue-500 transition-colors ${loadingSentiment ? 'animate-spin' : ''}`}
                                title="立即刷新"
                            >
                                <RefreshCw className="w-3 h-3" />
                            </button>
                         </div>
                         <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">2min/次</span>
                    </div>
                </div>

                {/* Right: AI Comment (6 cols - 50%) */}
                <div className="lg:col-span-6 pt-1 flex flex-col h-full min-h-[160px] border-l border-transparent lg:border-slate-100 lg:pl-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center">
                            <Zap className="w-4 h-4 text-amber-500 mr-1.5" />
                            AI 智能点评
                        </h4>
                    </div>
                    
                    <div className="flex-1 bg-white/80 rounded-lg p-4 border border-blue-100/50 shadow-sm relative group flex flex-col">
                        {generatingComment ? (
                            <div className="flex flex-col items-center justify-center h-full py-4">
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                                <span className="text-xs text-slate-500">DeepSeek 正在分析实时盘面...</span>
                            </div>
                        ) : aiComment ? (
                            <div className="relative h-full flex flex-col">
                                <div className="flex-1 overflow-y-auto scrollbar-thin max-h-[120px]">
                                    <p className="text-sm text-slate-700 leading-relaxed text-justify animate-fade-in pr-1">
                                        {aiComment}
                                    </p>
                                </div>
                                <button 
                                    onClick={handleGenerateComment}
                                    className="absolute bottom-0 right-0 bg-white/90 p-1.5 rounded-lg shadow-sm hover:text-blue-600 text-slate-400 transition-colors border border-slate-100"
                                    title="重新生成"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-2 text-center">
                                <p className="text-xs text-slate-400 mb-3">点击下方按钮，调用 DeepSeek 分析当前情绪数据</p>
                                <button 
                                    onClick={handleGenerateComment}
                                    disabled={!sentiment}
                                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <MessageSquarePlus className="w-4 h-4" />
                                    <span className="text-sm font-medium">生成实时点评</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

      {/* 3. Daily Reports Section */}
      <div className="bg-slate-100/50 p-5 rounded-2xl border border-slate-200/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-slate-600" />
                <h3 className="font-bold text-slate-700">每日复盘</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                    {reports?.date || '今日更新'}
                </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Cards Column */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-3 lg:col-span-1">
                  <ReportCard type="early" title="早间前瞻 (08:30)" icon={Sun} colorClass="orange" />
                  <ReportCard type="midday" title="午间复盘 (11:30)" icon={Clock} colorClass="blue" />
                  <ReportCard type="close" title="收盘总结 (16:00)" icon={Moon} colorClass="indigo" />
              </div>
              
              {/* Content View */}
              <div className="lg:col-span-3 md:col-span-3 bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative min-h-[240px] flex flex-col">
                  {reports && reports[selectedReport as keyof ReportsData] ? (
                      <div className="animate-fade-in flex flex-col h-full">
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                              <h4 className="text-lg font-bold text-slate-800 flex items-center">
                                  {(reports[selectedReport as keyof ReportsData] as MarketReport).title}
                                  <span className="ml-3 text-xs font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                      DeepSeek-V3 生成
                                  </span>
                              </h4>
                              <div className="flex items-center space-x-2 text-slate-400 text-sm">
                                  <Clock className="w-4 h-4" />
                                  <span>{(reports[selectedReport as keyof ReportsData] as MarketReport).time}</span>
                              </div>
                          </div>
                          <div className="prose prose-slate prose-sm max-w-none flex-1">
                              <p className="leading-7 text-slate-600 text-justify">
                                  {(reports[selectedReport as keyof ReportsData] as MarketReport).content}
                              </p>
                          </div>
                          
                          {/* Quote Snapshot inside report */}
                          <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                             <p className="text-xs font-bold text-slate-500 uppercase shrink-0">生成时段指数快照</p>
                             <div className="flex space-x-8">
                                 <div className="flex items-baseline space-x-2">
                                     <span className="text-xs text-slate-400">上证指数</span>
                                     <span className={`font-mono font-bold ${(reports[selectedReport as keyof ReportsData] as any).indices?.shanghai?.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {(reports[selectedReport as keyof ReportsData] as any).indices?.shanghai?.price || '--'}
                                     </span>
                                 </div>
                                 <div className="flex items-baseline space-x-2">
                                     <span className="text-xs text-slate-400">创业板指</span>
                                     <span className={`font-mono font-bold ${(reports[selectedReport as keyof ReportsData] as any).indices?.chinext?.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                         {(reports[selectedReport as keyof ReportsData] as any).indices?.chinext?.price || '--'}
                                     </span>
                                 </div>
                             </div>
                          </div>
                      </div>
                  ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col">
                          <Layers className="w-12 h-12 mb-3 opacity-20" />
                          <p className="font-medium">暂无报告数据</p>
                          <p className="text-xs mt-1 opacity-70">请确保后端 Docker 服务正在运行</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* 4. Charts Grid (Main Trend + Hot Sectors) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Widget */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[350px]">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2 cursor-move">
              <GripHorizontal className="w-4 h-4 text-slate-300" />
              <h3 className="font-bold text-slate-700">大盘资金流向趋势</h3>
            </div>
            <div className="flex space-x-2">
               {['分时', '日K', '周K'].map(t => (
                 <button key={t} className="text-xs px-2 py-1 rounded hover:bg-white hover:shadow-sm text-slate-500 transition-all">{t}</button>
               ))}
            </div>
          </div>
          <div className="p-6 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marketData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                  formatter={(value: any) => [`${value}`, '指数点位']}
                  labelFormatter={(label) => `时间: ${label}`}
                />
                <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" activeDot={{r: 6, strokeWidth: 2, stroke: '#fff'}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hot Sectors Widget */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[350px]">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2 cursor-move">
              <GripHorizontal className="w-4 h-4 text-slate-300" />
              <h3 className="font-bold text-slate-700">行业热度排行</h3>
            </div>
          </div>
          <div className="p-6 flex-1">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorVolume} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} width={60} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px'}} />
                <Bar dataKey="volume" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
