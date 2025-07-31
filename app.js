const { modulesConfig } = require('./utils/data.js');

App({
  onLaunch() {
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