# -*- coding: utf-8 -*-
import os
import json
import logging
import requests
from typing import Optional, Tuple
from sw_industry_2021_clean import sw_industry_2021_clean

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

def analyze_news_simple(title: str, content: str) -> Tuple[str, int, str]:
    """
    调用本地 Ollama 模型分析新闻。
    返回: (行业, 分数, 理由)
    """
    try:
        prompt = _build_prompt(title, content)
        response_text = _call_ollama(prompt)
        return _parse_json(response_text)
    except Exception as e:
        logger.error(f"AI 分析失败: {e}")
        return "未分类", 50, "AI 分析服务暂时不可用"

def _build_prompt(title: str, content: str) -> str:
    return f"""
你是一个金融新闻分析师。请分析以下新闻：
标题：{title}
内容：{content[:500]}

任务：
1. 判断所属的申万行业（如：食品饮料-白酒，电子-半导体，宏观-货币政策）。
2. 给出重要性评分（0-100），0为无关噪音，100为重磅利好/利空。
3. 用一句话简述理由（30字以内）。

请严格且只返回 JSON 格式，不要包含 markdown 标记：
{{
  "industry": "行业名称",
  "score": 85,
  "reason": "理由..."
}}
"""

def _call_ollama(prompt: str) -> str:
    url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json" 
    }
    try:
        resp = requests.post(url, json=payload, timeout=30)
        if resp.status_code == 200:
            return resp.json().get("response", "")
        else:
            logger.error(f"Ollama API Error: {resp.status_code}")
            return ""
    except Exception as e:
        logger.error(f"Ollama Connection Error: {e}")
        return ""

def _parse_json(text: str) -> Tuple[str, int, str]:
    try:
        data = json.loads(text)
        industry = data.get("industry", "综合")
        score = int(data.get("score", 50))
        reason = data.get("reason", "")
        return industry, score, reason
    except:
        return "未分类", 50, "解析结果失败"
