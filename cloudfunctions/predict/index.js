// 云函数入口文件
const cloud = require('wx-server-sdk');
const ort = require('onnxruntime-web');

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

// --- 缓存 ---
let session;
let scalerParams;
let encoderParams;
let finalFeatureNames;

const ONNX_MODEL_FILE_ID = 'cloud://cloud1-2gqdzqj9e43361c0.636c-cloud1-2gqdzqj9e43361c0-1372646642/lgbm_model_hb.onnx';
const SCALER_PARAMS_FILE_ID = 'cloud://cloud1-2gqdzqj9e43361c0.636c-cloud1-2gqdzqj9e43361c0-1372646642/scaler_params.json';
const ENCODER_PARAMS_FILE_ID = 'cloud://cloud1-2gqdzqj9e43361c0.636c-cloud1-2gqdzqj9e43361c0-1372646642/encoder_params.json';
const FINAL_FEATURES_FILE_ID = 'cloud://cloud1-2gqdzqj9e43361c0.636c-cloud1-2gqdzqj9e43361c0-1372646642/final_feature_names.json';

// --- 名称对照表和风险提示 ---
const nameMapping = {
    'ana': 'ANA',
    'anaTiter': 'titer',
    'anaPattern': 'pattern',
    'antiDsdna': 'KSL-DNA',
    'antiSm': 'Sm',
    'antiScl70': 'ASc1-70',
    'antiRo52': 'KRO52',
    'antiSsa': 'KS-A',
    'antiSsb': 'KSS-B',
    'antiU1rnp': 'aU1-nRNP',
    'antiHistone': 'AHA',
    'antiM2': 'AMM2A',
    'antiCentromere': 'ACA',
    'la': 'LA',
    'aclIgg': 'ACLIgG',
    'aclIgm': 'ACLIgM',
    'b2gp1Igg': 'B2-GDP1IgG/B2-GDP1-IgA',
    'b2gp1Igm': 'B2-GDP1IgM',
    'vitD': '25-VITD',
    'vitD2': '25-VITD2',
    'vitD3': '25-VITD3',
    'tpoAb': 'TPOAb',
    'tgAb': 'TGAb',
    'rf': 'RF/PS/Jo/HHCY',
    'antiJo1': 'RF/PS/Jo/HHCY',
    'hcy': 'RF/PS/Jo/HHCY',
    'c3': 'C3',
    'c4': 'C4',
    // 添加其他可能的映射
    'aae': 'AAE',
    'ena': 'ENA',
    'htt': 'HTT',
    'apmscl': 'APMSCL'
};

const riskTips = {
    'ANA': {
        title: '抗核抗体(ANA)阳性',
        tip: '提示有自身免疫性疾病的可能，需要风湿免疫科进一步检查，并遵医嘱进行相应治疗。'
    },
    'pattern': {
        title: 'ANA模式异常',
        tip: '请咨询医生，根据具体模式（如斑点型、核仁型等）进行针对性评估。'
    },
    'titer': {
        title: 'ANA滴度异常',
        tip: '滴度越高，提示自身免疫性疾病活动性可能越强。请遵医嘱进一步检查和治疗。'
    },
    'RF/PS/Jo/HHCY': {
        title: '风湿因子异常',
        tip: '可能与风湿性疾病、类风湿关节炎等相关。请风湿免疫科评估。'
    },
    'KSL-DNA': {
        title: '抗双链DNA抗体(anti-dsDNA)阳性',
        tip: '是系统性红斑狼疮的特异性指标，建议进行风湿免疫科评估。'
    },
    'ACA': {
        title: '抗心磷脂抗体(ACA)阳性',
        tip: '可能与抗磷脂综合征（APS）相关，这是一种自身免疫性疾病，是复发性流产的重要病因之一。'
    },
    'ACLIgG': {
        title: '抗心磷脂抗体IgG(ACLIgG)高于阈值',
        tip: '提示有抗磷脂综合征（APS）的可能，需要风湿免疫科进一步检查和治疗。'
    },
    'ACLIgM': {
        title: '抗心磷脂抗体IgM(ACLIgM)高于阈值',
        tip: '提示有抗磷脂综合征（APS）的可能，需要风湿免疫科进一步检查和治疗。'
    },
    'b2gp1Igm': {
        title: '抗B2糖蛋白-I抗体IgM(b2gp1Igm)阳性',
        tip: '提示有抗磷脂综合征（APS）的可能，需要风湿免疫科进一步检查和治疗。'
    },
    'b2gp1Igg': {
        title: '抗B2糖蛋白-I抗体IgG(b2gp1Igg)阳性',
        tip: '提示有抗磷脂综合征（APS）的可能，需要风湿免疫科进一步检查和治疗。'
    },
    'tgAb': {
        title: '甲状腺球蛋白抗体(TGAb)阳性',
        tip: '提示可能存在自身免疫性甲状腺炎，建议内分泌科就诊，并根据甲状腺功能评估是否需要治疗。'
    },
    'tpoAb': {
        title: '甲状腺过氧化物酶抗体(TPOAb)阳性',
        tip: '提示可能存在自身免疫性甲状腺炎，建议内分泌科就诊，并根据甲状腺功能评估是否需要治疗。'
    },
    'vitD-3': {
        title: '维生素D3缺乏',
        tip: '维生素D3缺乏与自身免疫性疾病和妊娠不良结局相关。建议补充维生素D。'
    },
    'vitD-2': {
        title: '维生素D2缺乏',
        tip: '维生素D2缺乏与自身免疫性疾病和妊娠不良结局相关。建议补充维生素D。'
    },
    'vitD': {
        title: '维生素D缺乏',
        tip: '维生素D缺乏与自身免疫性疾病和妊娠不良结局相关。建议补充维生素D。'
    }
};

