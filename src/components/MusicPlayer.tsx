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

  // State untuk bar visualizer (8 bar agar lebih padat)
  const [vuLevel, setVuLevel] = useState([5, 5, 5, 5, 5, 5, 5, 5])

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationRef = useRef<number>()

  const currentTrack = TRACKS[currentTrackIndex]

  // Inisialisasi Audio API saat pertama kali Play (harus ada interaksi user)
  const initAudioContext = () => {
    if (!audioContextRef.current && audioRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContextClass()
      const analyser = ctx.createAnalyser()

      // Hubungkan audio element ke analyser
      const source = ctx.createMediaElementSource(audioRef.current)
      source.connect(analyser)
      analyser.connect(ctx.destination)

      analyser.fftSize = 64 // Resolusi bar

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

      // Ambil beberapa sample dari spectrum (bass ke treble)
      const newLevels = [
        dataArray[2],  // Bass
        dataArray[4],
        dataArray[7],  // Mid
        dataArray[10],
        dataArray[13],
        dataArray[16], // Treble
        dataArray[20],
        dataArray[25],
      ].map(v => Math.max(5, (v / 255) * 100)) // Normalize ke 0-100%

      setVuLevel(newLevels)
      animationRef.current = requestAnimationFrame(updateVisualizer)
    }
  }

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateVisualizer)
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      setVuLevel([5, 5, 5, 5, 5, 5, 5, 5])
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying])

  const togglePlay = () => {
    if (!audioRef.current) return
    initAudioContext() // Pastikan context jalan

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
            className="flex h-14 w-14 items-center justify-center rounded-full bg-hindia-maroon text-hindia-gold shadow-2xl border-2 border-hindia-gold/30 hover:scale-110 transition-transform"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Radio className={isPlaying ? "animate-pulse" : ""} size={28} />
          </motion.button>
        ) : (
          <motion.div
            layoutId="player"
            className="w-80 overflow-hidden rounded-xl border-2 border-hindia-gold/40 bg-hindia-black p-4 shadow-[0_0_50px_rgba(128,0,0,0.3)] backdrop-blur-md"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-hindia-gold/20 pb-2 text-[10px] uppercase tracking-widest text-hindia-gold/60">
              <span className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-900"}`} />
                REAL ANALOG SIGNAL
              </span>
              <button onClick={() => setIsOpen(false)} className="hover:text-hindia-gold">
                <X size={14} />
              </button>
            </div>

            {/* REAL VU Meter Area */}
            <div className="mb-6 flex h-20 items-end justify-center gap-1 rounded bg-zinc-900/80 p-3 border border-hindia-gold/10">
              {vuLevel.map((level, i) => (
                <motion.div
                  key={i}
                  className="w-full bg-gradient-to-t from-hindia-maroon via-hindia-gold to-yellow-200 rounded-t-sm"
                  animate={{ height: `${level}%` }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
