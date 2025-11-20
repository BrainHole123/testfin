# -*- coding: utf-8 -*-
import pandas as pd
import akshare as ak

class MarketSentiment:
    def __init__(self):
        self.dfMarket = None

    def get_market_overview(self):
        """获取市场全景数据"""
        try:
            # 获取A股实时行情
            df = ak.stock_zh_a_spot_em()
            
            # 标准化字段
            df = df.rename(columns={
                '涨跌幅': 'change_pct',
                '最新价': 'price',
                '成交额': 'amount',
                '名称': 'name',
                '代码': 'code'
            })
            
            self.dfMarket = df
            
            up_count = len(df[df['change_pct'] > 0])
            down_count = len(df[df['change_pct'] < 0])
            flat_count = len(df[df['change_pct'] == 0])
            total_amount = df['amount'].sum() / 100000000 # 亿元

            # 涨跌停计算 (粗略估算 9.8% / -9.8%)
            limit_up = len(df[df['change_pct'] > 9.8])
            limit_down = len(df[df['change_pct'] < -9.8])

            return {
                'up_count': up_count,
                'down_count': down_count,
                'flat_count': flat_count,
                'limit_up': limit_up,
                'limit_down': limit_down,
                'total_amount': total_amount,
                'up_down_ratio': up_count / (down_count if down_count > 0 else 1)
            }
        except Exception as e:
            print(f"获取市场数据失败: {e}")
            return None

    def get_market_sentiment(self):
        """计算情绪分数 (0-100)"""
        if self.dfMarket is None:
            return 50
        
        overview = self.get_market_overview()
        if not overview:
            return 50

        # 1. 涨跌比得分 (权重 50%)
        # 极度悲观(0) -> 涨跌比0.1; 极度乐观(100) -> 涨跌比3.0
        ratio = overview['up_down_ratio']
        ratio_score = min(100, max(0, ratio * 33))

        # 2. 涨停奖励 (权重 30%)
        limit_score = min(100, overview['limit_up'] / 100 * 50) # 200家涨停满分

        # 3. 赚钱效应 (权重 20%)
        # 上涨家数占比
        total = overview['up_count'] + overview['down_count']
        breadth_score = (overview['up_count'] / total * 100) if total > 0 else 50

        final_score = (ratio_score * 0.5) + (limit_score * 0.3) + (breadth_score * 0.2)
        return round(final_score, 1)
