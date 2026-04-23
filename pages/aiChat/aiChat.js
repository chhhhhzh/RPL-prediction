const app = getApp();

Page({
  data: {
    inputValue: '',
    isLoading: false,
    scrollTop: 999999,
    quickPrompts: [
      '我当前最需要优先干预的风险是什么？',
      '请给我未来两周的复查建议',
      '哪些指标改善后，对结果帮助最大？'
    ],
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: '您好，我是 RPL 智能助手。您可以直接问我“当前风险重点”“复查优先级”或“如何改善关键指标”。'
      }
    ]
  },
  sessionId: '',
  pageFrom: 'unknown',

  onLoad(options) {
    this.sessionId = `chat_${Date.now()}`;
    this.pageFrom = options.from || 'unknown';
    if (options.prefill) {
      const text = decodeURIComponent(options.prefill);
      this.setData({ inputValue: text });
    }
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  onQuickAsk(e) {
    const question = e.currentTarget.dataset.question;
    this.setData({ inputValue: question }, () => this.handleSend());
  },

  appendMessage(message) {
    this.setData(
      { messages: [...this.data.messages, message] },
      () => this.setData({ scrollTop: this.data.scrollTop + 10000 })
    );
  },

  async handleSend() {
    const text = (this.data.inputValue || '').trim();
    if (!text || this.data.isLoading) return;

    const userMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text
    };
    this.appendMessage(userMessage);
    this.setData({ inputValue: '', isLoading: true });

    try {
      const resp = await wx.cloud.callFunction({
        name: 'ai-assistant',
        data: {
          sessionId: this.sessionId,
          fromPage: this.pageFrom,
          question: text
        }
      });
      if (resp.result && resp.result.success) {
        this.appendMessage({
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: resp.result.answer || '当前暂无可用回答。'
        });
      } else {
        throw new Error((resp.result && resp.result.error) || '调用失败');
      }
    } catch (err) {
      this.appendMessage({
        id: `e_${Date.now()}`,
        role: 'assistant',
        content: '抱歉，AI 助手暂时不可用。请稍后重试，或先查看结果页中的风险提示。'
      });
      console.error('ai-assistant error:', err);
    } finally {
      this.setData({ isLoading: false });
    }
  }
});
