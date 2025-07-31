Page({
    data: {
      // 模拟的预测结果（纯模拟）
      mockResult: {
        probability: 85.6,
        confidenceInterval: [82.1, 89.1],
        influencingFactors: [
          { name: 'RF (类风湿因子)', effect: '负面影响', reason: '指标高于正常范围，可能增加免疫系统活跃度。' },
          { name: '凝血酶原时间 (PT)', effect: '显著负面影响', reason: '指标高于理想范围，显示凝血功能异常。' },
          { name: '促甲状腺激素 (TSH)', effect: '显著负面影响', reason: '指标偏高，可能影响胚胎早期发育环境。' },
        ]
      }
    }
  })