// 风险识别函数，现在基于原始输入值进行判断
const identifyRiskFactors = (rawData) => {
    const risks = [];

    // 检查哪些指标是阳性或异常，并从 riskTips 中获取对应提示
    if (rawData.ANA == 1 && rawData.titer != 0) {
        risks.push(riskTips.ANA);
    }
    if (rawData.titer && rawData.titer != 0) {
        risks.push(riskTips.titer);
    }
    if (rawData.pattern && rawData.pattern != 0) {
        risks.push(riskTips.pattern);
    }
    if (rawData['RF/PS/Jo/HHCY'] == 1) {
        risks.push(riskTips['RF/PS/Jo/HHCY']);
    }
    if (rawData['KSL-DNA'] == 1) {
        risks.push(riskTips['KSL-DNA']);
    }
    if (rawData.ACA == 1) {
        risks.push(riskTips.ACA);
    }
    if (rawData.ACLIgG == 1) {
        risks.push(riskTips.ACLIgG);
    }
    if (rawData.ACLIgM == 1) {
        risks.push(riskTips.ACLIgM);
    }
    if (rawData.b2gp1Igm == 1) {
        risks.push(riskTips.b2gp1Igm);
    }
    if (rawData.b2gp1Igg == 1) {
        risks.push(riskTips.b2gp1Igg);
    }
    if (rawData.tgAb == 1) {
        risks.push(riskTips.tgAb);
    }
    if (rawData.tpoAb == 1) {
        risks.push(riskTips.tpoAb);
    }
    // 检查维生素D是否低于阈值
    const vitDValue = parseFloat(rawData['25-VITD'] || '0');
    if (rawData.hasOwnProperty('25-VITD') && vitDValue < 20) {
        if (rawData['25-VITD-3'] == 1) {
            risks.push(riskTips['vitD-3']);
        } else if (rawData['25-VITD-2'] == 1) {
            risks.push(riskTips['vitD-2']);
        } else {
            risks.push(riskTips.vitD);
        }
    }

    return risks;
};

// 定义训练时使用的特征列表（保持与训练一致）
const continuousFeatures = ['titer', 'ACLIgG', 'ACLIgM', 'B2-GDP1IgM', 'B2-GDP1IgG/B2-GDP1-IgA', '25-VITD3', '25-VITD2', '25-VITD', 'LA', 'C3', 'C4'];
const categoricalFeatures = ['ANA', 'KSL-DNA', 'KS-A', 'ACA', 'KSS-B', 'ASc1-70', 'AAE', 'KRO52', 'ENA', 'HTT', 'APMSCL', 'aU1-nRNP', 'Sm', 'AHA', 'AMM2A', 'TGAb', 'TPOAb', 'pattern', 'RF/PS/Jo/HHCY'];

// 定义特征默认值
const continuousDefaults = {
    'titer': 100,
    'ACLIgG': 12,
    'ACLIgM': 15,
    'B2-GDP1IgM': 12,
    'B2-GDP1IgG/B2-GDP1-IgA': 18,
    '25-VITD3': 20,
    '25-VITD2': 1.00,
    '25-VITD': 25,
    'LA': 1.00,
    'C3': 1.00,
    'C4': 0.20
};

const categoricalDefaults = {
    // 二元特征：默认为阴性 (0)
    'ANA': '0',
    'KSL-DNA': '0',
    'KS-A': '0',
    'ACA': '0',
    'KSS-B': '0',
    'ASc1-70': '0',
    'AAE': '0',
    'KRO52': '0',
    'ENA': '0',
    'HTT': '0',
    'APMSCL': '0',
    'aU1-nRNP': '0',
    'Sm': '0',
    'AHA': '0',
    'AMM2A': '0',
    'TGAb': '0',
    'TPOAb': '0',
    // 多元特征：默认为正常 (0)
    'pattern': '0',
    'RF/PS/Jo/HHCY': '0'
};

