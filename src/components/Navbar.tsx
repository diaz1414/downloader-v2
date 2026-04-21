"use client"

import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { SiGithub } from "@icons-pack/react-simple-icons"
import { Globe, Download } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function Navbar() {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleLanguage = () => {
    const nextLang = i18n.language === "en" ? "id" : "en"
    i18n.changeLanguage(nextLang)
  }


  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/10"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-accent group-hover:rotate-12 transition-transform">
            <Download className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl tracking-tight text-foreground leading-none">HINDIA</span>
            <span className="text-[8px] font-mono uppercase tracking-[0.3em] opacity-40">Professional Downloader</span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 text-[10px] font-mono font-bold uppercase tracking-[0.2em] mr-8">
            <Link href="/" className="hover:text-accent transition-colors">Home</Link>
            <Link href="/archives" className="hover:text-accent transition-colors opacity-40 hover:opacity-100">Archives</Link>
            <Link href="/privacy" className="hover:text-accent transition-colors opacity-40 hover:opacity-100">Privacy</Link>
          </div>

          <div className="h-8 w-px bg-border opacity-20" />

          <div className="flex items-center gap-4 pl-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 hover:bg-accent/10 transition-colors text-[10px] font-bold uppercase tracking-widest text-foreground"
            >
              <Globe className="w-3.5 h-3.5" />
              {i18n.language === "en" ? "EN" : "ID"}
            </button>
            
            <a 
              href="https://github.com/imputnet/cobalt" 
              target="_blank" 
              rel="noreferrer"
              className="p-2 hover:bg-accent/10 transition-colors text-foreground"
            >
              <SiGithub className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
