// webpro/functions/nowplaying.js

export async function onRequest(context) {
    // 1) Read from environment (make sure you set these in your Pages dashboard)
    const LASTFM_USERNAME = context.env.LASTFM_USERNAME;
    const LASTFM_API_KEY  = context.env.LASTFM_API_KEY;
  
    if (!LASTFM_USERNAME || !LASTFM_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing LASTFM_USERNAME or LASTFM_API_KEY" }),
        {
          status: 500,
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  
    // 2) Build Last.fm URLefsfs
    const lastfmUrl = new URL("https://ws.audioscrobbler.com/2.0/");
    lastfmUrl.searchParams.set("method", "user.getRecentTracks");
    lastfmUrl.searchParams.set("user", LASTFM_USERNAME);
    lastfmUrl.searchParams.set("api_key", LASTFM_API_KEY);
    lastfmUrl.searchParams.set("format", "json");
  
    try {
      // 3) Proxy the fetch to Last.fm
      const apiResp = await fetch(lastfmUrl.toString());
      if (!apiResp.ok) {
        // If Last.fm returns an error status, forward that (with a minimal JSON body)
        const text = await apiResp.text();
        return new Response(
          JSON.stringify({
            error: `Last.fm returned status ${apiResp.status}`,
            detail: text,
          }),
          {
            status: apiResp.status,
            headers: {
              "content-type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
  
      const data = await apiResp.json();
      const tracks = data.recenttracks?.track || [];
  
      // 4) Find the track with @attr.nowplaying="true"
      const now = tracks.find((t) => t["@attr"]?.nowplaying === "true") || null;
  
      // 5) Build a minimal JSON response
      const payload = now
        ? {
            track: now.name,
            artist: now.artist["#text"],
            album: now.album["#text"] || null,
            url: now.url || null,
          }
        : { track: null, artist: null, album: null, url: null };
  
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Fetch failed", detail: err.message }),
        {
          status: 500,
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }
  