"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Heart, Share2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const releases = [
	{
		id: 1,
		title: "Omri.",
		artist: "Mission Impossible",
		artwork: "/assets/missionimpossible.webp",
		genre: "House",
		releaseDate: "2024",
		streams: "2.1M",
		color: "from-purple-600 to-blue-600",
	},
	{
		id: 2,
		title: "Rafael, Sapian",
		artist: "What What",
		artwork: "/assets/whatwhat.webp",
		genre: "Indie Dance",
		releaseDate: "2024",
		streams: "1.8M",
		color: "from-orange-600 to-red-600",
	},
	{
		id: 3,
		title: "Cruisers EP",
		artist: "Adaru",
		artwork: "/assets/cruisersep.webp",
		genre: "Electronic",
		releaseDate: "2024",
		streams: "1.3M",
		color: "from-green-600 to-teal-600",
	},
	{
		id: 4,
		title: "Wanna Dance?",
		artist: "The Botanist",
		artwork: "/assets/wannadance.webp",
		genre: "House",
		releaseDate: "2024",
		streams: "2.8M",
		color: "from-pink-600 to-purple-600",
	},
	{
		id: 5,
		title: "Culture React",
		artist: "Bonafique",
		artwork: "/assets/culturereact.webp",
		genre: "Techno",
		releaseDate: "2024",
		streams: "1.9M",
		color: "from-blue-600 to-cyan-600",
	},
	{
		id: 6,
		title: "Chicken Bone",
		artist: "TOBEHONEST",
		artwork: "/assets/chickenbone.webp",
		genre: "Bass",
		releaseDate: "2024",
		streams: "2.4M",
		color: "from-yellow-600 to-orange-600",
	},
]

export default function ReleasesCarousel() {
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
			setCurrentIndex((prev) => (prev + 1) % releases.length)
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

	return (
		<div className="w-full max-w-6xl mx-auto px-8">
			<div className="relative">
				{/* Carousel Container */}
				<div
					className="relative h-[500px] overflow-hidden"
					onMouseEnter={() => setIsPlaying(false)}
					onMouseLeave={() => setIsPlaying(true)}
				>
					{/* Cards */}
					<div className="absolute inset-0 flex items-center justify-center">
						{releases.map((release, index) => (
							<Card 
								key={release.id} 
								className="absolute w-80 bg-gray-900 border-gray-800 overflow-hidden group hover:scale-105 transition-all duration-300" 
								style={getCardStyle(index)}
							>
								<div className="relative">
									{/* Gradient Overlay - Only visible on hover */}
									<div
										className={`absolute inset-0 bg-gradient-to-br ${release.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-10`}
									/>

									{/* Album Artwork */}
									<div className="aspect-square relative overflow-hidden">
										<img
											src={release.artwork || "/placeholder.svg"}
											alt={`${release.title} by ${release.artist}`}
											className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
										/>

										{/* Play Button Overlay */}
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
											<Button
												size="lg"
												className="rounded-full bg-white text-black hover:bg-gray-200"
											>
												<Play className="w-6 h-6 ml-1" />
											</Button>
										</div>

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
										<div className="flex justify-between items-start mb-3">
											<div>
												<h3 className="text-xl font-bold text-white mb-1">
													{release.title}
												</h3>
												<p className="text-gray-300 text-lg">
													{release.artist}
												</p>
											</div>
											<Badge
												variant="secondary"
												className="bg-gray-800 text-gray-300"
											>
												{release.genre}
											</Badge>
										</div>

										<div className="flex justify-between items-center mb-4">
											<span className="text-gray-400 text-sm">
												{release.releaseDate}
											</span>
											<span className="text-gray-300 font-semibold">
												{release.streams} streams
											</span>
										</div>

										{/* Action Buttons */}
										<div className="flex space-x-2">
											<Button
												variant="ghost"
												size="sm"
												className="text-gray-400 hover:text-white flex-1"
											>
												<Heart className="w-4 h-4 mr-2" />
												Like
											</Button>
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

				{/* Controls */}
				<div className="flex items-center justify-between mt-6">
					{/* Indicators */}
					<div className="flex space-x-2">
						{releases.map((_, index) => (
							<button
								key={index}
								className={`w-3 h-3 rounded-full transition-all duration-300 ${
									index === currentIndex ? "bg-white scale-125" : "bg-gray-600 hover:bg-gray-400"
								}`}
								onClick={() => handleIndicatorClick(index)}
							/>
						))}
					</div>
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
