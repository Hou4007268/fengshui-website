require('dotenv').config();
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8081;

// Feishu Bitable Configuration
const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU_APP_TOKEN = process.env.FEISHU_APP_TOKEN;
const FEISHU_TABLE_ID = process.env.FEISHU_TABLE_ID;

async function getFeishuToken() {
    if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) return null;
    try {
        const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET })
        });
        const data = await res.json();
        return data.tenant_access_token;
    } catch (e) {
        console.error('Feishu auth error:', e);
        return null;
    }
}

async function createFeishuRecord(token, fields) {
    if (!token || !FEISHU_APP_TOKEN || !FEISHU_TABLE_ID) return false;
    try {
        const res = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields })
        });
        const data = await res.json();
        if (data.code !== 0) console.error('Feishu error:', data);
        return data.code === 0;
    } catch (e) {
        console.error('Feishu create record error:', e);
        return false;
    }
}

const systemPrompt = `你是「一宅一句」AI风水助手，专业、温暖、简洁。

回答风水问题要：
1. 用通俗易懂的语言解释专业风水知识
2. 结合实际案例给出实用建议
3. 保持轻松幽默的风格，不迷信

重要转化任务：
- 用户问详细问题时，在回答末尾适当引导加微信
- 话术：想了解更多细节？可以加微信：yiyayiyayao 获取1v1指导
- 不要每次都引导，保持专业性，只在用户需要深入时引导

回答格式：
- 开头：回应用户问题
- 中间：给出专业建议（2-3条）
- 结尾（可选）：引导加微信深入沟通

回答控制在100-200字左右`;

const requestHandler = (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.method === 'POST' && req.url === '/api/chat') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { type, question, history } = JSON.parse(body);
                
                // 记录日志
                const logPath = process.env.CHAT_LOG_PATH || __dirname + '/chat.log';
                const logEntry = `[${new Date().toISOString()}] 类型:${type} 问题:${question.substring(0,50)}\n`;
                fs.appendFileSync(logPath, logEntry);
                
                let prompt = systemPrompt + '\n\n';
                
                // 添加历史对话（最近6轮）
                if (history && Array.isArray(history) && history.length > 0) {
                    prompt += '对话历史：\n';
                    history.slice(-6).forEach(h => {
                        prompt += `${h.role === 'user' ? '用户' : '助手'}：${h.content.substring(0,100)}\n`;
                    });
                }
                
                prompt += `\n用户问题类型：${type}\n用户最新问题：${question}\n\n请给出专业的风水建议：`;
                
                // 使用本地AI或返回模拟回复
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    answer: '你好！我是「一宅一句」AI风水助手。请问有什么风水问题可以帮您解答？'
                }));
                
            } catch (e) {
                console.log('Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/api/submit-consult') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const formData = JSON.parse(body);
                
                // Logging
                const logPath = process.env.CONSULT_LOG_PATH || __dirname + '/consult.log';
                const logEntry = JSON.stringify(formData) + '\n';
                fs.appendFileSync(logPath, logEntry);
                
                let feishuSuccess = false;
                // Sync to Feishu
                const token = await getFeishuToken();
                console.log("Feishu token:", token); if (token) {
                    feishuSuccess = await createFeishuRecord(token, {
                        '姓名': formData.name,
                        '联系方式': formData.contactType + ': ' + formData.contact,
                        '咨询类型': formData.consultType,
                        '问题描述': formData.description,
                        '提交时间': new Date().toLocaleString('zh-CN')
                    });
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    feishu_synced: feishuSuccess,
                    message: feishuSuccess ? '提交成功，我们会尽快联系您' : '提交成功，我们会尽快联系您'
                }));
                
            } catch (e) {
                console.log('Consult Error:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: '服务器内部错误' }));
            }
        });
        
    } else if (req.method === 'GET' && req.url === '/api/stats') {
        const logPath = process.env.CHAT_LOG_PATH || __dirname + '/chat.log';
        try {
            const log = fs.readFileSync(logPath, 'utf8');
            const lines = log.trim().split('\n').filter(l => l);
            const today = new Date().toISOString().split('T')[0];
            const todayCount = lines.filter(l => l.includes(today)).length;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ today, count: todayCount, total: lines.length }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ today: new Date().toISOString().split('T')[0], count: 0, total: 0 }));
        }
    } else {
        res.writeHead(404);
        res.end();
    }
};

const server = http.createServer(requestHandler);
server.listen(PORT, () => {
    console.log(`AI风水API运行在 http://localhost:${PORT}`);
});
