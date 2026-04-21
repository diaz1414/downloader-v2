import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Extended timeout
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

    // 0. CLEAN URL (Strip tracking parameters)
    try {
      if (url.includes("instagram.com") || url.includes("tiktok.com") || url.includes("youtube.com") || url.includes("youtu.be")) {
        const urlObj = new URL(url);
        url = `${urlObj.origin}${urlObj.pathname}`;
      }
    } catch (e) {
      console.warn("URL Parsing failed, using original");
    }

    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isTiktok = url.includes("tiktok.com");
    const isInstagram = url.includes("instagram.com");

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json",
    };

    console.log(`[HYBRID_PROTOCOL] [${new Date().toISOString()}] Processing: ${url}`);

    // 1. INSTAGRAM PRIORITY (Chocomilk)
    if (isInstagram) {
      try {
        console.log("[HYBRID_PROTOCOL] Attempting Chocomilk Instagram...");
        const cocoRes = await fetchWithTimeout(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`, { headers, timeout: 15000 });
        if (cocoRes.ok) {
          const d = await cocoRes.json();
          // Map result based on common API structures
          const mediaUrl = d.result?.url || d.data?.url || d.url;
          if (mediaUrl) {
            console.log("[HYBRID_PROTOCOL] Chocomilk Success");
            return NextResponse.json({
              status: "stream",
              url: mediaUrl,
              title: d.result?.title || d.data?.title || d.title || "Instagram Content",
              thumbnail: d.result?.thumbnail || d.data?.thumbnail || d.thumbnail,
              source: "Instagram (Chocomilk)",
              picker: [{ url: mediaUrl, type: "video", quality: "HD", extension: "mp4" }]
            });
          }
        }
      } catch (e: any) {
        console.warn(`[HYBRID_PROTOCOL] Chocomilk Failed: ${e.message}`);
      }
    }

    // 2. TIKTOK PRIORITY (TikWM)
    if (isTiktok) {
      try {
        console.log("[HYBRID_PROTOCOL] Attempting TikWM...");
        const twmRes = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { headers, timeout: 10000 });
        const twmData = await twmRes.json();
        if (twmData?.data) {
          console.log("[HYBRID_PROTOCOL] TikWM Success");
          const d = twmData.data;
          return NextResponse.json({
            status: "stream",
            url: d.play,
            title: d.title,
            thumbnail: d.cover,
            source: "TikTok (TikWM)",
            picker: [
              { url: d.play, type: "video", quality: "HD (NO-WM)", extension: "mp4" },
              { url: d.music, type: "audio", quality: "AUDIO", extension: "mp3" }
            ]
          });
        }
      } catch (e: any) { console.warn(`TikWM Failed: ${e.message}`); }
    }

    // 2. COBALT PROTOCOL (Highest Reliability for Instagram/Twitter/YouTube)
    try {
      console.log("[HYBRID_PROTOCOL] Attempting Cobalt Protocol...");
      const cobaltRes = await fetchWithTimeout("https://api.cobalt.tools/api/json", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: url,
          videoQuality: "720",
          filenameStyle: "pretty"
        }),
        timeout: 20000
      });

      if (cobaltRes.ok) {
        const d = await cobaltRes.json();
        if (d.status === "stream" || d.status === "redirect") {
          console.log("[HYBRID_PROTOCOL] Cobalt Success");
          return NextResponse.json({
            status: "stream",
            url: d.url,
            title: d.filename || "Extracted Media",
            source: "Cobalt Protocol",
            picker: [{ url: d.url, type: "video", quality: "HD", extension: "mp4" }]
          });
        } else if (d.status === "picker") {
          console.log("[HYBRID_PROTOCOL] Cobalt Picker Success");
           return NextResponse.json({
              status: "stream",
              url: d.picker[0].url,
              title: "Multiple Items Found",
              source: "Cobalt Picker",
              picker: d.picker.map((p: any) => ({ url: p.url, type: p.type || "video", quality: p.quality || "HD", extension: "mp4" }))
           });
        }
      }
    } catch (e: any) {
      console.warn(`[HYBRID_PROTOCOL] Cobalt Failed: ${e.message}`);
    }

    // 3. YOUTUBE PRIORITY (Ryzumi)
    if (isYoutube) {
      try {
        console.log("[HYBRID_PROTOCOL] Attempting Ryzumi YouTube...");
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
            source: "YouTube (Ryzumi)",
            picker: pickerItems
          });
        }
      } catch (err) {}
    }

    // 4. RYZUMI ALL-IN-ONE (Universal Fallback)
    try {
      console.log("[HYBRID_PROTOCOL] Attempting Ryzumi AIO...");
      const ryzumiRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, {
        headers: { ...headers, "Referer": "https://ryzumi.net/" },
        timeout: 25000
      });

      if (ryzumiRes.ok) {
        const data = await ryzumiRes.json();
        if (data && data.medias && data.medias.length > 0) {
          console.log("[HYBRID_PROTOCOL] Ryzumi Success");
          return NextResponse.json({
            status: "stream",
            url: data.medias[0].url,
            title: data.title || "Universal Result",
            thumbnail: data.thumbnail,
            source: "Ryzumi AIO",
            picker: data.medias.map((m: any) => ({
              url: m.url,
              type: m.type || "video",
              quality: m.quality || "HD",
              extension: m.extension || "mp4"
            }))
          });
        }
      }
    } catch (err: any) {}

    // 5. SNAPANY (Final Emergency Fallback)
    try {
      console.log("[HYBRID_PROTOCOL] Attempting SnapAny...");
      const snapRes = await fetchWithTimeout(`https://api.snapany.com/api/allinone?url=${encodeURIComponent(url)}`, { headers, timeout: 15000 });
      if (snapRes.ok) {
        const d = await snapRes.json();
        const medias = d.medias || d.data?.medias;
        if (medias && medias.length > 0) {
          console.log("[HYBRID_PROTOCOL] SnapAny Success");
          return NextResponse.json({
            status: "stream",
            url: medias[0].url,
            title: d.title || "Archive Media",
            source: "SnapAny Protocol",
            picker: medias.map((m: any) => ({ url: m.url, type: m.type || "video", quality: m.quality || "HD", extension: m.extension || "mp4" }))
          });
        }
      }
    } catch (e) {}

    return NextResponse.json({
      status: "error",
      text: "Semua protokol (Cobalt, Ryzumi, SnapAny) gagal mengekstrak link ini. Link mungkin privat atau tidak didukung."
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CRITICAL_ERROR]", error);
    return NextResponse.json({ status: "error", text: "Protokol Kritis Gagal." }, { status: 500 });
  }
}