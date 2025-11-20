import React, { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
  market_volume?: number;
}

interface SentimentData {
  updated_at: string;
  score: number;
  level: string;
  stats: SentimentStats;
  indices?: SentimentIndex[];
}

const fallbackSentiment: SentimentData = {
  updated_at: '',
  score: 50,
  level: '中性',
  stats: {
    up: 0,
    down: 0,
    limit_up: 0,
    limit_down: 0,
    market_volume: 0,
  },
  indices: [
    { name: '上证指数', price: 0, change: 0 },
    { name: '深证成指', price: 0, change: 0 },
    { name: '创业板指', price: 0, change: 0 },
  ],
};

const MarketOverview: React.FC = () => {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch('/data/market_sentiment.json', { cache: 'no-store' });
        if (!res.ok) {
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
          indices:
            data.indices && data.indices.length > 0
              ? data.indices
              : fallbackSentiment.indices,
        });
      } catch (e) {
        console.error('fetchSentiment error', e);
        setSentiment(fallbackSentiment);
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
  }, []);

  const s = sentiment || fallbackSentiment;
  const indicesToShow = s.indices || fallbackSentiment.indices;

  const sentimentColor =
    s.score >= 70 ? 'text-red-500' : s.score >= 40 ? 'text-emerald-500' : 'text-blue-500';

  return (
    <div className="space-y-4">
      {/* 情绪总览卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">A股市场情绪</div>
            <div className="text-xs text-slate-500">
              上次更新：{s.updated_at || '—'}（基于涨跌家数、涨跌停与成交额的综合指标）
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={`text-2xl font-bold ${sentimentColor}`}>{s.score}</div>
            <div className="text-xs text-slate-500">情绪得分（0-100）</div>
          </div>
          <div className="w-28">
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-red-500"
                style={{ width: `${Math.min(Math.max(s.score, 0), 100)}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-500 text-right">{s.level}</div>
          </div>
        </div>
      </div>

      {/* 涨跌结构 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
          <div className="text-[11px] text-slate-500 mb-1">上涨家数</div>
          <div className="text-lg font-semibold text-red-500">{s.stats.up}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
          <div className="text-[11px] text-slate-500 mb-1">下跌家数</div>
          <div className="text-lg font-semibold text-emerald-500">{s.stats.down}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
          <div className="text-[11px] text-slate-500 mb-1">涨停</div>
          <div className="text-lg font-semibold text-red-500">{s.stats.limit_up}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
          <div className="text-[11px] text-slate-500 mb-1">跌停</div>
          <div className="text-lg font-semibold text-slate-700">{s.stats.limit_down}</div>
        </div>
      </div>

      {/* 指数列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-slate-800">核心指数表现</div>
          <div className="text-[11px] text-slate-400">
            数据来自 /data/market_sentiment.json 中的 indices
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {indicesToShow.map((idx) => (
            <div
              key={idx.name}
              className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 flex flex-col gap-1"
            >
              <div className="text-[11px] text-slate-500">{idx.name}</div>
              <div className="flex items-baseline gap-1">
                <div className="text-base font-semibold text-slate-800">
                  {idx.price.toFixed ? idx.price.toFixed(2) : idx.price}
                </div>
                <div
                  className={`text-xs font-medium flex items-center ${
                    idx.change >= 0 ? 'text-red-500' : 'text-emerald-500'
                  }`}
                >
                  {idx.change >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  {idx.change >= 0 ? '+' : ''}
                  {idx.change.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-xs text-slate-400">
          数据加载中（如果长时间无变化，检查后端是否按预期写入
          <code className="px-1 bg-slate-100 rounded">/app/data/market_sentiment.json</code>）。
        </div>
      )}
    </div>
  );
};

export default MarketOverview;
