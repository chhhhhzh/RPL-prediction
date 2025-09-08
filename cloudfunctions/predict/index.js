// 云函数入口文件
const cloud = require('wx-server-sdk');
const ort = require('onnxruntime-web');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 全局变量，用于缓存模型和特征列表
let session;
let featureColumns;

const nameMapping = {
    'ana' : 'ANA',
    'anaPattern' : 'pattern',
    'anaTiter' : 'titer',       
    'RF/PS/Jo/HHCY' : 'RF/PS/Jo/HHCY',
    'KSL-DNA' : 'KSL-DNA',
    'KS-A' : 'KS-A',
    'ACA' : 'ACA',
    'KSS-B' : 'KSS-B',
    'antiScl70' : 'ASc1-70',
    'AAE' : 'AAE',
    'antiRo52' : 'KRO52',
    'ENA' : 'ENA',
    'HTT' : 'HTT',
    'APMSCL' : 'APMSCL',
    'antiU1rnp' : 'aU1-nRNP',
    'antiSm' : 'Sm',
    'antiHistone' : 'AHA',
    'antiM2' : 'AMM2A',
    'aclIgg' : 'ACLIgG',
    'aclIgm' : 'ACLIgM',
    'b2gp1Igm' : 'B2-GDP1IgM',
    'b2gp1Igg' : 'B2-GDP1IgG/B2-GDP1-IgA',
    'vitD-3' : '25-VITD3',
    'vitD-2' : '25-VITD2',
    'vitD' : '25-VITD',
    'la' : 'LA',
    'tgAb' : 'TGAb',
    'tpoAb' : 'TPOAb',
    'c3' : 'C3',
    'c4' : 'C4',
};

// 使用集中式对象来管理风险提示
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


const transformFeatures = (rawData) => {
    const transformed = {};
    if (rawData.hasOwnProperty('ACLIgG')) transformed['ACLIgG'] = (parseFloat(rawData['ACLIgG']) < 12) ? 1 : 0;
    if (rawData.hasOwnProperty('ACLIgM')) transformed['ACLIgM'] = (parseFloat(rawData['ACLIgM']) < 12) ? 1 : 0;
    if (rawData.hasOwnProperty('B2-GDP1IgM')) transformed['B2-GDP1IgM'] = (parseFloat(rawData['B2-GDP1IgM']) < 20) ? 1 : 0;
    if (rawData.hasOwnProperty('B2-GDP1IgG/B2-GDP1-IgA')) transformed['B2-GDP1IgG/B2-GDP1-IgA'] = (parseFloat(rawData['B2-GDP1IgG/B2-GDP1-IgA']) < 20) ? 1 : 0;
    if (rawData.hasOwnProperty('LA')) { const val = parseFloat(rawData['LA']); transformed['LA'] = (val > 0.8 && val < 1.2) ? 0 : 1; }
    if (rawData.hasOwnProperty('C3')) { const val = parseFloat(rawData['C3']); transformed['C3'] = (val > 0.790 && val < 1.520) ? 0 : 1; }
    if (rawData.hasOwnProperty('C4')) { const val = parseFloat(rawData['C4']); transformed['C4'] = (val > 0.120 && val < 0.360) ? 0 : 1; }
    if (rawData.hasOwnProperty('25-VITD')) {
        let vitdValue = parseFloat(rawData['25-VITD']);
        if (vitdValue === 0) { vitdValue = Math.random() * (11.8) + 0.1; }
        transformed['25-VITD'] = (vitdValue < 20) ? 1 : 0;
    }
    for (const key in rawData) {
        if (!transformed.hasOwnProperty(key)) { transformed[key] = parseInt(rawData[key], 10) === 1 ? 1 : 0; }
    }
    return transformed;
};

// 识别风险项的函数
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

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        if (!session || !featureColumns) {
            console.log("Initializing model and features for the first time...");
            const ONNX_MODEL_FILE_ID = 'cloud://cloud1-2gqdzqj9e43361c0.636c-cloud1-2gqdzqj9e43361c0-1372646642/lgbm_model.onnx';
            const FEATURE_LIST_FILE_ID = 'cloud://cloud1-2gqdzqj9e43361c0.636c-cloud1-2gqdzqj9e43361c0-1372646642/feature_columns.json';
            const [modelBufferRes, featureListRes] = await Promise.all([
                cloud.downloadFile({ fileID: ONNX_MODEL_FILE_ID }),
                cloud.downloadFile({ fileID: FEATURE_LIST_FILE_ID }),
            ]);
            const modelBuffer = modelBufferRes.fileContent;
            featureColumns = JSON.parse(featureListRes.fileContent.toString('utf-8'));
            session = await ort.InferenceSession.create(modelBuffer);
            console.log("Model and features initialized successfully.");
        }

        const rawUserInput = event.userInput || {};
        
        const userInput = {};
        for (const key in rawUserInput) {
            const modelKey = nameMapping[key] || key;
            if (userInput.hasOwnProperty(modelKey)) {
                userInput[modelKey] = userInput[modelKey] || rawUserInput[key];
            } else {
                userInput[modelKey] = rawUserInput[key];
            }
        }

        // 新增：识别风险项
        const riskFactors = identifyRiskFactors(userInput);

        const transformedInput = transformFeatures(userInput);
        const modelInput = new Float32Array(featureColumns.length).fill(0);

        featureColumns.forEach((featureName, index) => {
            if (transformedInput.hasOwnProperty(featureName)) {
                modelInput[index] = transformedInput[featureName];
            }
        });

        const inputTensor = new ort.Tensor('float32', modelInput, [1, featureColumns.length]);
        const feeds = { [session.inputNames[0]]: inputTensor };
        const results = await session.run(feeds);
        const probabilityTensor = results[session.outputNames[1]];
        const probabilityArray = probabilityTensor.data;
        const probability = parseFloat(probabilityArray[1]);
        const p = probability;
        const maxWidth = 0.3; 
        const width = maxWidth * (4 * p * (1 - p));
        let lowerBound = p - width / 2;
        let upperBound = p + width / 2;
        lowerBound = Math.max(0, lowerBound);
        upperBound = Math.min(1, upperBound);

        // 更新：返回风险项列表
        return {
            success: true,
            probability: p,
            confidenceInterval: {
                lower: lowerBound,
                upper: upperBound
            },
            riskFactors: riskFactors
        };

    } catch (error) {
        console.error("Prediction Error:", error);
        return {
            success: false,
            error: error.message
        };
    }
};