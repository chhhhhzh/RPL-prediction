const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const TRACKED_INDICATORS = [{
        id: 'VITD',
        label: '维生素D',
        preferredDirection: 'up'
    },
    {
        id: 'ACLIgM',
        label: '抗心磷脂抗体IgM',
        preferredDirection: 'down'
    },
    {
        id: 'ACLIgG',
        label: '抗心磷脂抗体IgG',
        preferredDirection: 'down'
    },
    {
        id: 'TPOAb',
        label: 'TPOAb',
        preferredDirection: 'down'
    },
    {
        id: 'TGAb',
        label: 'TGAb',
        preferredDirection: 'down'
    },
    {
        id: 'L_RI',
        label: '左侧子宫动脉RI',
        preferredDirection: 'down'
    },
    {
        id: 'R_RI',
        label: '右侧子宫动脉RI',
        preferredDirection: 'down'
    }
];

const POSITIVE_SET = new Set(['是', '阳性', '有', '异常', '确诊', 'true', '1', 'yes']);
const NEGATIVE_SET = new Set(['否', '阴性', '无', '正常', '正常/阴性', 'false', '0', 'no']);
const MAX_INVOKE_BUDGET_MS = parseInt(process.env.LLM_REPORT_BUDGET_MS || '2500', 10);

function toDate(value) {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'object') {
        if (typeof value.toDate === 'function') {
            const d = value.toDate();
            if (d instanceof Date && !Number.isNaN(d.getTime())) return d;
        }
        if (typeof value.seconds === 'number') {
            return new Date(value.seconds * 1000);
        }
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function toNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^[-+]?\d+(\.\d+)?$/.test(trimmed)) return null;
    const parsed = parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUserInputMap(item) {
    if (Array.isArray(item.userInput)) {
        return item.userInput.reduce((acc, current) => {
            if (current && current.id) acc[current.id] = current.value;
            return acc;
        }, {});
    }
    if (item.userInput && typeof item.userInput === 'object') {
        return {
            ...item.userInput
        };
    }
    if (Array.isArray(item.indicators)) {
        return item.indicators.reduce((acc, current) => {
            if (current && current.id) acc[current.id] = current.value;
            return acc;
        }, {});
    }
    return {};
}

function encodeValue(rawValue) {
    if (rawValue === undefined || rawValue === null || rawValue === '') return null;
    const num = toNumber(rawValue);
    if (num !== null) return num;
    if (typeof rawValue === 'string') {
        const normalized = rawValue.trim().toLowerCase();
        if (POSITIVE_SET.has(normalized)) return 1;
        if (NEGATIVE_SET.has(normalized)) return 0;
    }
    return null;
}

function summarizeTemporal(records, currentInput, currentPredictResult) {
    const highlights = [];
    const historyProb = records
        .filter(item => item.predictionResult && typeof item.predictionResult.probability === 'number')
        .sort((a, b) => a.timestampMs - b.timestampMs);

    if (historyProb.length >= 2 && currentPredictResult && typeof currentPredictResult.probability === 'number') {
        const lastHistory = historyProb[historyProb.length - 1].predictionResult.probability;
        const currentRisk = currentPredictResult.probability;
        const delta = currentRisk - lastHistory;
        if (delta <= -0.05) {
            highlights.push(`与上次相比，当前流产风险下降约 ${(Math.abs(delta) * 100).toFixed(1)}%，趋势向好。`);
        } else if (delta >= 0.05) {
            highlights.push(`与上次相比，当前流产风险上升约 ${(delta * 100).toFixed(1)}%，建议尽快复查。`);
        } else {
            highlights.push('与上次相比，整体风险波动较小，近期趋于稳定。');
        }
    }

    TRACKED_INDICATORS.forEach(indicator => {
        const series = records
            .map(item => ({
                value: encodeValue(item.userInputMap[indicator.id]),
                timestampMs: item.timestampMs
            }))
            .filter(item => item.value !== null)
            .sort((a, b) => a.timestampMs - b.timestampMs);

        const currentValue = encodeValue(currentInput[indicator.id]);
        if (currentValue !== null) {
            series.push({
                value: currentValue,
                timestampMs: Date.now()
            });
        }
        if (series.length < 2) return;

        const first = series[0].value;
        const last = series[series.length - 1].value;
        const diff = last - first;
        if (Math.abs(diff) < 0.01) return;

        if (indicator.preferredDirection === 'up') {
            if (diff > 0) {
                highlights.push(`${indicator.label}较既往有上升趋势（+${diff.toFixed(2)}），属于积极变化。`);
            } else {
                highlights.push(`${indicator.label}较既往下降（${diff.toFixed(2)}），建议重点干预与复查。`);
            }
        } else if (diff < 0) {
            highlights.push(`${indicator.label}较既往下降（${diff.toFixed(2)}），趋势向好。`);
        } else {
            highlights.push(`${indicator.label}较既往上升（+${diff.toFixed(2)}），需持续关注。`);
        }
    });

    if (highlights.length === 0) {
        highlights.push('当前历史数据较少，建议持续录入以获得更稳定的时序趋势判断。');
    }

    return highlights.slice(0, 5);
}

