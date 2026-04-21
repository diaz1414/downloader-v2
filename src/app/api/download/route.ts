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

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    console.log(`[HYBRID_PROTOCOL] [${new Date().toISOString()}] Processing: ${url}`);

    // 1. TIKTOK PRIORITY (TikWM)
    if (isTiktok) {
      try {
        console.log("[HYBRID_PROTOCOL] Attempting TikWM...");
        const twmRes = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { headers, timeout: 10000 });
        
        if (!twmRes.ok) {
           console.warn(`[HYBRID_PROTOCOL] TikWM responded with status: ${twmRes.status}`);
        } else {
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

    // 3. FORCED RYZUMI ALL-IN-ONE (For Instagram and everything else)
    try {
      console.log(`[HYBRID_PROTOCOL] Attempting Ryzumi All-In-One for: ${url}`);
      const ryzumiRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, {
        headers,
        timeout: 30000,
        cache: 'no-store'
      });

      if (!ryzumiRes.ok) {
        console.error(`[HYBRID_PROTOCOL] Ryzumi Error: HTTP ${ryzumiRes.status}`);
        const errorText = await ryzumiRes.text().catch(() => "Unknown error");
        console.error(`[HYBRID_PROTOCOL] Ryzumi Response Body: ${errorText.substring(0, 200)}`);
        
        if (ryzumiRes.status === 403 || ryzumiRes.status === 429) {
          return NextResponse.json({
            status: "error",
            text: "Sistem (Ryzumi) membatasi akses dari server. Silakan coba lagi beberapa saat lagi."
          }, { status: 200 });
        }
      } else {
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
        } else {
          console.warn("[HYBRID_PROTOCOL] Ryzumi returned no media");
        }
      }
    } catch (err: any) {
      console.error("[ALL_IN_ONE_ERROR]", err.message);
      if (err.name === 'AbortError') {
        return NextResponse.json({
          status: "error",
          text: "Waktu permintaan habis (Timeout). Server sedang sangat lambat."
        }, { status: 200 });
      }
    }

    return NextResponse.json({
      status: "error",
      text: "Maaf, sistem sedang sibuk atau tidak mendukung link ini. Silakan coba link lain."
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CRITICAL_PROTOCOL_ERROR]", error);
    return NextResponse.json({ 
      status: "error", 
      text: `Protokol Error: ${error.message || "Unknown error"}` 
    }, { status: 500 });
  }
}