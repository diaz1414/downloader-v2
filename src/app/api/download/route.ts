import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Extended timeout (30 seconds for forced Ryzumi, less for others)
async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 30000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { url } = body;

    if (!url) return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 });

    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isTiktok = url.includes("tiktok.com");
    const isInstagram = url.includes("instagram.com");

    // Enhanced browser-like headers to reduce blocking
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Origin": "https://ryzumi.net",
      "Referer": "https://ryzumi.net/",
      "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
    };

    console.log(`[HYBRID_PROTOCOL] [${new Date().toISOString()}] Processing: ${url}`);

    // 1. TIKTOK PRIORITY (TikWM)
    if (isTiktok) {
      try {
        console.log("[HYBRID_PROTOCOL] Attempting TikWM...");
        const twmRes = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { headers, timeout: 10000 });
        
        if (twmRes.ok) {
          const twmData = await twmRes.json();
          if (twmData?.data) {
            console.log("[HYBRID_PROTOCOL] TikWM Success");
            const d = twmData.data;
            return NextResponse.json({
              status: "stream",
              url: d.play,
              title: d.title,
              thumbnail: d.cover,
              source: "TikTok",
              picker: [
                { url: d.play, type: "video", quality: "HD (NO-WM)", extension: "mp4" },
                { url: d.music, type: "audio", quality: "AUDIO", extension: "mp3" }
              ]
            });
          }
        }
      } catch (e: any) { 
        console.warn(`[HYBRID_PROTOCOL] TikWM Failed: ${e.message}`); 
      }
    }

    // 2. YOUTUBE PRIORITY (Specialized Ryzumi)
    if (isYoutube) {
      try {
        console.log("[HYBRID_PROTOCOL] Attempting YouTube Priority...");
        const [mp4Res, mp3Res] = await Promise.allSettled([
          fetchWithTimeout(`https://api.ryzumi.net/api/downloader/ytmp4?url=${encodeURIComponent(url)}`, { headers, timeout: 15000 }),
          fetchWithTimeout(`https://api.ryzumi.net/api/downloader/ytmp3?url=${encodeURIComponent(url)}`, { headers, timeout: 15000 })
        ]);

        const pickerItems = [];
        let title = "YouTube Video";
        let thumbnail = "";

        if (mp4Res.status === "fulfilled" && mp4Res.value.ok) {
          const d = await mp4Res.value.json();
          if (d.videoUrl) {
            title = d.title || title;
            thumbnail = d.thumbnail || thumbnail;
            pickerItems.push({ url: d.videoUrl, type: "video", quality: "720P (DIRECT)", extension: "mp4" });
          }
        }

        if (mp3Res.status === "fulfilled" && mp3Res.value.ok) {
          const d = await mp3Res.value.json();
          if (d.audioUrl) pickerItems.push({ url: d.audioUrl, type: "audio", quality: "AUDIO (320kbps)", extension: "mp3" });
        }

        if (pickerItems.length > 0) {
          console.log("[HYBRID_PROTOCOL] YouTube Success");
          return NextResponse.json({
            status: "stream",
            url: pickerItems[0].url,
            title,
            thumbnail,
            source: "YouTube",
            picker: pickerItems
          });
        }
      } catch (err: any) { 
        console.warn(`[HYBRID_PROTOCOL] YouTube Priority Failed: ${err.message}`); 
      }
    }

    // 3. INSTAGRAM SPECIFIC (Optional optimization)
    if (isInstagram) {
      try {
        console.log("[HYBRID_PROTOCOL] Attempting Ryzumi Instagram Specific...");
        const igRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/instagram?url=${encodeURIComponent(url)}`, { headers, timeout: 15000 });
        if (igRes.ok) {
          const d = await igRes.json();
          if (d.medias && d.medias.length > 0) {
             return NextResponse.json({
                status: "stream",
                url: d.medias[0].url,
                title: d.title || "Instagram Content",
                thumbnail: d.thumbnail,
                source: "Instagram",
                picker: d.medias.map((m: any) => ({ url: m.url, type: m.type, quality: m.quality || "HD", extension: m.extension || "mp4" }))
             });
          }
        }
      } catch (e) {}
    }

    // 4. FORCED RYZUMI ALL-IN-ONE
    try {
      console.log(`[HYBRID_PROTOCOL] Attempting Ryzumi All-In-One...`);
      const ryzumiRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, {
        headers,
        timeout: 30000,
        cache: 'no-store'
      });

      if (ryzumiRes.ok) {
        const data = await ryzumiRes.json();
        if (data && data.medias && data.medias.length > 0) {
          console.log("[HYBRID_PROTOCOL] Ryzumi Success");
          return NextResponse.json({
            status: "stream",
            url: data.medias[0].url,
            title: data.title || "Archive Result",
            thumbnail: data.thumbnail,
            source: data.source || "Universal Protocol",
            author: data.author,
            picker: data.medias.map((m: any) => ({
              url: m.url,
              type: m.type || "video",
              quality: m.quality || m.extension || "HD",
              extension: m.extension || "mp4"
            }))
          });
        }
      } else {
        console.warn(`[HYBRID_PROTOCOL] Ryzumi AIO Failed (HTTP ${ryzumiRes.status}), attempting emergency fallback...`);
      }
    } catch (err: any) {
      console.error("[ALL_IN_ONE_ERROR]", err.message);
    }

    // 5. EMERGENCY FALLBACK (SnapAny or Cobalt-like behavior)
    try {
      console.log("[HYBRID_PROTOCOL] Attempting Emergency Fallback (Universal)...");
      const fallbackRes = await fetchWithTimeout(`https://api.snapany.com/api/allinone?url=${encodeURIComponent(url)}`, { 
        headers: { "User-Agent": headers["User-Agent"] },
        timeout: 20000 
      });
      
      if (fallbackRes.ok) {
        const d = await fallbackRes.json();
        if (d.medias && d.medias.length > 0) {
          console.log("[HYBRID_PROTOCOL] Emergency Fallback Success");
          return NextResponse.json({
            status: "stream",
            url: d.medias[0].url,
            title: d.title || "Recovered Media",
            thumbnail: d.thumbnail,
            source: "Emergency Protocol",
            picker: d.medias.map((m: any) => ({
              url: m.url,
              type: m.type || "video",
              quality: m.quality || "Standard",
              extension: m.extension || "mp4"
            }))
          });
        }
      }
    } catch (e: any) {
      console.error("[FALLBACK_ERROR]", e.message);
    }

    return NextResponse.json({
      status: "error",
      text: "Maaf, semua protokol sedang sibuk atau link tidak didukung. Silakan coba lagi nanti atau gunakan link lain."
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CRITICAL_PROTOCOL_ERROR]", error);
    return NextResponse.json({ 
      status: "error", 
      text: `Protokol Error: ${error.message || "Unknown error"}` 
    }, { status: 500 });
  }
}