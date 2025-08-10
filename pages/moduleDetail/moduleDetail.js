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
    });

    this.getUserOpenId(); 
  },

  async getUserOpenId() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getUserData' });
      this.setData({ openid: res.result.openid });
    } catch (err) {
      console.error('获取用户标识失败', err);
      wx.showToast({ title: '用户信息获取失败', icon: 'none' });
    }
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
  async saveToCloud() {
    const requiredFields = this.data.module.indicators
    .filter(ind => ind.required && !ind.value);
    
    if (requiredFields.length > 0) {
    wx.showToast({ title: `请填写${requiredFields[0].label}`, icon: 'none' })
    return
    }
    if (!this.data.openid) {
      wx.showToast({ title: '用户信息未就绪', icon: 'none' });
      return;
    }

    const db = wx.cloud.database();
    const indicators = this.data.module.indicators.map(item => ({
      id: item.id,
      label: item.label,
      value: item.value,
      unit: item.unit,
      // 特殊处理选择型数据 [5](@ref)
      ...(item.inputType === 'select' && { selectedOption: item.option[item.selectedIndex] })
    }));

    try {
      await db.collection('medicalRecords').add({
        data: {
          _openid: this.data.openid, // 用户唯一标识 [2](@ref)
          moduleId: this.data.moduleId,
          moduleTitle: this.data.module.title,
          indicators: indicators, // 结构化指标数据
          date: db.serverDate(), // 使用服务器时间 [5](@ref)
          // 添加元数据便于查询
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
        }
      });
      wx.showToast({ title: '云端保存成功' });
    } catch (err) {
        console.error('完整错误信息:', err)
        wx.showToast({ 
          title: `失败:${err.errCode || err.message}`,
          icon: 'none'
        })
    }
  },
  
  saveAndBack() {
    // 将当前页面的修改保存回全局数据
    app.globalData.predictionData[this.data.moduleId] = this.data.module;
    // 保存到云端
    this.saveToCloud();
    wx.navigateBack();
  },

})