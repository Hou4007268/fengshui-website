# 项目开发规范（AI 代理必读）

## 严禁事项

1. **禁止修改网站风格** — 不要改配色、字体、背景、圆角、阴影等任何视觉样式
2. **禁止修改 `<head>` 标签** — 不要改 `<title>`、`<meta>`、`<link>`、`<style>` 中的现有内容
3. **禁止修改 `css/shared.css`** — 这是全站公共样式，除非明确要求不要动
4. **禁止修改 `js/shared.js`** — 这是全站公共脚本，除非明确要求不要动
5. **禁止引入新的 CSS 框架或配色方案** — 不要用 Tailwind、Bootstrap、暗色主题等
6. **禁止重写页面结构** — 只在指定位置添加内容，不要重构整个页面

---

## 项目基本信息

- 网站：一宅一句（12zn.com）— 风水咨询网站
- 风格：中式古典、暖色纸张质感、金色点缀
- 字体：Noto Serif SC（标题）+ Noto Sans SC（正文）
- 托管：腾讯云 VPS + Cloudflare CDN

## 配色方案（固定不可修改）

```css
--ink: #2c2420;           /* 深墨色，主文字 */
--parchment: #f6f2eb;     /* 纸张色，页面背景 */
--cream: #faf8f4;         /* 奶油色 */
--gold: #a68a3e;          /* 金色，品牌主色 */
--gold-soft: #c4aa5c;     /* 浅金色 */
--vermilion: #b5452a;     /* 朱红色，强调/NEW标签 */
--white: #fefcf8;         /* 暖白色，卡片背景 */
--text: #3d3530;          /* 正文色 */
--text-secondary: #7a706a;/* 次要文字 */
--border-soft: #e8e2d6;   /* 边框色 */
```

---

## 文件结构

```
fengshui-website/
├── index.html              ← 主页（不要大改）
├── css/shared.css          ← 全站公共样式（不要动）
├── js/shared.js            ← 全站公共脚本（不要动）
├── test/index.html         ← 趣味测试合集页
├── services/
│   ├── caiyun.html ...     ← 13个服务详情页
│   ├── test-yunshi.html    ← 趣味测试页面（共10个）
│   ├── test-wuxing.html
│   ├── test-fengshui.html
│   ├── test-xingming.html
│   ├── test-mianxiang.html
│   ├── test-taohua.html
│   ├── test-caishang.html
│   ├── test-qianshi.html
│   ├── test-lucky.html
│   └── test-xinli.html
├── sitemap.xml
└── images/
```

---

## 如何新增趣味测试（最常见操作）

### 第一步：在 test/index.html 的「新上线」区域添加卡片

找到 `<!-- 新上线测试 -->` 下的 `<div class="test-hub-grid">`，在里面末尾添加：

```html
<a class="test-hub-card test-hub-card--new" href="../services/test-xxx.html">
    <div class="test-hub-card-icon">emoji图标</div>
    <div class="test-hub-card-title">测试名称</div>
    <div class="test-hub-card-desc">一句话描述</div>
    <span class="test-hub-card-tag">8道题</span>
</a>
```

### 第二步：在 index.html 主页的测试区域添加卡片

找到 `id="test-grid"` 的容器，在折叠区域（`test-card--hidden` 的卡片之后）添加：

```html
<a class="test-card-item test-card--hidden" href="services/test-xxx.html">
    <div class="test-card-icon">emoji图标</div>
    <div class="test-card-title">测试名称</div>
    <div class="test-card-desc">一句话描述</div>
</a>
```

注意：主页卡片没有 `test-hub-card-tag`，结构更简单。

### 第三步：创建测试页面 services/test-xxx.html

**必须参考现有测试页面（如 `services/test-xinli.html`）的完整结构**，包括：
- `<head>` 中引入 `../css/shared.css?v=20260223`
- 页面底部引入 `../js/shared.js?v=20260223`
- 使用 Supabase CDN `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
- 导航栏使用 `topbar` 类
- 使用 Google Fonts: Noto Serif SC + Noto Sans SC
- 底部保留微信引导区和 footer

### 第四步：更新 sitemap.xml

在 `<!-- 趣味测试 -->` 区块添加：

```xml
<url>
    <loc>https://12zn.com/services/test-xxx.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
</url>
```

---

## 测试页面结构模板

每个测试页面的基本结构如下（以8道选择题为例）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XXX测试 | 一宅一句</title>
    <meta name="description" content="描述...">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@200;400;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/shared.css?v=20260223">
    <style>
        /* 仅放此页面特有的样式，使用项目 CSS 变量如 var(--gold)、var(--ink) 等 */
    </style>
</head>
<body>
    <!-- 导航 -->
    <nav class="topbar" id="topbar">
        <div class="topbar-inner">
            <a href="../index.html" class="topbar-brand">一宅一句</a>
            <div class="topbar-nav">
                <a href="../index.html#services">服务</a>
                <a href="../test/" class="topbar-cta">更多测试</a>
            </div>
        </div>
    </nav>

    <!-- 面包屑 -->
    <div class="container">
        <div class="breadcrumb">
            <a href="../index.html">首页</a><span>›</span>
            <a href="../test/">趣味测试</a><span>›</span>
            XXX测试
        </div>
    </div>

    <!-- 测试内容区 -->
    <!-- ... 题目和选项 ... -->

    <!-- 微信引导 -->
    <section class="wechat-section">
        <div class="wechat-inner">
            <h2>想要更精准的分析？</h2>
            <p class="wechat-sub">扫码添加微信，获得一对一专属指导</p>
            <img class="wechat-qr" src="../images/wechat-qr.jpg" alt="微信二维码">
            <p class="wechat-hint">长按识别二维码 · 添加微信</p>
        </div>
    </section>

    <!-- 底部 -->
    <footer class="site-footer">
        <p class="footer-brand">一宅一句</p>
        <p>科学风水 · 真实案例 · 专业服务</p>
    </footer>

    <script src="../js/shared.js?v=20260223"></script>
</body>
</html>
```

---

## 注意事项

1. 所有 CSS 和 JS 引用必须带版本号 `?v=20260223`
2. 页内自定义样式必须使用项目 CSS 变量（`var(--gold)` 等），不要写死颜色值
3. 不要用 `body { background: xxx }` 覆盖全局背景
4. 不要用 `* { margin:0; padding:0; }` 重置样式（shared.css 已经有了）
5. 新页面的风格必须和现有页面保持一致：暖色纸张底 + 金色点缀 + 中式排版
