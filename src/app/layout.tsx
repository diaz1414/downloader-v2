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
  metadataBase: new URL("https://downloaderv2.diaww.my.id"), // Ganti dengan domain produksi Anda nanti
  title: {
    default: "DIAW DOWNLOADER V2 | Professional Media Extraction",
    template: "%s | DIAW DOWNLOADER V2"
  },
  description: "The ultimate tool for high-quality social media content extraction. Safe, fast, and private. Supporting TikTok, Instagram, YouTube, and more with zero tracking.",
  keywords: ["downloader", "video downloader", "social media downloader", "tiktok downloader", "instagram downloader", "youtube downloader", "media extraction", "privacy focused"],
  authors: [{ name: "_Ferdiazrip", url: "https://downloaderv2.diaww.my.id" }],
  creator: "_Ferdiazrip",
  publisher: "DIAW STUDIO",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/images/logo.png?v=2" },
      { url: "/images/logo.png?v=2", sizes: "32x32", type: "image/png" }
    ],
    apple: [
      { url: "/images/logo.png?v=2" }
    ],
    shortcut: ["/images/logo.png?v=2"]
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://downloaderv2.diaww.my.id",
    siteName: "DIAW DOWNLOADER V2",
    title: "DIAW DOWNLOADER V2 | Professional Media Extraction",
    description: "High-quality social media content extraction. Safe, fast, and private.",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "DIAW DOWNLOADER V2 Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DIAW DOWNLOADER V2",
    description: "Professional Social Media Downloader",
    creator: "@_ferdiazrip",
    images: ["/images/logo.png"],
  },
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
