// webpro/functions/nowplaying.js

export async function onRequest(context) {
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
  
    // Build the Last.fm URL
    const lastfmUrl = new URL("https://ws.audioscrobbler.com/2.0/");
    lastfmUrl.searchParams.set("method", "user.getRecentTracks");
    lastfmUrl.searchParams.set("user", LASTFM_USERNAME);
    lastfmUrl.searchParams.set("api_key", LASTFM_API_KEY);
    lastfmUrl.searchParams.set("format", "json");
  
    try {
      const apiResp = await fetch(lastfmUrl.toString());
      if (!apiResp.ok) {
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
  
      // 1) Find the “now playing” track if it exists
      const now = tracks.find((t) => t["@attr"]?.nowplaying === "true") || null;
  
      // 2) Helper: pick a reasonable image URL (falling back if none)
      const pickImageUrl = (trackObj) => {
        // Last.fm returns an array `image` with objects like { "#text": "URL", size: "small" }
        // We’ll try “extralarge” first, then “large,” then any non-empty URL.
        if (!trackObj.image) return null;
        const bySize = {};
        for (const img of trackObj.image) {
          if (img["#text"]) bySize[img.size] = img["#text"];
        }
        return bySize.extralarge || bySize.large || bySize.medium || bySize.small || null;
      };
  
      // 3) If something is playing right now…
      if (now) {
        const payload = {
          track: now.name,
          artist: now.artist["#text"],
          album: now.album["#text"] || null,
          url: now.url || null,
          imageUrl: pickImageUrl(now),
          lastPlayed: "now",
        };
  
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
  
      // 4) Otherwise, fall back to the most recent scrobble (the first element of tracks)
      if (tracks.length > 0) {
        const recent = tracks[0];
        const dateObj = recent.date; // e.g. { "#text": "04 Jun 2025, 01:23", uts: "1717489385" }
        const uts = dateObj?.uts ? Number(dateObj.uts) : null;
        let ago = null;
  
        if (uts) {
          // Compute difference from now (UTC seconds)
          const nowSeconds = Math.floor(Date.now() / 1000);
          const diffSec = nowSeconds - uts;
          if (diffSec < 60) {
            ago = `${diffSec} seconds ago`;
          } else if (diffSec < 3600) {
            const m = Math.floor(diffSec / 60);
            ago = `${m} minute${m === 1 ? "" : "s"} ago`;
          } else if (diffSec < 86400) {
            const h = Math.floor(diffSec / 3600);
            ago = `${h} hour${h === 1 ? "" : "s"} ago`;
          } else {
            const d = Math.floor(diffSec / 86400);
            ago = `${d} day${d === 1 ? "" : "s"} ago`;
          }
        }
  
        const payload = {
          track: recent.name,
          artist: recent.artist["#text"],
          album: recent.album["#text"] || null,
          url: recent.url || null,
          imageUrl: pickImageUrl(recent),
          lastPlayed: ago || "some time ago",
        };
  
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
  
      // 5) If no tracks at all (new user or nothing ever played)
      return new Response(
        JSON.stringify({
          track: null,
          artist: null,
          album: null,
          url: null,
          imageUrl: null,
          lastPlayed: null,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
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
  