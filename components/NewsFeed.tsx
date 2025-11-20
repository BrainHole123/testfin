import React, { useEffect, useMemo, useState } from "react";
import type { NewsItem } from "../types";

const REFRESH_INTERVAL_MS = 60_000; // 1 分钟刷新一次

const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [minScore, setMinScore] = useState<number>(0);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("全部");
  const [showReason, setShowReason] = useState<boolean>(true);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`/data/news_data.json?_t=${Date.now()}`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as NewsItem[];
      setNews(data || []);
    } catch (e: any) {
      setError(e?.message || "加载新闻失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    const timer = setInterval(loadNews, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const industries = useMemo(() => {
    const set = new Set<string>();
    news.forEach((n) => {
      if (n.industry) {
        set.add(n.industry);
      }
    });
    return ["全部", ...Array.from(set).sort()];
  }, [news]);

  const filteredNews = useMemo(() => {
    return news.filter((n) => {
      if (selectedIndustry !== "全部" && n.industry !== selectedIndustry) {
        return false;
      }
      if (typeof n.score === "number" && n.score < minScore) {
        return false;
      }
      if (keyword.trim()) {
        const k = keyword.trim();
        const text = `${n.title || ""}${n.content || ""}`;
        if (!text.includes(k)) {
          return false;
        }
      }
      return true;
    });
  }, [news, selectedIndustry, minScore, keyword]);

  return (
    <div className="news-feed">
      <div className="news-feed-header">
        <h2>市场要闻 &amp; AI 分析</h2>
        <button
          className="refresh-button"
          onClick={loadNews}
          type="button"
        >
          手动刷新
        </button>
      </div>

      <div className="news-filters">
        <div className="filter-item">
          <label>关键词：</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="按标题 / 正文模糊搜索"
          />
        </div>

        <div className="filter-item">
          <label>最低 AI 评分：</label>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value) || 0)}
          />
        </div>

        <div className="filter-item">
          <label>行业：</label>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>
            <input
              type="checkbox"
              checked={showReason}
              onChange={(e) => setShowReason(e.target.checked)}
            />
            显示 AI 评分理由
          </label>
        </div>
      </div>

      {loading && <div className="news-status">正在加载新闻…</div>}
      {error && <div className="news-status error">加载失败：{error}</div>}

      <div className="news-list">
        {filteredNews
