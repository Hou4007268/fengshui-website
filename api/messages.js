// Vercel API: /api/messages
// GET: 分页查询留言  POST: 提交留言
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fugdohvvjqwwobdkfsii.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Z2RvaHZ2anF3d29iZGtmc2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDA4NzcsImV4cCI6MjA4NjcxNjg3N30.SY3WYl8ElSQS0pdER5uV8VU9j6Dh5GM6MTU9MEuOroM';

let supabase;
try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch(e) {
    supabase = null;
}

// 简单 IP hash 限流：同一 IP 60秒内只能发一条
const ipTimestamps = new Map();
const RATE_LIMIT_MS = 60000;

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.socket?.remoteAddress || 'unknown';
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash.toString(36);
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Check Supabase client
    if (!supabase) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    // GET: 分页查询
    if (req.method === 'GET') {
        try {
            const offset = parseInt(req.query.offset) || 0;
            const limit = Math.min(parseInt(req.query.limit) || 10, 50);

            const { data, error, count } = await supabase
                .from('messages')
                .select('id, author_name, content, service_type, created_at', { count: 'exact' })
                .eq('is_visible', true)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                console.error('Supabase GET error:', error);
                // Table might not exist yet
                if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    return res.status(200).json({ messages: [], total: 0, has_more: false, notice: '留言表尚未创建，请先执行 supabase-setup.sql' });
                }
                return res.status(500).json({ error: error.message });
            }

            return res.status(200).json({
                messages: data || [],
                total: count || 0,
                has_more: (offset + limit) < (count || 0)
            });
        } catch (e) {
            console.error('Messages GET exception:', e);
            return res.status(500).json({ error: e.message || 'Internal server error' });
        }
    }

    // POST: 提交留言
    if (req.method === 'POST') {
        try {
            const { author_name, content, service_type } = req.body || {};

            // 验证
            if (!author_name || !content) {
                return res.status(400).json({ error: '请填写姓名和留言内容' });
            }
            if (author_name.length > 50) {
                return res.status(400).json({ error: '姓名不超过50字' });
            }
            if (content.length > 500) {
                return res.status(400).json({ error: '留言内容不超过500字' });
            }

            // IP 限流
            const ip = getClientIP(req);
            const ipHash = simpleHash(ip);
            const lastTime = ipTimestamps.get(ipHash);
            if (lastTime && Date.now() - lastTime < RATE_LIMIT_MS) {
                return res.status(429).json({ error: '发送太频繁，请稍后再试' });
            }

            // 插入数据库
            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    author_name: author_name.trim(),
                    content: content.trim(),
                    service_type: service_type ? service_type.trim() : null,
                    ip_hash: ipHash,
                    is_visible: true
                }])
                .select();

            if (error) {
                console.error('Supabase POST error:', error);
                return res.status(500).json({ error: error.message });
            }

            ipTimestamps.set(ipHash, Date.now());

            return res.status(200).json({ success: true, message: data?.[0] });
        } catch (e) {
            console.error('Messages POST exception:', e);
            return res.status(500).json({ error: e.message || 'Internal server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
