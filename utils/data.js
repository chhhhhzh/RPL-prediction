const { icons } = require('./icons.js');

// 预定义所有模块和指标的结构
const modulesConfig = {
  autoimmune: {
    id: 'autoimmune',
    title: '自身免疫与免疫标志物',
    icon: icons.shield,
    color: 'bg-rose-100',
    textColor: 'text-rose-800',
    indicators: [
      { id: 'rf', label: 'RF (类风湿因子)', value: '', unit: 'IU/mL', placeholder: '例如: 15', inputType: "text"},
      { id: 'ana', label: 'ANA (抗核抗体)', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'anaTiter', label: 'ANA 滴度', value: '', unit: '', placeholder: '例如: 1:100', inputType: "text" },
      { id: 'antiDsdna', label: '抗双链DNA抗体', value: '', unit: 'IU/mL', placeholder: '例如: 100', inputType: "text" },
      { id: 'antiSm', label: '抗Sm抗体', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'antiScl70', label: '抗Scl-70抗体', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'antiRo52', label: '抗Ro52/TRIM21抗体', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'antiSsa', label: '抗SSA/Ro60抗体', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'antiSsb', label: '抗SSB/La抗体', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'antiJo1', label: '抗Jo-1抗体', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'antiCentromere', label: '抗着丝点抗体', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'antiU1rnp', label: '抗U1-nRNP抗体', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'antiHistone', label: '抗组蛋白抗体', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'antiM2', label: '抗线粒体M2抗体', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
    ]
  },
  coagulation: {
    id: 'coagulation',
    title: '凝血与抗凝功能',
    icon: icons.droplets,
    color: 'bg-cyan-100',
    textColor: 'text-cyan-800',
    indicators: [
      { id: 'dDimer', label: 'D-二聚体', value: '', unit: 'mg/L', placeholder: '例如: 0.25', inputType: "text" },
      { id: 'la', label: '狼疮抗凝物(LA)', value: '', unit: '', placeholder: '阳性/阴性', inputType: "select", option: ["阴性", "阳性"], selectedIndex: null},
      { id: 'aclIgg', label: '抗心磷脂抗体IgG', value: '', unit: 'GPL/mL', placeholder: '例如: 20', inputType: "text" },
      { id: 'aclIgm', label: '抗心磷脂抗体IgM', value: '', unit: 'MPL/mL', placeholder: '例如: 15', inputType: "text" },
      { id: 'b2gp1Igg', label: '抗β2-糖蛋白I IgG', value: '', unit: 'U/mL', placeholder: '例如: 18', inputType: "text" },
      { id: 'b2gp1Igm', label: '抗β2-糖蛋白I IgM', value: '', unit: 'U/mL', placeholder: '例如: 12', inputType: "text" },
      { id: 'proteinC', label: '蛋白C活性', value: '', unit: '%', placeholder: '例如: 90', inputType: "text" },
      { id: 'proteinS', label: '蛋白S活性', value: '', unit: '%', placeholder: '例如: 85', inputType: "text" },
      { id: 'antithrombin3', label: '抗凝血酶III活性', value: '', unit: '%', placeholder: '例如: 95', inputType: "text" },
    ]
  },
  endocrine: {
    id: 'endocrine',
    title: '内分泌与代谢状态',
    icon: icons.zap,
    color: 'bg-amber-100',
    textColor: 'text-amber-800',
    indicators: [
      { id: 'vitD', label: '25-羟基维生素D', value: '', unit: 'ng/mL', placeholder: '例如: 25', inputType: "text" },
      { id: 'tsh', label: '促甲状腺激素(TSH)', value: '', unit: 'mIU/L', placeholder: '例如: 2.1', inputType: "text" },
      { id: 'tpoAb', label: '甲状腺过氧化物酶抗体', value: '', unit: 'IU/mL', placeholder: '例如: 30', inputType: "text" },
      { id: 'tgAb', label: '甲状腺球蛋白抗体', value: '', unit: 'IU/mL', placeholder: '例如: 40', inputType: "text" },
      { id: 'amh', label: '抗缪勒管激素(AMH)', value: '', unit: 'ng/mL', placeholder: '例如: 2.5', inputType: "text" },
      { id: 'fsh', label: '卵泡刺激素(FSH)', value: '', unit: 'mIU/mL', placeholder: '例如: 6.0', inputType: "text" },
      { id: 'lh', label: '黄体生成素(LH)', value: '', unit: 'mIU/mL', placeholder: '例如: 5.0', inputType: "text" },
      { id: 'prl', label: '催乳素(PRL)', value: '', unit: 'ng/mL', placeholder: '例如: 15', inputType: "text" },
      { id: 'testosterone', label: '总睾酮', value: '', unit: 'nmol/L', placeholder: '例如: 1.5', inputType: "text" },
      { id: 'and', label: '雄烯二酮(AND)', value: '', unit: 'ng/mL', placeholder: '例如: 2.0', inputType: "text" },
      { id: 'dheas', label: '硫酸脱氢表雄酮(DHEA-S)', value: '', unit: 'μg/dL', placeholder: '例如: 200', inputType: "text" },
      { id: 'fastingGlu', label: '空腹血糖', value: '', unit: 'mmol/L', placeholder: '例如: 4.8', inputType: "text" },
      { id: 'fastingIns', label: '空腹胰岛素', value: '', unit: 'μIU/mL', placeholder: '例如: 8.0', inputType: "text" },
    ]
  },
  hematology: {
    id: 'hematology',
    title: '血液学、化学与营养',
    icon: icons.testTube,
    color: 'bg-violet-100',
    textColor: 'text-violet-800',
    indicators: [
      { id: 'hb', label: '血红蛋白(HB)', value: '', unit: 'g/L', placeholder: '例如: 125', inputType: "text" },
      { id: 'plt', label: '血小板(PLT)', value: '', unit: 'x10^9/L', placeholder: '例如: 250', inputType: "text" },
      { id: 'mcv', label: '红细胞平均体积(MCV)', value: '', unit: 'fL', placeholder: '例如: 90', inputType: "text" },
      { id: 'hcy', label: '同型半胱氨酸(HCY)', value: '', unit: 'μmol/L', placeholder: '例如: 8', inputType: "text" },
      { id: 'folicAcid', label: '血清叶酸', value: '', unit: 'ng/mL', placeholder: '例如: 10', inputType: "text" },
      { id: 'vitB12', label: '维生素B12', value: '', unit: 'pg/mL', placeholder: '例如: 400', inputType: "text" },
      { id: 'crp', label: 'C-反应蛋白(CRP)', value: '', unit: 'mg/L', placeholder: '例如: <1', inputType: "text" },
      { id: 'esr', label: '血沉(ESR)', value: '', unit: 'mm/h', placeholder: '例如: 10', inputType: "text" },
      { id: 'alt', label: '谷丙转氨酶(ALT)', value: '', unit: 'U/L', placeholder: '例如: 20', inputType: "text" },
      { id: 'ast', label: '谷草转氨酶(AST)', value: '', unit: 'U/L', placeholder: '例如: 22', inputType: "text" },
    ]
  },
  demographic: {
    id: 'demographic',
    title: '人口学特征与病史',
    icon: icons.users,
    color: 'bg-lime-100',
    textColor: 'text-lime-800',
    indicators: [
      { id: 'age', label: '年龄', value: '', unit: '岁', placeholder: '例如: 32', inputType: "text" },
      { id: 'bmi', label: '孕前BMI指数', value: '', unit: '', placeholder: '例如: 21.5', inputType: "text" },
      { id: 'spontaneousMiscarriage', label: '自然流产次数', value: '', unit: '次', placeholder: '例如: 3', inputType: "text" },
      { id: 'termBirth', label: '足月产次数', value: '', unit: '次', placeholder: '例如: 0', inputType: "text" },
      { id: 'pretermBirth', label: '早产次数', value: '', unit: '次', placeholder: '例如: 0', inputType: "text" },
    ]
  },
  doppler: {
    id: 'doppler',
    title: '子宫动脉多普勒评估',
    icon: icons.waves,
    color: 'bg-orange-100',
    textColor: 'text-orange-800',
    indicators: [
      { id: 'leftPi', label: '左侧子宫动脉PI', value: '', unit: '', placeholder: '例如: 1.1', inputType: "text" },
      { id: 'rightPi', label: '右侧子宫动脉PI', value: '', unit: '', placeholder: '例如: 1.2', inputType: "text" },
      { id: 'leftRi', label: '左侧子宫动脉RI', value: '', unit: '', placeholder: '例如: 0.6', inputType: "text" },
      { id: 'rightRi', label: '右侧子宫动脉RI', value: '', unit: '', placeholder: '例如: 0.7', inputType: "text" },
      { id: 'endometrialThickness', label: '内膜厚度', value: '', unit: 'mm', placeholder: '例如: 10', inputType: "text" },
    ]
  }
};

// 导出，以便其他文件可以导入使用
module.exports = {
  modulesConfig
}