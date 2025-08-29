const app = getApp();
const {
    modulesConfig
} = require('../../utils/data.js');
const {
    icons
} = require('../../utils/icons.js');

Page({
    data: {
        modules: Object.values(modulesConfig),
        iconUpload: icons.testTube
    },
    onLoad() {
        if (!app.globalData.predictionData) {
            app.globalData.predictionData = JSON.parse(JSON.stringify(modulesConfig));
        }
    },

    goToModuleDetail(e) {
        const moduleId = e.currentTarget.dataset.moduleid;
        wx.navigateTo({
            url: `/pages/moduleDetail/moduleDetail?id=${moduleId}`,
        })
    },

    _mergeOcrData(ocrData) {
        // 使用 modulesConfig 作为基础，以确保所有字段都存在
        let currentData = JSON.parse(JSON.stringify(modulesConfig));

        // 遍历 OCR 数据，只更新 currentData 中的指标值
        for (const moduleId in ocrData) {
            if (currentData[moduleId]) {
                ocrData[moduleId].indicators.forEach(newIndicator => {
                    const currentIndicator = currentData[moduleId].indicators.find(
                        ind => ind.id === newIndicator.id
                    );
                    if (currentIndicator && (!currentIndicator.value || currentIndicator.value === '') && newIndicator.value) {
                        currentIndicator.value = newIndicator.value;
                    }
                });
            }
        }
        
        // 关键修改：将全局数据也更新为这个完整的新对象
        app.globalData.predictionData = currentData;
        
        // 重新构建 modules 数据，确保图标等信息完整
        this.setData({
            modules: Object.values(app.globalData.predictionData)
        });

        // 以下是原始的 Toast 提示逻辑
        // ...
        const updatedFields = [];
        for (const moduleId in ocrData) {
            if (modulesConfig[moduleId]) {
                ocrData[moduleId].indicators.forEach(newIndicator => {
                    const originalIndicator = modulesConfig[moduleId].indicators.find(ind => ind.id === newIndicator.id);
                    if (originalIndicator && newIndicator.value) {
                        // 假设 OCR 只返回有值的指标
                        updatedFields.push(originalIndicator.label);
                    }
                });
            }
        }

        if (updatedFields.length > 0) {
            const toastTitle = `已补充：${updatedFields.join('、')}`;
            wx.showToast({
                title: toastTitle,
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

    handlePredict() {
        const predictionData = app.globalData.predictionData;
        const isAllFilled = Object.values(predictionData).every(module => module.indicators.some(ind => ind.value !== ''));
        if (!isAllFilled) {
            wx.showModal({
                title: '提示',
                content: '请至少在每个模块中填写一项指标',
                showCancel: false
            });
            return;
        }
        wx.navigateTo({
                 url: '/pages/result/result',
             })
    }
});