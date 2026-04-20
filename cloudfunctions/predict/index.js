// 云函数入口文件
const cloud = require('wx-server-sdk');
const ort = require('onnxruntime-web'); // 使用 onnxruntime-web

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

// --- 缓存 ---
let session;
let imputerParams; // 用于中位数填充
let finalFeatureOrder; // 特征顺序

const ONNX_MODEL_FILE_ID = 'cloud://cloud1-2gqdzqj9e43361c0.636c-cloud1-2gqdzqj9e43361c0-1372646642/best_model.onnx';
const IMPUTER_PARAMS_FILE_ID = 'cloud://cloud1-2gqdzqj9e43361c0.636c-cloud1-2gqdzqj9e43361c0-1372646642/imputer_params.json';
const FINAL_FEATURES_FILE_ID = 'cloud://cloud1-2gqdzqj9e43361c0.636c-cloud1-2gqdzqj9e43361c0-1372646642/final_feature_order.json';

// --- 全量特征映射表 (前端data.js ID -> 模型特征名) ---
const keyMap = {
    // 1. 基本信息
    'age': '年龄',
    'weightGainKg': '孕期增加体重kg',
    'previousMiscarriageCount': '既往流产次数',
    'previousLiveBirthCount': '先前活产小孩数',
    
    // 2. 自身免疫 ANA
    'ANA': 'ANA',
    'pattern': 'pattern',
    'titer': 'titer',
    'ENA': 'ENA',
    // 具体抗体映射
    'Sm': 'Sm',
    'aU1_nRNP': 'aU1-nRNP',
    'SSA_Ro52': 'KRO52',
    'SSA_Ro60': 'KSS-B',
    'SSB_La': 'KSL-DNA',
    'Scl_70': 'KS-A',
    'Jo_1': 'RF/PS/Jo/HHCY', 
    'CENP_B': 'ACA',
    'dsDNA': 'AAE',
    'Nukleosomen': 'AHA',
    'Histone': 'HTT',
    'AMA_M2': 'AMM2A',
    'PM_Scl': 'APMSCL',

    // 3. 抗磷脂
    'ACLIgG': 'ACLIgG',
    'ACLIgM': 'ACLIgM',
    'B2_GDP1IgM': 'B2-GDP1IgM',
    'B2_GDP1IgG_IgA': 'B2-GDP1IgG/B2-GDP1-IgA',
    'LA': 'LA',
    'proteinS': '蛋白S缺乏',
    'APS_diagnosis': '抗磷脂综合征',
    'thrombosis_history': '反复肝损/血栓形成/血小板聚集率高/D2高',

    // 4. 内分泌
    'VITD': 'VITD',
    'TGAb': 'TGAb',
    'TPOAb': 'TPOAb',
    'insulinResistance': '胰岛素抵抗/糖尿病',
    'hyperlipidemia': '高血脂',
    'homocysteine': '高同型半胱氨酸血症与甲状腺功能',
    'thyroid': '桥本甲状腺炎/甲状腺癌术后/甲减',
    'PCOS': '多囊卵巢综合征/卵巢早衰',

    // 5. 其他
    'C3': 'C3',
    'C4': 'C4',
    'HBV': '乙肝',
    'placenta': '前置胎盘/胎盘植入',
    'infection': '绒毛膜羊膜炎/支原体感染/大肠埃希菌感染/胎儿巨细胞病毒等',
    'hypertension': '慢性高血压',
    'kidney': '慢性肾炎/肾病/蛋白尿/肾结石',
    'connectiveTissueDisease': '结缔组织疾病/类风湿',
    'chromosomalAbnormality': '平衡易位/臂间倒位（染色体异常）',
    'thrombocytopenia': '血小板减少',
    'PAI1_homozygous': 'PAI-I纯合子',
    'intrahepaticCholestasis': '先天性/妊娠期肝内胆汁淤积症',
    'cervicalInsufficiency': '宫颈机能不全',
    'smokingHistory': '吸烟病史',

    // 6. 子宫动脉数据（新增）
    'L_PSC': 'L-PSC（cm/s）',
    'L_RI': 'l-RI',
    'L_PI': 'l-PI',
    'L_SD_ratio': 'L-S/D',
    'R_PSC': 'R-PSC（cm/s）',
    'R_RI': 'R-RI',
    'R_PI': 'R-PI',
    'R_SD_ratio': 'R-S/D',
    'S_SD_ratio': 'S--S/D'
};

