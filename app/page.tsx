"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Music, Mail, Instagram, FileAudio, X, MapPin, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import ReleasesCarousel from "@/components/releases-carousel"
import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import HorizontalSetsCarousel from "@/components/horizontal-sets-carousel"
import { buildApiUrl } from '@/lib/api'

// Custom icons for music platforms
const BeatportIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 17.568c-1.414 1.414-3.314 2.197-5.318 2.197s-3.904-.783-5.318-2.197c-1.414-1.414-2.197-3.314-2.197-5.318s.783-3.904 2.197-5.318c1.414-1.414 3.314-2.197 5.318-2.197s3.904.783 5.318 2.197c1.414 1.414 2.197 3.314 2.197 5.318s-.783 3.904-2.197 5.318zM12 6c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z" />
  </svg>
)

const AppleMusicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.146-.525-.01-1.52-.01-2.948-.01h-6.375c-1.428 0-2.423 0-2.948.01-.526.011-1.047-.053-1.564.146-.673.121-1.303.353-1.877.727C1.302 1.624.557 2.624.24 3.934.065 4.654 0 5.386 0 6.124v11.752c0 .738.065 1.47.24 2.19.317 1.31 1.062 2.31 2.18 3.043.574.374 1.204.606 1.877.727.517.093 1.038.135 1.564.146.525.01 1.52.01 2.948.01h6.375c1.428 0 2.423 0 2.948-.01.526-.011 1.047-.053 1.564-.146.673-.121 1.303-.353 1.877-.727 1.118-.733 1.863-1.733 2.18-3.043.175-.72.24-1.452.24-2.19V6.124zm-7.78 6.778c-.309 1.467-1.297 3.146-2.638 3.168-1.075.018-1.428-.63-2.668-.63-1.24 0-1.626.612-2.65.648-1.297.037-2.4-1.8-2.714-3.264-.639-2.97.112-6.31 2.034-7.897.94-.776 2.48-.692 3.113.175.525.724.875 1.193.875 1.193s.35-.469.875-1.193c.633-.867 2.173-.951 3.113-.175.663.547 1.201 1.387 1.494 2.318.096.306-.48.63-.834.657z" />
  </svg>
)

const SpotifyIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
)

