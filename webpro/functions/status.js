// webpro/functions/status.js

export async function onRequest(context) {
    // Proxy directly to your Render-hosted bot:
    const target = "https://procatv-bot.onrender.com/status";
  
    const apiResp = await fetch(target);
    const body = await apiResp.text();
  
    return new Response(body, {
      status: apiResp.status,
      headers: {
        "content-type": apiResp.headers.get("content-type") || "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  