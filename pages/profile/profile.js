import * as echarts from '../../lib/ec-canvas/echarts';
const {
    icons
} = require('../../utils/icons.js');
const app = getApp();

const allIndicatorsData = {
    'hgb': {
        title: '血红蛋白 (HGB)',
        categories: ['1月', '2月', '3月', '4月', '5月'],
        series: [{
            name: '血红蛋白',
            data: [110, 112, 115, 120, 118],
            type: 'line',
            smooth: true,
            color: '#8884d8'
        }]
    },
    'tsh': {
        title: '促甲状腺激素 (TSH)',
        categories: ['1月', '2月', '3月', '4月', '5月'],
        series: [{
            name: '促甲状腺激素',
            data: [3.0, 2.8, 2.5, 2.4, 2.6],
            type: 'line',
            smooth: true,
            color: '#82ca9d'
        }]
    },
    'pt': {
        title: '凝血酶原时间 (PT)',
        categories: ['1月', '2月', '3月', '4月', '5月'],
        series: [{
            name: '凝血酶原时间',
            data: [13.0, 12.8, 12.5, 12.6, 12.7],
            type: 'line',
            smooth: true,
            color: '#ffc658'
        }]
    }
};
const mockRadarData = [{
    value: [80, 90, 65, 75, 85, 70],
    name: '个人状态'
}];
const radarIndicator = [{
        name: '免疫',
        max: 100
    }, {
        name: '凝血',
        max: 100
    }, {
        name: '内分泌',
        max: 100
    },
    {
        name: '血液学与营养',
        max: 100
    }, {
        name: '人口学与病史',
        max: 100
    }, {
        name: '子宫动脉',
        max: 100
    },
];

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
        indicatorList: Object.keys(allIndicatorsData).map(key => ({
            id: key,
            title: allIndicatorsData[key].title
        })),
        indicatorIndex: 0,
        historyList: [],
        historyLoading: true, // 初始为加载状态
        isHistoryEmpty: false,
    },

    chartInstance: null,

    onShow() {
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
                const historyList = res.result.data.map(item => {
                    const date = new Date(item.timestamp);
                    const probability = item.predictionResult.probability;

                    return {
                        ...item,
                        formattedDate: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
                        formattedTime: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
                        displayProbability: (probability * 100).toFixed(1),
                        badgeBgColor: probability > 0.6 ? '#e8f5e9' : '#fff3e0',
                        badgeColor: probability > 0.6 ? '#2e7d32' : '#ff8f00'
                    };
                });

                this.setData({
                    historyList: historyList,
                    isHistoryEmpty: historyList.length === 0
                });
            } else {
                throw new Error(res.result.error || '获取历史记录失败');
            }
        } catch (err) {
            console.error('历史记录加载失败 (profile.js):', err);
            this.setData({
                isHistoryEmpty: true
            });
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
            const option = {
                tooltip: {},
                radar: {
                    indicator: radarIndicator,
                    radius: '65%'
                },
                series: [{
                    type: 'radar',
                    data: mockRadarData
                }]
            };
            chart.setOption(option);
            return chart;
        });
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
        const chartData = allIndicatorsData[selectedIndicator.id];
        const option = {
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: chartData.series.map(s => s.name)
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
                data: chartData.categories
            },
            yAxis: {
                type: 'value'
            },
            series: chartData.series
        };
        this.chartInstance.setOption(option, true);
    },
    bindPickerChange(e) {
        const selectedIndex = e.detail.value;
        this.setData({
            indicatorIndex: selectedIndex
        });
        this.updateLineChart();
    }
});