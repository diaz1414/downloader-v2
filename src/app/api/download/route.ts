import { NextResponse } from "next/server";

export const runtime = "edge";

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 8000 } = options;
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

    if (!url) {
      return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 });
    }

    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isTiktok = url.includes("tiktok.com");

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    console.log(`[EDGE_PROTOCOL] Fetching: ${url}`);

    // 1. KHUSUS TIKTOK
    if (isTiktok) {
      // Prioritas 1: TikWM (Sangat stabil)
      try {
        const twmRes = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { headers });
        const twmData = await twmRes.json();
        if (twmData && twmData.data) {
          const d = twmData.data;
          return NextResponse.json({
            status: "stream",
            url: d.play || d.wmplay,
            title: d.title || "TikTok Video",
            thumbnail: d.cover,
            source: "TikTok",
            author: { name: d.author?.nickname, username: d.author?.unique_id },
            picker: [
              { url: d.play, type: "video", quality: "HD (NO-WM)", extension: "mp4" },
              { url: d.wmplay, type: "video", quality: "WATERMARK", extension: "mp4" },
              { url: d.music, type: "audio", quality: "AUDIO", extension: "mp3" }
            ]
          });
        }
      } catch (e) { console.warn("TikWM failed, trying TiklyDown..."); }

      // Prioritas 2: TiklyDown
      try {
        const tdRes = await fetchWithTimeout(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, { headers });
        if (tdRes.ok) {
          const data = await tdRes.json();
          if (data && data.video) {
            return NextResponse.json({
              status: "stream",
              url: data.video.noWatermark || data.video.watermark,
              title: data.title || "TikTok Video",
              thumbnail: data.author?.avatar || "",
              source: "TikTok",
              picker: [
                { url: data.video.noWatermark, type: "video", quality: "HD (NO-WM)", extension: "mp4" },
                { url: data.video.watermark, type: "video", quality: "WATERMARK", extension: "mp4" },
                ...(data.music ? [{ url: data.music.play_url, type: "audio", quality: "AUDIO", extension: "mp3" }] : [])
              ]
            });
          }
        }
      } catch (e) { console.warn("Tiklydown failed, falling back to Ryzumi..."); }
    }

    // 2. JIKA YOUTUBE
    if (isYoutube) {
      try {
        const [mp4Res, mp3Res] = await Promise.allSettled([
          fetchWithTimeout(`https://api.ryzumi.net/api/downloader/ytmp4?url=${encodeURIComponent(url)}`, { headers }),
          fetchWithTimeout(`https://api.ryzumi.net/api/downloader/ytmp3?url=${encodeURIComponent(url)}`, { headers })
        ]);

        const pickerItems = [];
        let title = "YouTube Video";
        let thumbnail = "";

        if (mp4Res.status === "fulfilled" && mp4Res.value.ok) {
          const d = await mp4Res.value.json();
          title = d.title || title;
          thumbnail = d.thumbnail || thumbnail;
          pickerItems.push({ url: d.videoUrl, type: "video", quality: "720P (DIRECT)", extension: "mp4" });
        }

        if (mp3Res.status === "fulfilled" && mp3Res.value.ok) {
          const d = await mp3Res.value.json();
          pickerItems.push({ url: d.audioUrl, type: "audio", quality: "AUDIO (320kbps)", extension: "mp3" });
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
      } catch (err) {
        console.warn("YouTube specialized failed.");
      }
    }

    // 3. ALL-IN-ONE RYZUMI
    try {
      const ryzumiRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, { headers });
      if (ryzumiRes.ok) {
        const data = await ryzumiRes.json();
        if (data && data.medias && data.medias.length > 0) {
          return NextResponse.json({
            status: "stream",
            url: data.medias[0].url,
            title: data.title,
            thumbnail: data.thumbnail,
            source: data.source,
            author: data.author,
            picker: data.medias.map((m: any) => ({
              url: m.url,
              type: m.type || "video",
              quality: m.quality || m.extension,
              extension: m.extension
            }))
          });
        }
      }
    } catch (err: any) {
      console.error("Ryzumi All-in-One failed.");
    }

    // 4. COBALT FINAL FALLBACK
    const COBALTS = ["https://cobalt.canine.tools/api/json", "https://cobalt-api.meowing.de/api/json"];
    for (const instance of COBALTS) {
      try {
        const cRes = await fetchWithTimeout(instance, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ url, vQuality: "720" })
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData && (cData.url || cData.picker)) return NextResponse.json(cData);
        }
      } catch (e) { continue; }
    }

    return NextResponse.json({ 
      status: "error", 
      text: "Sistem sibuk. Coba lagi dalam 30 detik." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("[EDGE_ERROR]", error);
    return NextResponse.json({ status: "error", text: "Protokol Error." }, { status: 500 });
  }
}