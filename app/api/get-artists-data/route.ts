import { NextRequest, NextResponse } from 'next/server';
import { SpotifyService } from '@/lib/services/spotify';
import { DropboxService } from '@/lib/services/dropbox';

export async function GET(request: NextRequest) {
  try {
    // Read artist data from Dropbox JSON file
    const dropboxService = new DropboxService();
    const artistsFromDropbox = await dropboxService.readArtistsData();

    // Enrich artist data with Spotify profile images
    const spotifyService = new SpotifyService();
    const artistsData = await spotifyService.getArtistsData(artistsFromDropbox);

    return NextResponse.json({
      success: true,
      data: artistsData,
      total_artists: artistsData.length,
      message: 'Successfully retrieved artist data',
    });
  } catch (error: any) {
    if (error.message.includes('Invalid')) {
      return NextResponse.json(
        { error: 'Invalid data format', message: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Artist data file not found', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve artist data', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read artist data from Dropbox JSON file
    const dropboxService = new DropboxService();
    const artistsFromDropbox = await dropboxService.readArtistsData();

    // Enrich artist data with Spotify profile images
    const spotifyService = new SpotifyService();
    const artistsData = await spotifyService.getArtistsData(artistsFromDropbox);

    return NextResponse.json({
      success: true,
      data: artistsData,
      total_artists: artistsData.length,
      message: 'Successfully retrieved artist data',
    });
  } catch (error: any) {
    if (error.message.includes('Invalid')) {
      return NextResponse.json(
        { error: 'Invalid data format', message: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Artist data file not found', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve artist data', message: error.message },
      { status: 500 }
    );
  }
}
