// pages/result/result.js
const app = getApp();

Page({
    data: {
        isLoading: true,
        isError: false,
        errorMessage: '',
        resultData: null,
        riskFactors: [] // 新增：存储风险项列表
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
                this.setData({
                    isLoading: false,
                    isError: false,
                    resultData: {
                        probability: (result.probability * 100).toFixed(1),
                        confidenceInterval: [
                            (result.confidenceInterval.lower * 100).toFixed(1),
                            (result.confidenceInterval.upper * 100).toFixed(1)
                        ],
                        influencingFactors: [] // 暂时留空
                    },
                    // --- 修改：接收并设置风险项数据 ---
                    riskFactors: result.riskFactors || []
                });
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

    onRetry() {
        wx.reLaunch({
            url: '/pages/prediction/prediction'
        });
    }
});