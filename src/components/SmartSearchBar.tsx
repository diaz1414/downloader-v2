"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ArrowRight, Loader2, Check, AlertCircle, Globe } from "lucide-react"
import { detectPlatform, Platform } from "@/lib/detector"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import axios from "axios"

export function SmartSearchBar({ onResult }: { onResult: (data: any) => void }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState<"idle" | "fetching" | "success" | "error">("idle")
  const [platform, setPlatform] = useState<Platform>("unknown")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (url) {
      setPlatform(detectPlatform(url))
    } else {
      setPlatform("unknown")
    }
  }, [url])

  const handleDownload = async () => {
    if (!url) return
    setStatus("fetching")
    setErrorMessage("")
    onResult(null)
    
    try {
      const response = await axios.post("/api/download", { url })
      if (response.data.status === "error") throw new Error(response.data.text)
      onResult(response.data)
      setStatus("success")
      setTimeout(() => setStatus("idle"), 3000)
    } catch (error: any) {
      setStatus("error")
      setErrorMessage("Something went wrong with the server. Please try again.")
      setTimeout(() => setStatus("idle"), 5000)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="relative group">
        <div className="doc-container flex items-center bg-background/30 backdrop-blur-md rounded-none border-border">
          <div className="pl-6 pr-4">
            <Search className="w-5 h-5 opacity-40" />
          </div>
          
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDownload()}
            placeholder="Paste your link here (e.g., Instagram Reel, TikTok, etc.)"
            suppressHydrationWarning
            className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-sm py-6 outline-none font-mono placeholder:opacity-30 uppercase"
          />

          <div className="pr-4">
            <Button
              onClick={handleDownload}
              disabled={!url || status === "fetching"}
              className={cn(
                "cursor-download relative overflow-hidden min-w-[140px] h-14 rounded-none transition-all duration-500 border-l border-border bg-transparent hover:bg-accent hover:text-white group",
                status === "success" && "bg-emerald-600 text-white",
                status === "error" && "bg-hindia-maroon text-white"
              )}
            >
              <AnimatePresence mode="wait">
                {status === "fetching" ? (
                  <motion.div
                    key="fetching"
                    className="flex items-center gap-2"
                  >
                    <div className="relative w-5 h-5">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="absolute inset-0 border-2 border-current border-t-transparent rounded-full" 
                      />
                    </div>
                    <span className="font-bold uppercase text-[10px] tracking-widest">Processing</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    className="flex items-center gap-2"
                  >
                    <span className="font-bold uppercase text-[10px] tracking-widest">Fetch Media</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Detected Platform Badge */}
        <AnimatePresence>
          {platform !== "unknown" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-10 left-0"
            >
              <div className="flex items-center gap-2 px-4 py-1.5 bg-accent text-white rounded-none text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg">
                <Globe className="w-3 h-3" />
                Origin Platform: {platform}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center px-4 py-2 border border-border/20 bg-background/50">
        <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-40">
          [STATUS: {status === "fetching" ? "BUSY" : "READY"}]
        </div>
        <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-40">
          Secure Extraction Protocol v1.0
        </div>
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-4 bg-hindia-maroon/10 border border-hindia-maroon/20 text-hindia-maroon text-[10px] font-bold uppercase tracking-widest"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
