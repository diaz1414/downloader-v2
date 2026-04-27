import { NextResponse } from "next/server";

export const runtime = "edge";

// API Key ScrapingAnt kamu
const ANT_API_KEY = "b64b4ddbe94240de97808fdeedae26c2";

// Helper untuk fetch dengan timeout + ScrapingAnt Integration
async function fetchWithAnt(url: string, options: any = {}) {
  // Timeout diperketat ke 8 detik supaya fungsi Vercel (limit 10s) 
  // nggak keburu mati duluan sebelum dapet respon.
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // OPTIMASI: Gunakan residential proxy agar lebih sulit diblokir oleh target
  const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(url)}&x-api-key=${ANT_API_KEY}&browser=false&proxy_type=residential`;

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

    const baseHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Referer": "https://ryzumi.net/",
    };

    // Flag untuk memastikan kita tidak memanggil proxy lebih dari sekali (Cegah Error 423)
    let proxyUsed = false;

    // Helper internal untuk Ryzumi dengan fallback proxy
    async function fetchRyzumi(apiUrl: string) {
      // 1. Coba tembak langsung (Cepat)
      try {
        const res = await fetchWithTimeout(apiUrl, { headers: baseHeaders, timeout: 5000 });
        if (res.status === 403 || res.status === 429) throw new Error("Blocked");
        return res;
      } catch (err) {
        // 2. Jika diblokir DAN belum pernah pakai proxy, tembak lewat proxy
        if (!proxyUsed) {
          console.warn(`[RETRY] API Blocked, using proxy for: ${apiUrl}`);
          proxyUsed = true;
          return await fetchWithAnt(apiUrl, { headers: baseHeaders, timeout: 8000 });
        }
        throw new Error("Proxy already used or blocked");
      }
    }

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

    // 2. INSTAGRAM PRIORITY
    if (isInstagram) {
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

      try {
        const igRes = await fetchRyzumi(`https://api.ryzumi.net/api/downloader/instagram?url=${encodeURIComponent(url)}`);
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
      } catch (e) { console.warn("IG Ryzumi Failed"); }
    }

    // 3. YOUTUBE PRIORITY
    if (isYoutube) {
      try {
        // Penting: Jangan pakai Promise.all jika pakai proxy gratis (Limit 1 concurrency)
        // Kita panggil satu per satu agar tidak kena Error 423 Locked
        const mp4Res = await fetchRyzumi(`https://api.ryzumi.net/api/downloader/ytmp4?url=${encodeURIComponent(url)}`);
        const mp3Res = await fetchRyzumi(`https://api.ryzumi.net/api/downloader/ytmp3?url=${encodeURIComponent(url)}`);

        const pickerItems = [];
        let title = "YouTube Video";
        let thumbnail = "";

        if (mp4Res && mp4Res.ok) {
          const d = await mp4Res.json();
          if (d.videoUrl) {
            title = d.title || title;
            thumbnail = d.thumbnail || thumbnail;
            pickerItems.push({ url: d.videoUrl, type: "video", quality: "720P (DIRECT)", extension: "mp4" });
          }
        }

        if (mp3Res && mp3Res.ok) {
          const d = await mp3Res.json();
          if (d.audioUrl) pickerItems.push({ url: d.audioUrl, type: "audio", quality: "AUDIO (320kbps)", extension: "mp3" });
        }

        if (pickerItems.length > 0) {
          return NextResponse.json({
            status: "stream",
            url: pickerItems[0].url,
            title, thumbnail,
            source: "YouTube Protocol",
            picker: pickerItems
          });
        }
      } catch (err) { console.warn("YouTube Failed"); }
    }

    // 4. UNIVERSAL FALLBACK (Hanya jika belum dapat hasil)
    try {
      // Hanya jalankan fallback jika belum mencoba proxy (untuk hemat waktu/limit)
      if (!proxyUsed) {
        const ryzumiRes = await fetchRyzumi(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`);
        if (ryzumiRes && ryzumiRes.ok) {
          const data = await ryzumiRes.json();
          if (data && data.medias && data.medias.length > 0) {
            return NextResponse.json({
              status: "stream",
              url: data.medias[0].url,
              title: data.title || "Archive Result",
              thumbnail: data.thumbnail,
              source: "Universal Protocol",
              picker: data.medias.map((m: any) => ({
                url: m.url, type: m.type || "video", quality: m.quality || "HD", extension: m.extension || "mp4"
              }))
            });
          }
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