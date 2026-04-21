"use client"

import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState, useRef } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const rippleRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  const toggleTheme = (e: React.MouseEvent) => {
    if (isAnimating) return

    const x = e.clientX
    const y = e.clientY

    // Set ripple position via CSS variables
    document.documentElement.style.setProperty("--ripple-x", `${x}px`)
    document.documentElement.style.setProperty("--ripple-y", `${y}px`)

    setIsAnimating(true)
    
    // Switch theme halfway through animation
    setTimeout(() => {
      setTheme(theme === "dark" ? "light" : "dark")
    }, 400)

    // Reset animation state
    setTimeout(() => {
      setIsAnimating(false)
    }, 800)
  }

  if (!mounted) return null

  return (
    <>
      {/* The Ripple Element */}
      <div 
        className={`theme-ripple ${isAnimating ? "active" : ""}`} 
        style={{ 
          backgroundColor: theme === "dark" ? "#f5f5f5" : "#0a0a0a" 
        }} 
      />

      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative p-2 rounded-none border border-border bg-background/50 backdrop-blur-md overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {theme === "dark" ? (
            <motion.div
              key="moon"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              <Moon className="w-5 h-5 text-hindia-gold" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              <Sun className="w-5 h-5 text-hindia-maroon" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}
