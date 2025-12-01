const cloud = require('wx-server-sdk');

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();

    const openid = event.openid || wxContext.OPENID;

    switch (event.action) {
        case 'get': {
            try {
                const res = await db.collection('predictionHistory')
                    .where({
                        _openid: openid
                    })
                    .orderBy('timestamp', 'desc')
                    .get();
                return {
                    success: true,
                    data: res.data
                };
            } catch (e) {
                console.error('Error getting history:', e);
                return {
                    success: false,
                    error: e.toString()
                };
            }
        }
        case 'save': {
            const record = event.record;
            if (!record) {
                return {
                    success: false,
                    error: 'No record data provided.'
                };
            }
            try {
                console.log('正在执行 [save] 操作，获取到的 OpenID 是:', openid);
                const userInputArray = Object.keys(record.userInput || {}).map(key => ({
                    id: key,
                    value: record.userInput[key]
                }));

                const dataToSave = {
                    ...record,
                    userInput: userInputArray,
                    _openid: openid,
                    timestamp: db.serverDate(),
                };

                const addResult = await db.collection('predictionHistory').add({
                    data: dataToSave
                });
                return {
                    success: true,
                    result: addResult
                };
            } catch (e) {
                console.error('Error saving history:', e);
                return {
                    success: false,
                    error: e.toString()
                };
            }
        }
        case 'clear': {
            try {
                const removeResult = await db.collection('predictionHistory')
                    .where({
                        _openid: openid
                    })
                    .remove();
                return {
                    success: true,
                    stats: removeResult.stats
                };
            } catch (e) {
                console.error('Error clearing history:', e);
                return {
                    success: false,
                    error: e.toString()
                };
            }
        }
        default: {
            return {
                success: false,
                error: 'Invalid action specified.'
            };
        }
    }
};