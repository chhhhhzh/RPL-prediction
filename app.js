const {
    modulesConfig
} = require('./utils/data.js');

App({
    onLaunch() {
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        } else {
            wx.cloud.init({
                env: 'cloud1-2gqdzqj9e43361c0', // 自己的环境ID
                traceUser: true,
            });
        }

        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            console.log('发现本地缓存，初始化用户信息');
            this.globalData.userInfo = userInfo;
        } else {
            console.log('未发现本地缓存，用户未授权');
        }

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
        predictionData: {},
        userInfo: null,
    },

    // --- 全局授权检查函数 ---
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
                        // 注意：这里假设 profile 是 TabBar 页面，所以使用 switchTab
                        wx.switchTab({
                            url: '/pages/profile/profile'
                        });
                    }
                }
            });
        }
    }
})