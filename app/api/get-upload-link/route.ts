import { NextRequest, NextResponse } from 'next/server';
import { DropboxService } from '@/lib/services/dropbox';
import { verifyTurnstileToken } from '@/lib/services/turnstile';
import { randomUUID } from 'crypto';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
    const origin = request.headers.get('origin');
    if (origin && (origin.includes('collectingdots.com') || origin.includes('localhost'))) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    return response;
}

export async function POST(request: NextRequest) {
    try {
        // Parse JSON body (small payload - only metadata, no file)
        const body = await request.json();

        // Step 1: Verify Cloudflare Turnstile CAPTCHA
        const captchaToken = body.cf_turnstile_response as string | null;

        if (!captchaToken) {
            const response = NextResponse.json(
                { error: 'CAPTCHA verification is required' },
                { status: 400 }
            );
            return addCorsHeaders(response, request);
        }

        // Get remote IP from headers
        const remoteIp =
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('x-real-ip') ||
            undefined;

        const captchaResult = await verifyTurnstileToken(captchaToken, remoteIp);

        if (!captchaResult.success) {
            const response = NextResponse.json(
                { error: captchaResult.error || 'CAPTCHA verification failed' },
                { status: 403 }
            );
            return addCorsHeaders(response, request);
        }

        // Step 2: Validate required fields
        const artistName = body.artist_name as string | null;
        const trackTitle = body.track_title as string | null;

        if (!artistName || !trackTitle) {
            const response = NextResponse.json(
                { error: 'Missing required fields: artist_name, track_title' },
                { status: 400 }
            );
            return addCorsHeaders(response, request);
        }

        // Validate field lengths
        if (artistName.length > 100 || trackTitle.length > 100) {
            const response = NextResponse.json(
                { error: 'Artist name and track title must be under 100 characters' },
                { status: 400 }
            );
            return addCorsHeaders(response, request);
        }

        // Step 3: Generate temporary upload link from Dropbox
        const dropboxService = new DropboxService();
        const { uploadUrl, path, demoId } = await dropboxService.getTemporaryUploadLink(
            artistName,
            trackTitle
        );

        // Generate session ID for tracking this upload
        const sessionId = randomUUID();

        // Return the upload link to the client
        const response = NextResponse.json(
            {
                upload_url: uploadUrl,
                file_path: path,
                demo_id: demoId,
                session_id: sessionId,
                // Include expiry info (Dropbox temp links expire in 4 hours)
                expires_in_seconds: 4 * 60 * 60,
            },
            { status: 200 }
        );
        return addCorsHeaders(response, request);

    } catch (error: any) {
        console.error('Error generating upload link:', error);
        const response = NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
        return addCorsHeaders(response, request);
    }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get('origin');
    const response = new NextResponse(null, { status: 200 });

    if (origin && (origin.includes('collectingdots.com') || origin.includes('localhost'))) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return response;
}

