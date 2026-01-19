/**
 * @file /后端服务/routes/ai_assistant.js
 * @description AI 智能健康助手路由，转发请求至火山大模型 (Doubao)。
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const authenticateToken = require('../authMiddleware');

/**
 * @route POST /api/ai/chat
 * @description 发送对话消息给 AI 助手并获取回复。
 * @access Private
 */
router.post('/chat', authenticateToken, async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: '无效的对话消息格式' });
    }

    const apiKey = process.env.ARK_API_KEY;
    const baseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const model = process.env.ARK_MODEL || 'Doubao-Seed-1.8';

    if (!apiKey) {
        return res.status(500).json({ message: '服务器未配置 AI API Key' });
    }

    // 注入健康助手系统提示词
    const systemPrompt = {
        role: 'system',
        content: `你是一个名为“考拉健康助手”的智能 AI。你的目标是协助用户管理健康生活，提供关于用药、饮食、运动及心理健康的科学建议。
    
注意事项：
1. 你的回答应基于科学医学常识，语气亲切且专业。
2. 对于严重的疾病症状，必须在回答中包含“建议您尽快咨询专业医师或前往医院就诊”的提示。
3. 请尽可能给出具体的建议，例如“建议每日饮水量不少于2000ml”，而不是“多喝水”。
4. 请不要提供任何具体的处方建议。`
    };

    try {
        const response = await axios.post(
            baseUrl,
            {
                model: model,
                messages: [systemPrompt, ...messages],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('AI Chat Error:', error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({
            message: 'AI 助手暂时无法响应，请稍后再试',
            error: error.response ? error.response.data : error.message,
        });
    }
});

module.exports = router;
