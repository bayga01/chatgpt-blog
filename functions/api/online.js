// 实时在线人数接口（Cloudflare Pages Functions + D1）
//   POST /api/online  { vid, leave? }  -> 上报心跳 / 通知离线
//   GET  /api/online                  -> 返回当前在线人数
//
// 原理：D1 表 online 记录每个匿名访客 vid 的最后活跃时间（毫秒时间戳）。
//       统计「最后活跃时间 >= 现在 - ONLINE_WINDOW_MS」的记录条数 = 当前在线人数。
//       前端每 60 秒心跳一次，窗口设为 150 秒，容忍偶发丢包；超时未心跳自动算离线。
//
// 依赖：复用项目已绑定的 D1 数据库（变量名 DB），需在 D1 控制台建表一次：
//   CREATE TABLE IF NOT EXISTS online (
//     vid        TEXT    PRIMARY KEY,
//     last_seen  INTEGER NOT NULL
//   );

const HEADERS = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
};

const ONLINE_WINDOW_MS = 150 * 1000; // 在线窗口：150 秒

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: HEADERS
  });
}

// 校验匿名 vid：6~64 位字母数字下划线连字符
function validVid(v) {
  return typeof v === 'string' && /^[a-zA-Z0-9_-]{6,64}$/.test(v);
}

// GET：统计窗口内活跃人数
export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;
  if (!db) return json({ ok: false, error: 'DB not bound' }, 503);
  try {
    const cutoff = Date.now() - ONLINE_WINDOW_MS;
    const row = await db.prepare('SELECT COUNT(*) AS online FROM online WHERE last_seen >= ?').bind(cutoff).first();
    return json({ ok: true, online: row && typeof row.online === 'number' ? row.online : 0 });
  } catch (e) {
    return json({ ok: false, error: String((e && e.message) || e) }, 500);
  }
}

// POST：上报心跳（upsert 最后活跃时间），leave=true 则直接删除该访客
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;
  if (!db) return json({ ok: false, error: 'DB not bound' }, 503);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  const vid = body && body.vid;
  if (!validVid(vid)) return json({ ok: false, error: 'invalid vid' }, 400);

  try {
    if (body.leave === true) {
      // 明确离开：删除该访客记录，在线数立即下降
      await db.prepare('DELETE FROM online WHERE vid = ?').bind(vid).run();
    } else {
      // 心跳：不存在则插入，存在则更新最后活跃时间（原子 upsert）
      await db.prepare(
        'INSERT INTO online (vid, last_seen) VALUES (?, ?) ' +
        'ON CONFLICT(vid) DO UPDATE SET last_seen = excluded.last_seen'
      ).bind(vid, Date.now()).run();
    }
    // 顺手清理超时记录，避免表无限增长（每次请求清理一次，开销很小）
    await db.prepare('DELETE FROM online WHERE last_seen < ?').bind(Date.now() - ONLINE_WINDOW_MS).run();

    const row = await db.prepare('SELECT COUNT(*) AS online FROM online WHERE last_seen >= ?').bind(Date.now() - ONLINE_WINDOW_MS).first();
    return json({ ok: true, online: row && typeof row.online === 'number' ? row.online : 0 });
  } catch (e) {
    return json({ ok: false, error: String((e && e.message) || e) }, 500);
  }
}
