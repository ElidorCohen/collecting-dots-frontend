import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Collecting Dots - Electronic Music Label",
  description: "Independent electronic music label curated by Omri. Discover cutting-edge tracks from emerging and established artists.",
  keywords: "electronic music, music label, house music, techno, ambient, collecting dots, omri",
  authors: [{ name: "Collecting Dots" }],
  creator: "Collecting Dots",
  publisher: "Collecting Dots",
  openGraph: {
    title: "Collecting Dots - Electronic Music Label",
    description: "Independent electronic music label curated by Omri. Discover cutting-edge tracks from emerging and established artists.",
    url: "https://collectingdots.com",
    siteName: "Collecting Dots",
    images: [
      {
        url: "/assets/icon.png",
        width: 1200,
        height: 630,
        alt: "Collecting Dots Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Collecting Dots - Electronic Music Label",
    description: "Independent electronic music label curated by Omri. Discover cutting-edge tracks from emerging and established artists.",
    images: ["/assets/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
