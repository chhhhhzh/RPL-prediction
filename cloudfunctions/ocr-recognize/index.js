// cloudfunctions/ocr-recognize/index.js
const cloud = require('wx-server-sdk');
const tencentcloud = require("tencentcloud-sdk-nodejs");

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 腾讯云OCR客户端
const OcrClient = tencentcloud.ocr.v20181119.Client;

// --- 更新后的关键词映射表（与 utils/data.js 的字段 ID 完全对应） ---
const keywordMap = {
  // === 基本信息模块 (basic) ===
  'age': ['年龄', 'Age', '岁'],
  'heightCm': ['身高', 'Height', 'cm', '身高cm'],
  'prePregnancyWeightKg': ['孕前体重', '体重', 'kg', '孕前体重kg'],
  'weightGainKg': ['孕期增加体重', '增重', '体重增加', 'weightGain'],
  'previousMiscarriageCount': ['既往流产', '流产次数', '自然流产', '流产史'],

  // === 自身免疫 (ANA谱系) 模块 (autoimmune_ana) ===
  'ANA': ['抗核抗体', 'ANA', 'ANAs'],
  'pattern': ['ANA模式', 'ANA核型', 'Pattern', '染色模式', '核型', '胞浆型', '核仁型', '颗粒型', '斑点型'],
  'titer': ['ANA滴度', '滴度', 'ANA-滴度', 'Titer', '1:'],
  'ENA': ['抗ENA抗体', 'ENA', 'ENA总项'],
  'Sm': ['抗Sm抗体', 'Sm抗体', 'anti-Sm', 'Sm'],
  'aU1_nRNP': ['抗U1-nRNP', 'U1-nRNP', 'U1RNP', 'aU1-nRNP'],
  'SSA_Ro52': ['抗Ro52', 'Ro52', 'Ro-52', 'KRO52', 'TRIM21'],
  'SSA_Ro60': ['抗SSA', 'SSA', 'Ro60', 'SSA/Ro60', 'KSS-B/AH'],
  'SSB_La': ['抗SSB', 'SSB', 'La', 'SSB/La', 'KSL-DNA'],
  'Scl_70': ['抗Scl-70', 'Scl-70', 'Scl70', 'KS-A'],
  'Jo_1': ['抗Jo-1', 'Jo-1', 'Jo1', 'RF', 'PS'],
  'CENP_B': ['抗着丝点', '着丝点', 'CENP-B', 'ACA', 'centromere'],
  'dsDNA': ['抗双链DNA', '双链DNA', 'dsDNA', 'anti-dsDNA', 'AAE'],
  'Nukleosomen': ['抗核小体', '核小体', 'Nucleosome', 'AHA'],
  'Histone': ['抗组蛋白', '组蛋白', 'Histone', 'HTT'],
  'AMA_M2': ['抗线粒体M2', 'M2', 'AMA-M2', 'AMM2A', '线粒体'],
  'PM_Scl': ['抗PM-Scl', 'PM-Scl', 'APMSCL'],

  // === 抗磷脂与凝血模块 (autoimmune_aps) ===
  'ACLIgG': ['抗心磷脂抗体IgG', 'ACL-IgG', 'aCL IgG', '心磷脂IgG', 'ACLIgG'],
  'ACLIgM': ['抗心磷脂抗体IgM', 'ACL-IgM', 'aCL IgM', '心磷脂IgM', 'ACLIgM'],
  'B2_GDP1IgM': ['抗β2糖蛋白1 IgM', 'β2GP1 IgM', 'B2GP1-IgM', 'β2糖蛋白IgM', 'B2-GDP1IgM'],
  'B2_GDP1IgG_IgA': ['抗β2糖蛋白1 IgG', '抗β2糖蛋白1 IgA', 'β2GP1 IgG', 'B2GP1-IgG', 'B2-GDP1IgG'],
  'LA': ['狼疮抗凝物', 'LA', '狼疮抗凝', 'lupus anticoagulant'],
  'proteinS': ['蛋白S', 'Protein S', 'PS', '蛋白S缺乏'],
  'APS_diagnosis': ['抗磷脂综合征', 'APS', '确诊APS'],
  'thrombosis_history': ['血栓', '肝损', 'D2高', 'D-二聚体', '血栓史'],

  // === 内分泌与代谢模块 (endocrine) ===
  '25_VITD': ['25-羟维生素D', '维生素D', '25(OH)D', 'VitD', '25-VITD'],
  'TGAb': ['甲状腺球蛋白抗体', 'TG-Ab', 'TGAb', 'anti-TG', '抗甲状腺球蛋白'],
  'TPOAb': ['甲状腺过氧化物酶抗体', 'TPO-Ab', 'TPOAb', 'anti-TPO', '抗甲状腺过氧化物酶'],
  'insulinResistance': ['胰岛素抵抗', '糖尿病', 'IR', 'DM'],
  'hyperlipidemia': ['高血脂', '高脂血症', '血脂异常'],
  'homocysteine': ['同型半胱氨酸', 'HCY', 'homocysteine', '高同型半胱氨酸'],
  'thyroid': ['桥本', '甲减', '甲状腺术后', '甲状腺'],
  'PCOS': ['多囊卵巢', 'PCOS', '卵巢早衰', 'POF'],

  // === 其他病史与检查模块 (others) ===
  'C3': ['补体C3', 'C3', 'complement C3'],
  'C4': ['补体C4', 'C4', 'complement C4'],
  'HBV': ['乙肝', 'HBV', 'Hepatitis B', '乙型肝炎'],
  'placenta': ['前置胎盘', '胎盘植入', 'placenta'],
  'infection': ['宫内感染', '绒毛膜羊膜炎', '感染'],
  'hypertension': ['慢性高血压', '高血压', 'hypertension'],
  'kidney': ['慢性肾病', '蛋白尿', '肾结石', '肾病']
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