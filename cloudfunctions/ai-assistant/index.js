const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

const POSITIVE_SET = new Set(['是', '阳性', '有', '异常', '确诊', 'true', '1', 'yes']);
const NEGATIVE_SET = new Set(['否', '阴性', '无', '正常', '正常/阴性', 'false', '0', 'no']);

function toDate(value) {
  if (!value) return null;
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const n = parseFloat(value.trim());
  return Number.isFinite(n) ? n : null;
}

function normalizeInput(record) {
  if (Array.isArray(record.userInput)) {
    return record.userInput.reduce((acc, cur) => {
      if (cur && cur.id) acc[cur.id] = cur.value;
      return acc;
    }, {});
  }
  if (record.userInput && typeof record.userInput === 'object') return { ...record.userInput };
  if (Array.isArray(record.indicators)) {
    return record.indicators.reduce((acc, cur) => {
      if (cur && cur.id) acc[cur.id] = cur.value;
      return acc;
    }, {});
  }
  return {};
}

function encode(raw) {
  const num = toNumber(raw);
  if (num !== null) return num;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    if (POSITIVE_SET.has(s)) return 1;
    if (NEGATIVE_SET.has(s)) return 0;
  }
  return null;
}

function summarizeHistory(records) {
  const latest = records[0] || null;
  const latestPredict = records.find(r => r.predictionResult && typeof r.predictionResult.probability === 'number') || null;
  const previousPredict = records
    .filter(r => r.predictionResult && typeof r.predictionResult.probability === 'number')
    .slice(1, 2)[0] || null;

  const summary = {
    latestRisk: latestPredict ? latestPredict.predictionResult.probability : null,
    latestRiskFactors: latestPredict ? (latestPredict.predictionResult.riskFactors || []) : [],
    trendNotes: [],
    latestInput: latest ? latest.userInput : {}
  };

  if (latestPredict && previousPredict) {
    const delta = latestPredict.predictionResult.probability - previousPredict.predictionResult.probability;
    if (delta >= 0.05) summary.trendNotes.push(`较上一次风险上升 ${(delta * 100).toFixed(1)}%`);
    else if (delta <= -0.05) summary.trendNotes.push(`较上一次风险下降 ${(Math.abs(delta) * 100).toFixed(1)}%`);
    else summary.trendNotes.push('较上一次风险整体平稳');
  }

  const focus = ['VITD', 'ACLIgM', 'ACLIgG', 'TPOAb', 'TGAb', 'L_RI', 'R_RI', 'previousMiscarriageCount'];
  focus.forEach(key => {
    const vals = records
      .map(r => encode(r.userInput[key]))
      .filter(v => v !== null);
    if (vals.length >= 2) {
      const diff = vals[0] - vals[vals.length - 1];
      if (Math.abs(diff) >= 0.01) {
        summary.trendNotes.push(`${key} 近期变化 ${diff > 0 ? '+' : ''}${diff.toFixed(2)}`);
      }
    }
  });

  return summary;
}

function fallbackAnswer(question, summary) {
  const risk = typeof summary.latestRisk === 'number' ? `${(summary.latestRisk * 100).toFixed(1)}%` : '暂无';
  const riskLines = (summary.latestRiskFactors || []).slice(0, 3).map(i => `- ${i.title}`).join('\n') || '- 暂无显著风险项';
  const trendLines = (summary.trendNotes || []).slice(0, 4).map(i => `- ${i}`).join('\n') || '- 历史数据不足';
  return `我已结合您的历史记录进行分析。\n\n当前流产风险：${risk}\n高风险重点：\n${riskLines}\n\n时序趋势：\n${trendLines}\n\n针对您的提问“${question}”，建议您优先与医生确认近期复查计划（2-4周），并持续补充维生素D/免疫相关指标监测。`;
}

async function askModel(payload, apiKey) {
  const url = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1/chat/completions';
  const model = process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-72B-Instruct';

  const system = '你是复发性流产风险随访AI助手。输出中文，温和、可执行、非诊断。你必须结合用户问题、风险因子、趋势信息，给出分点建议，并提示需面诊。';
  const user = `用户问题：${payload.question}
来源页面：${payload.fromPage}
结构化上下文：${JSON.stringify(payload.summary, null, 2)}

请输出：
1) 先一句话回答问题
2) 给出3条可执行建议（复查项+时间）
3) 给出1条就医提醒`;

  const res = await axios.post(url, {
    model,
    temperature: 0.3,
    max_tokens: 700,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  }, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: parseInt(process.env.SILICONFLOW_HTTP_TIMEOUT_MS || '15000', 10)
  });

  const content = res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message && res.data.choices[0].message.content;
  if (!content) throw new Error('empty model response');
  return content;
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const question = (event.question || '').trim();
    const fromPage = event.fromPage || 'unknown';
    if (!question) {
      return { success: false, error: 'question is required' };
    }

    const history = await db.collection('predictionHistory')
      .where({ _openid: openid })
      .orderBy('timestamp', 'desc')
      .limit(12)
      .get();

    const records = (history.data || []).map(item => ({
      timestamp: toDate(item.timestamp) || toDate(item.date),
      userInput: normalizeInput(item),
      predictionResult: item.predictionResult || null
    })).filter(item => item.timestamp).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const summary = summarizeHistory(records);
    const apiKey = process.env.SILICONFLOW_API_KEY || process.env.SILICON_API_KEY || '';

    let answer = '';
    if (apiKey) {
      try {
        answer = await askModel({ question, fromPage, summary }, apiKey);
      } catch (err) {
        console.error('ai-assistant model error:', err);
        answer = fallbackAnswer(question, summary);
      }
    } else {
      answer = fallbackAnswer(question, summary);
    }

    return {
      success: true,
      answer
    };
  } catch (error) {
    console.error('ai-assistant failed:', error);
    return {
      success: false,
      error: error.message || 'internal error'
    };
  }
};
