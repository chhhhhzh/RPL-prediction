// pages/historyDetail/historyDetail.js
const app = getApp();

Page({
    data: {
        historyRecord: null,
        displayData: {
            probability: '0.0',
            confidenceInterval: '[0.0% - 0.0%]'
        },
        indicatorLabels: {
            'ANA': 'ANA (抗核抗体)',
            'titer': 'ANA 滴度',
            'KSL-DNA': '抗双链DNA抗体',
            'ACLIgG': '抗心磷脂抗体IgG',
            'ACLIgM': '抗心磷脂抗体IgM',
            'B2-GDP1IgM': '抗β2-糖蛋白I IgM',
            'B2-GDP1IgG/B2-GDP1-IgA': '抗β2-糖蛋白I IgG/IgA',
            '25-VITD': '25-羟基维生素D',
            'LA': '狼疮抗凝物',
            'C3': '补体C3',
            'C4': '补体C4',
            'pattern': 'ANA pattern',
            'RF/PS/Jo/HHCY': 'RF/PS/Jo/HHCY',
            'KS-A': '抗角质素硫酸抗体',
            'ACA': '抗心磷脂抗体',
            'KSS-B': '抗KSS抗体',
            'ASc1-70': '抗Scl-70抗体',
            'AAE': '抗血管内皮细胞抗体',
            'KRO52': '抗Ro52抗体',
            'ENA': '可提取核抗原抗体谱',
            'HTT': 'HTT',
            'APMSCL': '抗PM/Scl抗体',
            'aU1-nRNP': '抗U1-nRNP抗体',
            'Sm': '抗Sm抗体',
            'AHA': '抗组蛋白抗体',
            'AMM2A': '抗线粒体M2抗体',
            'TGAb': '甲状腺球蛋白抗体',
            'TPOAb': '甲状腺过氧化物酶抗体'
        },
        // 定义二元特征列表（0/1 需要转换为阴性/阳性的指标）
        binaryFeatures: [
            'ANA', 'KSL-DNA', 'ACLIgG', 'ACLIgM', 'B2-GDP1IgM', 'B2-GDP1IgG/B2-GDP1-IgA',
            'LA', 'KS-A', 'ACA', 'KSS-B', 'ASc1-70', 'AAE', 'KRO52', 'ENA', 'HTT',
            'APMSCL', 'aU1-nRNP', 'Sm', 'AHA', 'AMM2A', 'TGAb', 'TPOAb'
        ],
        // 定义多元特征的映射
        patternMapping: {
            '0': '正常',
            '1': '颗粒型',
            '2': '胞浆颗粒型',
            '3': '核颗粒型',
            '4': '核仁型',
            '5': '核均质型',
            '6': '染色体型',
            '7': '高尔基型',
            '8': '无核型',
            '9': '核少点型',
            '10': '核膜型',
            '11': '核着丝点型',
            '12': '线粒体型',
            '13': '斑点型'
        },
        rfMapping: {
            '0': '无',
            '1': 'RF',
            '2': 'PS',
            '3': 'Jo',
            '4': 'HHCY'
        }
    },

    onLoad(options) {
        const record = app.globalData.currentHistoryDetail;
        if (record) {
            // 处理用户输入数据，转换各种类型的值为可读格式
            const processedRecord = {
                ...record,
                userInput: this.processUserInputValues(record.userInput)
            };
            
            this.setData({
                historyRecord: processedRecord,
                displayData: {
                    probability: (record.predictionResult.probability * 100).toFixed(1),
                    confidenceInterval: `[${(record.predictionResult.confidenceInterval.lower * 100).toFixed(1)}% - ${(record.predictionResult.confidenceInterval.upper * 100).toFixed(1)}%]`
                }
            });
            app.globalData.currentHistoryDetail = null; // 清除全局数据
        } else {
            wx.showToast({
                title: '无法加载记录',
                icon: 'error',
                duration: 2000,
                complete: () => {
                    setTimeout(() => {
                        wx.navigateBack();
                    }, 2000);
                }
            })
        }
    },

    /**
     * @description 处理用户输入值，将不同类型的特征转换为可读格式
     * @param {Object} userInput 用户输入对象
     * @returns {Array} 处理后的用户输入数组
     */
    processUserInputValues(userInput) {
        // 如果输入是对象，转换为数组格式
        let inputArray = [];
        
        if (typeof userInput === 'object' && !Array.isArray(userInput)) {
            // 将对象转换为数组
            inputArray = Object.keys(userInput).map(key => ({
                id: key,
                label: this.data.indicatorLabels[key] || key,
                value: userInput[key]
            }));
        } else if (Array.isArray(userInput)) {
            inputArray = userInput;
        } else {
            return [];
        }
        
        return inputArray.map(item => {
            if (!item || typeof item !== 'object') {
                return item;
            }
            
            let displayValue = item.value;
            
            // 处理不同类型的特征
            if (item.id === 'pattern') {
                // 处理 pattern 特征
                displayValue = this.data.patternMapping[String(item.value)] || `未知模式(${item.value})`;
            } else if (item.id === 'RF/PS/Jo/HHCY') {
                // 处理 RF/PS/Jo/HHCY 特征
                displayValue = this.data.rfMapping[String(item.value)] || `未知类型(${item.value})`;
            } else if (this.data.binaryFeatures.includes(item.id)) {
                // 处理二元特征
                if (item.value === 1 || item.value === '1') {
                    displayValue = '阳性';
                } else if (item.value === 0 || item.value === '0') {
                    displayValue = '阴性';
                } else {
                    displayValue = item.value || '未检测';
                }
            } else {
                // 数值特征保持原值
                displayValue = item.value;
            }
            
            return {
                ...item,
                label: this.data.indicatorLabels[item.id] || item.id,
                displayValue: displayValue
            };
        });
    },

    /**
     * @description 处理返回按钮点击事件
     */
    goBack() {
        wx.navigateBack();
    }
});