"use client"

import { motion, Variants } from "framer-motion"
import { useTranslation } from "react-i18next"
import { SmartSearchBar } from "./SmartSearchBar"

const staggeredVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.8,
      ease: [0.215, 0.61, 0.355, 1] as const,
    },
  }),
}

export function Hero({ onResult }: { onResult: (data: any) => void }) {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 md:px-6 overflow-hidden">
      {/* Background Video Layer */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-40 scale-105"
        >
          <source src="/videos/bg.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10" />
        <div className="absolute inset-0 bg-black/50 z-10" />
      </div>

      <div className="max-w-6xl mx-auto text-center space-y-8 md:space-y-12 relative z-20 pt-20">

        {/* Editorial Title */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-7xl font-serif tracking-tight leading-[1.1] uppercase">
            {t("hero.title").split("//")[0]} // <br className="md:hidden" />
            <span className="opacity-50">{t("hero.title").split("//")[1]?.split(" ")[1]}</span> <br />
            {t("hero.title").split(" ").slice(-2).join(" ")}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xs md:text-sm font-mono uppercase tracking-[0.2em] opacity-60 max-w-2xl mx-auto leading-relaxed"
          >
            {t("hero.subtitle")}
          </motion.p>
        </div>

        {/* Search Field */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="space-y-6"
        >
          <SmartSearchBar onResult={onResult} />

          {/* Telegram Bot Notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            className="flex justify-center"
          >
            <a
              href="https://t.me/diawwdownloadbot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full backdrop-blur-md transition-all group"
            >
              <div className="p-1.5 bg-[#24A1DE]/20 rounded-full">
                <svg className="w-4 h-4 text-[#24A1DE]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.441-.168.575-.532 1.031-.97 1.031-.438 0-.845-.456-1.168-.781-.323-.325-1.545-1.468-2.062-1.937-.517-.469-.875-.75-.875-.75s.312-.25.562-.437c.25-.187 2.062-1.875 2.5-2.25.438-.375.625-.625.625-.625s-.125-.125-.437 0c-.312.125-2.875 1.75-3.375 2.062-.5.312-.875.312-1.125.187-.25-.125-1.312-.437-1.875-.625-.562-.187-.875-.312-.875-.562 0-.25.375-.437 1.125-.687 2.187-.875 5.562-2.187 6.187-2.312.625-.125 1.187.062 1.375.25.187.188.187.562.062.937z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 leading-none mb-1">Available on</p>
                <p className="text-xs font-bold font-mono tracking-wider uppercase group-hover:text-accent transition-colors">Telegram Bot @DIAW_BOT</p>
              </div>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