// --- 风险提示配置 ---
const riskTips = {
    '既往流产次数': { title: '既往流产次数风险', tip: '次数越多风险越高，请遵医嘱。' },
    'VITD': { title: '维生素D水平偏低', tip: '可能增加不良风险，建议咨询医生。' },
    'ACLIgM': { title: '抗心磷脂抗体IgM阳性', tip: '提示抗磷脂综合征风险。' },
    'ACLIgG': { title: '抗心磷脂抗体IgG阳性', tip: '提示抗磷脂综合征风险。' },
    'LA': { title: '狼疮抗凝物阳性', tip: '抗磷脂综合征重要指标。' },
    'TPOAb': { title: 'TPOAb 阳性', tip: '提示自身免疫性甲状腺炎可能。' },
    'TGAb': { title: 'TGAb 阳性', tip: '提示自身免疫性甲状腺炎可能。' },
    'ANA': { title: 'ANA 阳性', tip: '需结合滴度和核型评估自身免疫风险。' },
    '抗磷脂综合征': { title: '确诊APS', tip: '高危因素，需严格管理。' },
    '胰岛素抵抗/糖尿病': { title: '代谢异常', tip: '建议控制血糖。' },
    '肥胖': { title: 'BMI 偏高', tip: '建议控制体重。' },
    'R-RI': { title: '右侧子宫动脉阻力指数偏高', tip: '提示胎盘灌注异常风险。' },
    'L-RI': { title: '左侧子宫动脉阻力指数偏高', tip: '提示胎盘灌注异常风险。' },
    '平衡易位/臂间倒位（染色体异常）': { title: '染色体异常', tip: '建议遗传咨询。' },
    '血小板减少': { title: '血小板减少', tip: '需关注出血风险。' },
    'PAI-I纯合子': { title: 'PAI-I纯合子', tip: '血栓风险因素。' },
    '宫颈机能不全': { title: '宫颈机能不全', tip: '建议医学评估。' },
    '吸烟病史': { title: '吸烟病史', tip: '建议戒烟以降低风险。' }
};

// --- 辅助：数值转换函数 ---
const transformValue = (key, val) => {
    if (val === '' || val === undefined || val === null) return null;
    if (!isNaN(parseFloat(val)) && isFinite(val) && key !== 'titer' && key !== 'pattern') return parseFloat(val);

    const trueSet = ['是', '阳性', '有'];
    const falseSet = ['否', '阴性', '无', '正常/阴性', '正常/未测'];
    
    if (trueSet.includes(val)) return 1.0;
    if (falseSet.includes(val)) return 0.0;

    if (key === 'titer') {
        if (val.includes('阴性') || val.includes('80以下')) return 0;
        if (val === '1:80') return 1;
        if (val === '1:160') return 2;
        if (val === '1:320') return 3;
        if (val === '1:640') return 4;
        if (val.includes('1000')) return 5;
        return 0;
    }
    
    if (key === 'pattern') {
        if (val.includes('正常') || val.includes('阴性')) return 0.0;
        return 1.0;
    }

    return null;
};

// --- 预处理函数 ---
const preprocessData = (userInput) => {
    let processed = {}; 

    // 1. 计算 BMI
    const h = parseFloat(userInput['heightCm']) / 100 || 0;
    const w = parseFloat(userInput['prePregnancyWeightKg']) || 0;
    let bmi = null, isObese = 0, isThin = 0;

    if (h > 0 && w > 0) {
        bmi = w / (h * h);
        if (bmi >= 28.0) isObese = 1.0;
        if (bmi < 18.5) isThin = 1.0;
    }

    // 2. 映射特征
    finalFeatureOrder.forEach(featureName => {
        let val = null;
        if (featureName === 'BMI') val = bmi;
        else if (featureName === '肥胖') val = isObese;
        else if (featureName === '偏瘦') val = isThin;
        else {
            const inputKey = Object.keys(keyMap).find(k => keyMap[k] === featureName);
            if (inputKey && userInput[inputKey] !== undefined) {
                val = transformValue(inputKey, userInput[inputKey]);
            }
        }
        processed[featureName] = val;
    });

    // 3. 中位数填充
    const featureMedianMap = {};
    imputerParams.features.forEach((feature, i) => {
        featureMedianMap[feature] = imputerParams.medians[i];
    });

    finalFeatureOrder.forEach(featureName => {
        let val = processed[featureName];
        if (val === null || typeof val === 'undefined' || (typeof val === 'number' && isNaN(val))) {
            const median = featureMedianMap[featureName];
            processed[featureName] = (median !== undefined) ? median : 0.0;
        }
    });

    // 4. 构建 Tensor 数组
    const finalInputArray = new Float32Array(finalFeatureOrder.length);
    const processedDataMapForRisk = {};

    finalFeatureOrder.forEach((featureName, i) => {
        const value = parseFloat(processed[featureName]);
        finalInputArray[i] = value;
        processedDataMapForRisk[featureName] = value;
    });

    return { finalInputArray, processedDataMapForRisk };
};

