# Supabase 用户系统集成指南

## 文件说明

已创建以下文件：
1. `supabase-setup.sql` - Supabase建表SQL
2. `login.html` - 登录/注册页面

---

## 步骤1：创建Supabase项目

1. 访问 [supabase.com](https://supabase.com) 注册/登录
2. 点击 "New project"
3. 填写项目信息：
   - Organization: 选择或创建
   - Name: `fengshui-app`
   - Database Password: 设置强密码（记住它）
   - Region: 选择 `Northeast Asia (Tokyo)` 离中国近
4. 等待项目创建完成（1-2分钟）

---

## 步骤2：执行SQL建表

1. 在Supabase控制台左侧菜单点击 **SQL Editor**
2. 点击 **New query**
3. 复制 `supabase-setup.sql` 的全部内容
4. 粘贴到SQL Editor并点击 **Run**
5. 确认执行成功

---

## 步骤3：获取API配置

1. 点击左侧菜单 **Project Settings** (齿轮图标)
2. 点击 **API**
3. 复制以下信息：
   - **Project URL**: 格式类似 `https://xxxxx.supabase.co`
   - **anon public key**: 长串字符，以 `eyJ` 开头

---

## 步骤4：配置前端代码

编辑 `login.html`，找到配置区域：

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // 替换为你的Project URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // 替换为anon key
```

---

## 步骤5：集成到现有网站

### 方式A：独立登录页面
```html
<!-- 在index.html中添加登录入口 -->
<a href="login.html" class="btn">登录</a>
```

### 方式B：模态框嵌入
将 `login.html` 中的 `<div id="app">...</div>` 内容复制到你的网站的模态框中。

### 方式C：API调用
在现有JavaScript中引入Supabase：

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
    // 配置
    const supabase = window.supabase.createClient(
        'YOUR_SUPABASE_URL',
        'YOUR_SUPABASE_ANON_KEY'
    );
    
    // 登录
    async function login(wechatId) {
        const { data, error } = await supabase.rpc('get_or_create_user', {
            p_wechat_id: wechatId
        });
        return data;
    }
    
    // 检查付费状态
    async function checkPaid(wechatId) {
        const { data } = await supabase
            .from('users')
            .select('is_paid')
            .eq('wechat_id', wechatId)
            .single();
        return data?.is_paid || false;
    }
</script>
```

---

## 核心API

| 功能 | 函数 |
|------|------|
| 登录/注册 | `supabase.rpc('get_or_create_user', {p_wechat_id: 'xxx'})` |
| 更新登录时间 | `supabase.rpc('update_login', {p_wechat_id: 'xxx'})` |
| 查询用户 | `supabase.from('users').select('*').eq('wechat_id', 'xxx')` |
| 更新付费状态 | `supabase.from('users').update({is_paid: true, paid_at: new Date()}).eq('wechat_id', 'xxx')` |
| 记录支付 | `supabase.from('payments').insert({user_id: 'xxx', amount: 99, status: 'completed'})` |

---

## 付费功能示例

```javascript
// 管理员手动开通付费
async function setPaidUser(wechatId) {
    await supabase
        .from('users')
        .update({ 
            is_paid: true, 
            paid_at: new Date().toISOString(),
            subscription_tier: 'premium'
        })
        .eq('wechat_id', wechatId);
}

// 检查权限
async function requirePaid() {
    const isPaid = await checkPaidStatus();
    if (!isPaid) {
        alert('请先付费成为VIP');
        // 跳转支付页面
    }
    return isPaid;
}
```

---

## 注意事项

1. **安全性**：本方案使用简单的微信ID登录，生产环境建议增加短信/邮箱验证
2. **RLS**：已启用行级安全，用户只能操作自己的数据
3. **匿名访问**：如需不登录使用部分功能，在后端检查 `is_paid` 字段
4. **微信扫码**：真实扫码需要微信开放平台配置，本地测试可先用ID登录

---

## 本地测试

```bash
# 进入项目目录
cd /Users/yachaolailo/projects/openclaw-backup/projects/fengshui-website

# 启动本地服务器（如果有Python）
python3 -m http.server 8080

# 然后访问 http://localhost:8080/login.html
```
