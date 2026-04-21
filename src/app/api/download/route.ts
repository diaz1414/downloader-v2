import { NextResponse } from "next/server";

export const runtime = "edge";

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

    console.log(`[HYBRID_PROTOCOL] Processing: ${url}`);

    // 1. TIKTOK PRIORITY (TikWM)
    if (isTiktok) {
      try {
        const twmRes = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { headers, timeout: 10000 });
        const twmData = await twmRes.json();
        if (twmData?.data) {
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
      } catch (e) { console.warn("TikTok Priority Failed"); }
    }

    // 2. YOUTUBE PRIORITY (Specialized Ryzumi)
    if (isYoutube) {
      try {
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
          return NextResponse.json({
            status: "stream",
            url: pickerItems[0].url,
            title,
            thumbnail,
            source: "YouTube",
            picker: pickerItems
          });
        }
      } catch (err) { console.warn("YouTube Priority Failed"); }
    }

    // 3. FORCED RYZUMI ALL-IN-ONE (For Instagram and everything else)
    try {
      const ryzumiRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, { 
        headers,
        timeout: 30000,
        cache: 'no-store'
      });

      if (ryzumiRes.ok) {
        const data = await ryzumiRes.json();
        if (data && data.medias && data.medias.length > 0) {
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
      }
    } catch (err: any) {
      console.error("[ALL_IN_ONE_ERROR]", err.message);
    }

    return NextResponse.json({ 
      status: "error", 
      text: "Maaf, sistem sedang sibuk memproses antrean. Silakan coba lagi nanti." 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ status: "error", text: "Protokol Error." }, { status: 500 });
  }
}