const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const PORT = 8081;

const systemPrompt = `你是「一宅一句」AI风水助手，专业、温暖、简洁。

回答风水问题要：
1. 用通俗易懂的语言解释专业风水知识
2. 结合实际案例给出实用建议
3. 保持轻松幽默的风格，不迷信

重要转化任务：
- 用户问详细问题时，在回答末尾适当引导加微信
- 话术："想了解更多细节？可以加微信：yiyayiyayao 获取1v1指导"
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
                const logEntry = `[${new Date().toISOString()}] 类型:${type} 问题:${question.substring(0,50)}\n`;
                fs.appendFileSync('/Users/yachaolailo/projects/openclaw-backup/projects/fengshui-website/chat.log', logEntry);
                
                let prompt = systemPrompt + '\n\n';
                
                // 添加历史对话（最近6轮）
                if (history && Array.isArray(history) && history.length > 0) {
                    prompt += '对话历史：\n';
                    history.slice(-6).forEach(h => {
                        prompt += `${h.role === 'user' ? '用户' : '助手'}：${h.content.substring(0,100)}\n`;
                    });
                }
                
                prompt += `\n用户问题类型：${type}\n用户最新问题：${question}\n\n请给出专业的风水建议：`;
                
                const ollama = spawn('ollama', ['run', 'gemma3:4b', prompt]);
                
                let result = '';
                ollama.stdout.on('data', (data) => {
                    result += data.toString();
                });
                
                ollama.on('close', (code) => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    // 清理AI回复中的多余内容
                    const cleanAnswer = result.replace(/Done/g, '').trim() || '抱歉，AI正在休息，请稍后再试～';
                    res.end(JSON.stringify({ success: true, answer: cleanAnswer }));
                });
                
                ollama.on('error', (err) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: err.message }));
                });
                
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/api/stats') {
        // 获取聊天统计
        try {
            const log = fs.readFileSync('/Users/yachaolailo/projects/openclaw-backup/projects/fengshui-website/chat.log', 'utf8');
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
