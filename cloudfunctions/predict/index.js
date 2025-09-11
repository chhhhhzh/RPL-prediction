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
    'tpoAb': 'TPOAb',
    'tgAb': 'TGAb',
    'rf': 'RF/PS/Jo/HHCY',
    'antiJo1': 'RF/PS/Jo/HHCY',
    'hcy': 'RF/PS/Jo/HHCY',
    'c3': 'C3',
    'c4': 'C4',
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


// --- 全新的预处理流水线 ---
const preprocessData = (rawData) => {
    // 1. 标准化数值特征
    const scaledNumericalData = {};
    scalerParams.features.forEach((featureName, i) => {
        const mean = scalerParams.mean[i];
        const scale = scalerParams.scale[i];
        let value = parseFloat(rawData[featureName]);

        // 你的Python代码逻辑：对NaN或0进行随机填充
        if (isNaN(value) || value === 0) {
            value = Math.random() * (10 - 0.1) + 0.1;
        }

        scaledNumericalData[featureName] = (value - mean) / scale;
    });

    // 2. 独热编码分类型特征
    const encodedCategoricalData = {};
    encoderParams.features.forEach((featureName, i) => {
        const categories = encoderParams.categories[i];
        const value = rawData.hasOwnProperty(featureName) ? String(rawData[featureName]) : 'missing_value';

        categories.forEach(category => {
            const finalName = `cat__${featureName}_${category}`;
            encodedCategoricalData[finalName] = (value === category) ? 1.0 : 0.0;
        });
    });

    // 3. 构建最终的、有序的输入数组
    // 使用Float64Array以匹配Hummingbird模型的输入要求 (double)
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

    return finalInputArray;
};


// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext(); // 在函数入口获取 WX Context
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
        const userInput = {};
        for (const key in rawUserInput) {
            const modelKey = nameMapping[key] || key;
            userInput[modelKey] = rawUserInput[key];
        }

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

        // --- 使用 await 确保历史记录被成功保存后再返回 ---
        try {
            console.log("Attempting to save history record...");
            await cloud.callFunction({
                name: 'history',
                data: {
                    action: 'save',
                    openid: wxContext.OPENID,
                    record: {
                        // 注意：这里我们传递的是经过名称映射后的 userInput
                        // 这样保存到数据库里的就是模型真正使用的、标准的指标名称
                        userInput: userInput,
                        predictionResult: resultToReturn // 保存完整的预测结果
                    }
                }
            });
            console.log('History saved successfully.');
        } catch (saveError) {
            // 即使保存失败，也不应该影响主流程的返回
            // 我们只在后台记录这个错误，以便排查
            console.error('CRITICAL: Failed to save history, but proceeding to return result.', saveError);
        }
        // --- 修改结束 ---

        // 返回预测结果给前端
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