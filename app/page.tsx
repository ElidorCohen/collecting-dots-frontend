"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Music, Upload, Mail, Instagram, FileAudio, X } from "lucide-react"
import ReleasesCarousel from "@/components/releases-carousel"
import { useState } from "react"

// Custom icons for music platforms
const BeatportIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 17.568c-.184.184-.48.184-.664 0L12 12.664l-4.904 4.904c-.184.184-.48.184-.664 0-.184-.184-.184-.48 0-.664L11.336 12 6.432 7.096c-.184-.184-.184-.48 0-.664.184-.184.48-.184.664 0L12 11.336l4.904-4.904c.184-.184.48-.184.664 0 .184.184.184.48 0 .664L12.664 12l4.904 4.904c.184.184.184.48 0 .664z"/>
  </svg>
)

const AppleMusicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.146-.525-.01-1.52-.01-2.948-.01h-6.375c-1.428 0-2.423 0-2.948.01-.526.011-1.047.053-1.564.146-.673.121-1.303.353-1.877.727C1.302 1.624.557 2.624.24 3.934.065 4.654 0 5.386 0 6.124v11.752c0 .738.065 1.47.24 2.19.317 1.31 1.062 2.31 2.18 3.043.574.374 1.204.606 1.877.727.517.093 1.038.135 1.564.146.525.01 1.52.01 2.948.01h6.375c1.428 0 2.423 0 2.948-.01.526-.011 1.047-.053 1.564-.146.673-.121 1.303-.353 1.877-.727 1.118-.733 1.863-1.733 2.18-3.043.175-.72.24-1.452.24-2.19V6.124zm-7.78 6.778c-.309 1.467-1.297 3.146-2.638 3.168-1.075.018-1.428-.63-2.668-.63-1.24 0-1.626.612-2.65.648-1.297.037-2.4-1.8-2.714-3.264-.639-2.97.112-6.31 2.034-7.897.94-.776 2.48-.692 3.113.175.525.724.875 1.193.875 1.193s.35-.469.875-1.193c.633-.867 2.173-.951 3.113-.175.663.547 1.201 1.387 1.494 2.318.096.306-.48.63-.834.657z"/>
  </svg>
)

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
)

