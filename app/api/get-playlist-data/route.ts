import { NextRequest, NextResponse } from 'next/server';
import { SpotifyService } from '@/lib/services/spotify';

// Hardcoded playlist URL for easy testing
const DEFAULT_PLAYLIST_URL = 'https://open.spotify.com/playlist/253UKTc95dhq8FvVbLvroJ';

export async function GET(request: NextRequest) {
  try {
    // Use hardcoded playlist URL (can still be overridden with query param if needed)
    const { searchParams } = new URL(request.url);
    const playlist_url = searchParams.get('playlist_url') || DEFAULT_PLAYLIST_URL;

    const spotifyService = new SpotifyService();
    const playlistData = await spotifyService.getPlaylistData(playlist_url);

    return NextResponse.json({
      success: true,
      data: playlistData,
      message: `Successfully retrieved data for playlist: ${playlistData.playlist_info.name}`,
    });
  } catch (error: any) {
    if (error.message.includes('Invalid')) {
      return NextResponse.json(
        { error: 'Invalid playlist URL', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve playlist data', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use hardcoded playlist URL (can still be overridden with request body if needed)
    const body = await request.json().catch(() => ({}));
    const playlist_url = body.playlist_url || DEFAULT_PLAYLIST_URL;

    const spotifyService = new SpotifyService();
    const playlistData = await spotifyService.getPlaylistData(playlist_url);

    return NextResponse.json({
      success: true,
      data: playlistData,
      message: `Successfully retrieved data for playlist: ${playlistData.playlist_info.name}`,
    });
  } catch (error: any) {
    if (error.message.includes('Invalid')) {
      return NextResponse.json(
        { error: 'Invalid playlist URL', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve playlist data', message: error.message },
      { status: 500 }
    );
  }
}
