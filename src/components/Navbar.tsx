"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { SiGithub } from "@icons-pack/react-simple-icons"
import { Globe, Download, Menu, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { t, i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRTL, setIsRTL] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsRTL(i18n.language === "ar")
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr"
  }, [i18n.language])

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setIsMenuOpen(false)
  }

  const languages = [
    { code: "en", name: "English" },
    { code: "id", name: "Indonesia" },
    { code: "su", name: "Sunda" },
    { code: "jv", name: "Jawa" },
    { code: "ru", name: "Русский" },
    { code: "pt", name: "Português" },
    { code: "zh", name: "简体中文" },
    { code: "ko", name: "한국어" },
    { code: "ar", name: "العربية" },
    { code: "ja", name: "日本語" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
  ]

  const navLinks = [
    { href: "/", label: t("navbar.home") },
    { href: "/about", label: t("navbar.archives") },
    { href: "/privacy", label: t("navbar.privacy") },
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/10"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
          <div className="p-1.5 md:p-2 bg-accent group-hover:rotate-12 transition-transform">
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm md:text-xl tracking-tight text-foreground leading-none uppercase truncate max-w-[120px] md:max-w-none">
              DIAW DOWNLOADER V2
            </span>
            <span className="text-[7px] md:text-[8px] font-mono uppercase tracking-[0.3em] opacity-40">
              {t("navbar.subtext")}
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8 text-[10px] font-mono font-bold uppercase tracking-[0.2em] mr-8">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="hover:text-accent transition-colors opacity-40 hover:opacity-100">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          {/* Desktop/Tablet Language Picker */}
          <div className="hidden md:block relative group/lang">
            <div className="flex items-center gap-2 px-3 py-2 hover:bg-accent/10 transition-colors text-[10px] font-bold uppercase tracking-widest text-foreground cursor-pointer">
              <Globe className="w-3.5 h-3.5" />
              <span>{i18n.language}</span>
            </div>

            <div className="absolute top-full right-0 mt-3 w-56 bg-[#0a0a0a] border-2 border-foreground/30 opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-300 z-[60] shadow-[0_20px_50px_rgba(0,0,0,1)]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={cn(
                    "w-full text-left px-6 py-5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-all border-b border-foreground/10 last:border-none",
                    i18n.language === lang.code && "bg-accent/20 text-accent border-l-4 border-l-accent"
                  )}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block h-8 w-px bg-border opacity-20" />

          {/* Github Link (Desktop) */}
          <a
            href="https://github.com/diaz1414"
            target="_blank"
            rel="noreferrer"
            className="hidden md:block p-2 hover:bg-accent/10 transition-colors text-foreground"
          >
            <SiGithub className="w-5 h-5" />
          </a>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-foreground"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-6 py-8 space-y-8">
              <div className="flex flex-col gap-6 text-xs font-mono font-bold uppercase tracking-widest">
                {navLinks.map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="hover:text-accent">
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="h-px bg-border opacity-10" />

              <div className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-40">Language</span>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={cn(
                        "text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest border border-border/20",
                        i18n.language === lang.code && "bg-accent text-white border-accent"
                      )}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
