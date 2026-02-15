// Vercel API: /api/stats
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // 返回模拟数据（实际可以接数据库）
    return res.status(200).json({ 
        count: Math.floor(Math.random() * 50) + 10 
    });
}
