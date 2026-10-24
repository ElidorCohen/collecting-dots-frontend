"use client"

import CollectingDotsHero from "@/components/collecting-dots-hero"
import CollectingDotsReleases from "@/components/collecting-dots-releases"
import CollectingDotsArtists from "@/components/collecting-dots-artists"
import CollectingDotsEvents from "@/components/collecting-dots-events"
import CollectingDotsArchive from "@/components/collecting-dots-archive"
import CollectingDotsMerchandise from "@/components/collecting-dots-merchandise"
import CollectingDotsDemos from "@/components/collecting-dots-demos"
import CollectingDotsFooter from "@/components/collecting-dots-footer"

export default function Home() {
  return <div className="min-h-screen bg-black text-white">
    <CollectingDotsHero continueStory smoothFirstShot />
    <CollectingDotsReleases />
    <CollectingDotsArtists />
    <CollectingDotsEvents />
    <CollectingDotsArchive />
    <CollectingDotsMerchandise />
    <CollectingDotsDemos />
    <CollectingDotsFooter />
  </div>
}
