const app = getApp();
const { modulesConfig } = require('../../utils/data.js');
const { icons } = require('../../utils/icons.js');

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
    wx.showToast({
      title: '报告上传功能待开发',
      icon: 'none'
    })
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