// Vercel API: /api/chat
export default async function handler(req, res) {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { message, type = '基础咨询' } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: '缺少消息内容' });
    }
    
    // 系统提示词
    const systemPrompt = `你是一宅一句的风水AI助手。风格：轻松幽默，用真实故事讲风水知识。
    
回答要求：
- 用中文回答
- 风水知识要结合实际案例
- 适当加入民间故事
- 长度控制在200-500字
- 结尾可以引导加微信或使用工具

服务类型：${type}`;

    try {
        // 调用硅基流动API
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.SILICON_API_KEY
            },
            body: JSON.stringify({
                model: 'deepseek-ai/DeepSeek-V2-Chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }
        
        const answer = data.choices?.[0]?.message?.content || '抱歉，回答生成失败';
        
        return res.status(200).json({ answer });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: '服务器错误: ' + error.message });
    }
}
