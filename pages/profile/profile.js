import * as echarts from '../../lib/ec-canvas/echarts';
const { icons } = require('../../utils/icons.js');

//数据结构
const allIndicatorsData = {
  'hgb': { title: '血红蛋白 (HGB)', categories: ['1月', '2月', '3月', '4月', '5月'], series: [{ name: '血红蛋白', data: [110, 112, 115, 120, 118], type: 'line', smooth: true, color: '#8884d8' }] },
  'tsh': { title: '促甲状腺激素 (TSH)', categories: ['1月', '2月', '3月', '4月', '5月'], series: [{ name: '促甲状腺激素', data: [3.0, 2.8, 2.5, 2.4, 2.6], type: 'line', smooth: true, color: '#82ca9d' }] },
  'pt': { title: '凝血酶原时间 (PT)', categories: ['1月', '2月', '3月', '4月', '5月'], series: [{ name: '凝血酶原时间', data: [13.0, 12.8, 12.5, 12.6, 12.7], type: 'line', smooth: true, color: '#ffc658' }] }
};
const mockRadarData = [ { value: [80, 90, 65, 75, 85, 70], name: '个人状态' } ];
const radarIndicator = [ { name: '免疫', max: 100 }, { name: '凝血', max: 100 }, { name: '内分泌', max: 100 }, { name: '血液学与营养', max: 100 }, { name: '人口学与病史', max: 100 }, { name: '子宫动脉', max: 100 }, ];
function initRadarChart(canvas, width, height, dpr) {}

Page({
  data: {
    radar: { lazyLoad: true },
    line: { lazyLoad: true },
    iconDown: icons.chevronDown, // 下拉箭头
    
    // 用于 picker 的数据
    indicatorList: Object.keys(allIndicatorsData).map(key => ({
      id: key,
      title: allIndicatorsData[key].title
    })),
    indicatorIndex: 0, // 当前选中的是第几个
  },

  chartInstance: null,

  onReady() {
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
      this.updateLineChart(); // 首次渲染
      return chart;
    });
  },

  // 更新折线图的函数
  updateLineChart() {
    if (!this.chartInstance) return;
    
    // 根据当前选中的 index 获取对应的指标数据
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

  // picker 的值改变时触发的事件
  bindPickerChange(e) {
    const selectedIndex = e.detail.value; // 获取用户选择的是第几项
    this.setData({
      indicatorIndex: selectedIndex
    });
    this.updateLineChart(); // 更新图表
  }
});