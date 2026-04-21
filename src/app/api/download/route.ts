import { NextResponse } from "next/server";

export const runtime = "edge";

// Alamat VPS Scraper Anda
const VPS_API_URL = "http://51.75.118.169:20149/api/vercel-proxy";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { url } = body;
    if (!url) return NextResponse.json({ status: "error", text: "URL required" }, { status: 400 });

    console.log(`[PROCESS] Routing to VPS Scraper: ${url}`);

    // 1. JALUR UTAMA: VPS SELF-HOSTED (YT-DLP)
    try {
      const vpsRes = await fetch(VPS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        // Timeout 15 detik karena yt-dlp butuh waktu parsing
        signal: AbortSignal.timeout(15000)
      });

      if (vpsRes.ok) {
        const data = await vpsRes.json();
        if (data.status === "success") {
          return NextResponse.json({
            status: "stream",
            url: data.url,
            title: data.title || "Media Downloaded",
            thumbnail: data.thumbnail,
            source: "Self-Hosted Scraper (VPS)",
            picker: data.picker || [{ url: data.url, type: "video", quality: "HD", extension: "mp4" }]
          });
        }
      }
    } catch (e: any) {
      console.warn("[VPS_FAILED]", e.message);
    }

    // 2. JALUR CADANGAN: TIKWM (Khusus TikTok)
    if (url.includes("tiktok.com")) {
       try {
         const twmRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
         const twmData = await twmRes.json();
         if (twmData?.data) {
           const d = twmData.data;
           return NextResponse.json({
             status: "stream",
             url: d.play,
             title: d.title,
             source: "TikWM Protocol (Backup)",
             picker: [{ url: d.play, type: "video", quality: "HD", extension: "mp4" }]
           });
         }
       } catch (e) {}
    }

    return NextResponse.json({
      status: "error",
      text: "Maaf, mesin VPS sedang sibuk dan cadangan gagal. Silakan coba lagi nanti."
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ status: "error", text: "Internal Connection Error" }, { status: 500 });
  }
}