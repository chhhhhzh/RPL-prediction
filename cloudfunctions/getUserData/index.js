// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: "cloud1-2gqdzqj9e43361c0" })  // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    return {
      // 返回用户标识和基础信息 [6](@ref)
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
      env: wxContext.ENV
    }
  }