"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import Link from "next/link"
import { Shield, Zap, Lock, Code, User, Terminal } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-24">

          {/* Header Section */}
          <section className="space-y-8">
            <h1 className="text-5xl md:text-8xl font-serif tracking-tighter leading-none uppercase">
              Beyond <br />
              Extraction.
            </h1>
            <div className="h-px bg-border opacity-20 w-full" />
            <p className="text-sm md:text-base font-mono uppercase tracking-[0.3em] opacity-60 leading-relaxed max-w-2xl">
              DIAW DOWNLOADER V2 is a professional-grade digital media protocol designed for the seamless extraction and archiving of social media content. Built with privacy and speed as its core pillars.
            </p>
          </section>

          {/* Detailed Content Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
            <div className="space-y-6">
              <h2 className="text-xs font-mono uppercase tracking-[0.5em] text-accent">Philosophy</h2>
              <div className="space-y-4 text-sm font-mono opacity-50 leading-loose">
                <p>
                  In an era where digital content is transient, we believe in providing tools that allow users to preserve history. DIAW DOWNLOADER is not just a tool; it's a bridge between the chaotic flow of social media and your personal archive.
                </p>
                <p>
                  We prioritize the "Zero-Tracking" protocol. Unlike mainstream downloaders, we do not log your requests, store your links, or track your identity. Your extraction is your business.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xs font-mono uppercase tracking-[0.5em] text-accent">Technical Stack</h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: Zap, text: "High-Speed Extraction API" },
                  { icon: Shield, text: "SSL Encrypted Data Stream" },
                  { icon: Lock, text: "No Data Retention Policy" },
                  { icon: Code, text: "Next.js 15 Framework" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-border/10 bg-background/50">
                    <item.icon className="w-4 h-4 opacity-40" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Developer Section */}
          <section className="doc-container bg-accent/5 space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-serif">Developer.</h2>
              <p className="text-xs font-mono uppercase tracking-widest opacity-40">System Design & Development</p>
            </div>

            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="w-48 h-48 border border-border relative group overflow-hidden bg-border/10">
                <img
                  src="/images/developer.jpg"
                  alt="Lead Developer"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif">_Ferdiazrip</h3>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-accent">Lead System Developer</p>
                </div>
                <p className="text-xs font-mono opacity-50 leading-loose max-w-lg">
                  Specializing in high-performance web architectures and seamless user experiences. Driven by the intersection of retro aesthetics and modern technology.
                </p>
                <div className="flex justify-center md:justify-start gap-6">
                  <a href="https://github.com/diaz1414" target="_blank" className="text-[10px] font-mono uppercase tracking-widest hover:text-accent underline underline-offset-8">GitHub</a>
                  <a href="https://diaww.my.id" target="_blank" className="text-[10px] font-mono uppercase tracking-widest hover:text-accent underline underline-offset-8">Portfolio</a>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Call to Action */}
          <section className="text-center space-y-8 py-20 border-t border-border/20">
            <h2 className="text-2xl md:text-4xl font-serif">Ready to Extract?</h2>
            <Link href="/" className="inline-flex items-center gap-4 px-10 py-5 bg-foreground text-background font-mono text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-accent hover:text-white transition-all">
              Initialize Downloader <Terminal className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </main>

      {/* Footer Copy */}
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
            <Link href="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-accent transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-accent transition-colors">Support</Link>
            <span className="opacity-20">© 2026 DIAW DOWNLOADER V2</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
