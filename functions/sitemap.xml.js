// 动态站点地图：每次访问 /sitemap.xml 时，实时读取文章数据生成，
// 后台发布/修改文章后自动同步，无需手动维护。
// 数据来源：后台 Decap CMS 发布时写入的 data/posts.json

const BASE = 'https://dianlijuhe.com';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return '  <url>\n' +
    '    <loc>' + escapeXml(loc) + '</loc>\n' +
    (lastmod ? '    <lastmod>' + escapeXml(lastmod) + '</lastmod>\n' : '') +
    '    <changefreq>' + changefreq + '</changefreq>\n' +
    '    <priority>' + priority + '</priority>\n' +
    '  </url>\n';
}

function buildXml(posts) {
  let body = '';
  // 首页
  body += urlEntry(BASE + '/', null, 'daily', '1.0');
  // 文章页
  (Array.isArray(posts) ? posts : []).forEach(function (p) {
    if (!p || !p.slug) return;
    body += urlEntry(
      BASE + '/post.html?slug=' + encodeURIComponent(p.slug),
      p.date || null,
      'monthly',
      '0.8'
    );
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    '</urlset>\n';
}

function xmlResponse(xml) {
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml;charset=UTF-8',
      'cache-control': 'public, max-age=0, s-maxage=3600'
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  // 多级回退读取文章数据，保证任一通道可用即可
  let posts = null;
  try {
    // 首选：Cloudflare Pages 静态资源绑定，直接读仓库里的 data/posts.json
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      const res = await env.ASSETS.fetch(new URL('/data/posts.json', request.url));
      if (res.ok) {
        const data = await res.json();
        posts = Array.isArray(data.posts) ? data.posts : null;
      }
    }
  } catch (e) { /* 继续尝试下一通道 */ }

  if (!posts) {
    try {
      // 备选：通过公网请求本站静态文件（静态资源不会触发本函数，不构成循环）
      const res = await fetch(new URL('/data/posts.json', request.url));
      if (res.ok) {
        const data = await res.json();
        posts = Array.isArray(data.posts) ? data.posts : null;
      }
    } catch (e) { /* 走兜底 */ }
  }

  // 兜底：即便数据读取失败，也返回一个合法的最小 sitemap（至少含首页）
  if (!posts) posts = [];

  return xmlResponse(buildXml(posts));
}