export default function Home() {
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

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Submission status
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: "success" | "error" | null
    message: string
    demoId?: string
  }>({
    type: null,
    message: "",
  })

  // Validation states
  const [errors, setErrors] = useState({
    email: "",
    audioFile: "",
    captcha: "",
  })

  // Cloudflare Turnstile state
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileWidgetId = useRef<string | null>(null)

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())

  // Mobile artists carousel navigation state
  const [currentArtistIndex, setCurrentArtistIndex] = useState(0)

  // Artists data state
  const [artists, setArtists] = useState<Array<{
    artist_name: string;
    artist_instagram_username: string;
    artist_soundcloud: string;
    artist_spotify: string;
    artist_beatport: string;
    image: string;
  }>>([])
  const [isLoadingArtists, setIsLoadingArtists] = useState(true)

  // YouTube videos state
  const [youtubeVideos, setYoutubeVideos] = useState<Array<{
    artist?: string;
    setName: string;
    platform: string;
    duration: string;
    plays: string;
    videoUrl?: string;
    thumbnail?: string;
    id?: string;
  }>>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)

  // Events state
  const [futureEvents, setFutureEvents] = useState<Array<{
    title: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    artists: string[];
    event_external_url?: string;
    event_instagram_post?: string;
  }>>([])
  const [pastEvents, setPastEvents] = useState<Array<{
    title: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    artists: string[];
    event_external_url?: string;
    event_instagram_post?: string;
  }>>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

  const toggleCardFlip = (index: number) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // Fetch artists data from API
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setIsLoadingArtists(true)
        const response = await fetch(buildApiUrl('/api/get-artists-data'))
        const data = await response.json()

        if (data.success && data.data) {
          setArtists(data.data)
        }
      } catch (error) {
        console.error('Error fetching artists data:', error)
      } finally {
        setIsLoadingArtists(false)
      }
    }

    fetchArtists()
  }, [])

  // Fetch YouTube videos from API
  useEffect(() => {
    const fetchYouTubeVideos = async () => {
      try {
        setIsLoadingVideos(true)
        const response = await fetch(buildApiUrl('/api/get-youtube-videos'))
        const data = await response.json()

        if (data.success && data.data && data.data.videos) {
          // Transform YouTube videos to match the Set interface
          const videos = data.data.videos.map((video: any) => ({
            setName: video.title,
            platform: 'YouTube',
            duration: video.duration,
            plays: video.viewCount,
            videoUrl: video.videoUrl,
            thumbnail: video.thumbnail,
            id: video.id, // Include video ID for easier embedding
          }))
          setYoutubeVideos(videos)
        }
      } catch (error) {
        console.error('Error fetching YouTube videos:', error)
        // On error, keep empty array or show fallback
        setYoutubeVideos([])
      } finally {
        setIsLoadingVideos(false)
      }
    }

    fetchYouTubeVideos()
  }, [])

  // Helper function to parse DD/MM/YYYY date format
  const parseDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') {
      return null
    }
    try {
      const [day, month, year] = dateStr.split('/').map(Number)
      if (day && month && year) {
        return new Date(year, month - 1, day)
      }
      return null
    } catch (error) {
      console.error('Error parsing date:', dateStr, error)
      return null
    }
  }

  // Helper function to format date to "Month Day, Year" format
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return ''
    const date = parseDate(dateStr)
    if (!date) return dateStr

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  // Helper function to split location into venue and location
  const splitLocation = (locationStr: string | undefined): { venue: string; location: string } => {
    if (!locationStr || typeof locationStr !== 'string') {
      return { venue: '', location: '' }
    }
    const parts = locationStr.split(',').map(s => s.trim())
    if (parts.length >= 2) {
      return {
        venue: parts[0],
        location: parts.slice(1).join(', ')
      }
    }
    return {
      venue: locationStr,
      location: ''
    }
  }

  // Fetch events data from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true)
        const response = await fetch(buildApiUrl('/api/get-events-data'))
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()

        if (data.success && data.data && Array.isArray(data.data)) {
          const now = new Date()
          now.setHours(0, 0, 0, 0) // Set to start of day for comparison

          const future: Array<{
            title: string;
            date: string;
            time: string;
            venue: string;
            location: string;
            artists: string[];
            event_external_url?: string;
            event_instagram_post?: string;
            originalDate: Date;
          }> = []
          const past: Array<{
            title: string;
            date: string;
            time: string;
            venue: string;
            location: string;
            artists: string[];
            event_external_url?: string;
            event_instagram_post?: string;
            originalDate: Date;
          }> = []

          data.data.forEach((event: any) => {
            // Validate required fields
            if (!event || !event.date || !event.event_title) {
              return
            }

            const eventDate = parseDate(event.date)
            if (!eventDate) {
              return
            }

            // Set to start of day for comparison
            const eventDateStart = new Date(eventDate)
            eventDateStart.setHours(0, 0, 0, 0)

            const { venue, location } = splitLocation(event.location)
            const artists = event.artists 
              ? event.artists.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
              : []

            const transformedEvent = {
              title: event.event_title || '',
              date: formatDate(event.date),
              time: event.times || '',
              venue,
              location,
              artists,
              event_external_url: event.event_external_url || undefined,
              event_instagram_post: event.event_instagram_post || undefined,
              originalDate: eventDate, // Store original date for sorting
            }

            if (eventDateStart >= now) {
              future.push(transformedEvent)
            } else {
              past.push(transformedEvent)
            }
          })

          // Sort future events by date (ascending)
          future.sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())

          // Sort past events by date (descending)
          past.sort((a, b) => b.originalDate.getTime() - a.originalDate.getTime())

          // Remove originalDate before setting state
          setFutureEvents(future.map(({ originalDate, ...evt }) => evt))
          setPastEvents(past.map(({ originalDate, ...evt }) => evt))
        }
      } catch (error) {
        console.error('Error fetching events data:', error)
        setFutureEvents([])
        setPastEvents([])
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchEvents()
  }, [])

  // Initialize Turnstile widget
  useEffect(() => {
    const initTurnstile = () => {
      // Check if the widget element exists in the DOM
      const widgetElement = document.getElementById('turnstile-widget')

      if ((window as any).turnstile && !turnstileWidgetId.current && widgetElement) {
        try {
          const widgetId = (window as any).turnstile.render(widgetElement, {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
            callback: (token: string) => {
              setCaptchaToken(token)
              setErrors((prev) => ({ ...prev, captcha: "" }))
            },
            'error-callback': () => {
              setCaptchaToken(null)
              setErrors((prev) => ({ ...prev, captcha: "CAPTCHA verification failed. Please try again." }))
            },
            'expired-callback': () => {
              setCaptchaToken(null)
              setErrors((prev) => ({ ...prev, captcha: "CAPTCHA expired. Please verify again." }))
            },
            theme: 'dark',
          })
          turnstileWidgetId.current = widgetId
        } catch (error) {
          console.error('Failed to initialize Turnstile:', error)
        }
      }
    }

    // Check if Turnstile is loaded and DOM is ready
    const checkAndInit = () => {
      if ((window as any).turnstile && document.getElementById('turnstile-widget')) {
        initTurnstile()
      }
    }

    // Try immediate initialization
    checkAndInit()

    // Set up interval to check periodically
    const checkInterval = setInterval(checkAndInit, 100)

    // Clean up after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval)
    }, 10000)

    return () => {
      clearInterval(checkInterval)
      clearTimeout(timeout)
    }
  }, [formData.audioFile])

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
      captchaToken !== null &&
      errors.email === "" &&
      errors.audioFile === "" &&
      errors.captcha === ""
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
      setIsUploading(true)
      setUploadProgress(0)

      const fileType = file.type
      const validTypes = ["audio/mpeg", "audio/wav", "audio/mp3"]
      const validExtensions = [".mp3", ".wav"]

      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))

      if (validTypes.includes(fileType) || validExtensions.includes(fileExtension)) {
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(progressInterval)
              return 100
            }
            return prev + Math.random() * 15 + 5 // Random increment between 5-20%
          })
        }, 200)

        setTimeout(() => {
          clearInterval(progressInterval)
          setUploadProgress(100)
          setFormData((prev) => ({ ...prev, audioFile: file }))
          setErrors((prev) => ({ ...prev, audioFile: "" }))
          setIsUploading(false)
        }, 1500) // 1.5 second loading simulation
      } else {
        setErrors((prev) => ({ ...prev, audioFile: "Please upload an MP3 or WAV file only" }))
        setIsUploading(false)
        setUploadProgress(0)
        event.target.value = "" // Clear the input
      }
    }
  }

  // Remove uploaded file
  const removeFile = () => {
    setFormData((prev) => ({ ...prev, audioFile: null }))
    setErrors((prev) => ({ ...prev, audioFile: "" }))
    setUploadProgress(0)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid()) return

    setIsUploading(true)
    setSubmissionStatus({ type: null, message: "" })

    try {
      // Create FormData object for multipart/form-data
      const formDataToSubmit = new FormData()

      // Add file with the expected field name 'demo_file'
      if (formData.audioFile) {
        formDataToSubmit.append('demo_file', formData.audioFile)
      }

      // Add required fields
      formDataToSubmit.append('artist_name', formData.artistName)
      formDataToSubmit.append('track_title', formData.trackTitle)
      formDataToSubmit.append('email', formData.email)
      formDataToSubmit.append('full_name', formData.fullName)
      formDataToSubmit.append('instagram_username', formData.instagram)

      // Add optional fields only if they have values
      if (formData.beatport) {
        formDataToSubmit.append('beatport', formData.beatport)
      }
      if (formData.facebook) {
        formDataToSubmit.append('facebook', formData.facebook)
      }
      if (formData.x) {
        formDataToSubmit.append('x_twitter', formData.x)
      }

      // Add Turnstile CAPTCHA token
      if (captchaToken) {
        formDataToSubmit.append('cf_turnstile_response', captchaToken)
      }

      // Submit to API
      const response = await fetch(buildApiUrl('/api/submit-demo'), {
        method: 'POST',
        body: formDataToSubmit,
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      let data: any
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // Non-JSON response (likely an error from proxy/server)
        const textResponse = await response.text()
        throw new Error(textResponse || `Server returned non-JSON response (${response.status})`)
      }

      if (response.ok) {
        // Success
        setSubmissionStatus({
          type: "success",
          message: "Demo submitted successfully!",
          demoId: data.demo_id,
        })

        // Don't reset form immediately - let user see the success message
        // Keep the form fields but clear their values
        setFormData({
          trackTitle: "",
          artistName: "",
          fullName: "",
          email: "",
          instagram: "",
          beatport: "",
          facebook: "",
          x: "",
          audioFile: formData.audioFile, // Keep the file to maintain UI state
        })
        setErrors({ email: "", audioFile: "", captcha: "" })

        // Reset Turnstile widget after successful submission
        if (turnstileWidgetId.current && (window as any).turnstile) {
          (window as any).turnstile.reset(turnstileWidgetId.current)
          setCaptchaToken(null)
        }
      } else {
        // Error
        setSubmissionStatus({
          type: "error",
          message: data.error || 'Unknown error occurred',
        })

        // Reset CAPTCHA on error (especially for 403 CAPTCHA failures)
        if (response.status === 403 && turnstileWidgetId.current && (window as any).turnstile) {
          (window as any).turnstile.reset(turnstileWidgetId.current)
          setCaptchaToken(null)
        }
      }
    } catch (error: any) {
      console.error('Submission error:', error)
      setSubmissionStatus({
        type: "error",
        message: error.message || 'Network error occurred',
      })

      // Reset CAPTCHA on network error
      if (turnstileWidgetId.current && (window as any).turnstile) {
        (window as any).turnstile.reset(turnstileWidgetId.current)
        setCaptchaToken(null)
      }
    } finally {
      setIsUploading(false)
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
              <a href="#sets" className="text-gray-300 hover:text-white transition-colors font-medium">
                Sets
              </a>
              <a href="#artists" className="text-gray-300 hover:text-white transition-colors font-medium">
                Artists
              </a>
              <a href="#events" className="text-gray-300 hover:text-white transition-colors font-medium">
                Events
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

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-12">
            <img
              src="/CD - main logo white.svg"
              alt="Collecting Dots Logo"
              className="h-24 md:h-32 mx-auto w-auto"
            />
          </div>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
            More than just a label, Collecting Dots is a living, breathing narrative.
            <br />
            Each track, each artist, each soul on the dance floor is a dot, merging to form a bigger picture.
            <br />
            The music, the people, the moments, we're collecting them all.
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
                COLLECTING DOTS,
                <br />
                <span className="gradient-text">CURATING SOUND</span>
              </h2>
              <p className="text-lg text-gray-300 mb-8 font-light leading-relaxed">
                This is where boundaries blur and creativity flows. Every beat is a pulse, every mix a thread, binding us in a shared rhythm. It's not just music; it's a culture, a movement. Join us as we push limits, redefine connection, and journey into a space where sound becomes meaning and every dot tells a story.
              </p>
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

      {/* Artists Section */}
      <section id="artists" className="py-24 px-4 bg-gray-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">ARTISTS</h2>
            <p className="text-gray-300 text-lg font-light">Our label artists.</p>
          </div>

          {/* Loading state */}
          {isLoadingArtists ? (
            <div className="relative h-96 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="text-gray-400 text-lg">Loading artists...</p>
              </div>
            </div>
          ) : artists.length === 0 ? (
            <div className="relative h-96 flex items-center justify-center">
              <p className="text-gray-400 text-lg">No artists found</p>
            </div>
          ) : (
            <>
              {/* Mobile Artists Carousel with Navigation */}
              <div className="relative overflow-hidden md:hidden">
                <div className="relative">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentArtistIndex * 100}%)` }}
                  >
                    {artists.map((artist, index) => (
                      <div
                        key={index}
                        className="w-full flex-shrink-0 px-4"
                      >
                        <div
                          className="w-full group perspective-1000 cursor-pointer"
                          onClick={() => toggleCardFlip(index)}
                        >
                          <div
                            className={`relative w-full h-96 preserve-3d transition-transform duration-700 ${
                              flippedCards.has(index) ? "rotate-y-180" : ""
                            }`}
                          >
                            {/* Front of card */}
                            <div className="absolute inset-0 w-full h-full backface-hidden">
                              <Card className="w-full h-full bg-gray-900/80 border-gray-800/50 hover:border-gray-700/50 transition-all duration-500 backdrop-blur-sm overflow-hidden">
                                <div className="relative h-full">
                                  <img
                                    src={artist.image || "/placeholder.svg"}
                                    alt={artist.artist_name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                  <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="font-display text-2xl font-bold text-white mb-2">{artist.artist_name}</h3>
                                  </div>
                                  <div className="absolute top-4 right-4">
                                    <div className="flex space-x-1">
                                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                      <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-100" />
                                      <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-200" />
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </div>

                            {/* Back of card */}
                            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                              <Card className="w-full h-full bg-gray-900/90 border-gray-800/50 backdrop-blur-sm">
                                <CardContent className="h-full flex flex-col items-center justify-center p-8">
                                  <h3 className="font-display text-2xl font-bold text-white mb-6 text-center">
                                    {artist.artist_name}
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4 w-full">
                                    <Button
                                      variant="ghost"
                                      size="lg"
                                      className="text-gray-300 hover:text-white hover:bg-gray-800/50 flex flex-col items-center space-y-2 h-auto py-4"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(`https://instagram.com/${artist.artist_instagram_username}`, "_blank")
                                      }}
                                    >
                                      <Instagram className="w-8 h-8" />
                                      <span className="text-xs">Instagram</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="lg"
                                      className="text-gray-300 hover:text-white hover:bg-gray-800/50 flex flex-col items-center space-y-2 h-auto py-4"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(artist.artist_soundcloud, "_blank")
                                      }}
                                    >
                                      <Music className="w-8 h-8" />
                                      <span className="text-xs">SoundCloud</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="lg"
                                      className="text-gray-300 hover:text-white hover:bg-gray-800/50 flex flex-col items-center space-y-2 h-auto py-4"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(artist.artist_spotify, "_blank")
                                      }}
                                    >
                                      <SpotifyIcon />
                                      <span className="text-xs">Spotify</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="lg"
                                      className="text-gray-300 hover:text-white hover:bg-gray-800/50 flex flex-col items-center space-y-2 h-auto py-4"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(artist.artist_beatport, "_blank")
                                      }}
                                    >
                                      <BeatportIcon />
                                      <span className="text-xs">Beatport</span>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Arrows - Mobile Only */}
                  {artists.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-900/90 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600"
                        onClick={() => setCurrentArtistIndex((prev) => (prev - 1 + artists.length) % artists.length)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-900/90 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600"
                        onClick={() => setCurrentArtistIndex((prev) => (prev + 1) % artists.length)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Desktop Auto-moving Artists Carousel */}
              <div className="hidden md:block relative overflow-hidden">
                <div className="flex space-x-8 animate-scroll-artists">
                  {/* Double artists array for seamless loop */}
                  {[...artists, ...artists].map((artist, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-80 group perspective-1000 cursor-pointer"
                      onClick={() => toggleCardFlip(index)}
                    >
                      <div
                        className={`relative w-full h-96 preserve-3d transition-transform duration-700 ${
                          flippedCards.has(index) ? "rotate-y-180" : ""
                        }`}
                      >
                        {/* Front of card */}
                        <div className="absolute inset-0 w-full h-full backface-hidden">
                          <Card className="w-full h-full bg-gray-900/80 border-gray-800/50 hover:border-gray-700/50 transition-all duration-500 backdrop-blur-sm overflow-hidden">
                            <div className="relative h-full">
                              <img
                                src={artist.image || "/placeholder.svg"}
                                alt={artist.artist_name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-6">
                                <h3 className="font-display text-2xl font-bold text-white mb-2">{artist.artist_name}</h3>
                              </div>
                              <div className="absolute top-4 right-4">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-100" />
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-200" />
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Back of card */}
                        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                          <Card className="w-full h-full bg-gray-900/90 border-gray-800/50 backdrop-blur-sm">
                            <CardContent className="h-full flex flex-col items-center justify-center p-8">
                              <h3 className="font-display text-2xl font-bold text-white mb-6 text-center">
                                {artist.artist_name}
                              </h3>
                              <div className="grid grid-cols-2 gap-4 w-full">
                                <Button
                                  variant="ghost"
                                  size="lg"
                                  className="text-gray-300 hover:text-white hover:bg-gray-800/50 flex flex-col items-center space-y-2 h-auto py-4"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`https://instagram.com/${artist.artist_instagram_username}`, "_blank")
                                  }}
                                >
                                  <Instagram className="w-8 h-8" />
                                  <span className="text-xs">Instagram</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="lg"
                                  className="text-gray-300 hover:text-white hover:bg-gray-800/50 flex flex-col items-center space-y-2 h-auto py-4"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(artist.artist_soundcloud, "_blank")
                                  }}
                                >
                                  <Music className="w-8 h-8" />
                                  <span className="text-xs">SoundCloud</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="lg"
                                  className="text-gray-300 hover:text-white hover:bg-gray-800/50 flex flex-col items-center space-y-2 h-auto py-4"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(artist.artist_spotify, "_blank")
                                  }}
                                >
                                  <SpotifyIcon />
                                  <span className="text-xs">Spotify</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="lg"
                                  className="text-gray-300 hover:text-white hover:bg-gray-800/50 flex flex-col items-center space-y-2 h-auto py-4"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(artist.artist_beatport, "_blank")
                                  }}
                                >
                                  <BeatportIcon />
                                  <span className="text-xs">Beatport</span>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-24 px-4 bg-gray-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">EVENTS</h2>
            <p className="text-gray-300 text-lg font-light">Collecting Dots Records events all around the world.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Future Events */}
            <div className="flex flex-col">
              <h3 className="font-display text-2xl font-bold mb-8 text-center text-white">Future Events</h3>
              <div className="events-scroll-container overflow-y-auto pr-2 max-h-[480px]">
                {isLoadingEvents ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                      <p className="text-gray-400 text-lg">Loading events...</p>
                    </div>
                  </div>
                ) : futureEvents.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-400 text-lg">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {futureEvents.map((event, index) => (
                      <Card
                        key={index}
                        className={`bg-gray-900/80 border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 backdrop-blur-sm ${event.event_external_url ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (event.event_external_url) {
                            window.open(event.event_external_url, '_blank', 'noopener,noreferrer')
                          }
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-xl font-bold text-white">{event.title}</h4>
                              {event.event_external_url && (
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-300">{event.date}</div>
                              <div className="text-xs text-gray-400">{event.time}</div>
                            </div>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-300">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="text-sm">
                                {event.location ? `${event.venue}, ${event.location}` : event.venue}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {event.artists.map((artist, artistIndex) => (
                              <span
                                key={artistIndex}
                                className="px-3 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-full border border-gray-700/50"
                              >
                                {artist}
                              </span>
                            ))}
                          </div>
                          {event.event_instagram_post && (
                            <div className="mt-4 pt-4 border-t border-gray-800/50">
                              <a
                                href={event.event_instagram_post}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
                              >
                                <Instagram className="w-4 h-4" />
                                <span>View Instagram Post</span>
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Past Events */}
            <div className="flex flex-col">
              <h3 className="font-display text-2xl font-bold mb-8 text-center text-gray-400">Past Events</h3>
              <div className="events-scroll-container overflow-y-auto pr-2 max-h-[480px]">
                {isLoadingEvents ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
                      <p className="text-gray-400 text-lg">Loading events...</p>
                    </div>
                  </div>
                ) : pastEvents.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-400 text-lg">No past events</p>
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {pastEvents.map((event, index) => (
                      <Card 
                        key={index} 
                        className={`bg-gray-900/60 border-gray-800/30 backdrop-blur-sm opacity-75 ${event.event_external_url ? 'cursor-pointer hover:opacity-90' : ''}`}
                        onClick={() => {
                          if (event.event_external_url) {
                            window.open(event.event_external_url, '_blank', 'noopener,noreferrer')
                          }
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-xl font-bold text-gray-300">{event.title}</h4>
                              {event.event_external_url && (
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">{event.date}</div>
                              <div className="text-xs text-gray-500">{event.time}</div>
                            </div>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-400">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="text-sm">
                                {event.location ? `${event.venue}, ${event.location}` : event.venue}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {event.artists.map((artist, artistIndex) => (
                              <span
                                key={artistIndex}
                                className="px-3 py-1 bg-gray-800/30 text-gray-400 text-xs rounded-full border border-gray-700/30"
                              >
                                {artist}
                              </span>
                            ))}
                          </div>
                          {event.event_instagram_post && (
                            <div className="mt-4 pt-4 border-t border-gray-800/30">
                              <a
                                href={event.event_instagram_post}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm"
                              >
                                <Instagram className="w-4 h-4" />
                                <span>View Instagram Post</span>
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collecting Dots Sounds Section */}
      {/* Temporarily commented out - will be used in the future */}
      {/* <section id="sounds" className="py-24 px-4 bg-gray-950/30">
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
      </section> */}

      {/* Collecting Dots Sets Section */}
      <section id="sets" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold mb-4 tracking-tight text-4xl">COLLECTING DOTS MEDIA ARCHIVE </h2>
            <p className="text-gray-300 text-lg font-light">Live sets from the DOT family</p>
          </div>

          {isLoadingVideos ? (
            <div className="relative h-96 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="text-gray-400 text-lg">Loading videos...</p>
              </div>
            </div>
          ) : youtubeVideos.length === 0 ? (
            <div className="relative h-96 flex items-center justify-center">
              <p className="text-gray-400 text-lg">No videos found</p>
            </div>
          ) : (
            <HorizontalSetsCarousel sets={youtubeVideos} />
          )}
        </div>
      </section>

      {/* Collecting Dots Merchandise Section */}
      <section id="merchandise" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold mb-4 tracking-tight text-4xl">COLLECTING DOTS MERCHANDISE </h2>
            <p className="text-gray-300 text-lg font-light mb-6">
              Premium apparel and accessories in collaboration with Float Apparel
            </p>
            <a
              href="https://www.floatapparel.co.za/collections/collecting-dots-x-float"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button className="bg-white text-black hover:bg-gray-200 font-medium px-8 py-3 text-lg">
                Shop Full Collection →
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "COLLECTING DOTS X FLOAT WAVEFORM TEE",
                price: "R 800.00",
                image: "https://www.floatapparel.co.za/cdn/shop/files/FloatSS2526-88.jpg?v=1765538915",
              },
              {
                name: "COLLECTING DOTS FLOAT LOGO CAP",
                price: "R 1,000.00",
                image: "https://www.floatapparel.co.za/cdn/shop/files/FloatSS2526-11.jpg?v=1765539824",
              },
              {
                name: "COLLECTING DOTS X FLOAT MECHANIC BOWLER",
                price: "R 600.00",
                image: "https://www.floatapparel.co.za/cdn/shop/files/FloatSS2526-69.jpg?v=1765539570",
              },
              {
                name: "COLLECTING DOTS X FLOAT QUILTED TOTE",
                price: "R 600.00",
                image: "https://www.floatapparel.co.za/cdn/shop/files/FloatSS2526-51.jpg?v=1765788189",
              },
              {
                name: "COLLECTING DOTS X FLOAT PROTEA TEE",
                price: "R 800.00",
                image: "https://www.floatapparel.co.za/cdn/shop/files/FloatSS2526-62.jpg?v=1765538074",
              },
              {
                name: "COLLECTING DOTS FLOAT OVAL DOT CAP",
                price: "R 600.00",
                image: "https://www.floatapparel.co.za/cdn/shop/files/FloatSS2526-03.jpg?v=1765541687",
              },
            ].map((item, index) => (
              <a
                key={index}
                href="https://www.floatapparel.co.za/collections/collecting-dots-x-float"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="bg-gray-900/80 border-gray-800/50 group hover:border-gray-700/50 transition-all duration-500 backdrop-blur-sm h-full flex flex-col">
                  <div className="aspect-[4/5] relative overflow-hidden cursor-pointer bg-gray-800/50">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                  </div>
                  <CardContent className="p-4 flex flex-col flex-1">
                    <h3 className="font-display text-lg font-semibold text-white mb-2">{item.name}</h3>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono text-xl font-bold text-white">{item.price}</span>
                    </div>
                    <Button className="w-full bg-white text-black hover:bg-gray-200 font-medium mt-auto">
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Submission Section */}
      <section id="demo-submission" className="py-24 px-4 bg-gray-950/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4 tracking-tight md:text-4xl">SUBMIT YOUR DEMO</h2>
            <p className="text-gray-300 text-lg font-light uppercase">
              READY TO BECOME PART OF THE CONSTELLATION? SHARE YOUR MUSIC WITH US.
            </p>
          </div>

          <Card className="bg-gray-900/80 border-gray-800/50 backdrop-blur-sm uppercase">
            <CardHeader>
              <CardTitle className="text-white font-display text-2xl">DEMO SUBMISSION</CardTitle>
              <CardDescription className="text-gray-400 font-light">
                FILL OUT THE FORM BELOW AND UPLOAD YOUR TRACK.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="demo-file" className="text-white font-medium">
                  UPLOAD DEMO TRACK * (MP3 OR WAV ONLY)
                </Label>
                <div className="space-y-3">
                  {!formData.audioFile && !isUploading ? (
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-gray-500 transition-all duration-300 hover:bg-gray-800/20">
                      <div className="transform transition-transform duration-300 hover:scale-105">
                        <FileAudio className="w-20 h-20 mx-auto mb-6 text-gray-400" />
                        <h3 className="text-white text-3xl font-display font-bold mb-3 tracking-tight">
                          DROP IT LIKE IT'S DOT
                        </h3>
                        <p className="text-gray-400 text-lg mb-6 font-light normal-case">Share your sound with the constellation</p>
                        <p className="text-xs text-gray-500 font-light mb-6">MP3 OR WAV FILES ONLY • MAX 50MB</p>
                        <Input
                          id="demo-file"
                          type="file"
                          accept=".mp3,.wav,audio/mpeg,audio/wav"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          size="lg"
                          className="bg-white text-black hover:bg-gray-200 font-medium px-8 py-3 text-lg"
                          onClick={() => document.getElementById("demo-file")?.click()}
                        >
                          CHOOSE YOUR TRACK
                        </Button>
                      </div>
                    </div>
                  ) : isUploading ? (
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-6"></div>
                        <h3 className="text-white text-2xl font-display font-bold mb-3 tracking-tight">
                          UPLOADING YOUR TRACK...
                        </h3>
                        <p className="text-gray-400 text-lg font-light">PROCESSING YOUR AUDIO FILE</p>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in slide-in-from-top-4 duration-1000 space-y-6">
                      {/* Show file info and form fields only if submission hasn't succeeded */}
                      {submissionStatus.type !== "success" && (
                        <>
                          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600 rounded-lg p-6 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="p-3 bg-green-500/20 rounded-full">
                                  <FileAudio className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                  <p className="text-white text-lg font-medium">{formData.audioFile?.name}</p>
                                  <p className="text-gray-400 text-sm font-mono">
                                    {formData.audioFile && formatFileSize(formData.audioFile.size)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeFile}
                                className="text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </div>

                            {/* File display with enhanced styling */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium text-sm">UPLOAD PROGRESS</span>
                                <span className="text-green-400 font-mono text-sm">{Math.round(uploadProgress)}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p className="text-gray-400 text-xs font-light">
                                {uploadProgress < 100 ? "PROCESSING YOUR TRACK..." : "UPLOAD COMPLETE!"}
                              </p>
                            </div>
                          </div>

                          {/* Required Fields with enhanced styling */}
                          <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="track-title" className="text-white font-medium text-lg">
                              TRACK TITLE *
                            </Label>
                            <Input
                              id="track-title"
                              placeholder="NAME OF YOUR TRACK"
                              value={formData.trackTitle}
                              onChange={(e) => handleInputChange("trackTitle", e.target.value)}
                              className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light h-12 text-lg focus:border-white/50 transition-colors"
                            />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="artist-name" className="text-white font-medium text-lg">
                              ARTIST NAME *
                            </Label>
                            <Input
                              id="artist-name"
                              placeholder="YOUR ARTIST NAME"
                              value={formData.artistName}
                              onChange={(e) => handleInputChange("artistName", e.target.value)}
                              className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light h-12 text-lg focus:border-white/50 transition-colors"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="full-name" className="text-white font-medium text-lg">
                              FULL NAME *
                            </Label>
                            <Input
                              id="full-name"
                              placeholder="YOUR FULL NAME"
                              value={formData.fullName}
                              onChange={(e) => handleInputChange("fullName", e.target.value)}
                              className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light h-12 text-lg focus:border-white/50 transition-colors"
                            />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="email" className="text-white font-medium text-lg">
                              EMAIL *
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="YOUR@EMAIL.COM"
                              value={formData.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              className={`bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light h-12 text-lg focus:border-white/50 transition-colors ${
                                errors.email ? "border-red-500" : ""
                              }`}
                            />
                            {errors.email && <p className="text-red-400 text-sm font-light uppercase">{errors.email}</p>}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="instagram" className="text-white font-medium text-lg">
                            INSTAGRAM *
                          </Label>
                          <Input
                            id="instagram"
                            placeholder="@YOURUSERNAME OR FULL INSTAGRAM URL"
                            value={formData.instagram}
                            onChange={(e) => handleInputChange("instagram", e.target.value)}
                            className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 font-light h-12 text-lg focus:border-white/50 transition-colors"
                          />
                        </div>

                        {/* Optional Social Media Fields - removed header text */}
                        <div className="space-y-4 pt-4 border-t border-gray-700/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label htmlFor="beatport" className="text-gray-300 font-medium">
                                BEATPORT
                              </Label>
                              <Input
                                id="beatport"
                                placeholder="BEATPORT PROFILE URL"
                                value={formData.beatport}
                                onChange={(e) => handleInputChange("beatport", e.target.value)}
                                className="bg-black/30 border-gray-700 text-white placeholder:text-gray-500 font-light h-11 focus:border-gray-500 transition-colors"
                              />
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="facebook" className="text-gray-300 font-medium">
                                FACEBOOK
                              </Label>
                              <Input
                                id="facebook"
                                placeholder="FACEBOOK PAGE URL"
                                value={formData.facebook}
                                onChange={(e) => handleInputChange("facebook", e.target.value)}
                                className="bg-black/30 border-gray-700 text-white placeholder:text-gray-500 font-light h-11 focus:border-gray-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="x" className="text-gray-300 font-medium">
                              X (TWITTER)
                            </Label>
                            <Input
                              id="x"
                              placeholder="X/TWITTER PROFILE URL"
                              value={formData.x}
                              onChange={(e) => handleInputChange("x", e.target.value)}
                              className="bg-black/30 border-gray-700 text-white placeholder:text-gray-500 font-light h-11 focus:border-gray-500 transition-colors"
                            />
                          </div>
                        </div>

                          {/* Turnstile CAPTCHA Widget */}
                          <div className="space-y-3 pt-6 border-t border-gray-700/50">
                            <Label className="text-white font-medium text-lg">
                              VERIFICATION *
                            </Label>
                            <div id="turnstile-widget" className="flex justify-center"></div>
                            {errors.captcha && (
                              <p className="text-red-400 text-sm font-light text-center uppercase">{errors.captcha}</p>
                            )}
                          </div>

                          </div>
                        </>
                      )}

                      {/* Submit Button */}
                      <div className="pt-6 space-y-4">
                        {submissionStatus.type !== "success" && (
                          <Button
                            onClick={handleSubmit}
                            disabled={!isFormValid() || isUploading}
                            size="lg"
                            className={`w-full h-14 text-lg font-medium transition-all duration-300 ${
                              isFormValid() && !isUploading
                                ? "bg-white text-black hover:bg-gray-200 hover:scale-[1.02] shadow-lg"
                                : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {isUploading ? (
                              <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2"></div>
                                SUBMITTING...
                              </span>
                            ) : (
                              "SUBMIT DEMO"
                            )}
                          </Button>
                        )}

                        {/* Success/Error Message Display */}
                        {submissionStatus.type && (
                            <div
                              className={`animate-in slide-in-from-top-2 duration-500 p-6 rounded-lg border-2 ${
                                submissionStatus.type === "success"
                                  ? "bg-green-500/10 border-green-500/50 text-white"
                                  : "bg-red-500/10 border-red-500/50 text-red-400"
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  {submissionStatus.type === "success" ? (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                  ) : (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-display font-bold text-lg mb-1">
                                    {submissionStatus.type === "success" ? "SUCCESS!" : "ERROR"}
                                  </h4>
                                  <p className="text-sm font-light mb-2">{submissionStatus.message}</p>
                                  {submissionStatus.demoId && (
                                    <p className="text-sm font-mono bg-black/30 px-3 py-2 rounded border border-green-500/30 mt-3 text-white">
                                      <span className="font-bold">{submissionStatus.demoId}</span>
                                    </p>
                                  )}
                                  {submissionStatus.type === "success" && (
                                    <Button
                                      onClick={() => {
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
                                        setSubmissionStatus({ type: null, message: "" })
                                        setUploadProgress(0)
                                        setErrors({ email: "", audioFile: "", captcha: "" })

                                        // Reset Turnstile widget
                                        if (turnstileWidgetId.current && (window as any).turnstile) {
                                          (window as any).turnstile.reset(turnstileWidgetId.current)
                                          setCaptchaToken(null)
                                        }
                                      }}
                                      className="mt-4 bg-white hover:bg-gray-200 text-black font-medium border border-green-500/30"
                                    >
                                      SUBMIT ANOTHER DEMO
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                  )}
                  {errors.audioFile && <p className="text-red-400 text-sm font-light uppercase">{errors.audioFile}</p>}
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
              <p className="text-gray-400 font-light">Curated by OMRI.</p>
            </div>

            <div className="flex space-x-6">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white"
                onClick={() => window.open("mailto:office@collectingdots.com", "_blank")}
              >
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
                onClick={() => window.open("https://open.spotify.com/playlist/253UKTc95dhq8FvVbLvroJ", "_blank")}
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
