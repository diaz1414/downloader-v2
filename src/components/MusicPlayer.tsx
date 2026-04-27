"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, X, ChevronUp, Radio } from "lucide-react"

// Daftar lagu - USER silakan masukkan file .mp3 ke /public/music/ dengan nama yang sama
const TRACKS = [
  { id: 1, title: "Vintage Soul", artist: "Analog Dreams", url: "/music/track1.mp3" },
  { id: 2, title: "Midnight Radio", artist: "Hindia Vibes", url: "/music/track2.mp3" },
  { id: 3, title: "Lofi Memories", artist: "Diaz Studio", url: "/music/track3.mp3" },
]

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [vuLevel, setVuLevel] = useState([40, 60, 30, 70, 50])

  const currentTrack = TRACKS[currentTrackIndex]

  // Simulasi VU Meter
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setVuLevel(vuLevel.map(() => Math.floor(Math.random() * 80) + 10))
      }, 150)
      return () => clearInterval(interval)
    } else {
      setVuLevel([5, 5, 5, 5, 5])
    }
  }, [isPlaying])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {
        console.warn("Audio playback failed. Make sure files exist in /public/music/")
      })
    }
    setIsPlaying(!isPlaying)
  }

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length)
    setIsPlaying(false)
  }

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length)
    setIsPlaying(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-mono">
      <AnimatePresence>
        {!isOpen ? (
          // Collapsed Trigger
          <motion.button
            layoutId="player"
            onClick={() => setIsOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-hindia-maroon text-hindia-gold shadow-2xl border-2 border-hindia-gold/30 hover:scale-110 transition-transform"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Radio className={isPlaying ? "animate-pulse" : ""} size={28} />
          </motion.button>
        ) : (
          // Expanded Player UI
          <motion.div
            layoutId="player"
            className="w-80 overflow-hidden rounded-xl border-2 border-hindia-gold/40 bg-hindia-black p-4 shadow-[0_0_50px_rgba(128,0,0,0.3)] backdrop-blur-md"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
          >
            {/* Header / Analog Display */}
            <div className="mb-4 flex items-center justify-between border-b border-hindia-gold/20 pb-2 text-[10px] uppercase tracking-widest text-hindia-gold/60">
              <span className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-900"}`} />
                Analog Signal
              </span>
              <button onClick={() => setIsOpen(false)} className="hover:text-hindia-gold">
                <X size={14} />
              </button>
            </div>

            {/* VU Meter Area */}
            <div className="mb-6 flex h-16 items-end justify-center gap-1.5 rounded bg-zinc-900/50 p-2 border border-hindia-gold/10">
              {vuLevel.map((level, i) => (
                <motion.div
                  key={i}
                  className="w-4 bg-gradient-to-t from-hindia-maroon to-hindia-gold"
                  animate={{ height: `${level}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              ))}
            </div>

            {/* Track Info */}
            <div className="mb-6 text-center">
              <h3 className="truncate font-serif text-lg font-bold text-hindia-gold">{currentTrack.title}</h3>
              <p className="text-xs text-hindia-off-white/60">{currentTrack.artist}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 mb-4">
              <button onClick={prevTrack} className="text-hindia-gold/70 hover:text-hindia-gold active:scale-90 transition-all">
                <SkipBack size={24} fill="currentColor" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-hindia-gold text-hindia-black hover:bg-white active:scale-95 transition-all shadow-lg"
              >
                {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
              </button>

              <button onClick={nextTrack} className="text-hindia-gold/70 hover:text-hindia-gold active:scale-90 transition-all">
                <SkipForward size={24} fill="currentColor" />
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
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setVolume(val)
                  if (audioRef.current) audioRef.current.volume = val
                }}
                className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-hindia-gold/20 accent-hindia-gold"
              />
            </div>

            {/* Hidden Audio Element */}
            <audio 
              ref={audioRef}
              src={currentTrack.url}
              onEnded={nextTrack}
              autoPlay={false}
            />

            {/* Decoration */}
            <div className="mt-4 flex justify-center gap-1 opacity-20">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-0.5 w-12 bg-hindia-gold" />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
