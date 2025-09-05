const {
    icons
} = require('./icons.js');

// 预定义所有模块和指标的结构
const modulesConfig = {
    autoimmune: {
        id: 'autoimmune',
        title: '自身免疫与免疫标志物',
        icon: icons.shield,
        color: 'bg-rose-100',
        textColor: 'text-rose-800',
        indicators: [{
                id: 'ana',
                label: 'ANA (抗核抗体)',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'anaPattern',
                label: 'ANA pattern',
                value: '',
                unit: '',
                placeholder: '请选择',
                inputType: "select",
                option: ["颗粒型", "胞浆颗粒型", "核颗粒型", "核仁型", "核均质型", "染色体型", "高尔基型", "无核型", "核少点型", "核膜型", "核着丝点型", "线粒体型", "斑点型", "正常"],
                selectedIndex: null
            },
            {
                id: 'anaTiter',
                label: 'ANA 滴度',
                value: '',
                unit: '',
                placeholder: '例如: 100',
                inputType: "text"
            },
            {
                id: 'RF/PS/Jo/HHCY',
                label: 'RF/PS/Jo/HHCY',
                value: '',
                unit: '',
                placeholder: '请选择',
                inputType: "select",
                option: ["正常", "RF", "PS", "Jo", "HHCY"],
                selectedIndex: null
            },
            {
                id: 'KSL-DNA',
                label: '抗KSL-DNA抗体（KSL-DNA）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'KS-A',
                label: '抗角质素硫酸抗体（KS-A）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'ACA',
                label: '抗心磷脂抗体（ACA）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'KSS-B',
                label: '抗 KSS 抗体（KSS-B）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'antiScl70',
                label: '抗Scl-70抗体（ASc1-70）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'AAE',
                label: '抗血管内皮细胞抗体（AAE）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'antiRo52',
                label: '抗Ro52抗体（KRO52）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'ENA',
                label: '可提取核抗原抗体谱（ENA）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'HTT',
                label: 'HTT',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'APMSCL',
                label: '抗 PM/Scl 抗体（APMSCL）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'antiU1rnp',
                label: '抗U1-nRNP抗体（aU1-nRNP）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'antiSm',
                label: '抗Sm抗体（Sm）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'antiHistone',
                label: '抗组蛋白抗体（AHA）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'antiM2',
                label: '抗线粒体M2抗体（AMM2A）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
        ]
    },
    coagulation: {
        id: 'coagulation',
        title: '凝血与抗凝功能',
        icon: icons.droplets,
        color: 'bg-cyan-100',
        textColor: 'text-cyan-800',
        indicators: [{
                id: 'aclIgg',
                label: '抗心磷脂抗体IgG（ACLIgG）',
                value: '',
                unit: 'GPL/mL',
                placeholder: '例如: 12',
                inputType: "text"
            },
            {
                id: 'aclIgm',
                label: '抗心磷脂抗体IgM（ACLIgM）',
                value: '',
                unit: 'MPL/mL',
                placeholder: '例如: 15',
                inputType: "text"
            },
            {
                id: 'b2gp1Igm',
                label: '抗β2-糖蛋白I IgM（B2-GDP1IgM）',
                value: '',
                unit: 'U/mL',
                placeholder: '例如: 12',
                inputType: "text"
            },
            {
                id: 'b2gp1Igg',
                label: '抗β2-糖蛋白I IgG（B2-GDP1IgG/B2-GDP1-IgA）',
                value: '',
                unit: 'U/mL',
                placeholder: '例如: 18',
                inputType: "text"
            },
            {
                id: 'la',
                label: '狼疮抗凝物(LA)',
                value: '',
                unit: 'mg/L',
                placeholder: '例如: 1.00',
                inputType: "text"
            },
        ]
    },
    endocrine: {
        id: 'endocrine',
        title: '内分泌与代谢状态',
        icon: icons.zap,
        color: 'bg-amber-100',
        textColor: 'text-amber-800',
        indicators: [{
                id: 'vitD-3',
                label: '25-VITD3',
                value: '',
                unit: 'ng/mL',
                placeholder: '例如: 20',
                inputType: "text"
            },
            {
                id: 'vitD-2',
                label: '25-VITD2',
                value: '',
                unit: 'ng/mL',
                placeholder: '例如: 1.00',
                inputType: "text"
            },
            {
                id: 'vitD',
                label: '25-羟基维生素D（25-VITD）',
                value: '',
                unit: 'ng/mL',
                placeholder: '例如: 25',
                inputType: "text"
            },
            {
                id: 'tgAb',
                label: '甲状腺球蛋白抗体（TGAb）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'tpoAb',
                label: '甲状腺过氧化物酶抗体（TPOAb）',
                value: '',
                unit: '',
                placeholder: '阳性/阴性',
                inputType: "select",
                option: ["阴性", "阳性"],
                selectedIndex: null
            },
            {
                id: 'c3',
                label: '补体成分3（C3）',
                value: '',
                unit: '',
                placeholder: '例如: 1.00',
                inputType: "text"
            },
            {
                id: 'c4',
                label: '补体成分4（C4）',
                value: '',
                unit: '',
                placeholder: '例如: 0.20',
                inputType: "text"
            },
        ]
    },
    hematology: {
        id: 'hematology',
        title: '血液学、化学与营养',
        icon: icons.testTube,
        color: 'bg-violet-100',
        textColor: 'text-violet-800',
        indicators: []
    },
    demographic: {
        id: 'demographic',
        title: '人口学特征与病史',
        icon: icons.users,
        color: 'bg-lime-100',
        textColor: 'text-lime-800',
        indicators: []
    },
    doppler: {
        id: 'doppler',
        title: '子宫动脉多普勒评估',
        icon: icons.waves,
        color: 'bg-orange-100',
        textColor: 'text-orange-800',
        indicators: []
    }
};

// 导出，以便其他文件可以导入使用
module.exports = {
    modulesConfig
}