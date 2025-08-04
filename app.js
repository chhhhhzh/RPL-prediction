const { modulesConfig } = require('./utils/data.js');

App({
  onLaunch() {
    // ======================================================
    // ========↓↓↓ 在这里添加云开发初始化代码 ↓↓↓========
    // ======================================================
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // 此处请填入您在上一篇教程中获取到的【环境 ID】
        env: 'cloud1-2gqdzqj9e43361c0', // <--- 请务必替换成你自己的环境ID
        traceUser: true, // 将用户访问记录到用户管理中，建议开启
      });
    }
    // ======================================================
    // ========↑↑↑ 云开发初始化代码结束 ↑↑↑========
    // ======================================================

    // 初始化全局共享的预测数据
    this.initPredictionData();
  },

  initPredictionData() {
    const initialState = {};
    for (const key in modulesConfig) {
      initialState[key] = {
        id: modulesConfig[key].id,
        // 深拷贝，防止修改影响原始配置
        indicators: JSON.parse(JSON.stringify(modulesConfig[key].indicators))
      };
    }
    this.globalData.predictionData = initialState;
  },

  globalData: {
    // 所有页面都可以通过 getApp().globalData.predictionData 访问和修改这份数据
    predictionData: {}
  }
})