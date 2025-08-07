"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"

interface CarouselItem {
  id: number
  title: string
  description: string
  image: string
  color: string
}

const carouselData: CarouselItem[] = [
  {
    id: 1,
    title: "Mountain Adventure",
    description: "Explore breathtaking mountain landscapes and discover hidden trails.",
    image: "/placeholder.svg?height=300&width=400",
    color: "bg-gradient-to-br from-blue-500 to-purple-600",
  },
  {
    id: 2,
    title: "Ocean Serenity",
    description: "Dive into crystal clear waters and experience marine life up close.",
    image: "/placeholder.svg?height=300&width=400",
    color: "bg-gradient-to-br from-cyan-500 to-blue-600",
  },
  {
    id: 3,
    title: "Forest Escape",
    description: "Wander through ancient forests and connect with nature's tranquility.",
    image: "/placeholder.svg?height=300&width=400",
    color: "bg-gradient-to-br from-green-500 to-emerald-600",
  },
  {
    id: 4,
    title: "Desert Journey",
    description: "Experience the vast beauty of golden dunes and starlit nights.",
    image: "/placeholder.svg?height=300&width=400",
    color: "bg-gradient-to-br from-orange-500 to-red-600",
  },
  {
    id: 5,
    title: "City Lights",
    description: "Discover urban adventures and the pulse of metropolitan life.",
    image: "/placeholder.svg?height=300&width=400",
    color: "bg-gradient-to-br from-purple-500 to-pink-600",
  },
]

export default function SlidingCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const SLIDE_DURATION = 4000 // 4 seconds
  const PROGRESS_INTERVAL = 50 // Update progress every 50ms

  const startAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)

    setProgress(0)

    // Progress bar animation
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0
        }
        return prev + 100 / (SLIDE_DURATION / PROGRESS_INTERVAL)
      })
    }, PROGRESS_INTERVAL)

    // Slide advancement
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselData.length)
      setProgress(0)
    }, SLIDE_DURATION)
  }

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
  }

  useEffect(() => {
    if (isPlaying) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }

    return () => {
      stopAutoPlay()
    }
  }, [isPlaying, currentIndex])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselData.length) % carouselData.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselData.length)
  }

  const handleIndicatorClick = (index: number) => {
    setCurrentIndex(index)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex
    const normalizedDiff = ((diff % carouselData.length) + carouselData.length) % carouselData.length

    let translateX = 0
    let scale = 1
    let rotateY = 0
    let zIndex = 1
    let opacity = 0.6

    if (normalizedDiff === 0) {
      // Center card
      translateX = 0
      scale = 1
      rotateY = 0
      zIndex = 3
      opacity = 1
    } else if (normalizedDiff === 1 || normalizedDiff === carouselData.length - 1) {
      // Side cards
      if (normalizedDiff === 1) {
        // Right card
        translateX = 280
        scale = 0.8
        rotateY = -15
        zIndex = 2
        opacity = 0.7
      } else {
        // Left card
        translateX = -280
        scale = 0.8
        rotateY = 15
        zIndex = 2
        opacity = 0.7
      }
    } else {
      // Hidden cards
      if (normalizedDiff < carouselData.length / 2) {
        translateX = 400
      } else {
        translateX = -400
      }
      scale = 0.6
      opacity = 0
      zIndex = 1
    }

    return {
      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
      zIndex,
      opacity,
      transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      <div className="relative">
        {/* Carousel Container */}
        <div
          className="relative h-96 overflow-hidden"
          onMouseEnter={() => setIsPlaying(false)}
          onMouseLeave={() => setIsPlaying(true)}
        >
          {/* Cards */}
          <div className="absolute inset-0 flex items-center justify-center">
            {carouselData.map((item, index) => (
              <Card key={item.id} className="absolute w-80 h-80 cursor-pointer" style={getCardStyle(index)}>
                <CardContent className="p-0 h-full">
                  <div
                    className={`h-full rounded-lg ${item.color} flex flex-col justify-end p-6 text-white relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                      <p className="text-sm opacity-90">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-6">
          {/* Indicators */}
          <div className="flex space-x-2">
            {carouselData.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-blue-600 scale-110" : "bg-gray-300 hover:bg-gray-400"
                }`}
                onClick={() => handleIndicatorClick(index)}
              />
            ))}
          </div>

          {/* Play/Pause Button */}
          <Button variant="outline" size="sm" onClick={togglePlayPause} className="flex items-center gap-2">
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Play
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Slide Info */}
        <div className="mt-4 text-center">
          <h2 className="text-xl font-semibold text-gray-800">{carouselData[currentIndex].title}</h2>
          <p className="text-gray-600 mt-1">
            {currentIndex + 1} of {carouselData.length}
          </p>
        </div>
      </div>
    </div>
  )
}
