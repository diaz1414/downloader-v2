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
      const message = error.response?.data?.text || error.message || t("errors.fetch_failed")
      setErrorMessage(message)
      setTimeout(() => setStatus("idle"), 5000)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <div className="relative group">
        <div className="doc-container flex flex-col md:flex-row items-stretch md:items-center bg-background/30 backdrop-blur-md rounded-none border-border">
          <div className="flex items-center flex-1">
            <div className="pl-4 md:pl-6 pr-3 md:pr-4">
              <Search className="w-4 h-4 md:w-5 md:h-5 opacity-40" />
            </div>
            
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDownload()}
              placeholder={t("hero.input_placeholder")}
              suppressHydrationWarning
              className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] md:text-sm py-4 md:py-6 outline-none font-mono placeholder:opacity-30 uppercase"
            />
          </div>

          <div className="border-t md:border-t-0 md:border-l border-border">
            <Button
              onClick={handleDownload}
              disabled={!url || status === "fetching"}
              className={cn(
                "w-full md:w-auto cursor-download relative overflow-hidden min-w-[140px] h-12 md:h-14 rounded-none transition-all duration-500 bg-transparent hover:bg-accent hover:text-white group",
                status === "success" && "bg-emerald-600 text-white",
                status === "error" && "bg-hindia-maroon text-white"
              )}
            >
              <AnimatePresence mode="wait">
                {status === "fetching" ? (
                  <motion.div
                    key="fetching"
                    className="flex items-center justify-center gap-2"
                  >
                    <div className="relative w-4 h-4">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="absolute inset-0 border-2 border-current border-t-transparent rounded-full" 
                      />
                    </div>
                    <span className="font-bold uppercase text-[9px] md:text-[10px] tracking-widest">{t("hero.button_fetching")}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    className="flex items-center justify-center gap-2"
                  >
                    <span className="font-bold uppercase text-[9px] md:text-[10px] tracking-widest">{t("hero.button_fetch")}</span>
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
              <div className="flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 bg-accent text-white rounded-none text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg">
                <Globe className="w-3 h-3" />
                Origin: {platform}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-2 gap-2 border border-border/20 bg-background/50">
        <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-[0.2em] opacity-40">
          [STATUS: {status === "fetching" ? "BUSY" : "READY"}]
        </div>
        <div className="hidden sm:block text-[8px] md:text-[9px] font-mono uppercase tracking-[0.2em] opacity-40">
          Secure Extraction Protocol v1.0
        </div>
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 md:p-4 bg-hindia-maroon/10 border border-hindia-maroon/20 text-hindia-maroon text-[9px] md:text-[10px] font-bold uppercase tracking-widest"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
