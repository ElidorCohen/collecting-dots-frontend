"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { buildApiUrl } from '@/lib/api'

interface Release {
	id: string
	title: string
	artist: string
	artwork: string
	genre: string
	releaseDate: string
	streams: string
	color: string
	previewUrl: string | null
}

// Color gradient options for variety
const colorGradients = [
	"from-purple-600 to-blue-600",
	"from-orange-600 to-red-600",
	"from-green-600 to-teal-600",
	"from-pink-600 to-purple-600",
	"from-blue-600 to-cyan-600",
	"from-yellow-600 to-orange-600",
	"from-red-600 to-pink-600",
	"from-teal-600 to-green-600",
]

export default function ReleasesCarousel() {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [isPlaying, setIsPlaying] = useState(true)
	const [progress, setProgress] = useState(0)
	const [releases, setReleases] = useState<Release[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
	const [audioProgress, setAudioProgress] = useState(0)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
	const audioRef = useRef<HTMLAudioElement | null>(null)

	const SLIDE_DURATION = 4000 // 4 seconds
	const PROGRESS_INTERVAL = 50 // Update progress every 50ms

	// Fetch playlist data from Spotify API
	useEffect(() => {
		const fetchPlaylistData = async () => {
			try {
				setIsLoading(true)
				const response = await fetch(buildApiUrl('/api/get-playlist-data'))
				const data = await response.json()

				if (data.success && data.data.tracks) {
					// Map Spotify tracks to release format
					const mappedReleases: Release[] = data.data.tracks.map((track: any, index: number) => {
						// Get the largest album image
						const artwork = track.track.album.images[0]?.url || '/placeholder.svg'

						// Get artists names
						const artistNames = track.track.artists.map((artist: any) => artist.name).join(', ')

						// Format release date (year only)
						const releaseDate = track.track.album.release_date.split('-')[0]

						// Format duration to minutes:seconds
						const minutes = Math.floor(track.track.duration_ms / 60000)
						const seconds = Math.floor((track.track.duration_ms % 60000) / 1000)
						const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`

						return {
							id: track.track.id,
							title: track.track.name,
							artist: artistNames,
							artwork: artwork,
							genre: 'Electronic', // Default genre, could be enhanced with Spotify API genre data
							releaseDate: releaseDate,
							streams: duration, // Using duration instead of streams
							color: colorGradients[index % colorGradients.length],
							previewUrl: track.track.preview_url || track.track.deezer_preview_url || null,
						}
					})

					setReleases(mappedReleases)
				}
			} catch (error) {
				console.error('Error fetching playlist data:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchPlaylistData()
	}, [])

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
			setCurrentIndex((prev) => (prev + 1) % releases.length)
			setProgress(0)
		}, SLIDE_DURATION)
	}

	const stopAutoPlay = () => {
		if (intervalRef.current) clearInterval(intervalRef.current)
		if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
	}

	useEffect(() => {
		// Don't start autoplay if there are no releases
		if (releases.length === 0) {
			return
		}

		if (isPlaying) {
			startAutoPlay()
		} else {
			stopAutoPlay()
		}

		return () => {
			stopAutoPlay()
		}
	}, [isPlaying, currentIndex, releases.length])

	const handlePrevious = () => {
		setCurrentIndex((prev) => (prev - 1 + releases.length) % releases.length)
	}

	const handleNext = () => {
		setCurrentIndex((prev) => (prev + 1) % releases.length)
	}

	const handleIndicatorClick = (index: number) => {
		setCurrentIndex(index)
	}

	const getCardStyle = (index: number) => {
		const diff = index - currentIndex
		const normalizedDiff = ((diff % releases.length) + releases.length) % releases.length

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
		} else if (normalizedDiff === 1 || normalizedDiff === releases.length - 1) {
			// Side cards
			if (normalizedDiff === 1) {
				// Right card
				translateX = 300
				scale = 0.75
				rotateY = -15
				zIndex = 2
				opacity = 0.6
			} else {
				// Left card
				translateX = -300
				scale = 0.75
				rotateY = 15
				zIndex = 2
				opacity = 0.6
			}
		} else {
			// Hidden cards
			if (normalizedDiff < releases.length / 2) {
				translateX = 450
			} else {
				translateX = -450
			}
			scale = 0.5
			opacity = 0
			zIndex = 1
		}

		return {
			transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
			zIndex,
			opacity,
			transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
		}
	}

	// Handle audio playback
	const handlePlayPause = useCallback((release: Release) => {
		if (!release.previewUrl) {
			console.log('No preview available for this track')
			return
		}

		// If clicking on the same track that's playing, pause it
		if (playingTrackId === release.id && audioRef.current) {
			audioRef.current.pause()
			setPlayingTrackId(null)
			setAudioProgress(0)
			return
		}

		// Stop any currently playing audio
		if (audioRef.current) {
			audioRef.current.pause()
			audioRef.current.removeEventListener('ended', handleAudioEnded)
			audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
		}

		// Create new audio element and play
		const audio = new Audio(release.previewUrl)
		audioRef.current = audio

		audio.addEventListener('ended', handleAudioEnded)
		audio.addEventListener('timeupdate', handleTimeUpdate)

		audio.play().then(() => {
			setPlayingTrackId(release.id)
		}).catch((error) => {
			console.error('Error playing audio:', error)
			setPlayingTrackId(null)
		})
	}, [playingTrackId])

	const handleAudioEnded = useCallback(() => {
		setPlayingTrackId(null)
		setAudioProgress(0)
	}, [])

	const handleTimeUpdate = useCallback(() => {
		if (audioRef.current) {
			const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
			setAudioProgress(progress)
		}
	}, [])

	// Cleanup audio on unmount
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current.removeEventListener('ended', handleAudioEnded)
				audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
			}
		}
	}, [handleAudioEnded, handleTimeUpdate])

	// Show loading state
	if (isLoading) {
		return (
			<div className="w-full max-w-6xl mx-auto px-8">
				<div className="relative h-[500px] flex items-center justify-center">
					<div className="flex flex-col items-center space-y-4">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
						<p className="text-gray-400 text-lg">Loading releases from Spotify...</p>
					</div>
				</div>
			</div>
		)
	}

	// Show message if no releases
	if (!releases || releases.length === 0) {
		return (
			<div className="w-full max-w-6xl mx-auto px-8">
				<div className="relative h-[500px] flex items-center justify-center">
					<p className="text-gray-400 text-lg">No releases found</p>
				</div>
			</div>
		)
	}

	return (
		<div className="w-full max-w-6xl mx-auto px-8">
			<div className="relative">
				{/* Carousel Container */}
				<div
					className="relative h-[530px] overflow-hidden"
					onMouseEnter={() => setIsPlaying(false)}
					onMouseLeave={() => setIsPlaying(true)}
				>
					{/* Cards */}
					<div className="absolute inset-0 flex items-center justify-center">
						{releases.map((release, index) => (
							<Card
								key={release.id}
								className="absolute w-80 bg-gray-900 border-gray-800 overflow-hidden group transition-all duration-300"
								style={getCardStyle(index)}
							>
								<div className="relative">
									{/* Gradient Overlay - Only visible on hover */}
									<div
										className={`absolute inset-0 bg-gradient-to-br ${release.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-10`}
									/>

									{/* Album Artwork */}
									<div className="aspect-square relative overflow-hidden flex items-center justify-center bg-gray-950">
										<img
											src={release.artwork || "/placeholder.svg"}
											alt={`${release.title} by ${release.artist}`}
											className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
											
										/>

										{/* Play Button Overlay */}
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 leading-10">
											<Button
												size="lg"
												className={`rounded-full ${release.previewUrl ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
												onClick={(e) => {
													e.stopPropagation()
													handlePlayPause(release)
												}}
												disabled={!release.previewUrl}
												title={release.previewUrl ? (playingTrackId === release.id ? 'Pause preview' : 'Play preview') : 'No preview available'}
											>
												{playingTrackId === release.id ? (
													<Pause className="w-6 h-6" />
												) : (
													<Play className="w-6 h-6 ml-1" />
												)}
											</Button>
										</div>
										
										{/* Audio Progress Bar (shown when playing) */}
										{playingTrackId === release.id && (
											<div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 z-30">
												<div 
													className="h-full bg-white transition-all duration-100"
													style={{ width: `${audioProgress}%` }}
												/>
											</div>
										)}

										{/* Floating Dots Animation */}
										<div className="absolute top-4 right-4 z-30">
											<div className="flex space-x-1">
												<div className="w-2 h-2 bg-white rounded-full animate-pulse" />
												<div className="w-2 h-2 bg-white rounded-full animate-pulse delay-100" />
												<div className="w-2 h-2 bg-white rounded-full animate-pulse delay-200" />
											</div>
										</div>
									</div>

									<CardContent className="p-6">
										<div className="mb-3">
											<h3 className="text-xl font-bold text-white mb-1">
												{release.title}
											</h3>
											<p className="text-gray-300 text-lg">
												{release.artist}
											</p>
										</div>

										<div className="flex justify-between items-center mb-4">
											<span className="text-gray-400 text-sm">
												{release.releaseDate}
											</span>
											<span className="text-gray-300 font-semibold">
												{release.streams}
											</span>
										</div>

										{/* Action Buttons */}
										<div className="flex">
											<Button
												variant="ghost"
												size="sm"
												className="text-gray-400 hover:text-white flex-1"
											>
												<Share2 className="w-4 h-4 mr-2" />
												Share
											</Button>
										</div>
									</CardContent>
								</div>
							</Card>
						))}
					</div>

					{/* Navigation Buttons */}
					<Button
						variant="outline"
						size="icon"
						className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-gray-900/90 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600"
						onClick={handlePrevious}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-gray-900/90 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600"
						onClick={handleNext}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				{/* Progress Bar */}
				<div className="mt-4 w-full bg-gray-800 rounded-full h-1 overflow-hidden">
					<div
						className="h-full bg-white transition-all duration-75 ease-linear"
						style={{ width: `${progress}%` }}
					/>
				</div>

				{/* Current Release Info */}
				<div className="mt-4 text-center">
					<h2 className="text-xl font-semibold text-white">{releases[currentIndex].title}</h2>
					<p className="text-gray-400 mt-1">
						{releases[currentIndex].artist} • {currentIndex + 1} of {releases.length}
					</p>
				</div>
			</div>
		</div>
	)
}
