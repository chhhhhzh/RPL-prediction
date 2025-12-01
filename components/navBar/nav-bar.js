const { icons } = require('../../utils/icons.js');
Component({
    properties: {
      title: {
        type: String,
        value: '默认标题'
      },
      showBack: {
        type: Boolean,
        value: false
      },
      showHome: {
        type: Boolean,
        value: false
      }
    },
    data: {
        statusBarHeight: 0,
        iconBack: icons.chevronLeft,
        iconHome: icons.home,
      },
    lifetimes: {
      attached() {
        // 使用新的 API 获取状态栏高度
        const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        this.setData({
          statusBarHeight: windowInfo.statusBarHeight || 0
        });
      }
    },
    methods: {
      goBack() {
        wx.navigateBack();
      },
      goHome() {
        wx.reLaunch({
          url: '/pages/home/home',
        })
      }
    }
  })