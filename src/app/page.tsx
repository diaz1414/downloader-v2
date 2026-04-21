"use client"

import { useState } from "react"
import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { FeatureGrid } from "@/components/FeatureGrid"
import { TutorialSection } from "@/components/TutorialSection"
import { Footer } from "@/components/Footer"
import { ResultSection } from "@/components/ResultSection"
import { motion, AnimatePresence } from "framer-motion"

export default function HomePage() {
  const [resultData, setResultData] = useState<any>(null)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        <Hero onResult={setResultData} />
        
        <AnimatePresence>
          {resultData && (
            <ResultSection data={resultData} />
          )}
        </AnimatePresence>

        <FeatureGrid />
        <TutorialSection />
      </main>

      <Footer />
    </div>
  )
}
