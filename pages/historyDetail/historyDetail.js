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
        }
    },

    onLoad(options) {
        const record = app.globalData.currentHistoryDetail;
        if (record) {
            this.setData({
                historyRecord: record,
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
     * @description 处理返回按钮点击事件
     */
    goBack() {
        wx.navigateBack();
    }
});