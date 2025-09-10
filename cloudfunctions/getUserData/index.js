// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: "cloud1-2gqdzqj9e43361c0" }); // 使用当前云环境

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    // 根据 action 参数判断要执行的操作
    switch (event.action) {
        case 'getHistoryDetail':
            try {
                const record = await db.collection('medicalRecords').doc(event.id).get();
                return {
                    success: true,
                    record: record.data,
                };
            } catch (err) {
                console.error('获取历史详情失败', err);
                return {
                    success: false,
                    message: '获取历史详情失败: ' + err.message
                };
            }
        
        // 新增：保存预测结果和输入数据
        case 'savePrediction':
            try {
                const { userInput, predictionResult } = event.data;
                const record = {
                    _openid: openid,
                    createdAt: db.serverDate(),
                    userInput, // 用户的输入指标
                    predictionResult, // 预测结果
                };
                const result = await db.collection('medicalRecords').add({
                    data: record
                });
                return {
                    success: true,
                    _id: result._id
                };
            } catch (err) {
                console.error('保存预测记录失败', err);
                return {
                    success: false,
                    message: '保存预测记录失败: ' + err.message
                };
            }

        // 新增：获取用户历史记录列表
        case 'getHistoryRecords':
            try {
                const records = await db.collection('medicalRecords')
                    .where({ _openid: openid })
                    .orderBy('createdAt', 'desc') // 按时间倒序排列
                    .limit(20) // 限制返回记录数量
                    .get();

                return {
                    success: true,
                    records: records.data
                };
            } catch (err) {
                console.error('获取历史记录失败', err);
                return {
                    success: false,
                    message: '获取历史记录失败: ' + err.message
                };
            }
        
        // 获取用户基本信息
        case 'getUserInfo':
            return {
                openid: wxContext.OPENID,
                appid: wxContext.APPID,
                unionid: wxContext.UNIONID,
                env: wxContext.ENV
            };

        // 清空历史数据
        case 'clearHistoryData':
            try {
                const result = await db.collection('medicalRecords')
                    .where({ _openid: openid })
                    .remove();
                return {
                    success: true,
                    deletedCount: result.stats.removed
                };
            } catch (err) {
                return {
                    success: false,
                    message: '清空历史失败: ' + err.message
                };
            }
        
        default:
            return {
                success: false,
                message: '未知操作'
            };
    }
};