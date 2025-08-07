'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'

interface Set {
  artist: string
  setName: string
  platform: string
  duration: string
  plays: string
}

interface HorizontalSetsCarouselProps {
  sets: Set[]
}

export default function HorizontalSetsCarousel({ sets }: HorizontalSetsCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const itemsPerSlide = 2
  const totalSlides = Math.ceil(sets.length / itemsPerSlide)
  
  // If we have 4 or fewer items, show them in a grid instead of carousel
  if (sets.length <= 4) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sets.map((set, index) => (
          <Card key={index} className="bg-gray-900/80 border-gray-800/50 group hover:border-gray-700/50 transition-all duration-500 backdrop-blur-sm">
            <div className="aspect-video bg-gradient-to-br from-orange-600/10 to-red-600/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button size="lg" className="rounded-full bg-white text-black hover:bg-gray-200 opacity-80 group-hover:opacity-100 transition-all duration-300">
                  <Play className="w-6 h-6 ml-1" />
                </Button>
              </div>
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-black/60 text-gray-200 border-gray-700/50 backdrop-blur-sm font-mono text-xs">
                  {set.platform}
                </Badge>
              </div>
              <div className="absolute bottom-4 right-4 text-white text-sm font-mono">
                {set.duration}
              </div>
            </div>
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-semibold text-white mb-1">{set.setName}</h3>
              <p className="text-gray-300 mb-3 font-light">by {set.artist}</p>
              <div className="flex justify-between items-center text-sm text-gray-400 font-mono">
                <span>{set.plays} plays</span>
                <span>{set.duration}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const nextSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const prevSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {Array.from({ length: totalSlides }, (_, slideIndex) => (
            <div key={slideIndex} className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
                {sets
                  .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                  .map((set, index) => (
                    <Card key={index} className="bg-gray-900/80 border-gray-800/50 group hover:border-gray-700/50 transition-all duration-500 backdrop-blur-sm">
                      <div className="aspect-video bg-gradient-to-br from-orange-600/10 to-red-600/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button size="lg" className="rounded-full bg-white text-black hover:bg-gray-200 opacity-80 group-hover:opacity-100 transition-all duration-300">
                            <Play className="w-6 h-6 ml-1" />
                          </Button>
                        </div>
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="bg-black/60 text-gray-200 border-gray-700/50 backdrop-blur-sm font-mono text-xs">
                            {set.platform}
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 right-4 text-white text-sm font-mono">
                          {set.duration}
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="font-display text-lg font-semibold text-white mb-1">{set.setName}</h3>
                        <p className="text-gray-300 mb-3 font-light">by {set.artist}</p>
                        <div className="flex justify-between items-center text-sm text-gray-400 font-mono">
                          <span>{set.plays} plays</span>
                          <span>{set.duration}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          disabled={isTransitioning}
          className="border-gray-600 text-gray-300 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400 font-mono">
            {currentSlide + 1} of {totalSlides}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          disabled={isTransitioning}
          className="border-gray-600 text-gray-300 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
