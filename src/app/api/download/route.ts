import { NextResponse } from "next/server";

// URL Backend Python kamu (lewat jalur HTTPS Vercel Rewrite)
const PYTHON_API_URL = "https://downloaderv2.diaww.my.id/python-api/api/download";

async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 25000 } = options; // Timeout lebih lama untuk yt-dlp
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
      return NextResponse.json({ status: "error", message: "URL is required" }, { status: 400 });
    }

    console.log(`[PROCESS] Target: ${url} (Routing to Private Python Backend)`);

    try {
      const pythonRes = await fetchWithTimeout(PYTHON_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (pythonRes.ok) {
        const data = await pythonRes.json();
        console.log(`[PYTHON_SUCCESS]`, data.title);
        
        if (data.status === "stream") {
          return NextResponse.json(data);
        }
      } else {
        const errText = await pythonRes.text();
        console.error(`[PYTHON_ERROR]`, errText);
      }
    } catch (err: any) {
      console.error("[PYTHON_FAILED]", err.message);
      return NextResponse.json({ 
        status: "error", 
        message: "Server download sedang sibuk atau down. Silakan coba lagi nanti." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      status: "error", 
      message: "Gagal mengekstrak video. Pastikan link benar." 
    }, { status: 404 });

  } catch (error: any) {
    console.error("API_ERROR:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}