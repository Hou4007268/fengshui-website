/* === 一宅一句 公共 JS === */

// Supabase 初始化
const SUPABASE_URL = 'https://fugdohvvjqwwobdkfsii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Z2RvaHZ2anF3d29iZGtmc2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDA4NzcsImV4cCI6MjA4NjcxNjg3N30.SY3WYl8ElSQS0pdER5uV8VU9j6Dh5GM6MTU9MEuOroM';
const { createClient } = window.supabase || {};
let supabaseClient = null;
if(createClient) supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 兼容旧代码中用 supabase 变量名
if(typeof window !== 'undefined') window.supabaseInstance = supabaseClient;

// === 用户登录 ===
function openLogin(){
    document.getElementById('login-modal').classList.add('active');
}

async function doLogin(){
    const wechatId = document.getElementById('login-wechat').value.trim();
    if(!wechatId) return document.getElementById('login-msg').innerText='请输入微信ID';
    document.getElementById('login-msg').innerText='登录中...';
    let {data:users} = await supabaseClient.from('users').select('*').eq('wechat_id',wechatId);
    if(users && users.length > 0){
        localStorage.setItem('fengshui_user', JSON.stringify(users[0]));
        document.getElementById('login-msg').innerText='登录成功';
        setTimeout(()=>location.reload(), 800);
    } else {
        const {data, error} = await supabaseClient.from('users').insert([{wechat_id:wechatId}]).select();
        if(error){
            document.getElementById('login-msg').innerText='注册失败：'+error.message;
        } else {
            localStorage.setItem('fengshui_user', JSON.stringify(data[0]));
            document.getElementById('login-msg').innerText='注册成功';
            setTimeout(()=>location.reload(), 800);
        }
    }
}

function getUser(){
    const u = localStorage.getItem('fengshui_user');
    return u ? JSON.parse(u) : null;
}

async function checkPaidFromServer(){
    const user = getUser();
    if(!user || !user.id) return false;
    const {data} = await supabaseClient.from('users').select('is_paid').eq('id', user.id).single();
    return data ? data.is_paid : false;
}

// === 弹窗通用 ===
function openModal(tool){
    document.getElementById('modal-'+tool).classList.add('active');
}
function closeModal(tool){
    document.getElementById('modal-'+tool).classList.remove('active');
}

// === 结果 HTML 构建 ===
function buildResultHTML(icon, title, answer){
    return '<h4>'+title+'</h4>'+
        '<div style="margin:12px 0;padding:14px;background:var(--parchment-deep);border-radius:8px;line-height:1.8;font-size:0.88rem;color:var(--text);">'+answer+'</div>'+
        '<p style="color:var(--text-secondary);font-size:0.82rem;">想了解更多？添加微信获取详细指导</p>'+
        '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-soft);">'+
        '<button onclick="document.getElementById(\'lead-popup\').classList.add(\'active\')" class="btn">添加微信，获取完整报告</button></div>';
}
function buildErrorHTML(title){
    return '<h4>'+title+'</h4><p style="color:var(--text-secondary);font-size:0.88rem;">网络问题，请加微信详谈</p>'+
        '<button onclick="document.getElementById(\'lead-popup\').classList.add(\'active\')" class="btn" style="margin-top:12px;">添加微信</button>';
}
function showLoadingInResult(resultDiv){
    resultDiv.innerHTML='<div style="text-align:center;padding:24px;"><div class="spinner"></div><p style="margin-top:10px;color:var(--text-secondary);font-size:0.85rem;">AI分析中...</p></div>';
    resultDiv.classList.add('active');
}
function showLoading(){document.getElementById('loading').classList.add('active');}
function hideLoading(){document.getElementById('loading').classList.remove('active');}
function showResult(id,html){document.getElementById(id).innerHTML=html;document.getElementById(id).classList.add('active');}

// === Sticky 导航滚动效果 ===
window.addEventListener('scroll',()=>{
    const tb = document.getElementById('topbar');
    if(tb) tb.classList.toggle('scrolled', window.scrollY > 10);
});

// === FAQ 折叠 ===
function initFAQ(){
    document.querySelectorAll('.faq-q').forEach(q => {
        q.addEventListener('click', function(){
            const item = this.parentElement;
            const wasActive = item.classList.contains('active');
            // 关闭所有
            item.parentElement.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            // 切换当前
            if(!wasActive) item.classList.add('active');
        });
    });
}
document.addEventListener('DOMContentLoaded', initFAQ);

// === 留言板 ===
let messageOffset = 0;
const MESSAGE_LIMIT = 10;

async function loadMessages(append){
    if(!append) messageOffset = 0;
    try {
        const res = await fetch('/api/messages?offset='+messageOffset+'&limit='+MESSAGE_LIMIT);
        const data = await res.json();
        const list = document.getElementById('message-list');
        if(!list) return;
        if(!append) list.innerHTML = '';
        if(data.messages && data.messages.length > 0){
            data.messages.forEach(m => {
                const date = new Date(m.created_at).toLocaleDateString('zh-CN');
                const badge = m.service_type ? '<span class="message-item-badge">'+m.service_type+'</span>' : '';
                list.innerHTML += '<div class="message-item"><div class="message-item-header"><div><span class="message-item-author">'+m.author_name+'</span>'+badge+'</div><span class="message-item-meta">'+date+'</span></div><div class="message-item-content">'+m.content+'</div></div>';
            });
            messageOffset += data.messages.length;
            const btn = document.getElementById('btn-load-more-messages');
            if(btn) btn.style.display = data.has_more ? 'block' : 'none';
        } else {
            if(!append) list.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:20px;font-size:0.88rem;">暂无留言，快来留下第一条吧！</p>';
            const btn = document.getElementById('btn-load-more-messages');
            if(btn) btn.style.display = 'none';
        }
    } catch(e){
        console.error('加载留言失败', e);
    }
}

async function submitMessage(){
    const nameEl = document.getElementById('msg-author');
    const contentEl = document.getElementById('msg-content');
    const typeEl = document.getElementById('msg-service-type');
    const btnEl = document.getElementById('btn-submit-message');
    if(!nameEl || !contentEl) return;
    const name = nameEl.value.trim();
    const content = contentEl.value.trim();
    const serviceType = typeEl ? typeEl.value : '';
    if(!name || !content) return alert('请填写姓名和留言内容');
    if(content.length > 500) return alert('留言内容不超过500字');
    btnEl.disabled = true;
    btnEl.textContent = '提交中...';
    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ author_name: name, content: content, service_type: serviceType })
        });
        const data = await res.json();
        if(data.success){
            nameEl.value = '';
            contentEl.value = '';
            if(typeEl) typeEl.value = '';
            loadMessages(false);
            alert('留言成功！');
        } else {
            alert(data.error || '留言失败，请稍后再试');
        }
    } catch(e){
        alert('网络错误，请稍后再试');
    }
    btnEl.disabled = false;
    btnEl.textContent = '发表留言';
}

document.addEventListener('DOMContentLoaded', function(){
    if(document.getElementById('message-list')){
        loadMessages(false);
    }
});
