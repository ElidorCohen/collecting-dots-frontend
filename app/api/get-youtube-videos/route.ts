import { NextRequest, NextResponse } from 'next/server';
import { YouTubeService } from '@/lib/services/youtube';

// Default channel handle
const DEFAULT_CHANNEL_HANDLE = '@CollectingDotsRecords';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelHandle = searchParams.get('channel') || DEFAULT_CHANNEL_HANDLE;
    const maxResults = parseInt(searchParams.get('maxResults') || '50', 10);

    const youtubeService = new YouTubeService();
    const videosData = await youtubeService.getChannelVideos(channelHandle, maxResults);

    const response = NextResponse.json({
      success: true,
      data: videosData,
      message: `Successfully retrieved ${videosData.totalVideos} videos from ${videosData.channelTitle}`,
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
    console.error('Error fetching YouTube videos:', error);

    const errorResponse = NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch YouTube videos',
      },
      { status: 500 }
    );

    // Add CORS headers even for errors
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
    const body = await request.json().catch(() => ({}));
    const channelHandle = body.channel || DEFAULT_CHANNEL_HANDLE;
    const maxResults = parseInt(body.maxResults || '50', 10);

    const youtubeService = new YouTubeService();
    const videosData = await youtubeService.getChannelVideos(channelHandle, maxResults);

    const response = NextResponse.json({
      success: true,
      data: videosData,
      message: `Successfully retrieved ${videosData.totalVideos} videos from ${videosData.channelTitle}`,
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
    console.error('Error fetching YouTube videos:', error);

    const errorResponse = NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch YouTube videos',
      },
      { status: 500 }
    );

    // Add CORS headers even for errors
    const origin = request.headers.get('origin');
    if (origin && (origin.includes('collectingdots.com') || origin.includes('localhost'))) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return errorResponse;
  }
}

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

