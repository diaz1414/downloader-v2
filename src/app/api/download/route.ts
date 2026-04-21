import { NextResponse } from "next/server";

export const runtime = "edge";

// Ganti dengan API Key dari dashboard ScrapingAnt kamu
const ANT_API_KEY = "b64b4ddbe94240de97808fdeedae26c2";

// Helper untuk fetch dengan timeout + ScrapingAnt Integration
async function fetchWithAnt(url: string, options: any = {}) {
  const { timeout = 20000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // Kita bungkus URL asli ke dalam API ScrapingAnt
  // browser=false digunakan karena kita hanya menembak API (JSON), bukan render website
  const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(url)}&x-api-key=${ANT_API_KEY}&browser=false`;

  try {
    const response = await fetch(proxyUrl, {
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

// Fungsi Fetch standar tetap ada untuk cadangan
async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 15000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
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

    const randomIP = Array.from({ length: 4 }, () => Math.floor(Math.random() * 255)).join('.');
    const baseHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "X-Forwarded-For": randomIP,
    };

    console.log(`[PROCESS] Target: ${url} (Region: sin1)`);

    // 1. TIKTOK PRIORITY
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
      } catch (e) { console.warn("TikTok Failed"); }
    }

    // 2. INSTAGRAM PRIORITY (Using ScrapingAnt for Ryzumi)
    if (isInstagram) {
      // Prioritas 1: Chocomilk (Sering tembus tanpa proxy)
      try {
        const cocoRes = await fetchWithTimeout(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`, {
          headers: { ...baseHeaders, "Referer": "https://chocomilk.amira.us.kg/" }
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
      } catch (e) { console.warn("IG Chocomilk Failed"); }

      // Prioritas 2: Ryzumi (Wajib pakai ScrapingAnt karena 403 di Vercel)
      try {
        const igRes = await fetchWithAnt(`https://api.ryzumi.net/api/downloader/instagram?url=${encodeURIComponent(url)}`);
        if (igRes.ok) {
          const data = await igRes.json();
          if (data && data.medias && data.medias.length > 0) {
            return NextResponse.json({
              status: "stream",
              url: data.medias[0].url,
              title: data.title || "Instagram Content",
              thumbnail: data.thumbnail,
              source: "Instagram Protocol (v2 - Ant)",
              picker: data.medias.map((m: any) => ({
                url: m.url, type: m.type, quality: m.quality || "HD", extension: m.extension || "mp4"
              }))
            });
          }
        }
      } catch (e) { console.warn("IG Ryzumi Ant Failed"); }
    }

    // 3. YOUTUBE PRIORITY (Using ScrapingAnt)
    if (isYoutube) {
      try {
        const [mp4Res, mp3Res] = await Promise.allSettled([
          fetchWithAnt(`https://api.ryzumi.net/api/downloader/ytmp4?url=${encodeURIComponent(url)}`),
          fetchWithAnt(`https://api.ryzumi.net/api/downloader/ytmp3?url=${encodeURIComponent(url)}`)
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
            title, thumbnail,
            source: "YouTube Protocol (Ant)",
            picker: pickerItems
          });
        }
      } catch (err) { console.warn("YouTube Ant Failed"); }
    }

    // 4. UNIVERSAL FALLBACK
    try {
      const ryzumiRes = await fetchWithAnt(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`);
      if (ryzumiRes.ok) {
        const data = await ryzumiRes.json();
        if (data && data.medias && data.medias.length > 0) {
          return NextResponse.json({
            status: "stream",
            url: data.medias[0].url,
            title: data.title || "Archive Result",
            thumbnail: data.thumbnail,
            source: "Universal Protocol (Ant)",
            picker: data.medias.map((m: any) => ({
              url: m.url, type: m.type || "video", quality: m.quality || "HD", extension: m.extension || "mp4"
            }))
          });
        }
      }
    } catch (err: any) { console.error("[FALLBACK_ERROR]", err.message); }

    return NextResponse.json({
      status: "error",
      text: "Maaf, semua protokol gagal mendapatkan data. Link mungkin privat atau server sedang sibuk."
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CRITICAL_ERROR]", error);
    return NextResponse.json({ status: "error", text: "Terjadi kesalahan internal." }, { status: 500 });
  }
}