function buildFallbackReport(predictResult, temporalHighlights) {
    const miscarriageRisk = typeof predictResult.probability === 'number' ?
        (predictResult.probability * 100).toFixed(1) :
        '--';
    const riskTips = (predictResult.riskFactors || [])
        .slice(0, 3)
        .map(item => `- ${item.title}：${item.tip}`)
        .join('\n');
    const trends = temporalHighlights.map(item => `- ${item}`).join('\n');
    return `本次模型评估的流产风险约为 ${miscarriageRisk}%。\n\n` +
        `结合当前可用历史数据，给出以下随访建议：\n${trends || '- 当前时序数据不足，请保持连续记录。'}\n\n` +
        `重点风险提示：\n${riskTips || '- 暂未识别到显著风险因子。'}\n\n` +
        `建议在医生指导下，2-4 周内复查关键指标，并持续在小程序更新历史数据。`;
}

async function callSiliconFlow(reportPayload, apiKey) {
    const model = process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-72B-Instruct';
    const baseUrl = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1/chat/completions';

    const systemPrompt = '你是妇产科风险管理助手。请用中文输出通俗、温和、非诊断性的建议，避免恐吓，且明确“需结合医生面诊”。';
    const userPrompt = `请根据以下 JSON 生成患者可读报告，要求：
1) 3-4段，结构为“总体结论/时序变化/近期行动建议/就医提醒”；
2) 行动建议最多3条，必须具体到“复查什么、多久复查”；
3) 不要编造未提供的数据。

JSON:
${JSON.stringify(reportPayload, null, 2)}`;

    const response = await axios.post(baseUrl, {
        model,
        temperature: 0.3,
        max_tokens: 700,
        messages: [{
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: userPrompt
            }
        ]
    }, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        timeout: parseInt(process.env.SILICONFLOW_HTTP_TIMEOUT_MS || '1800', 10)
    });

    const content = response.data &&
        response.data.choices &&
        response.data.choices[0] &&
        response.data.choices[0].message &&
        response.data.choices[0].message.content;

    if (!content) {
        throw new Error('模型返回内容为空');
    }
    return content;
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
        })
    ]);
}

exports.main = async (event) => {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const currentInput = event.userInput || {};
    const predictResult = event.predictResult || {};

    try {
        const historyRes = await db.collection('predictionHistory')
            .where({
                _openid: openid
            })
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        const normalizedRecords = (historyRes.data || [])
            .map(item => {
                const timestampDate = toDate(item.timestamp) || toDate(item.date);
                if (!timestampDate) return null;
                return {
                    timestampMs: timestampDate.getTime(),
                    userInputMap: normalizeUserInputMap(item),
                    predictionResult: item.predictionResult || null
                };
            })
            .filter(Boolean);

        const temporalHighlights = summarizeTemporal(normalizedRecords, currentInput, predictResult);
        const reportPayload = {
            currentPrediction: {
                miscarriageProbability: predictResult.probability,
                confidenceInterval: predictResult.confidenceInterval || null,
                riskFactors: predictResult.riskFactors || []
            },
            temporalHighlights,
            recentInput: currentInput
        };

        const apiKey = process.env.SILICONFLOW_API_KEY || process.env.SILICON_API_KEY || '';
        let reportText = '';
        if (apiKey) {
            try {
                reportText = await withTimeout(
                    callSiliconFlow(reportPayload, apiKey),
                    MAX_INVOKE_BUDGET_MS,
                    'LLM 调用超出预算时间'
                );
            } catch (llmErr) {
                console.error('SiliconFlow 调用失败，降级为模板报告:', llmErr);
                reportText = buildFallbackReport(predictResult, temporalHighlights);
            }
        } else {
            reportText = buildFallbackReport(predictResult, temporalHighlights);
        }

        return {
            success: true,
            reportText,
            temporalHighlights
        };
    } catch (error) {
        console.error('llm-report 云函数错误:', error);
        return {
            success: false,
            error: error.message || '生成失败'
        };
    }
};
