const app = getApp();
const {
    modulesConfig
} = require('../../utils/data.js');
const {
    icons
} = require('../../utils/icons.js');

Page({
    data: {
        modules: [], // 初始为空，在onShow中加载
        iconUpload: icons.testTube
    },

    // 每次进入或返回该页面时，都从全局加载最新数据，确保界面同步
    onShow() {
        if (app.globalData.predictionData) {
            this.setData({
                modules: Object.values(app.globalData.predictionData)
            });
        } else {
            // 如果全局数据意外丢失，则重新初始化
            app.initPredictionData();
            this.setData({
                modules: Object.values(app.globalData.predictionData)
            });
        }
    },

    goToModuleDetail(e) {
        const moduleId = e.currentTarget.dataset.moduleid;
        wx.navigateTo({
            url: `/pages/moduleDetail/moduleDetail?id=${moduleId}`,
        });
    },

    handlePredict() {
        // 1. 从全局数据中提取用户输入的、有值的指标
        const userInputData = this._prepareInputData();

        // 2. 进行严格的空值验证
        if (Object.keys(userInputData).length === 0) {
            wx.showModal({
                title: '无法预测',
                content: '请至少填写一项有效的指标才能进行预测。',
                showCancel: false
            });
            return; // 验证失败，终止执行
        }

        console.log('验证通过，准备传递给结果页的数据:', userInputData);

        // 验证通过，将准备好的数据通过URL参数传递给结果页
        // 我们将数据转换为JSON字符串进行传递，并编码以防特殊字符
        wx.navigateTo({
            url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify(userInputData))}`,
        });
    },

    // 数据准备函数，负责将全局数据转换为干净的 key-value 对象 ---
    _prepareInputData() {
        const predictionData = app.globalData.predictionData;
        const userInput = {};
        if (!predictionData) return userInput;

        for (const moduleId in predictionData) {
            const module = predictionData[moduleId];
            for (const indicator of module.indicators) {
                // 只处理有值的指标
                if (indicator.value !== null && indicator.value !== '') {
                    // 如果是下拉选择类型
                    if (indicator.inputType === 'select') {
                        // "阳性" 转换为 1, "阴性" 或其他选项（如"正常"）转换为 0
                        userInput[indicator.id] = (indicator.value === '阳性' || indicator.value === 'RF' || indicator.value === 'PS' || indicator.value === 'Jo' || indicator.value === 'HHCY') ? 1 : 0;
                    } else {
                        // 其他文本输入类型，直接使用其值
                        userInput[indicator.id] = indicator.value;
                    }
                }
            }
        }
        return userInput;
    },

    // OCR
    _mergeOcrData(ocrData) {
        let currentData = JSON.parse(JSON.stringify(modulesConfig));
        for (const moduleId in ocrData) {
            if (currentData[moduleId]) {
                ocrData[moduleId].indicators.forEach(newIndicator => {
                    const currentIndicator = currentData[moduleId].indicators.find(ind => ind.id === newIndicator.id);
                    if (currentIndicator && (!currentIndicator.value || currentIndicator.value === '') && newIndicator.value) {
                        currentIndicator.value = newIndicator.value;
                    }
                });
            }
        }
        app.globalData.predictionData = currentData;
        this.setData({
            modules: Object.values(app.globalData.predictionData)
        });
        const updatedFields = [];
        for (const moduleId in ocrData) {
            if (modulesConfig[moduleId]) {
                ocrData[moduleId].indicators.forEach(newIndicator => {
                    const originalIndicator = modulesConfig[moduleId].indicators.find(ind => ind.id === newIndicator.id);
                    if (originalIndicator && newIndicator.value) {
                        updatedFields.push(originalIndicator.label);
                    }
                });
            }
        }
        if (updatedFields.length > 0) {
            wx.showToast({
                title: `已补充：${updatedFields.join('、')}`,
                icon: 'none',
                duration: 3000
            });
        } else {
            wx.showToast({
                title: '未补充任何新数据',
                icon: 'none',
                duration: 2000
            });
        }
    },
    _processFile(tempFilePath, fileName) {
        wx.showLoading({
            title: '正在上传并识别...',
            mask: true
        });
        const cloudPath = `ocr-uploads/${Date.now()}-${fileName}`;
        wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: tempFilePath,
            success: (uploadRes) => {
                const fileID = uploadRes.fileID;
                console.log('文件上传成功，fileID:', fileID);
                wx.cloud.callFunction({
                    name: 'ocr-recognize',
                    data: {
                        fileID: fileID
                    },
                    success: (ocrRes) => {
                        wx.hideLoading();
                        const result = ocrRes.result;
                        if (result && result.updatedData) {
                            this._mergeOcrData(result.updatedData);
                        } else {
                            console.error('云函数识别失败，返回结果：', ocrRes);
                            wx.showToast({
                                title: result.message || '识别失败',
                                icon: 'none'
                            });
                        }
                    },
                    fail: (err) => {
                        wx.hideLoading();
                        console.error('云函数调用失败', err);
                        wx.showToast({
                            title: '识别服务异常',
                            icon: 'none'
                        });
                    }
                });
            },
            fail: (err) => {
                wx.hideLoading();
                console.error('文件上传失败', err);
                wx.showToast({
                    title: '文件上传失败',
                    icon: 'none'
                });
            }
        });
    },
    handleUpload() {
        wx.showActionSheet({
            itemList: [
                '从本地相册选择图片 (JPEG/HEIC/PNG/JPG)',
                '从微信聊天记录选择文件 (PDF/图片)'
            ],
            success: (res) => {
                if (res.tapIndex === 0) {
                    wx.chooseMedia({
                        count: 1,
                        mediaType: ['image'],
                        sourceType: ['album'],
                        success: (mediaRes) => {
                            if (mediaRes.tempFiles && mediaRes.tempFiles.length > 0) {
                                const tempFilePath = mediaRes.tempFiles[0].tempFilePath;
                                const fileName = 'photo.jpg';
                                this._processFile(tempFilePath, fileName);
                            }
                        },
                        fail: (err) => {
                            console.error('从相册选择失败', err);
                        }
                    });
                } else if (res.tapIndex === 1) {
                    wx.chooseMessageFile({
                        count: 1,
                        type: 'all',
                        success: (msgRes) => {
                            if (msgRes.tempFiles && msgRes.tempFiles.length > 0) {
                                const tempFilePath = msgRes.tempFiles[0].path;
                                const fileName = msgRes.tempFiles[0].name;
                                this._processFile(tempFilePath, fileName);
                            }
                        },
                        fail: (err) => {
                            console.error('从微信聊天记录选择失败', err);
                        }
                    });
                }
            },
            fail: (err) => {
                console.error('显示选择弹窗失败', err);
            }
        });
    },
});