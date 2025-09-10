// pages/historyDetail/historyDetail.js
const app = getApp();

Page({
    data: {
        isLoading: true,
        record: null,
        isError: false,
        errorMessage: ''
    },

    onLoad(options) {
        if (options.id) {
            this.getHistoryDetail(options.id);
        } else {
            this.setData({
                isLoading: false,
                isError: true,
                errorMessage: '无法获取历史记录ID，请返回重试。'
            });
        }
    },

    async getHistoryDetail(recordId) {
        this.setData({ isLoading: true, isError: false });
        try {
            const res = await wx.cloud.callFunction({
                name: 'getUserData',
                data: {
                    action: 'getHistoryDetail',
                    id: recordId
                }
            });

            if (res.result && res.result.success) {
                const record = res.result.record;

                // 格式化日期
                const date = new Date(record.createdAt);
                record.displayDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

                // 格式化预测结果
                record.predictionResult.probability = (record.predictionResult.probability * 100).toFixed(1);
                record.predictionResult.confidenceInterval = [
                    (record.predictionResult.confidenceInterval.lower * 100).toFixed(1),
                    (record.predictionResult.confidenceInterval.upper * 100).toFixed(1)
                ];

                // 最终修复：增加对 userInput 数据的健壮性判断和值转换
                let formattedUserInput = [];
                const userInputData = record.userInput || {};
                
                // 确保 userInputData 是一个对象，且不是数组
                if (typeof userInputData === 'object' && !Array.isArray(userInputData)) {
                    // 遍历所有键，并为每个指标创建一个格式化的对象
                    formattedUserInput = Object.keys(userInputData).map(key => {
                        const item = userInputData[key];
                        let valueToDisplay = '';
                        let labelToDisplay = '';

                        if (typeof item === 'object' && item !== null && item.hasOwnProperty('label') && item.hasOwnProperty('value')) {
                            // 新数据格式：优先使用 label
                            labelToDisplay = item.label;
                            // 检查 value 是否为 0 或 1，并进行转换
                            if (item.value === 1) {
                                valueToDisplay = '阳性';
                            } else if (item.value === 0) {
                                valueToDisplay = '阴性';
                            } else {
                                // 对于非二元数据，直接使用原始值
                                valueToDisplay = item.value;
                            }
                        } else {
                            // 旧数据格式：使用键作为临时标签，并根据值进行转换
                            labelToDisplay = key; 
                            if (item === 1) {
                                valueToDisplay = '阳性';
                            } else if (item === 0) {
                                valueToDisplay = '阴性';
                            } else {
                                // 对于非二元数据，直接使用原始值
                                valueToDisplay = item;
                            }
                        }
                        
                        return { label: labelToDisplay, value: valueToDisplay };
                    });
                } else if (Array.isArray(userInputData)) {
                    // 如果 userInput 已经是数组，则遍历并转换其中的二元值
                    formattedUserInput = userInputData.map(item => {
                        let valueToDisplay = item.value;
                        if (valueToDisplay === 1) {
                            valueToDisplay = '阳性';
                        } else if (valueToDisplay === 0) {
                            valueToDisplay = '阴性';
                        }
                        return { label: item.label, value: valueToDisplay };
                    });
                }

                record.userInput = formattedUserInput;

                this.setData({
                    record: record,
                    isLoading: false,
                    isError: false // 成功加载后，清除错误状态
                });
            } else {
                // 云函数返回失败
                throw new Error(res.result.message || '获取详情失败');
            }
        } catch (err) {
            // 代码执行中发生错误
            console.error('获取历史记录详情失败:', err);
            this.setData({
                isLoading: false,
                isError: true,
                errorMessage: '获取历史记录详情失败，请稍后重试。'
            });
        }
    }
});