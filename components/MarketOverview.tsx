import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Info,
  Loader2,
  TrendingUp,
  TrendingDown,
  GripHorizontal,
} from 'lucide-react';
import { generateAnalysis } from '../services/geminiService';

// ================== Types ==================

interface SentimentIndex {
  name: string;
  price: number;
  change: number;
}

interface SentimentStats {
  up: number;
  down: number;
  limit_up: number;
  limit_down: number;
  market_volume?: number; // 亿元
}

interface SentimentData {
  updated_at: string;
  score: number;
  level: string;
  stats: SentimentStats;
  indices?: SentimentIndex[];
}

interface MarketReport {
  title: string;
  time: string;
  content: string;
  indices?: {
    shanghai?: {
      price: number | string;
      change: number;
    };
    chinext?: {
      price: number | string;
      change: number;
    };
  };
}

interface SectorVolumeItem {
  name: string;
  volume: number;
}

// ================== Mock fallback data ==================

const fallbackIndices: SentimentIndex[] = [
  { name: '上证指数', price: 3200, change: -0.3 },
  { name: '深证成指', price: 10500, change: 0.4 },
  { name: '创业板指', price: 2100, change: 0.8 },
  { name: '科创50', price: 870, change: -1.1 },
];

const fallbackSentiment: SentimentData = {
  updated_at: '',
  score: 50,
  level: '中性',
  stats: {
    up: 1600,
    down: 1900,
    limit_up: 35,
    limit_down: 15,
    market_volume: 950,
  },
  indices: fallbackIndices,
};

const mockMarketData = [
  { time: '9:30', value: 3200 },
  { time: '10:30', value: 3230 },
  { time: '11:30', value: 3210 },
  { time: '13:00', value: 3250 },
  { time: '14:00', value: 3290 },
  { time: '15:00', value: 3310 },
];

const mockSectorVolume: SectorVolumeItem[] = [
  { name: 'AI算力', volume: 100 },
  { name: '工业母机', volume: 90 },
  { name: '机器人', volume: 80 },
  { name: '券商', volume: 75 },
  { name: '新能源车', volume: 70 },
];

// ================== Helpers ==================

function getSentimentColor(score: number): string {
  if (score >= 70) return '#ef4444'; // 高风险偏热
  if (score >= 40) return '#22c55e'; // 偏多/健康
  return '#3b82f6'; // 偏防守/低温
}

