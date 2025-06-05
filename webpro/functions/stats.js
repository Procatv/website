// functions/api/stats.js
export async function onRequest(context) {
    const { request, env, waitUntil } = context;
  
    // only allow /api/stats
    if (new URL(request.url).pathname !== "/api/stats")
      return new Response("Not found", { status: 404 });
  
    /* ---------- 1. Total page views ---------- */
    const total = (parseInt(await env.PAGE_STATS.get("total") || "0") + 1);
    await env.PAGE_STATS.put("total", total.toString());
  
    /* ---------- 2. Unique visitors (1-year cookie) ---------- */
    const cookie = request.headers.get("cookie") || "";
    const seen   = /visitorId=/.test(cookie);
    if (!seen) {
      const uniques = parseInt(await env.PAGE_STATS.get("unique") || "0") + 1;
      await env.PAGE_STATS.put("unique", uniques.toString());
    }
  
    /* ---------- 3. Online-now counter (3-min TTL ‘heartbeat’) ---------- */
    const onlineNow = parseInt(await env.PAGE_STATS.get("online") || "0") + 1;
    await env.PAGE_STATS.put("online", onlineNow.toString(), { expirationTtl: 180 });
  
    // schedule a decrement 3 min after the response is returned
    waitUntil(env.PAGE_STATS.put(
      "online",
      (onlineNow - 1).toString(),
      { expiration: Date.now() + 180_000 }
    ));
  
    /* ---------- 4. Send JSON back ---------- */
    const body = JSON.stringify({
      total,
      unique: parseInt(await env.PAGE_STATS.get("unique") || "1"),
      online: onlineNow
    });
  
    const headers = { "content-type": "application/json" };
    if (!seen) {
      headers["set-cookie"] =
        `visitorId=${crypto.randomUUID()}; Max-Age=31536000; Path=/; SameSite=Lax`;
    }
    return new Response(body, { headers });
  }
  