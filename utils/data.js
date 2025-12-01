const {
    icons
} = require('./icons.js');

// 严格对应 final_feature_order.json 的所有特征
// 自动计算项（BMI、肥胖、偏瘦）不需要用户填写，通过身高体重计算
const modulesConfig = {
    // 模块1：基本特征
    basic: {
        id: 'basic',
        title: '基本信息',
        icon: icons.users, // 确保 icons.js 中有此图标
        color: 'bg-blue-100',
        textColor: 'text-blue-800',
        indicators: [{
                id: 'age',
                label: '年龄 (Age)',
                value: '',
                unit: '岁',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'heightCm',
                label: '身高cm',
                value: '',
                unit: 'cm',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'prePregnancyWeightKg',
                label: '孕前体重kg',
                value: '',
                unit: 'kg',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'weightGainKg',
                label: '孕期增加体重kg',
                value: '',
                unit: 'kg',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'previousMiscarriageCount',
                label: '既往流产次数',
                value: '',
                unit: '次',
                placeholder: '请输入',
                inputType: 'number'
            }
        ]
    },

    // 模块2：自身免疫 - ANA谱与抗体
    autoimmune_ana: {
        id: 'autoimmune_ana',
        title: '自身免疫 (ANA谱系)',
        icon: icons.shield,
        color: 'bg-rose-100',
        textColor: 'text-rose-800',
        indicators: [{
                id: 'ANA',
                label: '抗核抗体 (ANA)',
                value: '',
                unit: '',
                placeholder: '阴性/阳性',
                inputType: 'select',
                option: ['阴性', '阳性']
            },
            {
                id: 'pattern',
                label: 'ANA 核型 (Pattern)',
                value: '',
                unit: '',
                placeholder: '请选择',
                inputType: 'select',
                // 这里列出常见核型，云函数将尝试映射
                option: ['正常/阴性', '颗粒型', '胞浆颗粒型', '核均质型', '斑点型', '核仁型', '着丝点型', '其他异常'],
                selectedIndex: null
            },
            {
                id: 'titer',
                label: 'ANA 滴度',
                value: '',
                unit: '',
                placeholder: '请选择',
                inputType: 'select',
                option: ['阴性/1:80以下', '1:80', '1:160', '1:320', '1:640', '1:1000及以上'],
                selectedIndex: null
            },
            {
                id: 'ENA',
                label: '抗ENA抗体总项',
                value: '',
                unit: '',
                placeholder: '阴性/阳性',
                inputType: 'select',
                option: ['阴性', '阳性'],
                selectedIndex: null
            },
            // 以下为具体的单项抗体
            { id: 'Sm', label: '抗Sm抗体', value: '', unit: '',placeholder: '阴性/阳性',inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'aU1_nRNP', label: '抗U1-nRNP抗体', value: '',  unit: '',placeholder: '阴性/阳性',inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'SSA_Ro52', label: '抗Ro-52 (KRO52)', value: '',   unit: '',placeholder: '阴性/阳性',inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'SSA_Ro60', label: '抗SSA/Ro60 (KSS-B/AH)', value: '',   unit: '',placeholder: '阴性/阳性',inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null }, 
            { id: 'SSB_La', label: '抗SSB/La (KSL-DNA)', value: '',  unit: '',placeholder: '阴性/阳性', inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'Scl_70', label: '抗Scl-70 (KS-A)', value: '',  unit: '',placeholder: '阴性/阳性', inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'Jo_1', label: '抗Jo-1等综合 (RF/PS/Jo...)', value: '',  unit: '',placeholder: '阴性/阳性', inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'CENP_B', label: '抗着丝点B (ACA)', value: '',   unit: '',placeholder: '阴性/阳性',inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'dsDNA', label: '抗dsDNA (AAE)', value: '',   unit: '',placeholder: '阴性/阳性',inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'Nukleosomen', label: '抗核小体 (AHA)', value: '',  unit: '',placeholder: '阴性/阳性', inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'Histone', label: '抗组蛋白 (HTT)', value: '',   unit: '',placeholder: '阴性/阳性',inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'AMA_M2', label: '抗线粒体M2 (AMM2A)', value: '',  unit: '',placeholder: '阴性/阳性', inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null },
            { id: 'PM_Scl', label: '抗PM-Scl (APMSCL)', value: '',   unit: '',placeholder: '阴性/阳性',inputType: 'select', option: ['阴性', '阳性'], selectedIndex: null }
        ]
    },

    // 模块3：自身免疫 - 抗磷脂与凝血
    autoimmune_aps: {
        id: 'autoimmune_aps',
        title: '抗磷脂与凝血',
        icon: icons.testTube,
        color: 'bg-purple-100',
        textColor: 'text-purple-800',
        indicators: [{
                id: 'ACLIgG',
                label: '抗心磷脂抗体 IgG',
                value: '',
                unit: '',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'ACLIgM',
                label: '抗心磷脂抗体 IgM',
                value: '',
                unit: '',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'B2_GDP1IgM',
                label: '抗β2糖蛋白1 IgM',
                value: '',
                unit: '',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'B2_GDP1IgG_IgA',
                label: '抗β2糖蛋白1 IgG/IgA',
                value: '',
                unit: '',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'LA',
                label: '狼疮抗凝物 (LA)',
                value: '',
                unit: '',
                placeholder: '阴性/阳性',
                inputType: 'select',
                option: ['阴性', '阳性'],
                selectedIndex: null
            },
            {
                id: 'proteinS',
                label: '蛋白S缺乏',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            },
            {
                id: 'APS_diagnosis',
                label: '确诊抗磷脂综合征',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            },
             {
                id: 'thrombosis_history',
                label: '反复血栓/肝损/D2高',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            }
        ]
    },

    // 模块4：内分泌、代谢与甲状腺
    endocrine: {
        id: 'endocrine',
        title: '内分泌与代谢',
        icon: icons.droplets,
        color: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        indicators: [{
                id: '25_VITD',
                label: '25-羟维生素D',
                value: '',
                unit: 'ng/mL',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'TGAb',
                label: '抗甲状腺球蛋白 (TGAb)',
                value: '',
                unit: '',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'TPOAb',
                label: '抗甲状腺过氧化物酶 (TPOAb)',
                value: '',
                unit: '',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'insulinResistance',
                label: '胰岛素抵抗/糖尿病',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            },
            {
                id: 'hyperlipidemia',
                label: '高血脂',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            },
            {
                id: 'homocysteine',
                label: '高同型半胱氨酸血症',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            },
            {
                id: 'thyroid',
                label: '桥本/甲减/甲状腺术后',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            },
            {
                id: 'PCOS',
                label: '多囊卵巢/卵巢早衰',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            }
        ]
    },

    // 模块5：其他病史与检查
    others: {
        id: 'others',
        title: '其他病史与检查',
        icon: icons.zap,
        color: 'bg-gray-100',
        textColor: 'text-gray-800',
        indicators: [
            {
                id: 'C3',
                label: '补体 C3',
                value: '',
                unit: '',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'C4',
                label: '补体 C4',
                value: '',
                unit: '',
                placeholder: '请输入',
                inputType: 'number'
            },
            {
                id: 'HBV',
                label: '乙肝 (Hepatitis B)',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            },
            {
                id: 'placenta',
                label: '前置胎盘/胎盘植入',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            },
            {
                id: 'infection',
                label: '宫内感染/绒毛膜羊膜炎',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            },
            {
                id: 'hypertension',
                label: '慢性高血压',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            },
            {
                id: 'kidney',
                label: '慢性肾病/蛋白尿/肾结石',
                value: '',
                unit: '',
                placeholder: '否/是',
                inputType: 'select',
                option: ['否', '是'],
                selectedIndex: null
            }
        ]
    }
};

module.exports = {
    modulesConfig
};