import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { ArrowUpRight, ArrowDownRight, GripHorizontal, MoreHorizontal, AlertTriangle, RefreshCw, Zap, Info, MessageSquarePlus, Loader2 } from 'lucide-react';
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

interface SentimentIndex {
    name: string;
    price: number;
    change: number;
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
    indices: SentimentIndex[];
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
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          setReports(data);
      } catch (error) {
          console.error('Failed to fetch reports', error);
          setReports(null);
      }
  };

  // Fetch Sentiment
  const fetchSentiment = async () => {
      setLoadingSentiment(true);
      try {
          const res = await fetch('/data/market_sentiment.json');
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          setSentiment(data);
      } catch (error) {
          console.error('Failed to fetch sentiment', error);
          setSentiment({
              updated_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              score: 50,
              level: '中性',
              stats: {
                  up: 0,
                  down: 0,
                  flat: 0,
                  limit_up: 0,
                  limit_down: 0,
              },
              indices: [],
              market_volume: 0,
          });
      } finally {
          setLoadingSentiment(false);
      }
  };

  useEffect(() => {
      fetchReports();
      fetchSentiment();
  }, []);

  // Helper to render report content with line breaks
  const renderContent = (content: string) => {
      return content.split('\n').map((line, idx) => (
          <p key={idx} className="text-gray-700 mb-1 leading-relaxed">
              {line}
          </p>
      ));
  };

  const getSelectedReport = (): MarketReport | null => {
      if (!reports) return null;
      if (selectedReport === 'early') return reports.early || null;
      if (selectedReport === 'midday') return reports.midday || null;
      if (selectedReport === 'close') return reports.close || null;
      return null;
  };

  const selectedReportData = getSelectedReport();

  const sentimentScore = sentiment?.score ?? 50;
  const sentimentLevel = sentiment?.level ?? '中性';
  const sentimentStats = sentiment?.stats ?? { up: 0, down: 0, flat: 0, limit_up: 0, limit_down: 0 };

  const marketSentimentScore = Math.round(sentimentScore);

  const getSentimentColor = (score: number) => {
      if (score >= 70) return 'bg-green-100 text-green-700 border-green-300';
      if (score >= 40) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      return 'bg-red-100 text-red-700 border-red-300';
  };

  const sentimentColorClass = getSentimentColor(marketSentimentScore);

  const indexData = sentiment?.indices && sentiment.indices.length > 0
      ? sentiment.indices
      : [
          { name: '上证指数', price: 0, change: 0 },
          { name: '深证成指', price: 0, change: 0 },
          { name: '创业板指', price: 0, change: 0 },
      ];

  const stockBreadthData = [
      {
          name: '上涨',
          value: sentimentStats.up || 0,
          color: '#16a34a',
      },
      {
          name: '下跌',
          value: sentimentStats.down || 0,
          color: '#dc2626',
      },
      {
          name: '平盘',
          value: sentimentStats.flat || 0,
          color: '#6b7280',
      },
  ];

  const marketSummaryList = [
      {
          label: '上涨家数',
          value: sentimentStats.up || 0,
          color: 'text-green-600',
          bgLight: 'bg-green-50',
      },
      {
          label: '下跌家数',
          value: sentimentStats.down || 0,
          color: 'text-red-600',
          bgLight: 'bg-red-50',
      },
      {
          label: '涨停家数',
          value: sentimentStats.limit_up || 0,
          color: 'text-emerald-600',
          bgLight: 'bg-emerald-50',
      },
      {
          label: '跌停家数',
          value: sentimentStats.limit_down || 0,
          color: 'text-rose-600',
          bgLight: 'bg-rose-50',
      },
  ];

  const handleGenerateAIComment = async () => {
      if (!sentiment) return;
      try {
          setGeneratingComment(true);
