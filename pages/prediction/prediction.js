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
            if (app.initPredictionData) {
                app.initPredictionData();
            } else {
                // 兜底初始化，防止 app.js 中没有定义该方法
                app.globalData.predictionData = JSON.parse(JSON.stringify(modulesConfig));
            }
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
    goToAIChat() {
        const userInputData = this._prepareInputData();
        const filledCount = Object.keys(userInputData).length;
        const question = filledCount > 0
            ? `我目前已录入 ${filledCount} 项指标，请告诉我还应优先补充哪些关键指标，才能让预测更可靠？`
            : '我还没开始录入，请告诉我最关键的前5项指标应该先填什么。';
        wx.navigateTo({
            url: `/pages/aiChat/aiChat?from=prediction&prefill=${encodeURIComponent(question)}`
        });
    },

    // 清空数据
    handleClearData() {
        wx.showModal({
            title: '确认操作',
            content: '确定要清空所有已填写的指标吗？',
            success: (res) => {
                if (res.confirm) {
                    // 调用 app.js 中的全局清空函数
                    if (app.clearPredictionData) {
                        app.clearPredictionData();
                    } else {
                        // 兜底清空
                        app.globalData.predictionData = JSON.parse(JSON.stringify(modulesConfig));
                    }
                    
                    // 重新从已清空的全局数据加载到当前页面，刷新界面
                    this.setData({
                        modules: Object.values(app.globalData.predictionData)
                    });
                    wx.showToast({
                        title: '数据已清空',
                        icon: 'success',
                        duration: 1500
                    });
                }
            }
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

    // --- 【更新】的数据准备函数 ---
    _prepareInputData() {
        const predictionData = app.globalData.predictionData;
        const userInput = {};
        if (!predictionData) return userInput;

        // 【核心修改】：
        // 不再使用硬编码的映射表。
        // 因为新的 index.js (云函数) 和 data.js 已经设计为 ID 对应。
        // 云函数会根据 data.js 中的 id 直接查找对应的模型特征，并在云端处理文本到数值的转换（如 '阳性'->1, '颗粒型'->1）。
        
        for (const moduleId in predictionData) {
            const module = predictionData[moduleId];
            if (module.indicators) {
                for (const indicator of module.indicators) {
                    // 只处理有输入值的指标
                    if (indicator.value !== null && indicator.value !== '' && indicator.value !== undefined) {
                        // 直接使用 indicator.id 作为键名传递给云函数
                        // 云函数中的 keyMap 会负责将其映射到中文特征名
                        userInput[indicator.id] = indicator.value;
                    }
                }
            }
        }

        return userInput;
    },

    // OCR 识别结果合并 (保持原有逻辑)
    _mergeOcrData(ocrData) {
        let currentData = JSON.parse(JSON.stringify(modulesConfig));
        // 如果全局已有数据，基于全局数据更新，防止覆盖用户手动修改
        if(app.globalData.predictionData) {
             currentData = app.globalData.predictionData;
        }

        const updatedFields = [];

        for (const moduleId in ocrData) {
            // 确保模块存在
            if (currentData[moduleId]) {
                ocrData[moduleId].indicators.forEach(newIndicator => {
                    const currentIndicator = currentData[moduleId].indicators.find(ind => ind.id === newIndicator.id);
                    
                    // 逻辑：如果当前没有值，或者是OCR识别出来的新值，则填入
                    // 这里采用简单的覆盖策略：如果 OCR 有值，就覆盖（或者您可以改为只填补空缺）
                    // 原代码逻辑：if (currentIndicator && (!currentIndicator.value || currentIndicator.value === '') && newIndicator.value)
                    // 保持原代码逻辑：只填补空缺
                    if (currentIndicator && (!currentIndicator.value || currentIndicator.value === '') && newIndicator.value) {
                        currentIndicator.value = newIndicator.value;
                        updatedFields.push(currentIndicator.label);
                    }
                });
            }
        }

        app.globalData.predictionData = currentData;
        
        this.setData({
            modules: Object.values(app.globalData.predictionData)
        });

        if (updatedFields.length > 0) {
            wx.showToast({
                title: `已补充：${updatedFields.slice(0, 3).join('、')}${updatedFields.length > 3 ? '等' : ''}`,
                icon: 'none',
                duration: 3000
            });
        } else {
            wx.showToast({
                title: '未识别到有效新数据',
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
                                title: (result && result.message) || '识别失败',
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