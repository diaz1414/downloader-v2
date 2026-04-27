"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, SkipForward, SkipBack, Volume2, X, Radio } from "lucide-react"

const TRACKS = [
  { id: 1, title: "Old Songs", artist: "LoFi Remix", url: "/music/old%20song%201.mp3" },
  { id: 2, title: "Old Songs 2", artist: "LoFi Remix", url: "/music/old%20song%202.mp3" },
]

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // State untuk bar visualizer (16 bar agar lebih jelas gerakannya)
  const [vuLevel, setVuLevel] = useState<number[]>(new Array(16).fill(5))
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)

  const currentTrack = TRACKS[currentTrackIndex]

  // Inisialisasi Audio API
  const initAudioContext = () => {
    if (!audioContextRef.current && audioRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContextClass()
      const analyser = ctx.createAnalyser()
      
      const source = ctx.createMediaElementSource(audioRef.current)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      
      analyser.fftSize = 256 
      analyser.smoothingTimeConstant = 0.5 // Sangat responsif
      
      audioContextRef.current = ctx
      analyserRef.current = analyser
      sourceRef.current = source
    }
    
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume()
    }
  }

  // Loop Visualizer
  const updateVisualizer = () => {
    if (analyserRef.current && isPlaying) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      
      // Ambil 16 titik sample dengan pemetaan spektrum yang luas
      const newLevels = []
      const binCount = analyserRef.current.frequencyBinCount
      
      for (let i = 0; i < 16; i++) {
        // Distribusi frekuensi: lebih fokus ke bass dan mid yang biasanya lebih aktif
        const index = Math.floor(Math.pow(i / 15, 1.5) * (binCount * 0.6)) 
        const value = dataArray[index] || 0
        
        // Multiplier agar gerakan lebih tinggi (terutama untuk treble di bar kanan)
        const multiplier = i < 4 ? 1.4 : (i < 10 ? 1.8 : 2.2)
        const level = Math.min(100, (value / 255) * 100 * multiplier)
        
        newLevels.push(Math.max(10, level))
      }
      
      setVuLevel(newLevels)
      animationRef.current = requestAnimationFrame(updateVisualizer)
    }
  }

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateVisualizer)
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      setVuLevel(new Array(16).fill(5))
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying])

  const togglePlay = () => {
    if (!audioRef.current) return
    initAudioContext()

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(console.error)
    }
    setIsPlaying(!isPlaying)
  }

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length)
  }

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length)
  }

  // Volume Sinkronisasi
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-mono">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            layoutId="player"
            onClick={() => setIsOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-hindia-maroon text-hindia-gold shadow-[0_0_20px_rgba(128,0,0,0.5)] border-2 border-hindia-gold/30 hover:scale-110 transition-transform"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Radio className={isPlaying ? "animate-pulse" : ""} size={28} />
          </motion.button>
        ) : (
          <motion.div
            layoutId="player"
            className="w-80 overflow-hidden rounded-2xl border-2 border-hindia-gold/40 bg-black/90 p-4 shadow-[0_0_60px_rgba(0,0,0,1)] backdrop-blur-xl"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
          >
            {/* Header / Display Panel */}
            <div className="mb-4 flex items-center justify-between border-b border-hindia-gold/10 pb-2 text-[9px] uppercase tracking-[0.2em] text-hindia-gold/50">
              <span className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isPlaying ? "bg-green-500 shadow-[0_0_12px_#22c55e]" : "bg-red-950"}`} />
                Analog Frequency Meter
              </span>
              <button onClick={() => setIsOpen(false)} className="hover:text-hindia-gold transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* OPTIMIZED VISUALIZER AREA */}
            <div className="relative mb-6 flex h-24 items-end justify-center gap-[3px] rounded-lg bg-zinc-950 p-3 shadow-inner border border-hindia-gold/5 overflow-hidden">
              {/* Scanline/Grid Effect */}
              <div className="absolute inset-0 z-10 pointer-events-none opacity-10 bg-[linear-gradient(rgba(212,175,55,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.1)_1px,transparent_1px)] bg-[size:4px_4px]" />
              
              {vuLevel.map((level, i) => (
                <motion.div
                  key={i}
                  className="w-full bg-gradient-to-t from-hindia-maroon via-hindia-gold to-white rounded-t-sm"
                  animate={{ 
                    height: `${level}%`,
                    boxShadow: level > 40 ? `0 0 15px rgba(212, 175, 55, ${level/120})` : "none",
                    filter: level > 70 ? "brightness(1.2)" : "brightness(1)"
                  }}
                  transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                />
              ))}
            </div>

            {/* Track Info Panel */}
            <div className="mb-6 space-y-1">
              <motion.h3 
                className="truncate font-serif text-xl font-bold text-hindia-gold text-center"
                animate={isPlaying ? { opacity: [0.8, 1, 0.8] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {currentTrack.title}
              </motion.h3>
              <p className="text-center text-[10px] uppercase tracking-widest text-hindia-off-white/40">{currentTrack.artist}</p>
            </div>

            {/* Studio Controls */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <button onClick={prevTrack} className="text-hindia-gold/40 hover:text-hindia-gold active:scale-75 transition-all">
                <SkipBack size={22} fill="currentColor" />
              </button>

              <button
                onClick={togglePlay}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-hindia-gold text-hindia-black hover:scale-105 active:scale-90 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>

              <button onClick={nextTrack} className="text-hindia-gold/40 hover:text-hindia-gold active:scale-75 transition-all">
                <SkipForward size={22} fill="currentColor" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 px-2">
              <Volume2 size={14} className="text-hindia-gold/50" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-hindia-gold/20 accent-hindia-gold"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={nextTrack}
        crossOrigin="anonymous"
      />
    </div>
  )
}