// --- 风险识别 ---
const identifyRiskFactors = (processedDataMap) => {
    const risks = [];
    const threshold = 0.5;

    if (processedDataMap['既往流产次数'] >= 2) risks.push(riskTips['既往流产次数']);
    if (processedDataMap['VITD'] < 18) risks.push(riskTips['VITD']);
    if (processedDataMap['ACLIgM'] > 9) risks.push(riskTips['ACLIgM']);
    if (processedDataMap['ACLIgG'] > 9) risks.push(riskTips['ACLIgG']);
    if (processedDataMap['LA'] > threshold) risks.push(riskTips['LA']);
    if (processedDataMap['TPOAb'] > threshold) risks.push(riskTips['TPOAb']);
    if (processedDataMap['TGAb'] > threshold) risks.push(riskTips['TGAb']);
    if (processedDataMap['ANA'] > threshold) risks.push(riskTips['ANA']);
    if (processedDataMap['肥胖'] > threshold) risks.push(riskTips['肥胖']);
    if (processedDataMap['抗磷脂综合征'] > threshold) risks.push(riskTips['抗磷脂综合征']);
    if (processedDataMap['胰岛素抵抗/糖尿病'] > threshold) risks.push(riskTips['胰岛素抵抗/糖尿病']);

    // 新增的风险因素识别
    if (processedDataMap['R-RI'] > 1) risks.push(riskTips['R-RI']);
    if (processedDataMap['l-RI'] > 1) risks.push(riskTips['L-RI']);
    if (processedDataMap['平衡易位/臂间倒位（染色体异常）'] > threshold) risks.push(riskTips['平衡易位/臂间倒位（染色体异常）']);
    if (processedDataMap['血小板减少'] > threshold) risks.push(riskTips['血小板减少']);
    if (processedDataMap['PAI-I纯合子'] > threshold) risks.push(riskTips['PAI-I纯合子']);
    if (processedDataMap['宫颈机能不全'] > threshold) risks.push(riskTips['宫颈机能不全']);
    if (processedDataMap['吸烟病史'] > threshold) risks.push(riskTips['吸烟病史']);

    const uniqueRisks = [];
    const seenTitles = new Set();
    for (const risk of risks) {
        if (risk && risk.title && !seenTitles.has(risk.title)) {
            uniqueRisks.push(risk);
            seenTitles.add(risk.title);
        }
    }
    return uniqueRisks;
};

exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    try {
        if (!session || !imputerParams || !finalFeatureOrder) {
            console.log("初始化模型...");
            const [modelRes, imputerRes, finalFeaturesRes] = await Promise.all([
                cloud.downloadFile({ fileID: ONNX_MODEL_FILE_ID }),
                cloud.downloadFile({ fileID: IMPUTER_PARAMS_FILE_ID }),
                cloud.downloadFile({ fileID: FINAL_FEATURES_FILE_ID }),
            ]);

            session = await ort.InferenceSession.create(modelRes.fileContent);
            imputerParams = JSON.parse(imputerRes.fileContent.toString('utf-8'));
            finalFeatureOrder = JSON.parse(finalFeaturesRes.fileContent.toString('utf-8'));
        }

        const rawUserInput = event.data || event.userInput || {};
        console.log('原始输入:', rawUserInput);

        const { finalInputArray, processedDataMapForRisk } = preprocessData(rawUserInput);

        // 运行模型
        const inputTensor = new ort.Tensor('float32', finalInputArray, [1, finalFeatureOrder.length]);
        const feeds = { [session.inputNames[0]]: inputTensor };
        const results = await session.run(feeds);

        // 获取输出
        const outputKey = session.outputNames[1] || session.outputNames[0];
        const probabilityTensor = results[outputKey];

        // ⚠️ 检查模型输出类型，防止 Error 9
        if (!probabilityTensor || !probabilityTensor.data) {
             throw new Error("模型输出格式异常。请确保您已使用Python脚本移除了ZipMap层。");
        }

        let probability = 0;
        // 如果修复了模型，这里是一个 Float32Array
        if (probabilityTensor.data.length >= 2) {
            probability = parseFloat(probabilityTensor.data[1]);
        } else {
            probability = parseFloat(probabilityTensor.data[0]);
        }

        if (isNaN(probability)) throw new Error("预测概率为 NaN，请检查输入数据。");

        // 计算置信区间
        const p = probability;
        const width = 0.3 * (4 * p * (1 - p));
        let lowerBound = Math.max(0, p - width / 2);
        let upperBound = Math.min(1, p + width / 2);

        const riskFactors = identifyRiskFactors(processedDataMapForRisk);

        const resultToReturn = {
            success: true,
            probability: p,
            riskLevel: p > 0.5 ? '高风险' : '低风险',
            percent: (p * 100).toFixed(1) + '%',
            confidenceInterval: { lower: lowerBound, upper: upperBound },
            riskFactors: riskFactors
        };

        // 保存历史
        try {
            await cloud.callFunction({
                name: 'history', 
                data: {
                    action: 'save',
                    openid: wxContext.OPENID,
                    record: { userInput: rawUserInput, predictionResult: resultToReturn }
                }
            });
        } catch (e) { console.error('保存历史失败', e); }

        return resultToReturn;

    } catch (error) {
        console.error("云函数错误:", error);
        return { success: false, error: error.message };
    }
};