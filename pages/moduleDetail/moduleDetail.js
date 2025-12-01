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
    
    // 确保所有 select 类型的字段都有 selectedIndex 属性
    if (moduleData && moduleData.indicators) {
      moduleData.indicators.forEach(indicator => {
        if (indicator.inputType === 'select' && indicator.selectedIndex === undefined) {
          indicator.selectedIndex = null;
        }
      });
    }
    
    this.setData({
      moduleId: moduleId,
      module: moduleData
    });

    this.getUserOpenId();
  },

  async getUserOpenId() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getUserData' });
      this.setData({ openid: res.result.openid });
    } catch (err) {
      console.error('获取用户标识失败', err);
      wx.showToast({ title: '用户信息获取失败', icon: 'none' });
    }
  },

  handleSelectChange(e) {
    const indicatorId = e.currentTarget.dataset.indicatorid;
    const selectedIndex = e.detail.value;
    const indicators = this.data.module.indicators;
    const index = indicators.findIndex(item => item.id === indicatorId);

    if (index > -1) {
      const selectedValue = indicators[index].option[selectedIndex];
      // 更新当前页面数据
      this.setData({
        [`module.indicators[${index}].selectedIndex`]: selectedIndex,
        [`module.indicators[${index}].value`]: selectedValue
      });
      // 同步更新到全局数据
      app.globalData.predictionData[this.data.moduleId].indicators[index].selectedIndex = selectedIndex;
      app.globalData.predictionData[this.data.moduleId].indicators[index].value = selectedValue;
    }
  },

  handleInputChange(e) {
    const indicatorId = e.currentTarget.dataset.indicatorid;
    const value = e.detail.value;
    const indicators = this.data.module.indicators;
    const index = indicators.findIndex(item => item.id === indicatorId);

    if (index > -1) {
      // 更新当前页面数据
      this.setData({
        [`module.indicators[${index}].value`]: value
      });
      // 同步更新到全局数据
      app.globalData.predictionData[this.data.moduleId].indicators[index].value = value;
    }
  },

  // 清除选择器值的函数
  clearSelectValue(e) {
    const indicatorId = e.currentTarget.dataset.indicatorid;
    const index = this.data.module.indicators.findIndex(item => item.id === indicatorId);

    if (index > -1) {
      // 更新当前页面数据，实现界面刷新
      this.setData({
        [`module.indicators[${index}].selectedIndex`]: null,
        [`module.indicators[${index}].value`]: ''
      });
      // 同步清空全局数据
      app.globalData.predictionData[this.data.moduleId].indicators[index].selectedIndex = null;
      app.globalData.predictionData[this.data.moduleId].indicators[index].value = '';
    }
  },

  async saveToCloud() {
    const requiredFields = this.data.module.indicators
    .filter(ind => ind.required && !ind.value);
    if (requiredFields.length > 0) {
      wx.showToast({ title: `请填写${requiredFields[0].label}`, icon: 'none' });
      return;
    }
    if (!this.data.openid) {
      wx.showToast({ title: '用户信息未就绪', icon: 'none' });
      return;
    }
    const db = wx.cloud.database();
    const indicators = this.data.module.indicators.map(item => ({
      id: item.id,
      label: item.label,
      value: item.value,
      unit: item.unit,
      ...(item.inputType === 'select' && { selectedOption: item.option[item.selectedIndex] })
    }));
    try {
      await db.collection('predictionHistory').add({
        data: {
          _openid: this.data.openid,
          moduleId: this.data.moduleId,
          moduleTitle: this.data.module.title,
          indicators: indicators,
          date: db.serverDate(),
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
        }
      });
      wx.showToast({ title: '数据保存成功' });
    } catch (err) {
        console.error('完整错误信息:', err)
        wx.showToast({ title: `失败:${err.errCode || err.message}`, icon: 'none' });
    }
  },

  saveAndBack() {
    // 我们不再需要在返回时手动保存到全局数据，
    // 因为 handleInputChange 和 handleSelectChange 已经实时同步了。
    // app.globalData.predictionData[this.data.moduleId] = this.data.module;
    this.saveToCloud();
    wx.navigateBack();
  },
})