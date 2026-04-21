import { NextResponse } from "next/server";

export const runtime = "edge";

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 15000 } = options;
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
    const isInstagram = url.includes("instagram.com");

    // Spoofing Headers to bypass Data Center blocks
    const randomIP = Array.from({ length: 4 }, () => Math.floor(Math.random() * 255)).join('.');
    const baseHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "X-Forwarded-For": randomIP,
      "X-Real-IP": randomIP,
    };

    console.log(`[PROCESS] Target: ${url} (Spoof IP: ${randomIP})`);

    // 1. TIKTOK PRIORITY (TikWM)
    if (isTiktok) {
      try {
        const twmRes = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
          headers: { ...baseHeaders, "Referer": "https://www.tikwm.com/" },
          timeout: 10000
        });
        const twmData = await twmRes.json();
        if (twmData?.data) {
          const d = twmData.data;
          return NextResponse.json({
            status: "stream",
            url: d.play,
            title: d.title || "TikTok Video",
            thumbnail: d.cover,
            source: "TikTok Protocol",
            picker: [
              { url: d.play, type: "video", quality: "HD (NO-WM)", extension: "mp4" },
              { url: d.wmplay, type: "video", quality: "WATERMARK", extension: "mp4" },
              { url: d.music, type: "audio", quality: "AUDIO", extension: "mp3" }
            ]
          });
        }
      } catch (e) { console.warn("TikTok Priority Failed"); }
    }

    // 2. INSTAGRAM PRIORITY (Chocomilk & Ryzumi IG)
    if (isInstagram) {
      // Prioritas 1: Chocomilk
      try {
        const cocoRes = await fetchWithTimeout(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`, {
          headers: { ...baseHeaders, "Referer": "https://chocomilk.amira.us.kg/" },
          timeout: 8000
        });
        if (cocoRes.ok) {
          const d = await cocoRes.json();
          const data = d.data || d.result || d;
          const mediaUrl = data.url || (Array.isArray(data) ? data[0]?.url : null);
          if (mediaUrl) {
            return NextResponse.json({
              status: "stream",
              url: mediaUrl,
              title: data.title || "Instagram Content",
              thumbnail: data.thumbnail || (Array.isArray(data) ? data[0]?.thumbnail : ""),
              source: "Instagram Protocol (v1)",
              picker: [{ url: mediaUrl, type: "video", quality: "HD", extension: "mp4" }]
            });
          }
        }
      } catch (e) { console.warn("Instagram Chocomilk Failed"); }

      // Prioritas 2: Ryzumi Specialized IG
      try {
        const igRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/instagram?url=${encodeURIComponent(url)}`, {
          headers: { ...baseHeaders, "Referer": "https://ryzumi.net/" },
          timeout: 10000
        });
        if (igRes.ok) {
          const data = await igRes.json();
          if (data && data.medias && data.medias.length > 0) {
            return NextResponse.json({
              status: "stream",
              url: data.medias[0].url,
              title: data.title || "Instagram Content",
              thumbnail: data.thumbnail,
              source: "Instagram Protocol (v2)",
              picker: data.medias.map((m: any) => ({
                url: m.url, type: m.type, quality: m.quality || "HD", extension: m.extension || "mp4"
              }))
            });
          }
        }
      } catch (e) { console.warn("Instagram Ryzumi Failed"); }
    }

    // 3. YOUTUBE PRIORITY (Specialized Ryzumi)
    if (isYoutube) {
      try {
        const [mp4Res, mp3Res] = await Promise.allSettled([
          fetchWithTimeout(`https://api.ryzumi.net/api/downloader/ytmp4?url=${encodeURIComponent(url)}`, {
            headers: { ...baseHeaders, "Referer": "https://ryzumi.net/" },
            timeout: 15000
          }),
          fetchWithTimeout(`https://api.ryzumi.net/api/downloader/ytmp3?url=${encodeURIComponent(url)}`, {
            headers: { ...baseHeaders, "Referer": "https://ryzumi.net/" },
            timeout: 15000
          })
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
            source: "YouTube Protocol",
            picker: pickerItems
          });
        }
      } catch (err) { console.warn("YouTube Priority Failed"); }
    }

    // 4. UNIVERSAL FALLBACK (Ryzumi AIO)
    try {
      const ryzumiRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, {
        headers: { ...baseHeaders, "Referer": "https://ryzumi.net/" },
        timeout: 20000,
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
            source: "Universal Protocol",
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
      text: "Maaf, semua protokol gagal mendapatkan data. Link mungkin privat atau server sedang sibuk."
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CRITICAL_ERROR]", error);
    return NextResponse.json({ status: "error", text: "Terjadi kesalahan internal pada protokol." }, { status: 500 });
  }
}
