import { NextResponse } from "next/server"
import axios from "axios"

// MEGA LIST: Community instances gathered from trackers (April 2026)
// We try many because they are free and some might be down or restricted.
const COBALT_INSTANCES = [
  "https://cobalt.canine.tools/",
  "https://cobalt-api.meowing.de/",
  "https://capi.3kh0.net/",
  "https://kityune.imput.net/",
  "https://sunny.imput.net/",
  "https://nachos.imput.net/",
  "https://blossom.imput.net/",
  "https://olly.imput.net/",
  "https://noodle.imput.net/",
  "https://cobalt.hyonsu.com/",
  "https://cobalt.conner.gay/",
  "https://cobalt.shun.codes/",
  "https://cobalt.lewd.icu/",
  "https://cobalt.instavids.net/",
  "https://api.cobalt.tools/" // Last resort
]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 })
    }

    console.log("-----------------------------------")
    console.log("Mega Fallback - Processing:", url)

    let lastError = ""
    let success = false
    let resultData = null

    // Loop through the mega list
    for (const instance of COBALT_INSTANCES) {
      try {
        console.log(`Checking: ${instance}`)
        const response = await axios.post(instance, {
          url: url,
          vQuality: "720",
        }, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          timeout: 7000 // Short timeout to quickly jump to next instance
        })

        if (response.data && (response.data.url || response.data.picker)) {
          console.log(`✅ SUCCESS with: ${instance}`)
          success = true
          resultData = response.data
          break // Stop the loop on success
        }
      } catch (err: any) {
        lastError = err?.response?.data?.text || err?.response?.data?.message || err.message
        console.warn(`[-] ${instance} failed. Trying next...`)
      }
    }

    if (success) {
      return NextResponse.json(resultData)
    }

    // Special message for YouTube failures
    const isYoutube = url.includes("youtube") || url.includes("youtu.be")
    const finalMsg = isYoutube 
      ? "YouTube is extremely restricted on free servers right now. Please try TikTok or IG, or try again in 5 minutes."
      : `All ${COBALT_INSTANCES.length} servers are busy. Error: ${lastError}`

    return NextResponse.json({ 
      status: "error", 
      text: finalMsg 
    }, { status: 200 })

  } catch (error: any) {
    console.error("Critical Error:", error.message)
    return NextResponse.json(
      { status: "error", text: "System busy. Please refresh." },
      { status: 500 }
    )
  }
}
