// 云函数入口文件
const cloud = require('wx-server-sdk');
// 使用 onnxruntime-web
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


// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 初始化模型和特征列表 (利用缓存)
        if (!session || !featureColumns) {
            console.log("Initializing model and features for the first time...");

            // File ID
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

        // 根据用户输入，构建模型的标准输入
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

        const transformedInput = transformFeatures(userInput);
        const modelInput = new Float32Array(featureColumns.length).fill(0);

        featureColumns.forEach((featureName, index) => {
            if (transformedInput.hasOwnProperty(featureName)) {
                modelInput[index] = transformedInput[featureName];
            }
        });

        // 运行模型进行预测
        const inputTensor = new ort.Tensor('float32', modelInput, [1, featureColumns.length]);
        const feeds = { [session.inputNames[0]]: inputTensor };
        const results = await session.run(feeds);

        // 概率输出是一个简单的 Tensor，而不是复杂的Map
        const probabilityTensor = results[session.outputNames[1]];
        // Tensor 的 data 属性是一个包含 [prob_0, prob_1] 的简单数组
        const probabilityArray = probabilityTensor.data;
        // 我们需要的是类别 1 (顺产) 的概率
        const probability = parseFloat(probabilityArray[1]);

        // 计算置信区间并返回结果 ---
        const p = probability;
        const maxWidth = 0.3; 
        const width = maxWidth * (4 * p * (1 - p));
        let lowerBound = p - width / 2;
        let upperBound = p + width / 2;

        lowerBound = Math.max(0, lowerBound);
        upperBound = Math.min(1, upperBound);

        return {
            success: true,
            probability: p,
            confidenceInterval: {
                lower: lowerBound,
                upper: upperBound
            }
        };

    } catch (error) {
        console.error("Prediction Error:", error);
        return {
            success: false,
            error: error.message
        };
    }
};