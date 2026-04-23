import * as echarts from '../../lib/ec-canvas/echarts';
const {
    icons
} = require('../../utils/icons.js');
const {
    modulesConfig
} = require('../../utils/data.js');
const app = getApp();

const POSITIVE_SET = new Set(['是', '阳性', '有', '异常', '确诊', 'true', '1', 'yes']);
const NEGATIVE_SET = new Set(['否', '阴性', '无', '正常', '正常/阴性', 'false', '0', 'no']);

const RADAR_DIMENSIONS = [{
        id: 'immune',
        name: '免疫'
    },
    {
        id: 'uterineArtery',
        name: '子宫动脉'
    },
    {
        id: 'demographicHistory',
        name: '人口学与病史'
    },
    {
        id: 'bloodNutrition',
        name: '血液学与营养'
    },
    {
        id: 'endocrine',
        name: '内分泌'
    },
    {
        id: 'coagulation',
        name: '凝血'
    }
];

const RISK_FACTOR_DIMENSION_MAP = {
    '既往流产次数风险': 'demographicHistory',
    '维生素D水平偏低': 'endocrine',
    '抗心磷脂抗体IgM阳性': 'coagulation',
    '抗心磷脂抗体IgG阳性': 'coagulation',
    '狼疮抗凝物阳性': 'coagulation',
    'TPOAb 阳性': 'endocrine',
    'TGAb 阳性': 'endocrine',
    'ANA 阳性': 'immune',
    '确诊APS': 'coagulation',
    '代谢异常': 'endocrine',
    'BMI 偏高': 'endocrine',
    '右侧子宫动脉阻力指数偏高': 'uterineArtery',
    '左侧子宫动脉阻力指数偏高': 'uterineArtery',
    '染色体异常': 'demographicHistory',
    '血小板减少': 'coagulation',
    'PAI-I纯合子': 'coagulation',
    '宫颈机能不全': 'demographicHistory',
    '吸烟病史': 'demographicHistory'
};

const RADAR_RULES = {
    immune: [{
            id: 'ANA',
            predicate: val => isPositive(val)
        },
        {
            id: 'ENA',
            predicate: val => isPositive(val)
        },
        {
            id: 'connectiveTissueDisease',
            predicate: val => isPositive(val)
        }
    ],
    uterineArtery: [{
            id: 'L_RI',
            predicate: val => toNumber(val) > 1
        },
        {
            id: 'R_RI',
            predicate: val => toNumber(val) > 1
        },
        {
            id: 'S_SD_ratio',
            predicate: val => toNumber(val) > 3.5
        }
    ],
    demographicHistory: [{
            id: 'age',
            predicate: val => toNumber(val) >= 35
        },
        {
            id: 'previousMiscarriageCount',
            predicate: val => toNumber(val) >= 2
        },
        {
            id: 'smokingHistory',
            predicate: val => isPositive(val)
        },
        {
            id: 'chromosomalAbnormality',
            predicate: val => isPositive(val)
        },
        {
            id: 'cervicalInsufficiency',
            predicate: val => isPositive(val)
        }
    ],
    bloodNutrition: [{
            id: 'C3',
            predicate: val => {
                const n = toNumber(val);
                return n !== null && n < 0.75;
            }
        },
        {
            id: 'C4',
            predicate: val => {
                const n = toNumber(val);
                return n !== null && n < 0.1;
            }
        },
        {
            id: 'thrombocytopenia',
            predicate: val => isPositive(val)
        }
    ],
    endocrine: [{
            id: 'VITD',
            predicate: val => {
                const n = toNumber(val);
                return n !== null && n < 18;
            }
        },
        {
            id: 'TPOAb',
            predicate: val => {
                const n = toNumber(val);
                return n !== null && n > 9;
            }
        },
        {
            id: 'TGAb',
            predicate: val => {
                const n = toNumber(val);
                return n !== null && n > 9;
            }
        },
        {
            id: 'insulinResistance',
            predicate: val => isPositive(val)
        },
        {
            id: 'PCOS',
            predicate: val => isPositive(val)
        }
    ],
    coagulation: [{
            id: 'ACLIgM',
            predicate: val => {
                const n = toNumber(val);
                return n !== null && n > 9;
            }
        },
        {
            id: 'ACLIgG',
            predicate: val => {
                const n = toNumber(val);
                return n !== null && n > 9;
            }
        },
        {
            id: 'LA',
            predicate: val => isPositive(val)
        },
        {
            id: 'APS_diagnosis',
            predicate: val => isPositive(val)
        },
        {
            id: 'PAI1_homozygous',
            predicate: val => isPositive(val)
        }
    ]
};

