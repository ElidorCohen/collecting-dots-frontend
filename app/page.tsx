"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Music, Mail, Instagram, FileAudio, X, Users, Headphones, Star } from "lucide-react"
import ReleasesCarousel from "@/components/releases-carousel"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import HorizontalSetsCarousel from "@/components/horizontal-sets-carousel"

// Custom icons for music platforms
const BeatportIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 17.568c-.184.184-.48.184-.664 0L12 12.664l-4.904 4.904c-.184.184-.48.184-.664 0-.184-.184-.184-.48 0-.664L11.336 12 6.432 7.096c-.184-.184-.184-.48 0-.664.184-.184.48-.184.664 0L12 11.336l4.904-4.904c.184-.184.48-.184.664 0 .184.184.184.48 0 .664L12.664 12l4.904 4.904c.184.184.184.48 0 .664z" />
  </svg>
)

const AppleMusicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.146-.525-.01-1.52-.01-2.948-.01h-6.375c-1.428 0-2.423 0-2.948.01-.526.011-1.047-.053-1.564.146-.673.121-1.303.353-1.877.727C1.302 1.624.557 2.624.24 3.934.065 4.654 0 5.386 0 6.124v11.752c0 .738.065 1.47.24 2.19.317 1.31 1.062 2.31 2.18 3.043.574.374 1.204.606 1.877.727.517.093 1.038.135 1.564.146.525.01 1.52.01 2.948.01h6.375c1.428 0 2.423 0 2.948-.01.526-.011 1.047-.053 1.564-.146.673-.121 1.303-.353 1.877-.727 1.118-.733 1.863-1.733 2.18-3.043.175-.72.24-1.452.24-2.19V6.124zm-7.78 6.778c-.309 1.467-1.297 3.146-2.638 3.168-1.075.018-1.428-.63-2.668-.63-1.24 0-1.626.612-2.65.648-1.297.037-2.4-1.8-2.714-3.264-.639-2.97.112-6.31 2.034-7.897.94-.776 2.48-.692 3.113.175.525.724.875 1.193.875 1.193s.35-.469.875-1.193c.633-.867 2.173-.951 3.113-.175.663.547 1.201 1.387 1.494 2.318.096.306-.48.63-.834.657z" />
  </svg>
)

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
)