const MarketOverview: React.FC = () => {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [reports, setReports] = useState<MarketReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [aiComment, setAiComment] = useState<string>('');
  const [generatingComment, setGeneratingComment] = useState(false);

  // ========== 数据拉取 ==========
  const fetchSentiment = async () => {
    try {
      const res = await fetch('/data/market_sentiment.json', { cache: 'no-store' });
      if (!res.ok) {
        console.warn('failed to fetch sentiment, use fallback');
        setSentiment(fallbackSentiment);
        return;
      }
      const data = (await res.json()) as SentimentData;
      setSentiment({
        ...fallbackSentiment,
        ...data,
        stats: {
          ...fallbackSentiment.stats,
          ...(data.stats || {}),
        },
        indices: data.indices && data.indices.length > 0 ? data.indices : fallbackSentiment.indices,
      });
    } catch (e) {
      console.error('fetchSentiment error', e);
      setSentiment(fallbackSentiment);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/data/market_reports.json', { cache: 'no-store' });
      if (!res.ok) {
        console.warn('failed to fetch reports');
        setReports([]);
        return;
      }
      const data = (await res.json()) as MarketReport[];
      setReports(data);
    } catch (e) {
      console.error('fetchReports error', e);
      setReports([]);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
    fetchReports();
  }, []);

  // ========== AI 点评 ==========
  const handleGenerateComment = async () => {
    if (!sentiment) return;
    setGeneratingComment(true);
    try {
      const ctx = `A股情绪得分: ${sentiment.score} (${sentiment.level})。上涨家数: ${sentiment.stats.up}，下跌家数: ${sentiment.stats.down}，涨停: ${sentiment.stats.limit_up}，跌停: ${sentiment.stats.limit_down}，成交额: ${sentiment.stats.market_volume ?? '-'} 亿元。`;
      const result = await generateAnalysis(ctx, 'sentiment');
      setAiComment(result);
    } catch (e) {
      console.error('generate sentiment comment failed', e);
      setAiComment('AI 点评暂时不可用，请稍后重试。');
    } finally {
      setGeneratingComment(false);
    }
  };

  const indicesToShow = sentiment?.indices && sentiment.indices.length > 0 ? sentiment.indices : fallbackIndices;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部指数卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {indicesToShow.map((idx, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{idx.name}</p>
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                {idx.change >= 0 ? (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-red-500 mr-0.5" />
                    <span className="text-red-500">领涨</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-3 h-3 text-emerald-500 mr-0.5" />
                    <span className="text-emerald-500">承压</span>
                  </>
                )}
              </span>
            </div>

            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-800">
                {idx.price.toFixed ? idx.price.toFixed(2) : idx.price}
              </span>
              <span
                className={`text-sm font-medium ${
                  idx.change >= 0 ? 'text-red-500' : 'text-emerald-500'
                }`}
              >
                {idx.change >= 0 ? '+' : ''}
                {idx.change.toFixed(2)}%
              </span>
            </div>

            <div className="mt-2 flex items-center space-x-2 text-xs text-slate-500">
              {idx.change >= 0 ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  多头占优
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  空头占优
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 情绪总览卡片 */}
      <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-1 relative">
        {/* 背景装饰 */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute right-0 top-0 opacity-10">
            <Activity className="w-48 h-48 text-blue-600" />
          </div>
        </div>

        {/* 主体内容 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* 左侧：得分仪表盘 */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center border-b border-blue-100/40 lg:border-b-0 lg:border-r lg:pr-6">
            <div className="text-xs font-semibold text-blue-500 mb-1 tracking-wider">A股情绪计算器</div>
            <div className="relative w-32 h-32 flex items-center justify-center mb-3">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-slate-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  strokeWidth="8"
                  stroke={getSentimentColor(sentiment?.score ?? fallbackSentiment.score)}
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - (sentiment?.score ?? fallbackSentiment.score) / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 mb-0.5">情绪得分</span>
                <span className="text-2xl font-extrabold text-slate-800">
                  {sentiment?.score ?? fallbackSentiment.score}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {sentiment?.level ?? fallbackSentiment.level}
                </span>
              </div>
            </div>
            <button
              onClick={handleGenerateComment}
              disabled={generatingComment}
              className="mt-1 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generatingComment ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  生成 AI 点评...
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 mr-1" />
                  一键生成 AI 点评
                </>
              )}
            </button>
            <p className="mt-2 text-[11px] text-slate-400 text-center">
              综合指数表现、涨跌家数、涨停/跌停、成交额等多维度因子。
            </p>
          </div>

          {/* 中间：情绪明细 + AI 点评 */}
          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                <p className="text-[11px] text-slate-500 mb-1">上涨家数</p>
                <p className="text-lg font-semibold text-red-500">
                  {sentiment?.stats.up ?? fallbackSentiment.stats.up}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                <p className="text-[11px] text-slate-500 mb-1">下跌家数</p>
                <p className="text-lg font-semibold text-emerald-500">
                  {sentiment?.stats.down ?? fallbackSentiment.stats.down}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                <p className="text-[11px] text-slate-500 mb-1">涨停</p>
                <p className="text-lg font-semibold text-red-500">
                  {sentiment?.stats.limit_up ?? fallbackSentiment.stats.limit_up}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                <p className="text-[11px] text-slate-500 mb-1">跌停</p>
                <p className="text-lg font-semibold text-slate-700">
                  {sentiment?.stats.limit_down ?? fallbackSentiment.stats.limit_down}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 min-h-[90px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800">
                    <Activity className="w-3 h-3 text-emerald-400" />
                  </span>
                  <p className="text-xs font-semibold text-slate-200 tracking-wide">
                    DeepSeek 实时 AI 情绪点评
                  </p>
                </div>
                {sentiment?.stats.market_volume && (
                  <p className="text-[11px] text-slate-400">
                    今日成交额{' '}
                    <span className="text-emerald-400 font-semibold">
                      {sentiment.stats.market_volume.toFixed(0)} 亿元
                    </span>
                  </p>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                {aiComment ||
                  '基于当日涨跌结构、涨停/跌停分布、成交额以及指数走势，DeepSeek 将为你生成一段面向投资者的盘中解读。点击上方按钮开始分析。'}
              </p>
            </div>
          </div>

          {/* 右侧：简易仓位/风险提示 */}
          <div className="lg:col-span-3 space-y-3">
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-slate-500">资金温度计</p>
                <span className="text-[11px] text-slate-400">情绪 & 成交额</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${sentiment?.score ?? fallbackSentiment.score}%`,
                      backgroundColor: getSentimentColor(sentiment?.score ?? fallbackSentiment.score),
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-10 text-right">
                  {sentiment?.score ?? fallbackSentiment.score}%
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                分数越高越偏热，越容易出现筹码分化与波动放大。
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-[11px] font-semibold text-blue-700 mb-1">仓位建议仅作参考</p>
              <p className="text-[11px] text-blue-600 leading-relaxed">
                情绪高位时，更适合调仓换股、做结构；情绪冰点时，更适合分批吸纳优质资产。
                结合你的风险偏好与持仓周期，再决定实际操作。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部两块：大盘资金 & 行业热度 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 大盘资金流向趋势 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-c
