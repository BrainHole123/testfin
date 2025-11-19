import { GeminiAnalysisResult, NewsArticle } from '../types';

const API_KEY = process.env.API_KEY;
// DeepSeek API Endpoint (Compatible with OpenAI SDK, but we use fetch to avoid adding dependencies)
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_BALANCE_URL = "https://api.deepseek.com/user/balance";

/**
 * Generates analysis or prediction based on provided context using DeepSeek API.
 * Falls back to mock data if API key is missing or request fails.
 */
export const generateAnalysis = async (context: string, type: 'stock' | 'sector' | 'general' | 'sentiment'): Promise<string> => {
  // 1. Fallback Mode (No API Key)
  if (!API_KEY) {
    return getMockAnalysis(context, type);
  }

  try {
    // 2. DeepSeek API Call
    const promptMap = {
      stock: `作为一名资深的A股分析师，请分析股票 "${context}"。请结合技术面（趋势、支撑压力）和基本面逻辑，给出简明扼要的预测。请用专业、客观的中文回答，字数控制在200字以内。`,
      sector: `作为一名宏观策略分析师，请预测 "${context}" 行业的轮动趋势。下一季度哪些细分领域可能跑赢大盘？请用中文简要分析（200字以内）。`,
      general: `请提供关于 "${context}" 的简要市场展望。请用中文回答，150字以内。`,
      sentiment: `你是一个A股市场情绪专家。请根据以下实时交易数据，对当前市场情绪进行解读，并给出短线操作建议（如：是否适合追高、是否需要止损）。\n\n实时数据：${context}\n\n要求：风格犀利，言简意赅，100字以内。`
    };

    const content = promptMap[type] || promptMap.general;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // using DeepSeek-V3
        messages: [
          { role: "system", content: "你是一个专业的金融量化分析助手，擅长A股市场分析。回答风格：专业、理性、数据驱动。" },
          { role: "user", content: content }
        ],
        temperature: 1.3, // Higher temperature for more creative/analytical output
        max_tokens: 500,
        stream: false
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("DeepSeek API Error:", response.status, errData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "AI 暂时无法生成回答。";

  } catch (error) {
    console.error("Error generating analysis:", error);
    return getMockAnalysis(context, type); // Fallback on error
  }
};

/**
 * Fetch DeepSeek Account Balance
 * Endpoint: GET https://api.deepseek.com/user/balance
 */
export const fetchDeepSeekBalance = async (): Promise<string | null> => {
  if (!API_KEY) return null;

  try {
    const response = await fetch(DEEPSEEK_BALANCE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      console.warn(`DeepSeek Balance API failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Parse response: { is_available: boolean, balance_infos: [{ currency: "CNY", total_balance: "..." }] }
    if (data.balance_infos && data.balance_infos.length > 0) {
        const info = data.balance_infos[0];
        return `${info.currency} ${info.total_balance}`;
    }
    
    return "CNY 0.00";

  } catch (error) {
    console.error("Error fetching DeepSeek balance:", error);
    return null;
  }
};

/**
 * Helper to get mock analysis when API is unavailable
 */
const getMockAnalysis = (context: string, type: string): string => {
    if (type === 'stock') {
        return `【本地演示模式】关于 ${context} 的 DeepSeek 模拟分析：\n\n从技术形态来看，该股近期在60日均线附近获得支撑，成交量温和放大，MACD指标出现金叉迹象，显示短期动能转强。基本面上，行业景气度回升带来业绩修复预期。建议关注上方压力位的突破情况，若未能有效突破，可能面临短期回调风险。`;
    }
    if (type === 'sector') {
        return `【本地演示模式】关于 ${context} 的 DeepSeek 模拟研判：\n\n当前市场风格正在从防御板块向成长板块切换。${context} 作为本轮周期的核心受益方向，具备较高的配置价值。建议重点关注该产业链中具备技术壁垒的上游核心零部件环节，以及受益于国产替代逻辑的龙头企业。`;
    }
    if (type === 'sentiment') {
        return `【本地演示模式】当前市场数据显示情绪偏向震荡。上涨家数与下跌家数基本持平，资金观望情绪浓厚。建议控制仓位，多看少动，等待明确的主线方向出现后再跟随操作。`;
    }
    return "系统未检测到 API Key，已切换至 DeepSeek 本地演示模式。请在环境变量中配置 DeepSeek API Key 以获取实时 AI 分析。";
};

/**
 * Legacy function kept for compatibility, but simplified.
 * DeepSeek V3 doesn't have built-in search grounding like Gemini.
 */
export const fetchMarketNews = async (query: string): Promise<GeminiAnalysisResult> => {
  return {
    summary: "DeepSeek 暂不支持实时联网搜索，请关注左侧本地实时抓取的财联社新闻流。",
    articles: []
  };
};

// Local Ollama Stub (Optional future expansion)
export const generateWithLocalOllama = async (prompt: string) => {
    console.log("Ollama connection not implemented in this demo.");
    return "";
}