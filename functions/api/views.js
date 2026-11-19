// 文章阅读量计数接口（Cloudflare Pages Functions + D1）
//   GET  /api/views?slug=xxx  -> 读取该文章阅读量
//   POST /api/views?slug=xxx  -> 阅读量 +1（原子），返回最新值
//
// 依赖：需在 Cloudflare 项目 Settings -> Functions -> D1 database bindings
//       绑定一个 D1 数据库，变量名（Variable name）填：DB
// 表结构（在 D1 控制台执行）：
//   CREATE TABLE IF NOT EXISTS views (
//     slug  TEXT    PRIMARY KEY,
//     count INTEGER NOT NULL DEFAULT 0
//   );

const HEADERS = {
  'Content-Type': 'application/json; charset=UTF-8',
  // 阅读量必须实时，禁止任何 CDN / 浏览器缓存
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: HEADERS
  });
}

// 校验 slug：非空、长度合理、不含会破坏 query 的特殊字符
function getSlug(url) {
  const s = url.searchParams.get('slug');
  if (!s || s.length > 150 || /[\s?#&/\\]/.test(s)) return null;
  return s;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const slug = getSlug(new URL(request.url));
  if (!slug) return json({ ok: false, error: 'invalid slug' }, 400);
  const db = env.DB;
  if (!db) return json({ ok: false, error: 'DB not bound' }, 503);

  try {
    const row = await db.prepare('SELECT count FROM views WHERE slug = ?').bind(slug).first();
    return json({ ok: true, slug: slug, count: row ? row.count : 0 });
  } catch (e) {
    return json({ ok: false, error: String((e && e.message) || e) }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const slug = getSlug(new URL(request.url));
  if (!slug) return json({ ok: false, error: 'invalid slug' }, 400);
  const db = env.DB;
  if (!db) return json({ ok: false, error: 'DB not bound' }, 503);

  try {
    // 原子 upsert：不存在则插入并置 1，存在则 +1，一步返回最新值。
    // 比「先 SELECT 再 UPDATE」更安全，并发访问不会丢计数。
    const row = await db.prepare(
      'INSERT INTO views (slug, count) VALUES (?, 1) ' +
      'ON CONFLICT(slug) DO UPDATE SET count = count + 1 ' +
      'RETURNING count'
    ).bind(slug).first();
    return json({ ok: true, slug: slug, count: row ? row.count : 1 });
  } catch (e) {
    return json({ ok: false, error: String((e && e.message) || e) }, 500);
  }
}
