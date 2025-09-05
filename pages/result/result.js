const app = getApp();

Page({
    data: {
        // isLoading: 用于控制加载动画的显示
        // isError: 用于显示错误提示
        // resultData: 存储最终的预测结果
        isLoading: true,
        isError: false,
        errorMessage: '',
        resultData: null
    },

    onLoad(options) {
        // 从页面启动参数 options 中获取数据
        if (options.data) {
            try {
                // 将传递过来的JSON字符串解码并转换回对象
                const userInputData = JSON.parse(decodeURIComponent(options.data));
                // 直接调用云函数
                this.callPredictFunction(userInputData);
            } catch (e) {
                // 如果数据解析失败，显示错误
                this.setData({
                    isLoading: false,
                    isError: true,
                    errorMessage: '数据传递异常，请返回重试。'
                });
            }
        } else {
            // 如果没有数据传递过来，则显示错误
            this.setData({
                isLoading: false,
                isError: true,
                errorMessage: '无法获取预测数据，请返回重试。'
            });
        }
    },

    // 函数现在接收一个参数，不再自己准备数据
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
                // 预测成功，处理并设置结果
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
                    }
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

    // 点击重试按钮的逻辑 (调用失败时出现)
    onRetry() {
        // 因为数据已经丢失，最好的方式是返回上一页让用户重新提交
        wx.navigateBack();
    }
});