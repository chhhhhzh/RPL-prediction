const app = getApp();

Page({
  data: {
    moduleId: '',
    module: {}
  },
  onLoad(options) {
    const moduleId = options.id;
    // 从全局数据中获取当前模块的数据
    const moduleData = app.globalData.predictionData[moduleId];
    this.setData({
      moduleId: moduleId,
      module: moduleData
    })
  },
  handleSelectChange(e) {
    const indicatorId = e.currentTarget.dataset.indicatorid;
    const selectedIndex = e.detail.value; // 获取选项索引
    const indicators = this.data.module.indicators;
    const index = indicators.findIndex(item => item.id === indicatorId);
  
    if (index > -1) {
      this.setData({
        [`module.indicators[${index}].selectedIndex`]: selectedIndex,
        // 同步值到 value 字段（与其他指标一致）
        [`module.indicators[${index}].value`]: indicators[index].option[selectedIndex]
      });
    }
  },
  handleInputChange(e) {
    const indicatorId = e.currentTarget.dataset.indicatorid;
    const value = e.detail.value;

    // 更新当前页面的数据，以实时显示输入
    const indicators = this.data.module.indicators;
    const index = indicators.findIndex(item => item.id === indicatorId);
    if (index > -1) {
      this.setData({
        [`module.indicators[${index}].value`]: value
      });
    }
  },

  saveAndBack() {
    // 将当前页面的修改保存回全局数据
    app.globalData.predictionData[this.data.moduleId] = this.data.module;
    wx.navigateBack();
  },

  testCloudFunction() {
    wx.cloud.callFunction({
      name: 'test',  // 在cloudfunctions创建该函数
      success: res => wx.showToast({ title: '云函数调用成功' }),
      fail: err => wx.showToast({ title: '调用失败:' + err.errMsg })
    })
  }
})