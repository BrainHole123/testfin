import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Activity,
  Zap,
  BarChart2,
  Hash,
  AlertTriangle,
  RefreshCw,
  X,
  Loader2,
} from 'lucide-react';
import { NewsArticle } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LabelList,
  Sector,
} from 'recharts';

type TabType = 'all' | 'macro' | 'industry';
type QuickFilterType = 'none' | 'high_impact' | 'top_sector';
type ScoreFilterType = 'high' | 'medium' | 'low' | null;

// 统一解析时间，失败就返回 0
const parseTime = (t?: string) => {
  if (!t) return 0;
  if (t === '刚刚') return 0;
  const d = new Date(t);
  const ts = d.getTime();
  if (Number.isNaN(ts)) return 0;
  return ts;
};

// 自定义环形图的 Active Shape
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
  } = props;
  return (
    <g>
      <text
        x={cx}
        y={cy}
        dy={-10}
        textAnchor="middle"
        fill="#334155"
        fontWeight={700}
        fontSize={18}
      >
        {payload.value}条
      </text>
      <text
        x={cx}
        y={cy}
        dy={15}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={12}
      >
        {String(payload.name).split(' ')[0]}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const NewsFeed: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('none');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilterType>(null);

  const [feedNews, setFeedNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchNewsData = async () => {
    try {
      const resp = await fetch('/data/news_data.json');
      if (!resp.ok) {
        throw new Error('data file not found');
      }
      const data = await resp.json();
      setFeedNews(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('使用演示数据 fallback：', e);
      setFeedNews([
        {
          id: 'mock-1',
          title: '（演示数据）后端服务未连接：请启动 Docker Backend',
          content:
            '当前显示的是静态演示数据。请确保 docker-compose up 已运行，且 Python 脚本已成功抓取并写入 news_data.json。',
          url: '#',
          source: '系统提示',
          publishTime: '刚刚',
          score: 99,
          industry: '系统通知',
          aiReason: '系统自检提示',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsData();
    const timer = setInterval(fetchNewsData, 30000);
    return () => clearInterval(timer);
  }, []);

  // 全局统计
  const globalStats = useMemo(() => {
    const total = feedNews.length;
    const highImpactCount = feedNews.filter((n) => (n.score || 0) >= 80).length;
    const avgScore =
      total > 0
        ? Math.round(
            feedNews.reduce((acc, cur) => acc + (cur.score || 0), 0) / total,
          )
        : 0;

    const stats: Record<string, number> = {};
    feedNews.forEach((n) => {
      if (!n.industry) return;
      if (n.industry.includes('宏观') || n.industry.includes('系统')) return;
      const main = n.industry.split('-')[0];
      stats[main] = (stats[main] || 0) + 1;
    });
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    const topIndustry = sorted.length > 0 ? sorted[0][0] : '暂无';

    return { total, highImpactCount, avgScore, topIndustry };
  }, [feedNews]);

  // 过滤后的新闻（带排序）
  const filteredNews = useMemo(() => {
    let list = feedNews;

    // 顶部卡片快速筛选
    if (quickFilter === 'high_impact') {
      list = list.filter((n) => (n.score || 0) >= 80);
    } else if (quickFilter === 'top_sector') {
      list = list.filter((n) =>
        (n.industry || '').includes(globalStats.topIndustry),
      );
    }

    // 饼图分数筛选
    if (scoreFilter === 'high') {
      list = list.filter((n) => (n.score || 0) >= 80);
    } else if (scoreFilter === 'medium') {
      list = list.filter(
        (n) => (n.score || 0) >= 50 && (n.score || 0) < 80,
      );
    } else if (scoreFilter === 'low') {
      list = list.filter((n) => (n.score || 0) < 50);
    }

    // Tab 分类（仅在没有别的筛选时生效）
    if (quickFilter === 'none' && scoreFilter === null) {
      if (activeTab === 'macro') {
        list = list.filter((n) => {
          const s = n.score || 0;
          const ind = n.industry || '';
          return (
            s > 50 &&
            (ind.includes('宏观') ||
              ind.includes('银行') ||
              ind.includes('非银'))
          );
        });
      } else if (activeTab === 'industry') {
        list = list.filter((n) => {
          const s = n.score || 0;
          const ind = n.industry || '';
          return s >= 50 && !ind.includes('宏观');
        });
      }
    }

    // 文本搜索
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((n) => {
        const t = n.title.toLowerCase();
        const c = (n.content || '').toLowerCase();
        const ind = (n.industry || '').toLowerCase();
        return t.includes(q) || c.includes(q) || ind.includes(q);
      });
    }

    // 排序：时间新 → 旧，同一时间分数高 → 低
    const sorted = [...list].sort((a, b) => {
      const tb = parseTime(b.publishTime);
      const ta = parseTime(a.publishTime);
      if (tb !== ta) return tb - ta;
      return (b.score || 0) - (a.score || 0);
    });

    return sorted;
  }, [feedNews, query, activeTab, quickFilter, scoreFilter, globalStats.topIndustry]);

  // 行业柱状图数据（基于过滤后列表）
  const industryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredNews.forEach((n) => {
      if (!n.industry) return;
      if (n.industry.includes('宏观') || n.industry.includes('系统')) return;
      const main = n.industry.split('-')[0];
      stats[main] = (stats[main] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [filteredNews]);

  // 分数分布（用全量）
  const scoreDistribution = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    feedNews.forEach((n) => {
      const s = n.score || 0;
      if (s >= 80) high += 1;
      else if (s >= 50) medium += 1;
      else low += 1;
    });
    const result = [
      { name: '重磅 (80+)', value: high, color: '#ef4444', type: 'high' },
      { name: '重要 (50-79)', value: medium, color: '#f59e0b', type: 'medium' },
      { name: '一般 (<50)', value: low, color: '#94a3b8', type: 'low' },
    ];
    return result.filter((i) => i.value > 0);
  }, [feedNews]);

  const handleCardClick = (type: QuickFilterType) => {
    setScoreFilter(null);
    if (quickFilter === type) {
      setQuickFilter('none');
    } else {
      setQuickFilter(type);
      if (type !== 'none') {
        setActiveTab('all');
      }
    }
  };

  const handleIndustryClick = (data: any) => {
    if (data && data.name) {
      setQuery(String(data.name));
    }
  };

  const handlePieClick = (data: any) => {
    const t = data.type as ScoreFilterType;
    setQuickFilter('none');
    if (scoreFilter === t) {
      setScoreFilter(null);
    } else {
      setScoreFilter(t);
      setActiveTab('all');
    }
  };

  const activePieIndex = useMemo(() => {
    if (!scoreFilter) return -1;
    return scoreDistribution.findIndex((d) => d.type === scoreFilter);
  }, [scoreFilter, scoreDistribution]);

  return (
    <div className="flex flex-col space-y-6 animate-fade-in">
      {/* 标题 */}
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-slate-800">实时新闻收集</h2>
      </div>

      {/* 指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 全部 */}
        <button
          onClick={() => handleCardClick('none')}
          className={`p-4 rounded-xl border shadow-sm flex items-center space-x-4 transition-all duration-200 text-left ${
            quickFilter === 'none' && query === '' && scoreFilter === null
              ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100'
              : 'bg-white border-slate-100 hover:bg-slate-50 hover:shadow-md'
          }`}
        >
          <div
            className={`p-3 rounded-lg ${
              quickFilter === 'none' ? 'bg-blue-100' : 'bg-blue-50'
            }`}
          >
            <Hash
              className={`w-6 h-6 ${
                quickFilter === 'none' ? 'text-blue-700' : 'text-blue-600'
              }`}
            />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">
              资讯总数
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {globalStats.total}
            </p>
          </div>
          {quickFilter !== 'none' && (
            <RefreshCw className="w-4 h-4 text-slate-400 ml-auto" />
          )}
        </button>

        {/* 高价值 */}
        <button
          onClick={() => handleCardClick('high_impact')}
          className={`p-4 rounded-xl border shadow-sm flex items-center space-x-4 transition-all duration-200 text-left ${
            quickFilter === 'high_impact'
              ? 'bg-red-50 border-red-200 ring-2 ring-red-100'
              : 'bg-white border-slate-100 hover:bg-slate-50 hover:shadow-md'
          }`}
        >
          <div
            className={`p-3 rounded-lg ${
              quickFilter === 'high_impact' ? 'bg-red-100' : 'bg-red-50'
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${
                quickFilter === 'high_impact' ? 'text-red-700' : 'text-red-600'
              }`}
            />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">
              高价值新闻
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {globalStats.highImpactCount}
            </p>
          </div>
        </button>

        {/* 最热板块 */}
        <button
          onClick={() => handleCardClick('top_sector')}
          className={`p-4 rounded-xl border shadow-sm flex items-center space-x-4 transition-all duration-200 text-left ${
            quickFilter === 'top_sector'
              ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100'
              : 'bg-white border-slate-100 hover:bg-slate-50 hover:shadow-md'
          }`}
        >
          <div
            className={`p-3 rounded-lg ${
              quickFilter === 'top_sector' ? 'bg-indigo-100' : 'bg-indigo-50'
            }`}
          >
            <Activity
              className={`w-6 h-6 ${
                quickFilter === 'top_sector'
                  ? 'text-indigo-700'
                  : 'text-indigo-600'
              }`}
            />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">
              最热板块
            </p>
            <p
              className="text-lg font-bold text-slate-800 truncate w-24"
              title={globalStats.topIndustry}
            >
              {globalStats.topIndustry}
            </p>
          </div>
        </button>

        {/* 平均分 */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-lg">
            <BarChart2 className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">
              平均强度
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {globalStats.avgScore}
            </p>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左：行业热度 */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col h-80">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center">
            <Hash className="w-4 h-4 mr-2 text-slate-400" />
            行业热度排行
            <span className="text-xs font-normal text-slate-400 ml-1">
              （点击条形筛选）
            </span>
          </h3>
          <div className="flex-1 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={industryStats}
                margin={{ top: 5, right: 40, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  vertical
                  stroke="#f1f5f9"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar
                  dataKey="value"
                  barSize={20}
                  radius={[0, 4, 4, 0]}
                  onClick={handleIndustryClick}
                  cursor="pointer"
                >
                  {industryStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index < 3 ? '#3b82f6' : '#94a3b8'}
                    />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    fill="#64748b"
                    fontSize={12}
                    fontWeight="bold"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右：分数分布 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col h-80">
          <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center">
              <Zap className="w-4 h-4 mr-2 text-slate-400" />
              资讯价值分布
            </span>
            <span className="text-xs font-normal text-slate-400">
              点击色块筛选
            </span>
          </h3>
          <div className="flex-1 relative flex flex-col items-center justify-center">
            <div className="w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={handlePieClick}
                    activeIndex={activePieIndex}
                    activeShape={renderActiveShape as any}
                    cursor="pointer"
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-pie-${index}`}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} 条`, '数量']}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: '12px',
                      color: '#64748b',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center">
              <span className="text-sm font-medium text-slate-600">
                监测总数：
                <span className="font-bold text-slate-800">
                  {feedNews.length}
                </span>{' '}
                条
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab + 搜索 */}
      <div className="sticky top-0 z-10 bg-slate-50 pt-2 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 flex-1">
            {/* Tabs */}
            <div
              className={`bg-white p-1 rounded-lg border border-slate-200 shadow-sm inline-flex self-start ${
                quickFilter !== 'none' || scoreFilter !== null
                  ? 'opacity-50 pointer-events-none'
                  : 'opacity-100'
              }`}
            >
              {[
                { id: 'all', label: '全部实时资讯' },
                { id: 'macro', label: '重点宏观新闻' },
                { id: 'industry', label: '重点行业新闻' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 筛选标签提示 */}
            {(quickFilter !== 'none' || scoreFilter !== null) && (
              <div className="flex items-center space-x-2">
                {quickFilter !== 'none' && (
                  <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <span>
                      已筛选：
                      {quickFilter === 'high_impact'
                        ? '高价值新闻'
                        : `板块：${globalStats.topIndustry}`}
                    </span>
                    <button
                      onClick={() => setQuickFilter('none')}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {scoreFilter !== null && (
                  <div
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                      scoreFilter === 'high'
                        ? 'bg-red-100 text-red-700'
                        : scoreFilter === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>
                      分值筛选：
                      {scoreFilter === 'high'
                        ? '重磅 (80+)'
                        : scoreFilter === 'medium'
                        ? '重要 (50-79)'
                        : '一般 (<50)'}
                    </span>
                    <button
                      onClick={() => setScoreFilter(null)}
                      className="ml-2 opacity-70 hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 搜索框 */}
            <div className="relative group w-full md:w-64 md:ml-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm shadow-sm"
                placeholder="本地搜索：标题 / 行业 / 内容…"
              />
            </div>
          </div>

          {/* 状态指示 */}
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-full border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-1.5 px-2 border-r border-slate-100">
              <div
                className={`w-2 h-2 rounded-full ${
                  loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span className="text-xs font-medium text-slate-600">
                Docker {loading ? 'Syncing' : 'Active'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 px-2">
              <span className="text-xs font-medium text-slate-400">
                上次更新: {lastUpdated || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 列表区域 */}
      <div className="grid gap-4">
        {loading && filteredNews.length === 0 ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            <p className="text-slate-500 mt-2">
              正在从 Docker Backend 读取数据…
            </p>
          </div>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((news) => (
            <div
              key={news.id}
              className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  (news.score || 0) >= 80
                    ? 'bg-red-500'
                    : (news.score || 0) >= 50
                    ? 'bg-amber-500'
                    : 'bg-slate-300'
                }`}
              />
              <div className="flex justify-between items-start mb-2 pl-3">
                <div className="flex items-center space-x-2 mb-1">
                  {news.industry && (
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md font-medium border border-slate-200">
                      {news.industry}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                      news.source === '财联社'
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}
                  >
                    {news.source}
                  </span>
                  <span className="text-xs text-slate-400">
                    {news.publishTime}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {news.score !== undefined && (
                    <div
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                        news.score >= 80
                          ? 'bg-red-50 text-red-700'
                          : news.score >= 50
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Activity className="w-3 h-3" />
                      <span className="text-xs font-bold">{news.score}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="pl-3">
                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700">
                  {news.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-3">
                  {news.content}
                </p>
                {news.aiReason && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-start space-x-2">
                    <Zap className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-700">
                      <span className="font-semibold text-indigo-700">
                        AI 点评：
                      </span>
                      {news.aiReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-100 border-dashed">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">没有找到匹配的新闻</p>
            <p className="text-slate-400 text-sm mt-1">
              尝试切换筛选条件或更换搜索词
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