// --- 修复的预处理流水线 ---
const preprocessData = (rawData) => {
    console.log('开始预处理，原始数据:', rawData);
    
    // 1. 标准化数值特征
    const scaledNumericalData = {};
    scalerParams.features.forEach((featureName, i) => {
        const mean = scalerParams.mean[i];
        const scale = scalerParams.scale[i];
        let value = parseFloat(rawData[featureName]);

        // 【关键修复】使用特定的默认值而不是随机值进行填充
        if (isNaN(value) || value === 0) {
            value = continuousDefaults[featureName] || 1.0; // 使用特定默认值
            console.log(`特征 ${featureName} 使用默认值: ${value}`);
        }

        scaledNumericalData[featureName] = (value - mean) / scale;
    });

    console.log('标准化后的数值数据:', scaledNumericalData);

    // 2. 独热编码分类型特征
    const encodedCategoricalData = {};
    encoderParams.features.forEach((featureName, i) => {
        const categories = encoderParams.categories[i];
        
        let value;
        if (rawData.hasOwnProperty(featureName)) {
            value = String(rawData[featureName]);
        } else {
            // 使用特定的默认值
            value = categoricalDefaults[featureName] || 'missing_value';
            console.log(`特征 ${featureName} 使用默认值: ${value}`);
        }

        console.log(`处理特征 ${featureName}, 值: ${value}, 类型: ${typeof value}`);

        categories.forEach(category => {
            const finalName = `cat__${featureName}_${category}`;
            encodedCategoricalData[finalName] = (value === category) ? 1.0 : 0.0;
        });
    });

    console.log('编码后的分类数据样例:', Object.keys(encodedCategoricalData).slice(0, 10));

    // 3. 构建最终的、有序的输入数组
    const finalInputArray = new Float64Array(finalFeatureNames.length);
    finalFeatureNames.forEach((featureName, i) => {
        let value = 0.0;
        if (featureName.startsWith('cont__')) {
            const originalName = featureName.replace('cont__', '');
            value = scaledNumericalData[originalName] || 0.0;
        } else if (featureName.startsWith('cat__')) {
            value = encodedCategoricalData[featureName] || 0.0;
        }
        finalInputArray[i] = value;
    });

    console.log('最终输入数组长度:', finalInputArray.length);
    return finalInputArray;
};

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    try {
        if (!session) {
            console.log("Initializing model and preprocessing parameters...");

            const [modelRes, scalerRes, encoderRes, finalFeaturesRes] = await Promise.all([
                cloud.downloadFile({
                    fileID: ONNX_MODEL_FILE_ID
                }),
                cloud.downloadFile({
                    fileID: SCALER_PARAMS_FILE_ID
                }),
                cloud.downloadFile({
                    fileID: ENCODER_PARAMS_FILE_ID
                }),
                cloud.downloadFile({
                    fileID: FINAL_FEATURES_FILE_ID
                }),
            ]);

            session = await ort.InferenceSession.create(modelRes.fileContent);
            scalerParams = JSON.parse(scalerRes.fileContent.toString('utf-8'));
            encoderParams = JSON.parse(encoderRes.fileContent.toString('utf-8'));
            finalFeatureNames = JSON.parse(finalFeaturesRes.fileContent.toString('utf-8'));

            console.log("Initialization successful.");
        }

        const rawUserInput = event.userInput || {};
        console.log('接收到的原始输入:', rawUserInput);
        
        const userInput = {};
        for (const key in rawUserInput) {
            const modelKey = nameMapping[key] || key;
            userInput[modelKey] = rawUserInput[key];
        }
        
        console.log('映射后的输入:', userInput);

        // 功能保持一致：先识别风险项
        const riskFactors = identifyRiskFactors(userInput);

        // 使用全新的预处理流水线
        const modelInput = preprocessData(userInput);

        // 使用 'float64' 来匹配模型期望的 double 类型
        const inputTensor = new ort.Tensor('float64', modelInput, [1, finalFeatureNames.length]);
        const feeds = {
            [session.inputNames[0]]: inputTensor
        };
        const results = await session.run(feeds);

        const probabilityTensor = results[session.outputNames[1]];
        const probability = parseFloat(probabilityTensor.data[1]);

        const p = probability;
        const maxWidth = 0.3;
        const width = maxWidth * (4 * p * (1 - p));
        let lowerBound = p - width / 2;
        let upperBound = p + width / 2;
        lowerBound = Math.max(0, lowerBound);
        upperBound = Math.min(1, upperBound);

        const resultToReturn = {
            success: true,
            probability: p,
            confidenceInterval: {
                lower: lowerBound,
                upper: upperBound
            },
            riskFactors: riskFactors
        };

        // 保存历史记录
        try {
            console.log("Attempting to save history record...");
            await cloud.callFunction({
                name: 'history',
                data: {
                    action: 'save',
                    openid: wxContext.OPENID,
                    record: {
                        userInput: userInput,
                        predictionResult: resultToReturn
                    }
                }
            });
            console.log('History saved successfully.');
        } catch (saveError) {
            console.error('CRITICAL: Failed to save history, but proceeding to return result.', saveError);
        }

        return resultToReturn;

    } catch (error) {
        console.error("Prediction Error:", error);
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
};