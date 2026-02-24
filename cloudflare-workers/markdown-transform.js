/**
 * Cloudflare Worker - HTML to Markdown Transform
 * 把网站HTML自动转成Markdown，方便AI抓取
 * 
 * 使用方法：
 * 1. 在Cloudflare创建Worker
 * 2. 部署这个脚本
 * 3. 访问 worker域名/?url=12zn.com
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response('Usage: /?url=https://example.com', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // 检查是否请求Markdown
    const accept = request.headers.get('Accept') || '';
    if (!accept.includes('text/markdown') && !url.pathname.includes('/md/')) {
      // 普通访问，直接代理
      return fetch(targetUrl);
    }
    
    try {
      // 获取HTML
      const response = await fetch(targetUrl);
      const html = await response.text();
      
      // 简单HTML转Markdown
      let markdown = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
        .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\n{3,}/g, '\n\n');
      
      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } catch (e) {
      return new Response('Error: ' + e.message, { status: 500 });
    }
  }
};
