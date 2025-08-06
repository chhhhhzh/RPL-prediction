const app = getApp(); // 1. 获取App实例，以便访问全局函数

Page({
    goToPrediction() {
        // 2. 调用全局的授权检查函数
        app.checkAuthorization(() => {
            // 只有在检查通过后，才会执行这里的跳转逻辑
            wx.navigateTo({
                url: '/pages/prediction/prediction',
            });
        });
    },
})