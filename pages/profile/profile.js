import * as echarts from '../../lib/ec-canvas/echarts';
const { icons } = require('../../utils/icons.js');
const app = getApp(); // 获取App实例

const allIndicatorsData = {
  'hgb': { title: '血红蛋白 (HGB)', categories: ['1月', '2月', '3月', '4月', '5月'], series: [{ name: '血红蛋白', data: [110, 112, 115, 120, 118], type: 'line', smooth: true, color: '#8884d8' }] },
  'tsh': { title: '促甲状腺激素 (TSH)', categories: ['1月', '2月', '3月', '4月', '5月'], series: [{ name: '促甲状腺激素', data: [3.0, 2.8, 2.5, 2.4, 2.6], type: 'line', smooth: true, color: '#82ca9d' }] },
  'pt': { title: '凝血酶原时间 (PT)', categories: ['1月', '2月', '3月', '4月', '5月'], series: [{ name: '凝血酶原时间', data: [13.0, 12.8, 12.5, 12.6, 12.7], type: 'line', smooth: true, color: '#ffc658' }] }
};
const mockRadarData = [{ value: [80, 90, 65, 75, 85, 70], name: '个人状态' }];
const radarIndicator = [{ name: '免疫', max: 100 }, { name: '凝血', max: 100 }, { name: '内分泌', max: 100 }, { name: '血液学与营养', max: 100 }, { name: '人口学与病史', max: 100 }, { name: '子宫动脉', max: 100 },];

Page({
  data: {
    isAuthorized: false,
    userInfo: {},
    tempAvatarUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiNkZWRlZGUiPjxwYXRoIGQ9Ik0xMiAyYy01LjUyMyAwLTEwIDQuNDc3LTEwIDEwczQuNDc3IDEwIDEwIDEwIDEwLTQuNDc3IDEwLTEwLTQuNDc3LTEwLTEwLTEwem0wIDE4Yy00LjQxMSAwLTgtMy41ODktOC04czMuNTg5LTggOC04IDggMy41ODkgOCA4LTMuNTg5IDgtOCA4eiIvPjxwYXRoIGQ9Ik0xMiA2Yy0yLjIxIDAtNC Axel.NzkxLTQgNHMxLjc5IDQgNCA0IDQtMS43OTEgNC00LTEuNzktNC00LTR6bTAgNmMtMS4xMDMgMC0yLS44OTctMi0yczAuODk3LTIgMi0yIDIgLjg5NyAyIDItLjguODk3LTIgMnptLTYgNGMwLTIuMjA5IDEuNzktNC00IDRoOHYtMmMwLTEuMTAzLS44OTctMi0yLTJoLTRjLTEuMTAzIDAtMiAuODk3LTIgMnYyem0yIDBoNGMtMi4yMDkgMC00LTEuNzktNC00aC0ydjJjMCIDEuMTAzIDAuODk3IDIgMiAyaDR2LTJjMC0yLjIwOS0xLjc5LTQtNC00aC00djJjMC0xLjEwMy0uODk3LTItMi0yeiIvPjwvc3ZnPg==',
    tempNickName: '',
    isAvatarChosen: false,

    radar: { lazyLoad: true },
    line: { lazyLoad: true },
    iconDown: icons.chevronDown,
    indicatorList: Object.keys(allIndicatorsData).map(key => ({
      id: key,
      title: allIndicatorsData[key].title
    })),
    indicatorIndex: 0,
  },

  chartInstance: null,

  onShow() {
    this.checkAuthStatus();
  },

  checkAuthStatus() {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({
        isAuthorized: true,
        userInfo: userInfo
      });
      this.initCharts();
    } else {
      this.setData({
        isAuthorized: false
      });
    }
  },

  onChooseAvatar(e) {
    this.setData({
      tempAvatarUrl: e.detail.avatarUrl,
      isAvatarChosen: true,
    });
  },

  onNicknameInput(e) {
    this.setData({
      tempNickName: e.detail.value
    });
  },

  handleAuthorize() {
    if (!this.data.isAvatarChosen) {
      wx.showToast({ title: '请选择头像', icon: 'none' });
      return;
    }
    if (!this.data.tempNickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    const authorizedInfo = {
      nickName: this.data.tempNickName,
      avatarUrl: this.data.tempAvatarUrl,
    };

    app.globalData.userInfo = authorizedInfo;
    wx.setStorageSync('userInfo', authorizedInfo);
    wx.showToast({ title: '授权成功' });
    this.checkAuthStatus();
  },

  initCharts() {
    if (this.chartInstance) return;
    this.initRadar();
    this.initLineChart();
  },

  initRadar() {
    this.selectComponent('#radar-chart').init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
      canvas.setChart(chart);
      const option = { tooltip: {}, radar: { indicator: radarIndicator, radius: '65%' }, series: [{ type: 'radar', data: mockRadarData }] };
      chart.setOption(option);
      return chart;
    });
  },

  initLineChart() {
    this.selectComponent('#line-chart').init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
      canvas.setChart(chart);
      this.chartInstance = chart;
      this.updateLineChart();
      return chart;
    });
  },

  updateLineChart() {
    if (!this.chartInstance) return;
    const selectedIndicator = this.data.indicatorList[this.data.indicatorIndex];
    const chartData = allIndicatorsData[selectedIndicator.id];
    const option = {
      tooltip: { trigger: 'axis' },
      legend: { data: chartData.series.map(s => s.name) },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: chartData.categories },
      yAxis: { type: 'value' },
      series: chartData.series
    };
    this.chartInstance.setOption(option, true);
  },

  bindPickerChange(e) {
    const selectedIndex = e.detail.value;
    this.setData({
      indicatorIndex: selectedIndex
    });
    this.updateLineChart();
  }
});