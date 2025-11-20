# -*- coding: utf-8 -*-
import os
import time
import json
import hashlib
import schedule
import logging
from datetime import datetime
import akshare as ak
import tushare as ts
import requests

# 导入本地模块
from industry_ai import analyze_news_simple
from trade_sentiment import MarketSentiment

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# 环境变量
DATA_DIR = "/app/data"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
TUSHARE_TOKEN = os.getenv("TUSHARE_TOKEN")

if TUSHARE_TOKEN:
    ts.set_token(TUSHARE_TOKEN)
    pro = ts.pro_api()

def save_json(filename, data):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"成功保存 {filename}")

def fetch_cls_news():
    """抓取财联社新闻"""
    logger.info("开始抓取财联社新闻...")
    try:
        df = ak.stock_info_global_cls(symbol="全部")
        news_list = []
        for _, row in df.head(20).iterrows(): # 为了演示只取前20条
            title = row.get("标题") or row.get("内容", "")[:30]
            content = row.get("内容", "")
            pub_time = row.get("发布时间") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # 生成唯一ID
            news_id = hashlib.md5((title + pub_time).encode()).hexdigest()
            
            # 调用 AI 分析
            industry, score, reason = analyze_news_simple(title, content)
            
            news_list.append({
                "id": news_id,
                "title": title,
                "content": content,
                "source": "财联社",
                "publishTime": pub_time,
                "industry": industry,
                "score": score,
                "aiReason": reason
            })
        
        save_json("news_data.json", news_list)
    except Exception as e:
        logger.error(f"新闻抓取失败: {e}")

def calculate_sentiment():
    """每2分钟计算一次市场情绪"""
    logger.info("正在计算A股情绪...")
    analyzer = MarketSentiment()
    
    # 1. 情绪分
    score = analyzer.get_market_sentiment()
    overview = analyzer.get_market_overview()
    
    # 2. 指数行情
    indices = []
    try:
        # 上证
        df_sh = ak.stock_zh_index_spot()
        sh = df_sh[df_sh['名称'].str.contains('上证指数')].iloc[0]
        indices.append({"name": "上证指数", "price": sh['最新价'], "change": sh['涨跌幅']})
        
        # 创业板
        cy = df_sh[df_sh['名称'].str.contains('创业板指')].iloc[0]
        indices.append({"name": "创业板指", "price": cy['最新价'], "change": cy['涨跌幅']})
    except:
        pass

    data = {
        "updated_at": datetime.now().strftime("%H:%M"),
        "score": score,
        "level": "偏乐观" if score > 60 else ("偏悲观" if score < 40 else "中性"),
        "stats": {
            "up": overview['up_count'] if overview else 0,
            "down": overview['down_count'] if overview else 0,
            "limit_up": overview['limit_up'] if overview else 0,
            "limit_down": overview['limit_down'] if overview else 0
        },
        "indices": indices
    }
    save_json("market_sentiment.json", data)

def generate_report(period):
    """调用 DeepSeek 写复盘报告"""
    if not DEEPSEEK_API_KEY:
        logger.warning("未配置 DeepSeek Key，跳过报告生成")
        return

    logger.info(f"正在生成 {period} 报告...")
    prompt = f"请作为资深分析师，写一份A股{period}复盘报告。重点分析指数走势、领涨板块和资金流向。200字以内。"
    
    try:
        resp = requests.post(
            "https://api.deepseek.com/chat/completions",
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
            json={
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}]
            }
        )
        content = resp.json()['choices'][0]['message']['content']
        
        # 读取旧报告或新建
        report_path = os.path.join(DATA_DIR, "market_reports.json")
        if os.path.exists(report_path):
            with open(report_path, 'r') as f:
                reports = json.load(f)
        else:
            reports = {"date": datetime.now().strftime("%Y-%m-%d")}
            
        reports[period] = {
            "title": f"{period}点评",
            "time": datetime.now().strftime("%H:%M"),
            "content": content
        }
        save_json("market_reports.json", reports)
        
    except Exception as e:
        logger.error(f"报告生成失败: {e}")

# 定时任务
schedule.every(1).minutes.do(fetch_cls_news)
schedule.every(2).minutes.do(calculate_sentiment)
schedule.every().day.at("11:30").do(generate_report, "midday")
schedule.every().day.at("15:30").do(generate_report, "close")

if __name__ == "__main__":
    # 启动时立即执行一次
    fetch_cls_news()
    calculate_sentiment()
    
    logger.info("后端服务启动成功，开始定时任务监控...")
    while True:
        schedule.run_pending()
        time.sleep(1)
