"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Download, Loader2, Check, AlertCircle } from "lucide-react"
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
      
      if (response.data.status === "error") {
        throw new Error(response.data.text || "Failed to process")
      }

      onResult(response.data)
      setStatus("success")
      setTimeout(() => setStatus("idle"), 3000)
    } catch (error: any) {
      console.error(error)
      setStatus("error")
      setErrorMessage(error.message)
      setTimeout(() => {
        setStatus("idle")
      }, 5000)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className={cn(
          "absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200",
          status === "fetching" && "opacity-100 animate-pulse"
        )} />
        
        <div className="relative flex items-center bg-background rounded-2xl p-2 shadow-2xl border border-border">
          <div className="pl-4 pr-2 text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>
          
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDownload()}
            placeholder={t("hero.input_placeholder")}
            suppressHydrationWarning // Fixes the browser extension attribute issue
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg py-3 outline-none"
          />

          <motion.div layout>
            <Button
              onClick={handleDownload}
              disabled={!url || status === "fetching"}
              className={cn(
                "relative overflow-hidden min-w-[120px] h-12 rounded-xl transition-all duration-300",
                status === "idle" && "bg-blue-600 hover:bg-blue-700 text-white",
                status === "fetching" && "bg-slate-800 text-white",
                status === "success" && "bg-emerald-500 text-white",
                status === "error" && "bg-red-500 text-white"
              )}
            >
              <AnimatePresence mode="wait">
                {status === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t("hero.button_download")}</span>
                  </motion.div>
                )}
                {status === "fetching" && (
                  <motion.div
                    key="fetching"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("hero.button_fetching")}</span>
                  </motion.div>
                )}
                {status === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t("hero.button_success")}</span>
                  </motion.div>
                )}
                {status === "error" && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Error</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {(platform !== "unknown" || errorMessage) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex flex-col items-center gap-2"
          >
            {errorMessage && (
              <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                {errorMessage}
              </div>
            )}
            {platform !== "unknown" && (
              <div className="px-3 py-1 rounded-full glass text-xs font-medium capitalize flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Detected: {platform}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
