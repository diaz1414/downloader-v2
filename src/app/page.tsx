"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { ResultSection } from "@/components/ResultSection"
import { FeatureGrid } from "@/components/FeatureGrid"
import { TutorialSection } from "@/components/TutorialSection"

export default function Home() {
  const [result, setResult] = useState<any>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [result])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <Hero onResult={(data) => setResult(data)} />

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="result"
            ref={resultRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="scroll-mt-24"
          >
            <ResultSection data={result} />
          </motion.div>
        )}
      </AnimatePresence>

      <FeatureGrid />

      <TutorialSection />

      {/* Professional Minimalist Footer */}
      <footer className="py-20 px-6 border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="space-y-6">
            <h2 className="text-4xl font-serif">DIAW DOWNLOADER V2</h2>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 max-w-xs leading-loose">
              The ultimate tool for high-quality social media content extraction. <br />
              Safe, fast, and private. No tracking. No logs.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-[10px] font-mono font-bold uppercase tracking-widest">
            <a href="/privacy" className="hover:text-accent transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-accent transition-colors">Terms</a>
            <a href="/contact" className="hover:text-accent transition-colors">Support</a>
            <span className="opacity-20">© 2026 DIAW DOWNLOADER V2</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