function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
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

function isPositive(value) {
    if (typeof value === 'number') return value === 1;
    if (typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    if (POSITIVE_SET.has(normalized)) return true;
    if (NEGATIVE_SET.has(normalized)) return false;
    return false;
}

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

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return {
        formattedDate: `${year}-${month}-${day}`,
        formattedTime: `${hour}:${minute}`,
        axisLabel: `${month}-${day}`
    };
}

function buildIndicatorLabelMap() {
    const map = {};
    Object.keys(modulesConfig).forEach(moduleId => {
        const module = modulesConfig[moduleId];
        (module.indicators || []).forEach(indicator => {
            map[indicator.id] = indicator.label;
        });
    });
    return map;
}

function buildIndicatorMetaMap() {
    const map = {};
    Object.keys(modulesConfig).forEach(moduleId => {
        const module = modulesConfig[moduleId];
        (module.indicators || []).forEach(indicator => {
            map[indicator.id] = {
                id: indicator.id,
                label: indicator.label,
                inputType: indicator.inputType || 'number',
                option: Array.isArray(indicator.option) ? indicator.option : []
            };
        });
    });
    return map;
}

function buildAllIndicatorList(metaMap) {
    const list = [];
    Object.keys(modulesConfig).forEach(moduleId => {
        const module = modulesConfig[moduleId];
        (module.indicators || []).forEach(indicator => {
            const meta = metaMap[indicator.id];
            if (meta) {
                list.push({
                    id: meta.id,
                    title: meta.label
                });
            }
        });
    });
    return list;
}

const INDICATOR_LABEL_MAP = buildIndicatorLabelMap();
const INDICATOR_META_MAP = buildIndicatorMetaMap();
const ALL_INDICATOR_LIST = buildAllIndicatorList(INDICATOR_META_MAP);

function findOptionIndexBySemantic(options, positive) {
    const positiveTokens = ['是', '阳性', '有', '异常', '确诊'];
    const negativeTokens = ['否', '阴性', '无', '正常'];
    const target = positive ? positiveTokens : negativeTokens;
    return options.findIndex(opt => {
        const text = String(opt);
        return target.some(token => text.includes(token));
    });
}

function encodeIndicatorValue(indicatorId, rawValue) {
    const meta = INDICATOR_META_MAP[indicatorId];
    if (rawValue === undefined || rawValue === null || rawValue === '') return null;
    if (!meta) {
        const fallback = toNumber(rawValue);
        return fallback === null ? null : fallback;
    }

    if (meta.inputType === 'number') {
        const numeric = toNumber(rawValue);
        if (numeric !== null) return numeric;
        if (isPositive(rawValue)) return 1;
        if (NEGATIVE_SET.has(String(rawValue).trim().toLowerCase())) return 0;
        return null;
    }

    if (meta.inputType === 'select') {
        const options = meta.option || [];
        if (!options.length) {
            const numeric = toNumber(rawValue);
            if (numeric !== null) return numeric;
            if (isPositive(rawValue)) return 1;
            if (NEGATIVE_SET.has(String(rawValue).trim().toLowerCase())) return 0;
            return null;
        }

        const textValue = String(rawValue).trim();
        const exactIndex = options.findIndex(opt => String(opt).trim() === textValue);
        if (exactIndex >= 0) return exactIndex;

        const numberIndex = toNumber(textValue);
        if (numberIndex !== null && numberIndex >= 0 && numberIndex < options.length) {
            return numberIndex;
        }

        if (isPositive(textValue)) {
            const posIndex = findOptionIndexBySemantic(options, true);
            if (posIndex >= 0) return posIndex;
        }
        if (NEGATIVE_SET.has(textValue.toLowerCase())) {
            const negIndex = findOptionIndexBySemantic(options, false);
            if (negIndex >= 0) return negIndex;
        }
        return null;
    }

    return null;
}

