const app = getApp();
const {
    modulesConfig
} = require('../../utils/data.js');
const {
    icons
} = require('../../utils/icons.js');

Page({
    data: {
        modules: [],
        iconUpload: icons.upload
    },
    onLoad() {
        this.setData({
            modules: Object.values(modulesConfig)
        });
    },
    goToModuleDetail(e) {
        const moduleId = e.currentTarget.dataset.moduleid;
        wx.navigateTo({
            url: `/pages/moduleDetail/moduleDetail?id=${moduleId}`,
        })
    },
    handleUpload() {
        // 1. 引导用户选择文件（图片或PDF）
        wx.chooseMessageFile({
            count: 1, // 只允许选一个文件
            type: 'all', // 'image' 或 'file'
            success: (res) => {
                const tempFilePath = res.tempFiles[0].path;
                const fileName = res.tempFiles[0].name;

                wx.showLoading({
                    title: '正在上传并识别...',
                    mask: true
                });

                // 2. 上传文件到云存储
                const cloudPath = `ocr-uploads/${Date.now()}-${fileName}`;
                wx.cloud.uploadFile({
                    cloudPath: cloudPath,
                    filePath: tempFilePath,
                    success: (uploadRes) => {
                        const fileID = uploadRes.fileID;

                        // 3. 调用云函数进行识别
                        wx.cloud.callFunction({
                            name: 'ocr-recognize',
                            data: {
                                fileID: fileID
                            },
                            success: (ocrRes) => {
                                wx.hideLoading();
                                const result = ocrRes.result;

                                if (result.success) {
                                    // 4. 更新全局数据并提示用户
                                    app.globalData.predictionData = result.updatedData;
                                    wx.showModal({
                                        title: '识别完成',
                                        content: `成功为您自动填入了 ${result.filledCount} 项指标，请点击各个模块进行核对。`,
                                        showCancel: false
                                    });
                                } else {
                                    wx.showToast({
                                        title: '识别失败: ' + result.error,
                                        icon: 'none'
                                    });
                                }
                            },
                            fail: (err) => {
                                wx.hideLoading();
                                wx.showToast({
                                    title: '调用识别服务失败',
                                    icon: 'none'
                                });
                            }
                        });
                    },
                    fail: (err) => {
                        wx.hideLoading();
                        wx.showToast({
                            title: '上传失败',
                            icon: 'none'
                        });
                    }
                });
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
})