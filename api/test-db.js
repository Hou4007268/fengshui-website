// 临时测试：检查 Supabase 连通性
export default async function handler(req, res) {
    const url = 'https://zzukurhrupvyieetppty.supabase.co/rest/v1/';
    const key = 'sb_publishable_aalFKYjpIEVYqTegN2oalA_NNVnwbcy';

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
