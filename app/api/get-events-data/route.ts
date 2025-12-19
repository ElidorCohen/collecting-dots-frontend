import { NextRequest, NextResponse } from 'next/server';
import { DropboxService } from '@/lib/services/dropbox';

export async function GET(request: NextRequest) {
  try {
    // Read events data from Dropbox JSON file
    const dropboxService = new DropboxService();
    const eventsData = await dropboxService.readEventsData();

    const response = NextResponse.json({
      success: true,
      data: eventsData,
      total_events: eventsData.length,
      message: 'Successfully retrieved events data',
    });

    // Add CORS headers
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer') || '';
    
    // Allow same-origin requests (no origin header) or requests from collectingdots.com domains
    if (!origin || origin.includes('collectingdots.com') || origin.includes('localhost')) {
      if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else if (referer.includes('collectingdots.com') || referer.includes('localhost')) {
        // Extract origin from referer for same-origin requests
        try {
          const refererUrl = new URL(referer);
          response.headers.set('Access-Control-Allow-Origin', refererUrl.origin);
        } catch (e) {
          // If referer parsing fails, allow all (for same-origin requests)
          response.headers.set('Access-Control-Allow-Origin', '*');
        }
      }
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return response;
  } catch (error: any) {
    console.error('Error in get-events-data GET:', error);
    
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    let errorResponse: NextResponse;
    
    if (errorMessage.includes('Invalid')) {
      errorResponse = NextResponse.json(
        { error: 'Invalid data format', message: errorMessage },
        { status: 400 }
      );
    } else if (errorMessage.includes('not found')) {
      errorResponse = NextResponse.json(
        { error: 'Events data file not found', message: errorMessage },
        { status: 404 }
      );
    } else {
      errorResponse = NextResponse.json(
        { error: 'Failed to retrieve events data', message: errorMessage },
        { status: 500 }
      );
    }

    // Add CORS headers to error response
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer') || '';
    
    // Allow same-origin requests (no origin header) or requests from collectingdots.com domains
    if (!origin || origin.includes('collectingdots.com') || origin.includes('localhost')) {
      if (origin) {
        errorResponse.headers.set('Access-Control-Allow-Origin', origin);
      } else if (referer.includes('collectingdots.com') || referer.includes('localhost')) {
        // Extract origin from referer for same-origin requests
        try {
          const refererUrl = new URL(referer);
          errorResponse.headers.set('Access-Control-Allow-Origin', refererUrl.origin);
        } catch (e) {
          // If referer parsing fails, allow all (for same-origin requests)
          errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        }
      }
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read events data from Dropbox JSON file
    const dropboxService = new DropboxService();
    const eventsData = await dropboxService.readEventsData();

    const response = NextResponse.json({
      success: true,
      data: eventsData,
      total_events: eventsData.length,
      message: 'Successfully retrieved events data',
    });

    // Add CORS headers
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer') || '';
    
    // Allow same-origin requests (no origin header) or requests from collectingdots.com domains
    if (!origin || origin.includes('collectingdots.com') || origin.includes('localhost')) {
      if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else if (referer.includes('collectingdots.com') || referer.includes('localhost')) {
        // Extract origin from referer for same-origin requests
        try {
          const refererUrl = new URL(referer);
          response.headers.set('Access-Control-Allow-Origin', refererUrl.origin);
        } catch (e) {
          // If referer parsing fails, allow all (for same-origin requests)
          response.headers.set('Access-Control-Allow-Origin', '*');
        }
      }
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return response;
  } catch (error: any) {
    console.error('Error in get-events-data POST:', error);
    
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    let errorResponse: NextResponse;
    
    if (errorMessage.includes('Invalid')) {
      errorResponse = NextResponse.json(
        { error: 'Invalid data format', message: errorMessage },
        { status: 400 }
      );
    } else if (errorMessage.includes('not found')) {
      errorResponse = NextResponse.json(
        { error: 'Events data file not found', message: errorMessage },
        { status: 404 }
      );
    } else {
      errorResponse = NextResponse.json(
        { error: 'Failed to retrieve events data', message: errorMessage },
        { status: 500 }
      );
    }

    // Add CORS headers to error response
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer') || '';
    
    // Allow same-origin requests (no origin header) or requests from collectingdots.com domains
    if (!origin || origin.includes('collectingdots.com') || origin.includes('localhost')) {
      if (origin) {
        errorResponse.headers.set('Access-Control-Allow-Origin', origin);
      } else if (referer.includes('collectingdots.com') || referer.includes('localhost')) {
        // Extract origin from referer for same-origin requests
        try {
          const refererUrl = new URL(referer);
          errorResponse.headers.set('Access-Control-Allow-Origin', refererUrl.origin);
        } catch (e) {
          // If referer parsing fails, allow all (for same-origin requests)
          errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        }
      }
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

