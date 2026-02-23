// 临时测试：检查 Supabase 连通性
export default async function handler(req, res) {
    const url = 'https://fugdohvvjqwwobdkfsii.supabase.co/rest/v1/';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Z2RvaHZ2anF3d29iZGtmc2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDA4NzcsImV4cCI6MjA4NjcxNjg3N30.SY3WYl8ElSQS0pdER5uV8VU9j6Dh5GM6MTU9MEuOroM';

    try {
        const r = await fetch(url, {
            headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
        });
        const text = await r.text();
        return res.status(200).json({
            status: r.status,
            ok: r.ok,
            body: text.substring(0, 500)
        });
    } catch(e) {
        return res.status(200).json({
            error: e.message,
            name: e.name,
            cause: e.cause ? e.cause.message : null
        });
    }
}
