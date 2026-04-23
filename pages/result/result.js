// pages/result/result.js
const app = getApp();

Page({
    lastUserInputData: null,
    lastPredictResult: null,
    data: {
        isLoading: true,
        isError: false,
        errorMessage: '',
        resultData: null,
        riskFactors: [], // 存储风险项列表
        aiReportLoading: false,
        aiReportError: '',
        aiReportText: '',
        temporalHighlights: []
    },

    onLoad(options) {
        if (options.data) {
            try {
                const userInputData = JSON.parse(decodeURIComponent(options.data));
                this.callPredictFunction(userInputData);
            } catch (e) {
                this.setData({
                    isLoading: false,
                    isError: true,
                    errorMessage: '数据传递异常，请返回重试。'
                });
            }
        } else {
            this.setData({
                isLoading: false,
                isError: true,
                errorMessage: '无法获取预测数据，请返回重试。'
            });
        }
    },

    async callPredictFunction(userInputData) {
        this.lastUserInputData = userInputData;
        this.setData({
            isLoading: true,
            isError: false
        });

        try {
            console.log('接收到待预测的数据:', userInputData);

            const res = await wx.cloud.callFunction({
                name: 'predict',
                data: {
                    userInput: userInputData
                }
            });

            console.log('云函数返回结果:', res.result);

            if (res.result && res.result.success) {
                const result = res.result;
                this.lastPredictResult = result;
                
                // --- 【核心修改开始】 ---
                // 模型输出的是 result.probability (流产概率)
                // 我们需要展示的是 (1 - 流产概率) = 顺产/保胎成功概率
                
                const miscarriageProb = result.probability; 
                const liveBirthProb = 1 - miscarriageProb;

                // 置信区间也需要反转：[L, U] -> [1-U, 1-L]
                // 例如流产区间 [0.7, 0.9] -> 顺产区间 [0.1, 0.3]
                const rawLower = result.confidenceInterval.lower;
                const rawUpper = result.confidenceInterval.upper;
                
                let liveBirthLower = 1 - rawUpper;
                let liveBirthUpper = 1 - rawLower;

                // 简单的边界保护，防止浮点数计算出现 -0.00...
                liveBirthLower = Math.max(0, liveBirthLower);
                liveBirthUpper = Math.min(1, liveBirthUpper);

                this.setData({
                    isLoading: false,
                    isError: false,
                    resultData: {
                        // 这里展示的是反转后的【顺产概率】
                        probability: (liveBirthProb * 100).toFixed(1),
                        confidenceInterval: [
                            (liveBirthLower * 100).toFixed(1),
                            (liveBirthUpper * 100).toFixed(1)
                        ],
                        influencingFactors: [] 
                    },
                    // 风险因素列表保持不变，依然提示哪些指标导致了高风险
                    riskFactors: result.riskFactors || []
                });
                this.generateAiReport(userInputData, result);
                // --- 【核心修改结束】 ---

            } else {
                throw new Error(res.result.error || '预测服务返回未知错误');
            }
        } catch (err) {
            console.error('wx.cloud.callFunction failed:', err);
            this.setData({
                isLoading: false,
                isError: true,
                errorMessage: '预测服务调用失败，请检查网络后重试。'
            });
        }
    },
    async generateAiReport(userInputData, predictResult) {
        this.setData({
            aiReportLoading: true,
            aiReportError: '',
            aiReportText: '',
            temporalHighlights: []
        });
        try {
            const llmRes = await wx.cloud.callFunction({
                name: 'llm-report',
                data: {
                    userInput: userInputData,
                    predictResult: predictResult
                }
            });

            if (llmRes.result && llmRes.result.success) {
                this.setData({
                    aiReportLoading: false,
                    aiReportText: llmRes.result.reportText || '当前暂无智能解读，请稍后再试。',
                    temporalHighlights: llmRes.result.temporalHighlights || []
                });
            } else {
                throw new Error((llmRes.result && llmRes.result.error) || '报告生成失败');
            }
        } catch (err) {
            console.error('LLM report failed:', err);
            this.setData({
                aiReportLoading: false,
                aiReportError: '智能报告暂时不可用，您可稍后重试。'
            });
        }
    },
    onRetryAiReport() {
        if (!this.lastUserInputData || !this.lastPredictResult) {
            wx.showToast({
                title: '重试失败，请返回后重试',
                icon: 'none'
            });
            return;
        }
        this.generateAiReport(this.lastUserInputData, this.lastPredictResult);
    },
    goToAIChatFromResult() {
        const question = this.data.riskFactors && this.data.riskFactors.length
            ? `我这次的主要风险是：${this.data.riskFactors.slice(0, 3).map(i => i.title).join('、')}。请给我未来两周的行动清单。`
            : '请根据我这次的预测结果，给出未来两周的复查和生活管理建议。';
        wx.navigateTo({
            url: `/pages/aiChat/aiChat?from=result&prefill=${encodeURIComponent(question)}`
        });
    },

    onRetry() {
        wx.reLaunch({
            url: '/pages/prediction/prediction'
        });
    }
})