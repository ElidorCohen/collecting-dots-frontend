'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react'

interface Set {
  artist?: string
  setName: string
  platform: string
  duration: string
  plays: string
  videoUrl?: string
  thumbnail?: string
  id?: string // Video ID (optional, will be extracted from videoUrl if not provided)
}

interface HorizontalSetsCarouselProps {
  sets: Set[]
}

export default function HorizontalSetsCarousel({ sets }: HorizontalSetsCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Set | null>(null)
  
  const itemsPerSlide = 2
  const totalSlides = Math.ceil(sets.length / itemsPerSlide)

  // Extract video ID from YouTube URL or use provided ID
  const getVideoId = (set: Set): string | null => {
    // First check if ID is directly provided
    if (set.id) return set.id
    
    // Otherwise extract from URL
    if (!set.videoUrl) return null
    const match = set.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  // Get YouTube embed URL
  const getEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
  }

  const handleVideoClick = (set: Set) => {
    if (set.videoUrl) {
      setSelectedVideo(set)
    }
  }

  const closeModal = () => {
    setSelectedVideo(null)
  }

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedVideo) {
        closeModal()
      }
    }

    if (selectedVideo) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [selectedVideo])

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
                    <Card key={index} className="bg-gray-900/80 border-gray-800/50 group hover:border-gray-700/50 transition-all duration-500 backdrop-blur-sm cursor-pointer" onClick={() => handleVideoClick(set)}>
                      <div className="aspect-video bg-gradient-to-br from-orange-600/10 to-red-600/10 relative overflow-hidden">
                        {set.thumbnail ? (
                          <img 
                            src={set.thumbnail} 
                            alt={set.setName}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
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
                        {set.artist && <p className="text-gray-300 mb-3 font-light">by {set.artist}</p>}
                        <div className="flex justify-between items-center text-sm text-gray-400 font-mono">
                          <span>{set.plays} {set.plays.includes('K') || set.plays.includes('M') ? 'views' : 'plays'}</span>
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

      {/* Navigation Controls - Only show if there's more than one slide */}
      {totalSlides > 1 && (
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
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div 
            className="relative w-full max-w-6xl mx-4 bg-black rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Video Container */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {(() => {
                const videoId = getVideoId(selectedVideo)
                return videoId ? (
                  <iframe
                    src={getEmbedUrl(videoId)}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedVideo.setName}
                  />
                ) : null
              })()}
            </div>

            {/* Video Info */}
            <div className="p-6 bg-gray-900/95">
              <h3 className="font-display text-xl font-semibold text-white mb-2">{selectedVideo.setName}</h3>
              {selectedVideo.artist && (
                <p className="text-gray-300 mb-3 font-light">by {selectedVideo.artist}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-400 font-mono">
                <span>{selectedVideo.plays} {selectedVideo.plays.includes('K') || selectedVideo.plays.includes('M') ? 'views' : 'plays'}</span>
                <span>{selectedVideo.duration}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