function normalizeUserInputMap(item) {
    if (Array.isArray(item.userInput)) {
        return item.userInput.reduce((acc, current) => {
            if (current && current.id) {
                acc[current.id] = current.value;
            }
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
            if (current && current.id) {
                acc[current.id] = current.value;
            }
            return acc;
        }, {});
    }
    return {};
}

Page({
    data: {
        isAuthorized: false,
        userInfo: {},
        tempAvatarUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiNkZWRlZGUiPjxwYXRoIGQ9Ik0xMiAyYy01LjUyMyAwLTEwIDQuNDc3LTEwIDEwczQuNDc3IDEwIDEwIDEwIDEwLTQuNDc3IDEwLTEwLTQuNDc3LTEwLTEwLTEwem0wIDE4Yy00LjQxMSAwLTgtMy41ODktOC04czMuNTg5LTggOC04IDggMy41ODkgOCA4LTMuNTg5IDgtOCA4eiIvPjxwYXRoIGQ9Ik0xMiA2Yy0yLjIxIDAtNC0xLjc5MS00IDRzMS43OSA0IDQgNCA0LTEuNzkgMSAtNC0xLjc5LTQtNC00em0wIDZjLTEuMTAzIDAtMi0uODk3LTItMnMwLjg5Ny0yIDItMiAyIC44OTcgMiAyLS44OTcgMi0yIDJ6bS02IDRjMC0yLjIwOSAxLjc5LTQgNCA0aDh2LTJjMC0xLjEwMy0uODk3LTItMi0yaC00Yy0xLjEwMyAwLTIgLjg5Ny0yIDJ2MnpNMjAgMTRoLTRjLTIuMjA5IDAtNC0xLjc5LTQtNGgtMnYyYzAgMS4xMDMgMC44OTcgMiAyIDJoNHYtMmMwLTIuMjA5LTEuNzktNC00LTRoLTR2MmMwLTEuMTAzLS44OTctMi0yLTJ6Ii8+PC9zdmc+',
        tempNickName: '',
        isAvatarChosen: false,
        radar: {
            lazyLoad: true
        },
        line: {
            lazyLoad: true
        },
        iconDown: icons.chevronDown,
        indicatorList: ALL_INDICATOR_LIST,
        indicatorIndex: 0,
        historyList: [],
        historyLoading: true, // 初始为加载状态
        isHistoryEmpty: false,
        profileAiLoading: false,
        profileAiError: '',
        profileAiText: ''
    },

    chartInstance: null,
    radarChartInstance: null,
    normalizedHistoryRecords: [],
    indicatorSeriesMap: {},
    latestRadarValues: [],
    profileAiSessionId: '',

    onShow() {
        if (!this.profileAiSessionId) {
            this.profileAiSessionId = `profile_ai_${Date.now()}`;
        }
        this.checkAuthStatus();
    },

    checkAuthStatus() {
        const userInfo = app.globalData.userInfo;
        if (userInfo) {
            this.setData({
                isAuthorized: true,
                userInfo: userInfo
            });
            this.initCharts();
            this.loadHistoryData(); // 授权后加载历史
        } else {
            this.setData({
                isAuthorized: false,
                historyList: [],
                isHistoryEmpty: true,
                indicatorList: ALL_INDICATOR_LIST,
                indicatorIndex: 0
            });
            this.normalizedHistoryRecords = [];
            this.indicatorSeriesMap = {};
            this.updateRadarChart();
            this.updateLineChart();
            this.setData({
                profileAiText: '',
                profileAiError: '',
                profileAiLoading: false
            });
        }
    },

    async loadHistoryData() {
        this.setData({
            historyLoading: true,
            isHistoryEmpty: false
        });
        try {
            const res = await wx.cloud.callFunction({
                name: 'history',
                data: {
                    action: 'get'
                }
            });
            console.log('从云函数获取到的原始响应:', res);
            if (res.result && res.result.success) {
                const normalizedRecords = (res.result.data || [])
                    .map(item => {
                        const timestampDate = toDate(item.timestamp) || toDate(item.date);
                        if (!timestampDate) return null;
                        const userInputMap = normalizeUserInputMap(item);
                        const probability = item.predictionResult && typeof item.predictionResult.probability === 'number' ?
                            item.predictionResult.probability :
                            null;
                        return {
                            raw: item,
                            timestampDate,
                            timestampMs: timestampDate.getTime(),
                            userInputMap,
                            probability,
                            predictionResult: item.predictionResult || null
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => b.timestampMs - a.timestampMs);

                const historyList = normalizedRecords
                    .filter(record => typeof record.probability === 'number')
                    .map(record => {
                        const dateParts = formatDate(record.timestampDate);
                        const miscarriagePct = (record.probability * 100).toFixed(1);
                        const liveBirthPct = (100 - Number(miscarriagePct)).toFixed(1);
                        return {
                            ...record.raw,
                            formattedDate: dateParts.formattedDate,
                            formattedTime: dateParts.formattedTime,
                            displayProbability: miscarriagePct,
                            liveBirthDisplay: `${liveBirthPct}%`,
                            badgeBgColor: record.probability < 0.4 ? '#e8f5e9' : '#fff3e0',
                            badgeColor: record.probability < 0.4 ? '#2e7d32' : '#ff8f00'
                        };
                    });

                this.normalizedHistoryRecords = normalizedRecords;
                this.rebuildChartsFromHistory();

                this.setData({
                    historyList: historyList,
                    isHistoryEmpty: historyList.length === 0
                });
                this.requestProfileAiInsight();
            } else {
                throw new Error(res.result.error || '获取历史记录失败');
            }
        } catch (err) {
            console.error('历史记录加载失败 (profile.js):', err);
            this.setData({
                isHistoryEmpty: true,
                indicatorList: ALL_INDICATOR_LIST,
                indicatorIndex: 0,
                profileAiText: '',
                profileAiError: '暂时无法生成图表解读，请检查网络后重试。'
            });
            this.normalizedHistoryRecords = [];
            this.indicatorSeriesMap = {};
            this.rebuildChartsFromHistory();
            wx.showToast({
                title: `加载失败: ${err.message || '请检查网络'}`,
                icon: 'none'
            });
        } finally {
            this.setData({
                historyLoading: false
            });
        }
    },
    rebuildChartsFromHistory() {
        const seriesMap = {};
        ALL_INDICATOR_LIST.forEach(item => {
            seriesMap[item.id] = [];
        });

        this.normalizedHistoryRecords.forEach(record => {
            const axisLabel = formatDate(record.timestampDate).axisLabel;
            Object.keys(record.userInputMap).forEach(indicatorId => {
                if (!seriesMap[indicatorId]) {
                    seriesMap[indicatorId] = [];
                }
                const numeric = encodeIndicatorValue(indicatorId, record.userInputMap[indicatorId]);
                if (numeric === null) return;
                seriesMap[indicatorId].push({
                    timestampMs: record.timestampMs,
                    axisLabel,
                    value: numeric
                });
            });
        });

        Object.keys(seriesMap).forEach(indicatorId => {
            seriesMap[indicatorId].sort((a, b) => a.timestampMs - b.timestampMs);
        });

        this.indicatorSeriesMap = seriesMap;

        const indicatorList = [...ALL_INDICATOR_LIST];

        let nextIndex = this.data.indicatorIndex;
        if (indicatorList.length === 0) {
            nextIndex = 0;
        } else if (nextIndex >= indicatorList.length) {
            nextIndex = 0;
        }

        this.setData({
            indicatorList,
            indicatorIndex: nextIndex
        });
        this.updateRadarChart();
        this.updateLineChart();
    },

    calculateRadarValues() {
        const latestRecord = this.normalizedHistoryRecords[0] || null;
        const latestPredictRecord = this.normalizedHistoryRecords.find(item => typeof item.probability === 'number') || null;
        const baseScore = latestPredictRecord ?
            Math.round((1 - latestPredictRecord.probability) * 40 + 55) :
            72;

        const scoreMap = RADAR_DIMENSIONS.reduce((acc, current) => {
            acc[current.id] = baseScore;
            return acc;
        }, {});

        const riskFactors = latestPredictRecord && latestPredictRecord.predictionResult ?
            (latestPredictRecord.predictionResult.riskFactors || []) :
            [];
        riskFactors.forEach(risk => {
            if (!risk || !risk.title) return;
            const dim = RISK_FACTOR_DIMENSION_MAP[risk.title];
            if (dim && scoreMap[dim] !== undefined) {
                scoreMap[dim] -= 10;
            }
        });

        const latestInput = latestRecord ? latestRecord.userInputMap : {};
        Object.keys(RADAR_RULES).forEach(dim => {
            const rules = RADAR_RULES[dim];
            rules.forEach(rule => {
                const value = latestInput[rule.id];
                if (value === undefined || value === null || value === '') return;
                if (rule.predicate(value)) {
                    scoreMap[dim] -= 8;
                }
            });
        });

        return RADAR_DIMENSIONS.map(dim => clamp(Math.round(scoreMap[dim]), 35, 95));
    },
    buildSelectedIndicatorTrendText() {
        const selectedIndicator = this.data.indicatorList[this.data.indicatorIndex];
        if (!selectedIndicator) {
            return '当前未选择有效指标。';
        }
        const meta = INDICATOR_META_MAP[selectedIndicator.id] || null;
        const seriesData = this.indicatorSeriesMap[selectedIndicator.id] || [];
        if (seriesData.length === 0) {
            return `${selectedIndicator.title} 暂无历史数据。`;
        }
        const first = seriesData[0].value;
        const last = seriesData[seriesData.length - 1].value;
        const delta = last - first;
        if (meta && meta.inputType === 'select' && meta.option.length > 0) {
            const firstLabel = meta.option[first] || first;
            const lastLabel = meta.option[last] || last;
            return `${selectedIndicator.title} 从“${firstLabel}”变化为“${lastLabel}”，变化幅度 ${delta > 0 ? '+' : ''}${delta.toFixed(2)}。`;
        }
        return `${selectedIndicator.title} 从 ${first} 变化到 ${last}，变化幅度 ${delta > 0 ? '+' : ''}${delta.toFixed(2)}。`;
    },
    buildProfileAiQuestion() {
        const radarPairs = RADAR_DIMENSIONS.map((dim, idx) => `${dim.name}:${this.latestRadarValues[idx] || 0}`).join('，');
        const trendText = this.buildSelectedIndicatorTrendText();
        const historyCount = this.normalizedHistoryRecords.length;
        return `请你解读我的个人中心图表。已知六维雷达分数为：${radarPairs}。当前指标曲线解读：${trendText}。我共有 ${historyCount} 条历史记录。请输出：1) 总体状态判断；2) 最关键的2个风险维度；3) 未来2周复查建议（具体到指标与时间）；4) 一句温和提醒。`;
    },
    async requestProfileAiInsight() {
        if (!this.normalizedHistoryRecords.length) {
            this.setData({
                profileAiText: '暂无历史记录，完成至少一次预测后可获得 AI 图表解读。',
                profileAiError: '',
                profileAiLoading: false
            });
            return;
        }
        this.setData({
            profileAiLoading: true,
            profileAiError: ''
        });
        try {
            const question = this.buildProfileAiQuestion();
            const res = await wx.cloud.callFunction({
                name: 'ai-assistant',
                data: {
                    sessionId: this.profileAiSessionId || `profile_ai_${Date.now()}`,
                    fromPage: 'profile',
                    question
                }
            });
            if (res.result && res.result.success) {
                this.setData({
                    profileAiLoading: false,
                    profileAiText: res.result.answer || '当前暂无可用图表解读。'
                });
            } else {
                throw new Error((res.result && res.result.error) || 'AI 解读生成失败');
            }
        } catch (err) {
            console.error('profile ai insight error:', err);
            this.setData({
                profileAiLoading: false,
                profileAiError: 'AI图表解读暂时不可用，您可稍后重试。'
            });
        }
    },
    onRetryProfileAiInsight() {
        this.requestProfileAiInsight();
    },

    // --- 清空历史记录 ---
    handleClearHistory() {
        wx.showModal({
            title: '确认操作',
            content: '确定要清空所有历史记录吗？此操作不可恢复。',
            confirmColor: '#e53e3e',
            // 【关键修复】使用箭头函数，不再需要 .bind(this)，避免语法错误
            success: async (res) => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '正在清空...'
                    });
                    try {
                        const clearRes = await wx.cloud.callFunction({
                            name: 'history',
                            data: {
                                action: 'clear'
                            }
                        });
                        wx.hideLoading();
                        if (clearRes.result && clearRes.result.stats && clearRes.result.stats.removed > 0) {
                            wx.showToast({
                                title: '已清空'
                            });
                            this.loadHistoryData(); // 重新加载以刷新列表
                        } else {
                            wx.showToast({
                                title: '没有可清空的记录',
                                icon: 'none'
                            });
                        }
                    } catch (err) {
                        wx.hideLoading();
                        wx.showToast({
                            title: '操作失败',
                            icon: 'none'
                        });
                    }
                }
            }
        });
    },

    // --- 跳转到历史详情页 ---
    goToHistoryDetail(e) {
        const index = e.currentTarget.dataset.index;
        const historyItem = this.data.historyList[index];

        // 将复杂的对象暂存到全局，避免URL长度限制
        app.globalData.currentHistoryDetail = historyItem;

        wx.navigateTo({
            url: `/pages/historyDetail/historyDetail`
        });
    },

    // --- 你原有的其他函数保持不变 ---
    onChooseAvatar(e) {
        const avatarUrl = e.detail.avatarUrl;
        if (avatarUrl) {
            this.setData({
                tempAvatarUrl: avatarUrl,
                isAvatarChosen: true,
            });
        } else {
            wx.showToast({
                title: '头像选择失败，请重试',
                icon: 'none'
            });
        }
    },
    onNicknameInput(e) {
        this.setData({
            tempNickName: e.detail.value
        });
    },
    handleAuthorize() {
        if (!this.data.isAvatarChosen) {
            wx.showToast({
                title: '请选择头像',
                icon: 'none'
            });
            return;
        }
        if (!this.data.tempNickName) {
            wx.showToast({
                title: '请输入昵称',
                icon: 'none'
            });
            return;
        }
        const authorizedInfo = {
            nickName: this.data.tempNickName,
            avatarUrl: this.data.tempAvatarUrl,
        };
        app.globalData.userInfo = authorizedInfo;
        wx.setStorageSync('userInfo', authorizedInfo);
        wx.showToast({
            title: '授权成功'
        });
        this.checkAuthStatus();
    },
    initCharts() {
        if (this.chartInstance) return;
        this.initRadar();
        this.initLineChart();
    },
    initRadar() {
        this.selectComponent('#radar-chart').init((canvas, width, height, dpr) => {
            const chart = echarts.init(canvas, null, {
                width,
                height,
                devicePixelRatio: dpr
            });
            canvas.setChart(chart);
            this.radarChartInstance = chart;
            this.updateRadarChart();
            return chart;
        });
    },
    updateRadarChart() {
        if (!this.radarChartInstance) return;
        const values = this.calculateRadarValues();
        const option = {
            tooltip: {},
            radar: {
                indicator: RADAR_DIMENSIONS.map(dim => ({
                    name: dim.name,
                    max: 100
                })),
                radius: '65%'
            },
            series: [{
                type: 'radar',
                data: [{
                    value: values,
                    name: '当前状态'
                }],
                areaStyle: {
                    opacity: 0.2
                },
                lineStyle: {
                    width: 2
                }
            }]
        };
        this.latestRadarValues = values;
        this.radarChartInstance.setOption(option, true);
    },
    initLineChart() {
        this.selectComponent('#line-chart').init((canvas, width, height, dpr) => {
            const chart = echarts.init(canvas, null, {
                width,
                height,
                devicePixelRatio: dpr
            });
            canvas.setChart(chart);
            this.chartInstance = chart;
            this.updateLineChart();
            return chart;
        });
    },
    updateLineChart() {
        if (!this.chartInstance) return;
        const selectedIndicator = this.data.indicatorList[this.data.indicatorIndex];
        if (!selectedIndicator) {
            this.chartInstance.setOption({
                title: {
                    text: '暂无可用历史指标',
                    left: 'center',
                    top: 'middle',
                    textStyle: {
                        fontSize: 14,
                        color: '#a0aec0',
                        fontWeight: 'normal'
                    }
                },
                xAxis: {
                    show: false
                },
                yAxis: {
                    show: false
                },
                series: []
            }, true);
            return;
        }

        const selectedMeta = INDICATOR_META_MAP[selectedIndicator.id] || null;
        const seriesData = this.indicatorSeriesMap[selectedIndicator.id] || [];
        const categories = seriesData.map(item => item.axisLabel);
        const values = seriesData.map(item => item.value);
        const isSelectIndicator = selectedMeta && selectedMeta.inputType === 'select' && selectedMeta.option.length > 0;
        const yAxisConfig = isSelectIndicator ? {
            type: 'value',
            min: 0,
            max: selectedMeta.option.length - 1,
            interval: 1,
            axisLabel: {
                formatter: value => selectedMeta.option[value] || ''
            }
        } : {
            type: 'value'
        };
        const option = {
            tooltip: {
                trigger: 'axis',
                formatter: params => {
                    if (!params || !params.length) return '';
                    const point = params[0];
                    const rawValue = point.data;
                    const displayValue = isSelectIndicator ?
                        (selectedMeta.option[rawValue] || rawValue) :
                        rawValue;
                    return `${point.axisValue}<br/>${selectedIndicator.title}: ${displayValue}`;
                }
            },
            legend: {
                data: [selectedIndicator.title]
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: categories
            },
            yAxis: yAxisConfig,
            series: [{
                name: selectedIndicator.title,
                data: values,
                type: 'line',
                smooth: true,
                showSymbol: true,
                symbolSize: 6,
                lineStyle: {
                    width: 2
                },
                itemStyle: {
                    color: '#6C63FF'
                }
            }]
        };
        this.chartInstance.setOption(option, true);
    },
    bindPickerChange(e) {
        const selectedIndex = e.detail.value;
        this.setData({
            indicatorIndex: selectedIndex
        });
        this.updateLineChart();
        this.requestProfileAiInsight();
    }
});