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
      { id: 'rf', label: 'RF (类风湿因子)', value: '', unit: 'IU/mL', placeholder: '例如: 15' },
      { id: 'ana', label: 'ANA (抗核抗体)', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'anaTiter', label: 'ANA 滴度', value: '', unit: '', placeholder: '例如: 1:100' },
      { id: 'antiDsdna', label: '抗双链DNA抗体', value: '', unit: 'IU/mL', placeholder: '例如: 100' },
      { id: 'antiSm', label: '抗Sm抗体', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'antiScl70', label: '抗Scl-70抗体', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'antiRo52', label: '抗Ro52/TRIM21抗体', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'antiSsa', label: '抗SSA/Ro60抗体', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'antiSsb', label: '抗SSB/La抗体', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'antiJo1', label: '抗Jo-1抗体', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'antiCentromere', label: '抗着丝点抗体', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'antiU1rnp', label: '抗U1-nRNP抗体', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'antiHistone', label: '抗组蛋白抗体', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'antiM2', label: '抗线粒体M2抗体', value: '', unit: '', placeholder: '阳性/阴性' },
    ]
  },
  coagulation: {
    id: 'coagulation',
    title: '凝血与抗凝功能',
    icon: icons.droplets,
    color: 'bg-cyan-100',
    textColor: 'text-cyan-800',
    indicators: [
      { id: 'dDimer', label: 'D-二聚体', value: '', unit: 'mg/L', placeholder: '例如: 0.25' },
      { id: 'la', label: '狼疮抗凝物(LA)', value: '', unit: '', placeholder: '阳性/阴性' },
      { id: 'aclIgg', label: '抗心磷脂抗体IgG', value: '', unit: 'GPL/mL', placeholder: '例如: 20' },
      { id: 'aclIgm', label: '抗心磷脂抗体IgM', value: '', unit: 'MPL/mL', placeholder: '例如: 15' },
      { id: 'b2gp1Igg', label: '抗β2-糖蛋白I IgG', value: '', unit: 'U/mL', placeholder: '例如: 18' },
      { id: 'b2gp1Igm', label: '抗β2-糖蛋白I IgM', value: '', unit: 'U/mL', placeholder: '例如: 12' },
      { id: 'proteinC', label: '蛋白C活性', value: '', unit: '%', placeholder: '例如: 90' },
      { id: 'proteinS', label: '蛋白S活性', value: '', unit: '%', placeholder: '例如: 85' },
      { id: 'antithrombin3', label: '抗凝血酶III活性', value: '', unit: '%', placeholder: '例如: 95' },
    ]
  },
  endocrine: {
    id: 'endocrine',
    title: '内分泌与代谢状态',
    icon: icons.zap,
    color: 'bg-amber-100',
    textColor: 'text-amber-800',
    indicators: [
      { id: 'vitD', label: '25-羟基维生素D', value: '', unit: 'ng/mL', placeholder: '例如: 25' },
      { id: 'tsh', label: '促甲状腺激素(TSH)', value: '', unit: 'mIU/L', placeholder: '例如: 2.1' },
      { id: 'tpoAb', label: '甲状腺过氧化物酶抗体', value: '', unit: 'IU/mL', placeholder: '例如: 30' },
      { id: 'tgAb', label: '甲状腺球蛋白抗体', value: '', unit: 'IU/mL', placeholder: '例如: 40' },
      { id: 'amh', label: '抗缪勒管激素(AMH)', value: '', unit: 'ng/mL', placeholder: '例如: 2.5' },
      { id: 'fsh', label: '卵泡刺激素(FSH)', value: '', unit: 'mIU/mL', placeholder: '例如: 6.0' },
      { id: 'lh', label: '黄体生成素(LH)', value: '', unit: 'mIU/mL', placeholder: '例如: 5.0' },
      { id: 'prl', label: '催乳素(PRL)', value: '', unit: 'ng/mL', placeholder: '例如: 15' },
      { id: 'testosterone', label: '总睾酮', value: '', unit: 'nmol/L', placeholder: '例如: 1.5' },
      { id: 'and', label: '雄烯二酮(AND)', value: '', unit: 'ng/mL', placeholder: '例如: 2.0' },
      { id: 'dheas', label: '硫酸脱氢表雄酮(DHEA-S)', value: '', unit: 'μg/dL', placeholder: '例如: 200' },
      { id: 'fastingGlu', label: '空腹血糖', value: '', unit: 'mmol/L', placeholder: '例如: 4.8' },
      { id: 'fastingIns', label: '空腹胰岛素', value: '', unit: 'μIU/mL', placeholder: '例如: 8.0' },
    ]
  },
  hematology: {
    id: 'hematology',
    title: '血液学、化学与营养',
    icon: icons.testTube,
    color: 'bg-violet-100',
    textColor: 'text-violet-800',
    indicators: [
      { id: 'hb', label: '血红蛋白(HB)', value: '', unit: 'g/L', placeholder: '例如: 125' },
      { id: 'plt', label: '血小板(PLT)', value: '', unit: 'x10^9/L', placeholder: '例如: 250' },
      { id: 'mcv', label: '红细胞平均体积(MCV)', value: '', unit: 'fL', placeholder: '例如: 90' },
      { id: 'hcy', label: '同型半胱氨酸(HCY)', value: '', unit: 'μmol/L', placeholder: '例如: 8' },
      { id: 'folicAcid', label: '血清叶酸', value: '', unit: 'ng/mL', placeholder: '例如: 10' },
      { id: 'vitB12', label: '维生素B12', value: '', unit: 'pg/mL', placeholder: '例如: 400' },
      { id: 'crp', label: 'C-反应蛋白(CRP)', value: '', unit: 'mg/L', placeholder: '例如: <1' },
      { id: 'esr', label: '血沉(ESR)', value: '', unit: 'mm/h', placeholder: '例如: 10' },
      { id: 'alt', label: '谷丙转氨酶(ALT)', value: '', unit: 'U/L', placeholder: '例如: 20' },
      { id: 'ast', label: '谷草转氨酶(AST)', value: '', unit: 'U/L', placeholder: '例如: 22' },
    ]
  },
  demographic: {
    id: 'demographic',
    title: '人口学特征与病史',
    icon: icons.users,
    color: 'bg-lime-100',
    textColor: 'text-lime-800',
    indicators: [
      { id: 'age', label: '年龄', value: '', unit: '岁', placeholder: '例如: 32' },
      { id: 'bmi', label: '孕前BMI指数', value: '', unit: '', placeholder: '例如: 21.5' },
      { id: 'spontaneousMiscarriage', label: '自然流产次数', value: '', unit: '次', placeholder: '例如: 3' },
      { id: 'termBirth', label: '足月产次数', value: '', unit: '次', placeholder: '例如: 0' },
      { id: 'pretermBirth', label: '早产次数', value: '', unit: '次', placeholder: '例如: 0' },
    ]
  },
  doppler: {
    id: 'doppler',
    title: '子宫动脉多普勒评估',
    icon: icons.waves,
    color: 'bg-orange-100',
    textColor: 'text-orange-800',
    indicators: [
      { id: 'leftPi', label: '左侧子宫动脉PI', value: '', unit: '', placeholder: '例如: 1.1' },
      { id: 'rightPi', label: '右侧子宫动脉PI', value: '', unit: '', placeholder: '例如: 1.2' },
      { id: 'leftRi', label: '左侧子宫动脉RI', value: '', unit: '', placeholder: '例如: 0.6' },
      { id: 'rightRi', label: '右侧子宫动脉RI', value: '', unit: '', placeholder: '例如: 0.7' },
      { id: 'endometrialThickness', label: '内膜厚度', value: '', unit: 'mm', placeholder: '例如: 10' },
    ]
  }
};

// 导出，以便其他文件可以导入使用
module.exports = {
  modulesConfig
}