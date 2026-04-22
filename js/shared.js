/* === 一宅一句 公共 JS === */

// 百度统计
var _hmt = _hmt || [];
(function() {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?68d648c33764cf3ae6f44a43cbc3a8d9";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();

// Google Analytics (GA4)
var gtagScript = document.createElement("script");
gtagScript.async = true;
gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-JGQC5L2V2M";
var s2 = document.getElementsByTagName("script")[0];
s2.parentNode.insertBefore(gtagScript, s2);
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "G-JGQC5L2V2M");

// Supabase 初始化
const SUPABASE_URL = 'https://zzukurhrupvyieetppty.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aalFKYjpIEVYqTegN2oalA_NNVnwbcy';
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

// 百度自动推送
(function(){
    var bp = document.createElement("script");
    bp.src = "https://zz.bdstatic.com/linksubmit/push.js";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(bp, s);
})();

// 中英文切换 - 保持当前页面
(function(){
    var links = document.querySelectorAll(".topbar-nav a");
    for(var i = 0; i < links.length; i++){
        var a = links[i];
        var href = a.getAttribute("href");
        if(!href) continue;
        var text = a.textContent.trim();
        if(text === "EN"){
            // Chinese page -> English equivalent
            var path = location.pathname;
            if(path === "/" || path === "/index.html"){
                a.href = "/en/";
            } else if(path.indexOf("/services/") !== -1 || path.indexOf("/messages/") !== -1){
                a.href = "/en" + path;
            } else if(path.indexOf("/test/") !== -1 || path.indexOf("/blog/") !== -1){
                // test and blog are shared, just go to /en/ homepage
                a.href = "/en/";
            }
        } else if(text === "\u4e2d\u6587"){
            // English page -> Chinese equivalent
            var path = location.pathname;
            if(path === "/en/" || path === "/en/index.html"){
                a.href = "/";
            } else if(path.indexOf("/en/") === 0){
                a.href = path.replace("/en/", "/");
            }
        }
    }
})();


// 登录态导航同步（未登录显示登录，已登录显示个人中心/Profile）
(function(){
    function syncAuthNav(){
        var nav = document.querySelector('.topbar-nav');
        if(!nav) return;
        var link = nav.querySelector('a[href="/login.html"],a[href="login.html"],a[href="../login.html"]');
        if(!link) return;

        var token = '';
        try { token = localStorage.getItem('yzj_token') || ''; } catch(e) {}

        var isEnPage = location.pathname.indexOf('/en/') === 0 || location.pathname === '/en';

        if(token){
            link.setAttribute('href', '/profile.html');
            link.textContent = isEnPage ? 'Profile' : '个人中心';
        } else {
            link.setAttribute('href', '/login.html');
            link.textContent = isEnPage ? 'Login' : '登录';
        }
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', syncAuthNav);
    } else {
        syncAuthNav();
    }
})();

// 一键返回顶部
(function(){
    var btn = document.createElement("div");
    btn.className = "fab-top";
    btn.innerHTML = "&#9650;";
    btn.title = "返回顶部";
    
    btn.onclick = function(){ window.scrollTo({top:0,behavior:"smooth"}); };
    document.body.appendChild(btn);
    window.addEventListener("scroll", function(){
        if(window.scrollY > 400){ btn.classList.add("visible"); } else { btn.classList.remove("visible"); }
    });
})();

// 手机端汉堡菜单
(function(){
    var nav = document.querySelector(".topbar-nav");
    if(!nav || window.innerWidth > 768) return;
    var toggle = document.createElement("a");
    toggle.className = "mobile-toggle";
    toggle.href = "javascript:void(0)";
    toggle.innerHTML = "<span></span><span></span><span></span>";
    toggle.onclick = function(e){ e.preventDefault(); nav.classList.toggle("open"); };
    nav.insertBefore(toggle, nav.firstChild);
    document.addEventListener("click", function(e){
        if(!nav.contains(e.target)) nav.classList.remove("open");
    });
})();

// AI聊天窗口 - 全站生效
    window.toggleAIChatWidget = function(){var w=document.getElementById("ai-chat-widget");var b=document.getElementById("chat-float-btn");if(!w)return;if(w.style.display==="none"||!w.style.display){w.style.display="block";b.style.display="none";}else{w.style.display="none";b.style.display="flex";}};
(function(){
    if(document.getElementById("ai-chat-widget")) return;
    var btn = document.createElement("button");
    btn.className = "fab-chat fab-chat-pulse";
    btn.id = "chat-float-btn";
    btn.innerHTML = "AI";
    btn.onclick = function(){
        document.getElementById("ai-chat-widget").style.display = "block";
        btn.style.display = "none";
    };
    document.body.appendChild(btn);
    var widget = document.createElement("div");
    widget.id = "ai-chat-widget";
    widget.className = "chat-widget";
    widget.style.display = "none";
    widget.innerHTML = '<div class="chat-container"><div class="chat-head"><span class="chat-head-title">一宅一句 · AI风水助手</span><span class="chat-head-close" onclick="document.getElementById(&apos;ai-chat-widget&apos;).style.display=&apos;none&apos;;document.getElementById(&apos;chat-float-btn&apos;).style.display=&apos;flex&apos;">✕</span></div><div class="chat-body" id="chat-messages-widget"><div class="chat-msg bot">您好，我是「一宅一句」AI风水助手。<br>新用户可<strong>免费3次</strong>提问。解锁体验包（￥99）：1份深度报告 + 48小时内3次追问。</div><div class="chat-quick"><button onclick="quickAsk(&apos;我想算算财运&apos;)">财运</button><button onclick="quickAsk(&apos;我想看姻缘&apos;)">姻缘</button><button onclick="quickAsk(&apos;帮我看看房子&apos;)">房子</button><button onclick="quickAsk(&apos;犯太岁怎么办&apos;)">太岁</button></div></div><div class="chat-foot"><input id="chat-input" type="text" placeholder="输入您的风水问题..." onkeypress="if(event.key===&apos;Enter&apos;)sendChatMessage()"><button onclick="sendChatMessage()">发送</button></div></div>';
    document.body.appendChild(widget);
    window.quickAsk = function(q){
        document.getElementById("chat-input").value = q;
        sendChatMessage();
    };
    window.sendChatMessage = function(){
        var input = document.getElementById("chat-input");
        var msg = input.value.trim();
        if(!msg) return;
        var ms = document.getElementById("chat-messages-widget");
        var el = document.createElement("div");
        el.className = "chat-msg user";
        el.textContent = msg;
        ms.appendChild(el);
        input.value = "";
        var thinking = document.createElement("div");
        thinking.className = "chat-msg bot";
        thinking.textContent = "思考中...";
        thinking.id = "chat-thinking";
        ms.appendChild(thinking);
        ms.scrollTop = ms.scrollHeight;
        fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"对话咨询",message:msg})})
        .then(function(r){return r.json();})
        .then(function(data){
            var t=document.getElementById("chat-thinking");if(t)t.remove();
            var answer=data.answer||data.reply||"抱歉，AI正在休息，请加微信详谈";
            var r=document.createElement("div");r.className="chat-msg bot";r.textContent=answer;ms.appendChild(r);ms.scrollTop=ms.scrollHeight;
        })
        .catch(function(){
            var t=document.getElementById("chat-thinking");if(t)t.remove();
            var r=document.createElement("div");r.className="chat-msg bot";r.textContent="网络问题，请稍后再试。";ms.appendChild(r);
        });
    };
})();
