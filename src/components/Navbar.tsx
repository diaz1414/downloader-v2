"use client"

import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { ThemeToggle } from "./ThemeToggle"
import { SiGithub } from "@icons-pack/react-simple-icons"
import { Globe, Download } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function Navbar() {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  // Memastikan komponen sudah siap untuk interaksi
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleLanguage = () => {
    const nextLang = i18n.language === "en" ? "id" : "en"
    i18n.changeLanguage(nextLang)
  }

  return (
    <div className="fixed top-8 left-0 right-0 z-50 flex justify-center px-4">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        // bg-background/70 sekarang akan otomatis hitam jika OS kamu gelap (berkat CSS tadi)
        className="flex items-center gap-4 px-6 py-2.5 bg-background/70 backdrop-blur-xl rounded-full border border-border shadow-2xl transition-all duration-500"
      >
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 bg-accent rounded-full group-hover:rotate-12 transition-transform">
            <Download className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-serif font-bold text-lg hidden sm:block tracking-tight text-foreground">HINDIA</span>
        </Link>

        <div className="w-px h-6 bg-border opacity-20 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-accent/10 transition-colors text-[10px] font-bold uppercase tracking-widest text-foreground"
          >
            <Globe className="w-3.5 h-3.5" />
            {i18n.language === "en" ? "EN" : "ID"}
          </button>
          
          <ThemeToggle />
          
          <a 
            href="https://github.com/imputnet/cobalt" 
            target="_blank" 
            rel="noreferrer"
            className="p-2 rounded-full hover:bg-accent/10 transition-colors text-foreground"
          >
            <SiGithub className="w-5 h-5" />
          </a>
        </div>
      </motion.nav>
    </div>
  )
}
