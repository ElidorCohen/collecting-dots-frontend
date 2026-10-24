import type { Metadata } from "next"
import CollectingDotsHero from "@/components/collecting-dots-hero"
import CollectingDotsReleases from "@/components/collecting-dots-releases"
import CollectingDotsArtists from "@/components/collecting-dots-artists"
import CollectingDotsEvents from "@/components/collecting-dots-events"
import CollectingDotsArchive from "@/components/collecting-dots-archive"
import CollectingDotsMerchandise from "@/components/collecting-dots-merchandise"
import CollectingDotsDemos from "@/components/collecting-dots-demos"
import CollectingDotsFooter from "@/components/collecting-dots-footer"

export const metadata: Metadata = {
  title: "Collecting Dots — Original Timing",
  robots: { index: false, follow: false },
}

export default function OriginalOpenerPreview() {
  return <main><CollectingDotsHero preview continueStory /><CollectingDotsReleases preview /><CollectingDotsArtists /><CollectingDotsEvents mock /><CollectingDotsArchive /><CollectingDotsMerchandise /><CollectingDotsDemos /><CollectingDotsFooter /></main>
}
