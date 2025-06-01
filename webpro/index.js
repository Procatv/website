// webpro/index.js

export default {
    async fetch(req, env) {
      const url = new URL(req.url);
  
      if (url.pathname === "/status") {
        const target =
          env.ENVIRONMENT === "dev"
            ? "http://127.0.0.1:3000/status"
            : "https://<your‐hosted‐bot‐url>/status";
  
        const apiResp = await fetch(target, { cf: { cacheTtl: 0 } });
        const resp = new Response(apiResp.body, {
          status: apiResp.status,
          headers: apiResp.headers
        });
        resp.headers.set("Access-Control-Allow-Origin", "*");
        return resp;
      }
  
      // everything else falls back to static
      return env.ASSETS.fetch(req);
    }
  };
  