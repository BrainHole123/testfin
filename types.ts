
export enum ViewState {
  NEWS = 'NEWS',
  MARKET = 'MARKET',
  STOCK = 'STOCK',
  PORTFOLIO = 'PORTFOLIO',
  SECTOR = 'SECTOR'
}

export interface NewsArticle {
  id?: string;
  title: string;
  content?: string; // 正文内容
  url: string;
  source: string; // 来源：财联社、新浪财经
  publishTime: string; // 发布时间
  
  // AI 分析字段 (对应 Python 后端)
  score?: number; // 0-100
  industry?: string; // 例如: "食品饮料-白酒", "宏观-货币政策"
  aiReason?: string; // AI 评分理由
}

export interface GeminiAnalysisResult {
  summary: string;
  articles: NewsArticle[];
}

export interface StockData {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: { time: string; value: number }[];
}

export interface PortfolioItem {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  allocation: number;
}

export interface SectorData {
  name: string;
  performance: number;
  trend: 'up' | 'down' | 'neutral';
}