// cloudfunctions/ocr-recognize/index.js
const cloud = require('wx-server-sdk');
const tencentcloud = require("tencentcloud-sdk-nodejs");

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 腾讯云OCR客户端
const OcrClient = tencentcloud.ocr.v20181119.Client;

// --- 关键词映射表 ---
// 这个表是整个识别功能的核心
const keywordMap = {
  // 自身免疫
  'rf': ['类风湿因子', 'RF'],
  'ana': ['抗核抗体', 'ANA'],
  'anaTiter': ['ANA滴度', '滴度'],
  'antiDsdna': ['抗双链DNA抗体', '抗双链DNA'],
  // 凝血
  'dDimer': ['D-二聚体', 'D-D'],
  'proteinC': ['蛋白C活性', '蛋白C'],
  'proteinS': ['蛋白S活性', '蛋白S'],
  'antithrombin3': ['抗凝血酶III活性', 'AT-Ⅲ'],
  // 内分泌
  'vitD': ['25-羟基维生素D', '25-VITD'],
  'tsh': ['促甲状腺激素', 'TSH'],
  'tpoAb': ['甲状腺过氧化物酶抗体', 'TPO-Ab'],
  'tgAb': ['甲状腺球蛋白抗体', 'TG-Ab'],
  'amh': ['抗缪勒管激素', 'AMH'],
  // 血液学
  'hb': ['血红蛋白量', '血红蛋白', 'HB'],
  'plt': ['血小板计数', 'PLT'],
  'mcv': ['红细胞平均体积', '平均红细胞体积', 'MCV'],
  'hcy': ['同型半胱氨酸', 'HCY'],
  // 人口学
  'age': ['年龄'],
  // 子宫动脉
  'leftPi': ['左侧子宫动脉PI', 'L-PI'],
  'rightPi': ['右侧子宫动脉PI', 'R-PI'],
};

// --- 升级后的核心解析函数 ---
function parseOcrResult(ocrTextItems) {
  const extractedData = {};
  // 先把所有识别出的文本提取到一个简单数组里，方便处理
  const ocrTexts = ocrTextItems.map(item => item.DetectedText);

  // 遍历我们自己定义的所有指标
  for (const indicatorId in keywordMap) {
    const keywords = keywordMap[indicatorId];
    
    // 在OCR结果中，查找哪个文本框包含了我们的关键词
    let keywordIndex = -1; // 关键词所在的位置
    for (let i = 0; i < ocrTexts.length; i++) {
      const currentText = ocrTexts[i];
      // 使用 .some() 和 .includes() 进行模糊匹配
      if (keywords.some(keyword => currentText.includes(keyword))) {
        keywordIndex = i;
        break; // 找到了，就跳出循环
      }
    }

    // 如果找到了关键词
    if (keywordIndex !== -1) {
      // 就在它后面的几个文本框里寻找第一个出现的数字
      for (let j = 1; j <= 4 && (keywordIndex + j) < ocrTexts.length; j++) {
        const potentialValueText = ocrTexts[keywordIndex + j];
        // 使用更稳健的正则表达式来匹配数字 (可以带小数点，也可以是负数)
        const match = potentialValueText.match(/^-?\d+(\.\d+)?/); 
        if (match) {
          extractedData[indicatorId] = match[0];
          break; // 找到了数值，就处理下一个指标
        }
      }
    }
  }
  return extractedData;
}


// --- 云函数主入口 ---
exports.main = async (event, context) => {
  const { fileID } = event;

  // --- 腾讯云API密钥 ---
  // 请确保这里填写的是你创建的、拥有OCR权限的子用户的密钥
  const secretId = "AKIDr04zkJeS8j98wXw87tSpzwhFcnmb9h6I";
  const secretKey = "89zc2IHDyWt33PfjeU8ZqwteBbsvkPDw";

  if (secretId.startsWith("你的") || secretKey.startsWith("你的")) {
    return { success: false, error: "云函数中未配置腾讯云密钥" };
  }

  try {
    // 1. 下载文件的二进制内容 (Buffer)
    const downloadRes = await cloud.downloadFile({
        fileID: fileID,
    });
    const buffer = downloadRes.fileContent;

    // 2. 将文件的二进制内容转换为 Base64 字符串
    const fileBase64 = buffer.toString('base64');

    // 3. 配置腾讯云OCR客户端
    const client = new OcrClient({
      credential: { secretId, secretKey },
      region: "ap-guangzhou",
      profile: { httpProfile: { endpoint: "ocr.tencentcloudapi.com" } },
    });

    // 4. 准备API参数
    const params = {
      ImageBase64: fileBase64,
    };

    // 智能判断文件类型
    if (fileID.toLowerCase().endsWith('.pdf')) {
      console.log("检测到PDF文件，添加PDF处理参数");
      params.IsPdf = true;
      params.PdfPageNumber = 1; // 默认识别第一页
    }

    // 5. 调用腾讯云OCR
    const ocrResponse = await client.GeneralBasicOCR(params);
    
    // 6. 解析OCR结果
    const parsedData = parseOcrResult(ocrResponse.TextDetections);

    // 7. 将解析结果映射回小程序需要的数据结构
    const { modulesConfig } = require('./data.js');
    const finalData = JSON.parse(JSON.stringify(modulesConfig));

    let filledCount = 0;
    for (const moduleId in finalData) {
      finalData[moduleId].indicators.forEach(indicator => {
        if (parsedData[indicator.id]) {
          indicator.value = parsedData[indicator.id];
          filledCount++;
        }
      });
    }

    return {
      success: true,
      filledCount: filledCount,
      updatedData: finalData,
    };

  } catch (e) {
    console.error("OCR处理失败", e);
    return {
      success: false,
      error: e.toString()
    };
  }
}