export default function CollectingDotsLabel() {
  // Form state
  const [formData, setFormData] = useState({
    artistName: '',
    email: '',
    trackTitle: '',
    genre: '',
    message: '',
    audioFile: null as File | null
  })

  // Validation states
  const [errors, setErrors] = useState({
    email: '',
    audioFile: ''
  })

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.artistName.trim() !== '' &&
      formData.email.trim() !== '' &&
      validateEmail(formData.email) &&
      formData.trackTitle.trim() !== '' &&
      formData.genre.trim() !== '' &&
      formData.audioFile !== null &&
      errors.email === '' &&
      errors.audioFile === ''
    )
  }

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear email error when user starts typing
    if (field === 'email') {
      if (value.trim() === '') {
        setErrors(prev => ({ ...prev, email: '' }))
      } else if (!validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      } else {
        setErrors(prev => ({ ...prev, email: '' }))
      }
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileType = file.type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3']
      const validExtensions = ['.mp3', '.wav']
      
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      
      if (validTypes.includes(fileType) || validExtensions.includes(fileExtension)) {
        setFormData(prev => ({ ...prev, audioFile: file }))
        setErrors(prev => ({ ...prev, audioFile: '' }))
      } else {
        setErrors(prev => ({ ...prev, audioFile: 'Please upload an MP3 or WAV file only' }))
        event.target.value = '' // Clear the input
      }
    }
  }

  // Remove uploaded file
  const removeFile = () => {
    setFormData(prev => ({ ...prev, audioFile: null }))
    setErrors(prev => ({ ...prev, audioFile: '' }))
  }

  // Handle form submission
  const handleSubmit = () => {
    if (isFormValid()) {
      // Here you would typically send the form data to your backend
      console.log('Form submitted:', formData)
      alert('Demo submitted successfully! We\'ll get back to you within 48 hours.')
      
      // Reset form
      setFormData({
        artistName: '',
        email: '',
        trackTitle: '',
        genre: '',
        message: '',
        audioFile: null
      })
      setErrors({ email: '', audioFile: '' })
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-black text-white">
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
          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
            collecting
            <span className="block text-gray-300">dots</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            A music label curated by <span className="text-white font-semibold">Omri.</span>
            <br />
            Connecting the dots between sound and soul
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6"
            onClick={() => document.getElementById("demo-submission")?.scrollIntoView({ behavior: "smooth" })}
          >
            Demo Submission
          </Button>
        </div>
      </section>

      {/* About Section - Horizontal Layout */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">About collectingdots</h2>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="flex flex-col h-full">
              <p className="text-gray-300 text-lg leading-relaxed">
                Collecting Dots is an independent electronic music label founded in 2025 by Tel Aviv-born DJ and producer OMRI. With a vision rooted in storytelling, connection, and sonic exploration, the label is more than just a platform for releasing tracks — it's a creative movement. Each release is a chapter in a larger narrative, crafted to resonate on dancefloors and in deeper, more personal spaces.
              </p>
            </div>
            <div className="flex flex-col h-full">
              <p className="text-gray-300 text-lg leading-relaxed">
                Blending nostalgic textures with forward-thinking production, Collecting Dots focuses on genres like melodic house, deep techno, and cinematic electronica. It stands as a home for both emerging and established artists who share a passion for innovation and emotional impact. Guided by a spirit of unity and artistic freedom, the label invites listeners and creators alike to join in drawing the dots that connect us through sound.
              </p>
            </div>
            <div className="flex items-start justify-center h-full mt-2">
              <img 
                src="/assets/icon.png" 
                alt="collecting dots label icon" 
                className="w-full max-w-[290px] h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-gray-400">Artists</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">200+</div>
              <div className="text-gray-400">Releases</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">1M+</div>
              <div className="text-gray-400">Streams</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">25+</div>
              <div className="text-gray-400">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Releases Carousel Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Latest Releases</h2>
            <p className="text-gray-300 text-lg">Discover the dots we've connected in our musical constellation</p>
          </div>
          <ReleasesCarousel /> {/* Use the imported ReleasesCarousel component */}
        </div>
      </section>

      {/* Demo Submission Section */}
      <section id="demo-submission" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Submit Your Demo</h2>
            <p className="text-gray-300 text-lg">
              Ready to become part of the constellation? Share your music with us.
            </p>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Demo Submission</CardTitle>
              <CardDescription className="text-gray-400">
                Fill out the form below and upload your track. We'll get back to you within 48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="artist-name" className="text-white">
                    Artist Name *
                  </Label>
                  <Input
                    id="artist-name"
                    placeholder="Your artist name"
                    value={formData.artistName}
                    onChange={(e) => handleInputChange('artistName', e.target.value)}
                    className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`bg-black border-gray-700 text-white placeholder:text-gray-500 ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="track-title" className="text-white">
                  Track Title *
                </Label>
                <Input
                  id="track-title"
                  placeholder="Name of your track"
                  value={formData.trackTitle}
                  onChange={(e) => handleInputChange('trackTitle', e.target.value)}
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre" className="text-white">
                  Genre *
                </Label>
                <Input
                  id="genre"
                  placeholder="House, Tech House, Indie Dance, etc."
                  value={formData.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="demo-file" className="text-white">
                  Upload Demo Track * (MP3 or WAV only)
                </Label>
                <div className="space-y-3">
                  {!formData.audioFile ? (
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                      <FileAudio className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-400 mb-2">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">MP3 or WAV files only</p>
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
                        className="mt-3 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
                        onClick={() => document.getElementById('demo-file')?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileAudio className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white text-sm font-medium">{formData.audioFile.name}</p>
                          <p className="text-gray-400 text-xs">{formatFileSize(formData.audioFile.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {errors.audioFile && (
                    <p className="text-red-400 text-sm">{errors.audioFile}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-white">
                  Message (Optional)
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your music, inspiration, or anything else you'd like us to know..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
                />
              </div>

              <Button 
                className={`w-full text-lg py-6 ${
                  isFormValid() 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                onClick={handleSubmit}
                disabled={!isFormValid()}
              >
                <Upload className="w-5 h-5 mr-2" />
                Submit Demo
              </Button>
              
              {!isFormValid() && (
                <p className="text-gray-400 text-sm text-center">
                  Please fill in all required fields (*) and upload your demo track
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-950 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">collecting dots records</h3>
              <p className="text-gray-400">Curated by Omri.</p>
            </div>

            <div className="flex space-x-6">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Mail className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white"
                onClick={() => window.open('https://www.instagram.com/collectingdotsrecords/', '_blank')}
              >
                <Instagram className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white"
                onClick={() => window.open('https://www.beatport.com/label/collecting-dots/126941', '_blank')}
              >
                <BeatportIcon />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white"
                onClick={() => {/* Apple Music link to be added */}}
              >
                <AppleMusicIcon />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white"
                onClick={() => {/* Spotify link to be added */}}
              >
                <SpotifyIcon />
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 collecting dots. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
