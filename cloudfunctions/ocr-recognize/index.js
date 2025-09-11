// cloudfunctions/ocr-recognize/index.js
const cloud = require('wx-server-sdk');
const tencentcloud = require("tencentcloud-sdk-nodejs");

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 腾讯云OCR客户端
const OcrClient = tencentcloud.ocr.v20181119.Client;

// --- 更新后的关键词映射表 ---
// 根据新特征列表更新：二元特征、多元特征、连续值
const keywordMap = {
  
  // === 连续值特征（对应 scaler_params.json 中的 features） ===
  
  // titer - ANA滴度
  'anaTiter': ['ANA滴度', '滴度', 'ANA-滴度', '抗核抗体滴度', '1:', 'titer'],
  
  // ACLIgG - 抗心磷脂抗体IgG  
  'aclIgg': ['抗心磷脂抗体IgG', 'ACL-IgG', 'aCL IgG', '心磷脂IgG', 'ACLIgG'],
  
  // ACLIgM - 抗心磷脂抗体IgM
  'aclIgm': ['抗心磷脂抗体IgM', 'ACL-IgM', 'aCL IgM', '心磷脂IgM', 'ACLIgM'],
  
  // B2-GDP1IgM - 抗β2-糖蛋白I IgM
  'b2gp1Igm': ['抗β2-糖蛋白I IgM', 'β2GP1 IgM', 'B2GP1-IgM', 'β2糖蛋白IgM', 'B2-GDP1IgM'],
  
  // B2-GDP1IgG/B2-GDP1-IgA - 抗β2-糖蛋白I IgG
  'b2gp1Igg': ['抗β2-糖蛋白I IgG', 'β2GP1 IgG', 'B2GP1-IgG', 'β2糖蛋白IgG', 'B2-GDP1IgG'],
  
  // 25-VITD3 - 维生素D3
  'vitD3': ['25-羟基维生素D3', '25(OH)D3', '维生素D3', 'VitD3', '25-VITD3'],
  
  // 25-VITD2 - 维生素D2  
  'vitD2': ['25-羟基维生素D2', '25(OH)D2', '维生素D2', 'VitD2', '25-VITD2'],
  
  // 25-VITD - 总维生素D
  'vitD': ['25-羟基维生素D', '25(OH)D', '维生素D', 'VitD', '25-VITD'],
  
  // LA - 狼疮抗凝物
  'la': ['狼疮抗凝物', 'LA', '狼疮抗凝', 'lupus anticoagulant'],
  
  // C3 - 补体C3
  'c3': ['补体C3', 'C3', 'complement C3'],
  
  // C4 - 补体C4  
  'c4': ['补体C4', 'C4', 'complement C4'],

  // === 二元特征（对应 encoder_params.json 中的二元特征） ===
  
  // ANA - 抗核抗体
  'ana': ['抗核抗体', 'ANA', 'ANAs'],
  
  // KSL-DNA - 抗双链DNA抗体
  'antiDsdna': ['抗双链DNA抗体', '抗双链DNA', 'anti-dsDNA', 'dsDNA', '双链DNA', 'KSL-DNA'],
  
  // KS-A - 抗SSA/Ro60抗体
  'antiSsa': ['抗SSA抗体', 'SSA', 'anti-SSA', 'Ro60', 'SSA/Ro60', 'KS-A'],
  
  // ACA - 抗着丝点抗体
  'antiCentromere': ['抗着丝点抗体', '着丝点', 'ACA', '抗着丝点', 'centromere'],
  
  // KSS-B - 抗SSB/La抗体
  'antiSsb': ['抗SSB抗体', 'SSB', 'anti-SSB', 'La', 'SSB/La', 'KSS-B'],
  
  // ASc1-70 - 抗Scl-70抗体
  'antiScl70': ['抗Scl-70抗体', 'Scl-70', 'anti-Scl70', 'Scl70', 'ASc1-70'],
  
  // KRO52 - 抗Ro52抗体
  'antiRo52': ['抗Ro52抗体', 'Ro52', 'anti-Ro52', 'TRIM21', 'Ro52/TRIM21', 'KRO52'],
  
  // aU1-nRNP - 抗U1-nRNP抗体
  'antiU1rnp': ['抗U1-nRNP抗体', 'U1-nRNP', 'anti-U1RNP', 'U1RNP', 'aU1-nRNP'],
  
  // Sm - 抗Sm抗体
  'antiSm': ['抗Sm抗体', 'Sm抗体', 'anti-Sm', 'Sm'],
  
  // AHA - 抗组蛋白抗体
  'antiHistone': ['抗组蛋白抗体', '组蛋白', 'anti-Histone', 'Histone', 'AHA'],
  
  // AMM2A - 抗线粒体M2抗体
  'antiM2': ['抗线粒体M2抗体', 'M2', 'anti-M2', 'AMA-M2', '线粒体M2', 'AMM2A'],
  
  // TGAb - 甲状腺球蛋白抗体
  'tgAb': ['甲状腺球蛋白抗体', 'TG-Ab', 'TGAb', 'anti-TG'],
  
  // TPOAb - 甲状腺过氧化物酶抗体
  'tpoAb': ['甲状腺过氧化物酶抗体', 'TPO-Ab', 'TPOAb', 'anti-TPO'],

  // === 多元特征 ===
  
  // pattern - ANA模式（需要特殊处理，通常在ANA后面）
  'anaPattern': ['ANA模式', '模式', 'pattern', '染色模式', '核型', '胞浆型', '核仁型'],
  
  // RF/PS/Jo/HHCY - 类风湿因子等（需要特殊处理）
  'rf': ['类风湿因子', 'RF', 'IgM-RF', 'RF-IgM'],
  'antiJo1': ['抗Jo-1抗体', 'Jo-1', 'anti-Jo1', 'Jo1'],
  'hcy': ['同型半胱氨酸', 'HCY', 'homocysteine'],

  // === 其他在data.js中但不在模型特征中的指标（OCR仍需识别） ===
  
  // 凝血功能相关
  'dDimer': ['D-二聚体', 'D-D', 'D-Dimer', 'DD', 'D二聚体'],
  'proteinC': ['蛋白C活性', '蛋白C', 'Protein C', 'PC活性'],
  'proteinS': ['蛋白S活性', '蛋白S', 'Protein S', 'PS活性'],
  'antithrombin3': ['抗凝血酶III活性', '抗凝血酶III', 'AT-III', 'ATIII', 'antithrombin'],

  // 内分泌相关
  'tsh': ['促甲状腺激素', 'TSH', '甲状腺刺激素'],
  'amh': ['抗缪勒管激素', 'AMH', '抗苗勒管激素'],
  'fsh': ['卵泡刺激素', 'FSH', '促卵泡激素'],
  'lh': ['黄体生成素', 'LH', '促黄体激素'],
  'prl': ['催乳素', 'PRL', 'prolactin'],
  'testosterone': ['总睾酮', '睾酮', 'testosterone', 'T'],
  'and': ['雄烯二酮', 'AND', 'androstenedione'],
  'dheas': ['硫酸脱氢表雄酮', 'DHEA-S', 'DHEAS'],
  'fastingGlu': ['空腹血糖', 'FPG', '空腹葡萄糖', 'GLU'],
  'fastingIns': ['空腹胰岛素', 'FINS', '胰岛素', 'INS'],

  // 血液学相关
  'hb': ['血红蛋白', 'HB', 'Hb', 'hemoglobin'],
  'plt': ['血小板', 'PLT', 'platelet', '血小板计数'],
  'mcv': ['红细胞平均体积', 'MCV', '平均红细胞体积'],
  'folicAcid': ['叶酸', '血清叶酸', 'folic acid', 'FA'],
  'vitB12': ['维生素B12', 'VitB12', 'B12', 'cobalamin'],
  'crp': ['C-反应蛋白', 'CRP', 'C反应蛋白'],
  'esr': ['血沉', 'ESR', '红细胞沉降率'],
  'alt': ['谷丙转氨酶', 'ALT', 'GPT', '丙氨酸转氨酶'],
  'ast': ['谷草转氨酶', 'AST', 'GOT', '天冬氨酸转氨酶'],

  // 人口学相关
  'age': ['年龄', '岁'],
  'bmi': ['BMI', '体重指数', '身体质量指数'],
  'spontaneousMiscarriage': ['自然流产', '流产次数', '自然流产次数'],
  'termBirth': ['足月产', '足月分娩', '足月产次数'],
  'pretermBirth': ['早产', '早产次数'],

  // 多普勒相关
  'leftPi': ['左侧子宫动脉PI', 'L-PI', '左子宫动脉PI', '左侧PI'],
  'rightPi': ['右侧子宫动脉PI', 'R-PI', '右子宫动脉PI', '右侧PI'],
  'leftRi': ['左侧子宫动脉RI', 'L-RI', '左子宫动脉RI', '左侧RI'],
  'rightRi': ['右侧子宫动脉RI', 'R-RI', '右子宫动脉RI', '右侧RI'],
  'endometrialThickness': ['内膜厚度', '子宫内膜厚度', 'ET', '内膜']
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