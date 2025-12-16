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

    const response = NextResponse.json({
      success: true,
      data: playlistData,
      message: `Successfully retrieved data for playlist: ${playlistData.playlist_info.name}`,
    });

    // Add CORS headers
    const origin = request.headers.get('origin');
    if (origin && (origin.includes('collectingdots.com') || origin.includes('localhost'))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return response;
  } catch (error: any) {
    if (error.message.includes('Invalid')) {
      const errorResponse = NextResponse.json(
        { error: 'Invalid playlist URL', message: error.message },
        { status: 400 }
      );
      
      // Add CORS headers to error response
      const origin = request.headers.get('origin');
      if (origin && (origin.includes('collectingdots.com') || origin.includes('localhost'))) {
        errorResponse.headers.set('Access-Control-Allow-Origin', origin);
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      }
      
      return errorResponse;
    }

    const errorResponse = NextResponse.json(
      { error: 'Failed to retrieve playlist data', message: error.message },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    const origin = request.headers.get('origin');
    if (origin && (origin.includes('collectingdots.com') || origin.includes('localhost'))) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use hardcoded playlist URL (can still be overridden with request body if needed)
    const body = await request.json().catch(() => ({}));
    const playlist_url = body.playlist_url || DEFAULT_PLAYLIST_URL;

    const spotifyService = new SpotifyService();
    const playlistData = await spotifyService.getPlaylistData(playlist_url);

    const response = NextResponse.json({
      success: true,
      data: playlistData,
      message: `Successfully retrieved data for playlist: ${playlistData.playlist_info.name}`,
    });

    // Add CORS headers
    const origin = request.headers.get('origin');
    if (origin && (origin.includes('collectingdots.com') || origin.includes('localhost'))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return response;
  } catch (error: any) {
    if (error.message.includes('Invalid')) {
      const errorResponse = NextResponse.json(
        { error: 'Invalid playlist URL', message: error.message },
        { status: 400 }
      );
      
      // Add CORS headers to error response
      const origin = request.headers.get('origin');
      if (origin && (origin.includes('collectingdots.com') || origin.includes('localhost'))) {
        errorResponse.headers.set('Access-Control-Allow-Origin', origin);
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      }
      
      return errorResponse;
    }

    const errorResponse = NextResponse.json(
      { error: 'Failed to retrieve playlist data', message: error.message },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    const origin = request.headers.get('origin');
    if (origin && (origin.includes('collectingdots.com') || origin.includes('localhost'))) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    return errorResponse;
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  
  if (origin && (origin.includes('collectingdots.com') || origin.includes('localhost'))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  return response;
}