export default function CollectingDotsLabel() {
  // Form state
  const [formData, setFormData] = useState({
    trackTitle: "",
    artistName: "",
    fullName: "",
    email: "",
    instagram: "",
    beatport: "",
    facebook: "",
    x: "",
    audioFile: null as File | null,
  })

  // Validation states
  const [errors, setErrors] = useState({
    email: "",
    audioFile: "",
  })

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.trackTitle.trim() !== "" &&
      formData.artistName.trim() !== "" &&
      formData.fullName.trim() !== "" &&
      formData.email.trim() !== "" &&
      validateEmail(formData.email) &&
      formData.instagram.trim() !== "" &&
      formData.audioFile !== null &&
      errors.email === "" &&
      errors.audioFile === ""
    )
  }

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear email error when user starts typing
    if (field === "email") {
      if (value.trim() === "") {
        setErrors((prev) => ({ ...prev, email: "" }))
      } else if (!validateEmail(value)) {
        setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }))
      } else {
        setErrors((prev) => ({ ...prev, email: "" }))
      }
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileType = file.type
      const validTypes = ["audio/mpeg", "audio/wav", "audio/mp3"]
      const validExtensions = [".mp3", ".wav"]

      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))

      if (validTypes.includes(fileType) || validExtensions.includes(fileExtension)) {
        setFormData((prev) => ({ ...prev, audioFile: file }))
        setErrors((prev) => ({ ...prev, audioFile: "" }))
      } else {
        setErrors((prev) => ({ ...prev, audioFile: "Please upload an MP3 or WAV file only" }))
        event.target.value = "" // Clear the input
      }
    }
  }

  // Remove uploaded file
  const removeFile = () => {
    setFormData((prev) => ({ ...prev, audioFile: null }))
    setErrors((prev) => ({ ...prev, audioFile: "" }))
  }

  // Handle form submission
  const handleSubmit = () => {
    if (isFormValid()) {
      // Placeholder for future API call
      console.log("Demo submission data:", formData)
      // TODO: Implement API call here

      alert("Demo submitted successfully! We'll get back to you within 48 hours.")

      // Reset form
      setFormData({
        trackTitle: "",
        artistName: "",
        fullName: "",
        email: "",
        instagram: "",
        beatport: "",
        facebook: "",
        x: "",
        audioFile: null,
      })
      setErrors({ email: "", audioFile: "" })
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg className="h-8 w-auto" viewBox="0 0 730.53 150.04" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <style>{`.cls-1 { fill: #fff; }`}</style>
                </defs>
                <g>
                  <path
                    className="cls-1"
                    d="M193.08,18.94c8.27,0,15.15,6.36,16.8,13.75h18.28c-1.56-16.84-16.44-29.84-35.08-29.84-20.57,0-36.09,14.5-36.09,34.23s15.15,34.33,35.72,34.33c17.91,0,32.14-11.97,35.26-28.25h-18.73c-2.29,7.29-8.72,11.97-16.53,11.97-10.1,0-17.54-7.67-17.54-18.05s7.8-18.15,17.91-18.15"
                  />
                  <path
                    className="cls-1"
                    d="M267.93,55.04c-10.1,0-17.72-7.58-17.72-17.96s7.62-17.87,17.72-17.87,17.63,7.58,17.63,17.87-7.62,17.96-17.63,17.96M267.93,2.85c-20.57,0-35.91,14.59-35.91,34.24s15.43,34.33,35.91,34.33,35.82-14.69,35.82-34.33-15.24-34.24-35.82-34.24"
                  />
                  <polygon
                    className="cls-1"
                    points="347.22 54.76 327.39 54.76 327.39 4.35 309.76 4.35 309.76 69.82 347.22 69.82 347.22 54.76"
                  />
                  <polygon
                    className="cls-1"
                    points="391.07 54.76 371.23 54.76 371.23 4.35 353.6 4.35 353.6 69.82 391.07 69.82 391.07 54.76"
                  />
                  <polygon
                    className="cls-1"
                    points="397.44 69.82 435.27 69.82 435.27 55.23 415.07 55.23 415.07 44.66 433.71 44.66 433.71 30.07 415.07 30.07 415.07 19.4 435.27 19.4 435.27 4.34 397.44 4.34 397.44 69.82"
                  />
                  <path
                    className="cls-1"
                    d="M475.64,18.94c8.27,0,15.15,6.36,16.81,13.75h18.27c-1.56-16.84-16.44-29.84-35.08-29.84-20.57,0-36.09,14.5-36.09,34.23s15.15,34.33,35.72,34.33c17.91,0,32.14-11.97,35.26-28.25h-18.73c-2.3,7.29-8.72,11.97-16.53,11.97-10.1,0-17.54-7.67-17.54-18.05s7.81-18.15,17.91-18.15"
                  />
                  <polygon
                    className="cls-1"
                    points="512.68 18.94 525.72 18.94 525.72 69.82 543.35 69.82 543.35 18.94 556.39 18.94 556.39 4.35 512.68 4.35 512.68 18.94"
                  />
                  <rect className="cls-1" x="565.18" y="4.35" width="17.63" height="65.48" />
                  <polygon
                    className="cls-1"
                    points="640.88 41.37 638.91 41.47 610.19 4.37 592.3 4.37 592.3 69.85 609.84 69.85 609.84 33.78 611.99 33.78 639.61 69.85 658.42 69.85 658.42 4.37 640.88 4.37 640.88 41.37"
                  />
                  <path
                    className="cls-1"
                    d="M697.66,33.49v14.22h13.04c-1.01,6.45-6.52,9.17-12.4,9.17-10.1,0-15.06-9.17-15.06-19.55s4.68-19.08,15.06-19.08c6.7,0,11.3,4.77,13.78,9.82l16.07-7.48c-5.33-10.29-14.6-17.49-29.66-17.49-20.3,0-33.43,14.96-33.43,34.23,0,19.74,12.58,34.33,33.34,34.33,19.1,0,31.96-13.56,32.14-30.68v-7.48h-32.88Z"
                  />
                  <path
                    className="cls-1"
                    d="M267.93,133.3c-10.1,0-17.72-7.58-17.72-17.96s7.62-17.87,17.72-17.87,17.63,7.58,17.63,17.87-7.62,17.96-17.63,17.96M267.93,81.11c-20.57,0-35.91,14.59-35.91,34.24s15.43,34.33,35.91,34.33,35.82-14.69,35.82-34.33-15.24-34.24-35.82-34.24"
                  />
                  <polygon
                    className="cls-1"
                    points="305.44 97.19 318.48 97.19 318.48 148.08 336.11 148.08 336.11 97.19 349.15 97.19 349.15 82.6 305.44 82.6 305.44 97.19"
                  />
                  <path
                    className="cls-1"
                    d="M373.32,100.09c0-3.09,2.66-4.86,5.97-4.86,4.13,0,8.45,2.71,12.3,5.8l7.44-13.19c-4.59-3.27-11.85-6.55-21.21-6.55-13.04,0-23.33,6.73-23.42,21.42-.09,21.51,26.08,14.12,26.08,25.26,0,4.02-3.31,6.08-7.07,6.08-5.33,0-11.2-3.55-15.79-8.61l-7.99,14.22c4.32,4.4,14.6,9.82,25.16,9.82,11.66,0,24.15-7.58,24.34-22.64.28-22.54-25.8-16.74-25.8-26.75"
                  />
                  <path
                    className="cls-1"
                    d="M115.76,97.48c10.01,0,17.63,7.58,17.63,17.87s-7.62,17.96-17.63,17.96-17.72-7.58-17.72-17.96,7.62-17.87,17.72-17.87M0,150.04h150.04V0H0v150.04Z"
                  />
                  <path
                    className="cls-1"
                    d="M192.66,133.39h-14.7v-36.39h14.7c10.01,0,18.11,7.55,18.11,17.83s-7.74,18.55-18.11,18.55M192.57,82.6h-31.29v65.48h32.11c20.66,0,34.48-13.1,34.48-33.21s-14.83-32.27-35.3-32.27"
                  />
                </g>
              </svg>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#releases" className="text-gray-300 hover:text-white transition-colors font-medium">
                Releases
              </a>
              <a href="#sounds" className="text-gray-300 hover:text-white transition-colors font-medium">
                Sounds
              </a>
              <a href="#sets" className="text-gray-300 hover:text-white transition-colors font-medium">
                Sets
              </a>
              <a href="#merchandise" className="text-gray-300 hover:text-white transition-colors font-medium">
                Merchandise
              </a>
              <a href="#demo-submission" className="text-gray-300 hover:text-white transition-colors font-medium">
                Submit Demo
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Placeholder */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
          style={{
            backgroundImage: `url('/placeholder.svg?height=1080&width=1920')`,
          }}
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-8">
            <Music className="w-16 h-16 mx-auto mb-6 text-white" />
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-black mb-6 tracking-tight">
            collecting
            <span className="block text-gray-300">dots</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            A music label curated by <span className="text-white font-medium">Omri.</span>
            <br />
            Connecting the dots between sound and soul
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 font-medium"
            onClick={() => document.getElementById("demo-submission")?.scrollIntoView({ behavior: "smooth" })}
          >
            Demo Submission
          </Button>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Connecting Artists,
                <br />
                <span className="gradient-text">Curating Sound</span>
              </h2>
              <p className="text-lg text-gray-300 mb-8 font-light leading-relaxed">
                Founded in 2018, Collecting Dots has become a beacon for innovative electronic music. We bridge the gap
                between underground talent and global audiences, fostering a community where creativity knows no bounds.
              </p>
              <div className="grid grid-cols-2 gap-8">
                {[
                  { label: "Artists", value: "15+", icon: Users },
                  { label: "Releases", value: "20+", icon: Music },
                  { label: "Monthly Listeners", value: "110K", icon: Headphones },
                  { label: "Rating", value: "5.0", icon: Star },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                    <div className="font-display text-3xl font-bold mb-1 font-mono">{stat.value}</div>
                    <div className="text-gray-400 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden glass">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Lightbox%20design%202-tLk2nI9k00LkPEO5mMmfreb7XvAS5e.png"
                    alt="Collecting Dots Brand Pattern"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Releases Carousel Section */}
      <section id="releases" className="py-24 px-4 bg-gradient-to-b from-black to-gray-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">LATEST RELEASES</h2>
            <p className="text-gray-300 text-lg font-light">
              Discover the dots we've connected in our musical constellation
            </p>
          </div>
          <ReleasesCarousel />
        </div>
      </section>

      {/* Collecting Dots Sounds Section */}
      <section id="sounds" className="py-24 px-4 bg-gray-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold mb-4 tracking-tight text-4xl">COLLECTING DOTS SOUNDS </h2>
            <p className="text-gray-300 text-lg font-light">
              Premium sound packs crafted by Omri for producers worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Melodic Horizons Vol. 1",
                description: "Deep melodic loops and atmospheric textures perfect for progressive house productions",
                genre: "Melodic House",
                price: "$24.99",
                samples: "120+ Samples",
              },
              {
                name: "Underground Rhythms",
                description: "Raw percussion and driving basslines inspired by Berlin's underground scene",
                genre: "Tech House",
                price: "$19.99",
                samples: "85+ Samples",
              },
              {
                name: "Cinematic Emotions",
                description: "Orchestral elements and emotional chord progressions for cinematic electronica",
                genre: "Cinematic",
                price: "$29.99",
                samples: "95+ Samples",
              },
            ].map((pack, index) => (
              <Card
                key={index}
                className="bg-gray-900/80 border-gray-800/50 group hover:border-gray-700/50 transition-all duration-500 backdrop-blur-sm"
              >
                <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="font-mono text-6xl font-bold text-white/20 group-hover:text-white/30 transition-all duration-300">
                      {pack.samples}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="secondary"
                      className="bg-black/60 text-gray-200 border-gray-700/50 backdrop-blur-sm font-mono text-xs"
                    >
                      {pack.genre}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-display text-xl font-semibold text-white mb-2">{pack.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed font-light">{pack.description}</p>
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-mono text-2xl font-bold text-white">{pack.price}</span>
                  </div>
                  <div className="flex space-x-3">
                    <Button className="flex-1 bg-white text-black hover:bg-gray-200 font-medium">Download</Button>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800/50 font-medium bg-transparent"
                    >
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Collecting Dots Sets Section */}
      <section id="sets" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold mb-4 tracking-tight text-4xl">COLLECTING DOTS MEDIA ARCHIVE </h2>
            <p className="text-gray-300 text-lg font-light">Live DJ sets from Omri and our label artists</p>
          </div>

          <HorizontalSetsCarousel
            sets={[
              {
                artist: "Omri",
                setName: "Melodic Journey #003",
                platform: "SoundCloud",
                duration: "78 min",
                plays: "12.5K",
              },
              {
                artist: "The Botanist",
                setName: "Deep Vibes Session",
                platform: "YouTube",
                duration: "65 min",
                plays: "8.2K",
              },
              {
                artist: "Omri",
                setName: "Rooftop Sessions Vol. 2",
                platform: "SoundCloud",
                duration: "92 min",
                plays: "15.8K",
              },
              {
                artist: "Bonafique",
                setName: "Underground Frequencies",
                platform: "YouTube",
                duration: "71 min",
                plays: "6.9K",
              },
              {
                artist: "Omri",
                setName: "Sunset Grooves #005",
                platform: "SoundCloud",
                duration: "85 min",
                plays: "18.2K",
              },
              {
                artist: "Adaru",
                setName: "Electronic Horizons",
                platform: "YouTube",
                duration: "73 min",
                plays: "9.1K",
              },
              {
                artist: "TOBEHONEST",
                setName: "Bass Frequencies Live",
                platform: "SoundCloud",
                duration: "68 min",
                plays: "11.4K",
              },
              {
                artist: "Rafael & Sapian",
                setName: "Indie Dance Collective",
                platform: "YouTube",
                duration: "81 min",
                plays: "7.8K",
              },
            ]}
          />
        </div>
      </section>

      {/* Collecting Dots Merchandise Section */}
      <section id="merchandise" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold mb-4 tracking-tight text-4xl">COLLECTING DOTS MERCHANDISE </h2>
            <p className="text-gray-300 text-lg font-light">
              Premium apparel and accessories for the collecting dots community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Classic Logo Tee",
                price: "$35",
                image: "/placeholder-1s2ow.png",
                colors: ["Black", "White", "Gray"],
              },
              {
                name: "Dots Snapback",
                price: "$28",
                image: "/placeholder-1s2ow.png",
                colors: ["Black", "Navy"],
              },
              {
                name: "Minimalist Hoodie",
                price: "$65",
                image: "/placeholder-1s2ow.png",
                colors: ["Black", "Charcoal", "White"],
              },
              {
                name: "Vinyl Sticker Pack",
                price: "$12",
                image: "/placeholder-1s2ow.png",
                colors: ["Mixed"],
              },
              {
                name: "Constellation Tote",
                price: "$22",
                image: "/placeholder-rnvk3.png",
                colors: ["Black", "Natural"],
              },
              {
                name: "Logo Pin Set",
                price: "$18",
                image: "/placeholder-29ll1.png",
                colors: ["Gold", "Silver"],
              },
              {
                name: "Premium Crewneck",
                price: "$55",
                image: "/placeholder-i3d3c.png",
                colors: ["Black", "Gray", "Navy"],
              },
              {
                name: "Dots Beanie",
                price: "$25",
                image: "/placeholder-1s2ow.png",
                colors: ["Black", "Gray"],
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="bg-gray-900/80 border-gray-800/50 group hover:border-gray-700/50 transition-all duration-500 backdrop-blur-sm"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-display text-lg font-semibold text-white mb-2">{item.name}</h3>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono text-xl font-bold text-white">{item.price}</span>
                    <div className="flex space-x-1">
                      {item.colors.slice(0, 3).map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          className={`w-4 h-4 rounded-full border border-gray-600 ${
                            color === "Black"
                              ? "bg-black"
                              : color === "White"
                                ? "bg-white"
                                : color === "Gray" || color === "Charcoal"
                                  ? "bg-gray-500"
                                  : color === "Navy"
                                    ? "bg-blue-900"
                                    : color === "Natural"
                                      ? "bg-amber-100"
                                      : color === "Gold"
                                        ? "bg-yellow-500"
                                        : color === "Silver"
                                          ? "bg-gray-300"
                                          : "bg-gradient-to-r from-purple-500 to-pink-500"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mb-3 font-light">Available in: {item.colors.join(", ")}</p>
                  <Button className="w-full bg-white text-black hover:bg-gray-200 font-medium">Buy Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Submission Section */}
      <section id="demo-submission" className="py-24 px-4 bg-gray-950/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4 tracking-tight md:text-4xl">SUBMIT YOUR DEMO</h2>
            <p className="text-gray-300 text-lg font-light">
              Ready to become part of the constellation? Share your music with us.
            </p>
          </div>

          <Card className="bg-gray-900/80 border-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white font-display text-2xl">Demo Submission</CardTitle>
              <CardDescription className="text-gray-400 font-light">
                Fill out the form below and upload your track. We'll get back to you within 48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="demo-file" className="text-white font-medium">
                  Upload Demo Track * (MP3 or WAV only)
                </Label>
                <div className="space-y-3">
                  {!formData.audioFile ? (
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
                      <FileAudio className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-300 text-xl mb-2 font-light">Drop it like it's dot</p>
                      <p className="text-xs text-gray-500 font-light">MP3 or WAV files only</p>
                      <Input
                        id="demo-file"
                        type="file"
                        accept=".mp3,.wav,audio/mpeg,audio/wav"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800/50 font-medium"
                        onClick={() => document.getElementById("demo-file")?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* File display */}
                      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileAudio className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-white text-sm font-medium">{formData.audioFile.name}</p>
                            <p className="text-gray-400 text-xs font-mono">{formatFileSize(formData.audioFile.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Required Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="track-title" className="text-white font-medium">
                            Track Title *
                          </Label>
                          <Input
                            id="track-title"
                            placeholder="Name of your track"
                            value={formData.trackTitle}
                            onChange={(e) => handleInputChange("trackTitle", e.target.value)}
                            className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="artist-name" className="text-white font-medium">
                            Artist Name *
                          </Label>
                          <Input
                            id="artist-name"
                            placeholder="Your artist name"
                            value={formData.artistName}
                            onChange={(e) => handleInputChange("artistName", e.target.value)}
                            className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full-name" className="text-white font-medium">
                            Full Name *
                          </Label>
                          <Input
                            id="full-name"
                            placeholder="Your full name"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange("fullName", e.target.value)}
                            className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white font-medium">
                            Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className={`bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light ${
                              errors.email ? "border-red-500" : ""
                            }`}
                          />
                          {errors.email && <p className="text-red-400 text-sm font-light">{errors.email}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="text-white font-medium">
                          Instagram *
                        </Label>
                        <Input
                          id="instagram"
                          placeholder="@yourusername or full Instagram URL"
                          value={formData.instagram}
                          onChange={(e) => handleInputChange("instagram", e.target.value)}
                          className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light"
                        />
                      </div>

                      {/* Optional Social Media Fields */}
                      <div className="space-y-4">
                        <h4 className="text-white font-medium text-sm">Optional Social Media Links</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="beatport" className="text-gray-300 font-medium text-sm">
                              Beatport
                            </Label>
                            <Input
                              id="beatport"
                              placeholder="Beatport profile URL"
                              value={formData.beatport}
                              onChange={(e) => handleInputChange("beatport", e.target.value)}
                              className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="facebook" className="text-gray-300 font-medium text-sm">
                              Facebook
                            </Label>
                            <Input
                              id="facebook"
                              placeholder="Facebook page URL"
                              value={formData.facebook}
                              onChange={(e) => handleInputChange("facebook", e.target.value)}
                              className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="x" className="text-gray-300 font-medium text-sm">
                            X (Twitter)
                          </Label>
                          <Input
                            id="x"
                            placeholder="X/Twitter profile URL"
                            value={formData.x}
                            onChange={(e) => handleInputChange("x", e.target.value)}
                            className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {errors.audioFile && <p className="text-red-400 text-sm font-light">{errors.audioFile}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-gray-950 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="font-display text-2xl font-bold mb-2">COLLECTING DOTS RECORDS </h3>
              <p className="text-gray-400 font-light">Curated by Omri.</p>
            </div>

            <div className="flex space-x-6">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Mail className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => window.open("https://www.instagram.com/collectingdotsrecords/", "_blank")}
              >
                <Instagram className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => window.open("https://www.beatport.com/label/collecting-dots/126941", "_blank")}
              >
                <BeatportIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  /* Apple Music link to be added */
                }}
              >
                <AppleMusicIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  /* Spotify link to be added */
                }}
              >
                <SpotifyIcon />
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800/50 text-center text-gray-400">
            <p className="font-light">&copy; 2024 collecting dots. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
