import type { Metadata } from "next"
import { Inter, Outfit } from 'next/font/google'
import localFont from 'next/font/local'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
})

// Small labels: a light geometric face close to the Collecting Dots letters, easier to read small than a monospace
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-label",
  weight: ["400", "500"],
  display: 'swap',
})

const bnBobbieSans = localFont({
  src: '../public/fonts/BNBobbieSans.otf',
  variable: '--font-bn-bobbie-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Collecting Dots - Independent Music Record Label",
  description: "Independent music record label curated by OMRI. Discover cutting-edge tracks from emerging and established artists.",
  keywords: "electronic music, music label, house music, techno, ambient, collecting dots, omri",
  authors: [{ name: "Collecting Dots" }],
  creator: "Collecting Dots",
  publisher: "Collecting Dots",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/icon.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Collecting Dots - Independent Music Record Label",
    description: "Independent music record label curated by OMRI. Discover cutting-edge tracks from emerging and established artists.",
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
    title: "Collecting Dots - Independent Music Record Label",
    description: "Independent music record label curated by OMRI. Discover cutting-edge tracks from emerging and established artists.",
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
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${bnBobbieSans.variable} font-sans antialiased`}>
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
