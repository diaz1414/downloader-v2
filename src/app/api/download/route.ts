import { NextResponse } from "next/server";

export const runtime = "edge";

// URL Backend Python kamu
const PYTHON_API = "http://51.68.34.78:20212/api/download";

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

    console.log(`[PROCESS] Target: ${url} (Routing to Python Backend)`);

    // --- PRIORITAS 1: PYTHON BACKEND (yt-dlp) ---
    try {
      const pythonRes = await fetchWithTimeout(PYTHON_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        timeout: 12000 // Beri waktu lebih lama untuk yt-dlp memproses
      });

      if (pythonRes.ok) {
        const data = await pythonRes.json();
        if (data.status === "stream") {
          return NextResponse.json({
            ...data,
            source: "Python Private Engine (Stable)"
          });
        }
      }
    } catch (err: any) {
      console.warn("[PYTHON_BACKEND_FAILED]", err.message);
    }

    // --- PRIORITAS 2: TIKTOK FALLBACK (Direct) ---
    if (url.includes("tiktok.com")) {
      try {
        const twmRes = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const twmData = await twmRes.json();
        if (twmData?.data) {
          const d = twmData.data;
          return NextResponse.json({
            status: "stream",
            url: d.play,
            title: d.title || "TikTok Video",
            thumbnail: d.cover,
            source: "TikTok Protocol (Fallback)",
            picker: [
              { url: d.play, type: "video", quality: "HD (NO-WM)", extension: "mp4" },
              { url: d.music, type: "audio", quality: "AUDIO", extension: "mp3" }
            ]
          });
        }
      } catch (e) {}
    }

    // --- PRIORITAS 3: INSTAGRAM FALLBACK (Chocomilk) ---
    if (url.includes("instagram.com")) {
      try {
        const cocoRes = await fetchWithTimeout(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`);
        if (cocoRes.ok) {
          const d = await cocoRes.json();
          const data = d.data || d.result || d;
          const mediaUrl = data.url || (Array.isArray(data) ? data[0]?.url : null);
          if (mediaUrl) {
            return NextResponse.json({
              status: "stream",
              url: mediaUrl,
              title: data.title || "Instagram Content",
              thumbnail: data.thumbnail || "",
              source: "Instagram Protocol (Fallback)",
              picker: [{ url: mediaUrl, type: "video", quality: "HD", extension: "mp4" }]
            });
          }
        }
      } catch (e) {}
    }

    return NextResponse.json({
      status: "error",
      text: "Maaf, semua protokol gagal. Pastikan Backend Python sudah berjalan atau link valid."
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CRITICAL_ERROR]", error);
    return NextResponse.json({ status: "error", text: "Terjadi kesalahan internal." }, { status: 500 });
  }
}