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
        statusBarHeight: wx.getSystemInfoSync().statusBarHeight,
        iconBack: icons.chevronLeft,
        iconHome: icons.home,
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