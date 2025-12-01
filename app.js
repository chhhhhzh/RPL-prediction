const {
    modulesConfig
} = require('./utils/data.js');

App({
    onLaunch() {
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        } else {
            wx.cloud.init({
                env: 'cloud1-2gqdzqj9e43361c0', // 环境ID
                traceUser: true,
            });
        }

        this.initPredictionData();

        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.globalData.userInfo = userInfo;
        }
        wx.cloud.callFunction({
                name: 'getUserData'
            })
            .then(res => {
                this.globalData.openid = res.result.openid
            })
    },

    initPredictionData() {
        // 使用深拷贝，防止页面修改影响原始配置
        this.globalData.predictionData = JSON.parse(JSON.stringify(modulesConfig));
        console.log("Global prediction data has been initialized.");
    },

    // 清空并重置全局数据的方法，用于“重新评估”
    clearPredictionData() {
        console.log('Clearing global prediction data...');
        this.initPredictionData(); // 重新初始化为最初的空状态
    },

    globalData: {
        predictionData: null, // 初始化为null，在onLaunch中填充
        userInfo: null,
        openid: null
    },

    checkAuthorization(callback) {
        if (this.globalData.userInfo) {
            // 如果全局已经有用户信息，说明已授权，直接执行回调函数
            // 确保 callback 是一个函数再执行
            if (typeof callback === 'function') {
                callback();
            }
        } else {
            // 如果未授权，弹出提示，并引导用户去个人中心
            wx.showModal({
                title: '需要授权',
                content: '为了给您提供个性化的预测和记录服务，请先授权登录。',
                confirmText: '去授权',
                cancelText: '暂不',
                success: (res) => {
                    if (res.confirm) {
                        // 用户点击“去授权”
                        wx.switchTab({
                            url: '/pages/profile/profile'
                        });
                    }
                }
            });
        }
    }
})