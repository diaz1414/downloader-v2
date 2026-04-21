import type { Metadata } from "next"
import { Fraunces, JetBrains_Mono } from "next/font/google"
import "@/app/globals.css"
import { I18nProvider } from "@/components/I18nProvider"

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"],
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "HINDIA | Social Media Downloader",
  description: "A minimalist document-style media extraction tool.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${serif.variable} ${mono.variable} antialiased`}>
        <I18nProvider>
          {/* Texture Overlay */}
          <div className="grain-overlay" />
          
          {/* Main Content */}
          <main className="relative z-10 min-h-screen">
            {children}
          </main>
        </I18nProvider>
      </body>
    </html>
  )
}
