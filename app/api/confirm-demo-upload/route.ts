import { NextRequest, NextResponse } from 'next/server';
import { DropboxService, DemoMetadata } from '@/lib/services/dropbox';
import { EmailService } from '@/lib/services/email';
import { getDemoSubmissionEnabled } from '@/lib/redis';

const DEMO_SUBMISSION_DISABLED_MESSAGE = "We're currently under high load and will be accepting demos again soon.";

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
        const isDemoSubmissionEnabled = await getDemoSubmissionEnabled();
        if (!isDemoSubmissionEnabled) {
            const response = NextResponse.json(
                { error: DEMO_SUBMISSION_DISABLED_MESSAGE },
                { status: 503 }
            );
            return addCorsHeaders(response, request);
        }

        // Parse JSON body (small payload - only metadata, no file)
        const body = await request.json();

        // Step 1: Validate required fields
        const sessionId = body.session_id as string | null;
        const filePath = body.file_path as string | null;
        const contentHash = body.content_hash as string | null;
        const artistName = body.artist_name as string | null;
        const trackTitle = body.track_title as string | null;
        const email = body.email as string | null;
        const fullName = body.full_name as string | null;
        const instagramUsername = body.instagram_username as string | null;
        const suppressEmail = Boolean(body.suppress_email);

        // Optional fields
        const beatport = (body.beatport as string | null) || null;
        const facebook = (body.facebook as string | null) || null;
        const xTwitter = (body.x_twitter as string | null) || null;

        // Validate required fields
        if (!sessionId || !filePath || !artistName || !trackTitle || !email || !fullName || !instagramUsername) {
            const response = NextResponse.json(
                {
                    error: 'Missing required fields: session_id, file_path, artist_name, track_title, email, full_name, instagram_username'
                },
                { status: 400 }
            );
            return addCorsHeaders(response, request);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            const response = NextResponse.json(
                { error: 'Invalid email address format' },
                { status: 400 }
            );
            return addCorsHeaders(response, request);
        }

        // Validate file path (security check - must be in expected directory)
        const hasAllowedExtension = filePath.endsWith('.mp3') || filePath.endsWith('.wav');
        if (!filePath.startsWith('/demos/submitted/') || !hasAllowedExtension) {
            const response = NextResponse.json(
                { error: 'Invalid file path' },
                { status: 400 }
            );
            return addCorsHeaders(response, request);
        }

        // Step 2: Generate timestamp and demo_id for metadata
        const timestamp = new Date()
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\..+/, '')
            .replace('T', '_')
            .slice(0, 15);

        // Generate demo_id from artist name and track title
        const safeArtist = artistName.replace(/\s+/g, '_').replace(/[<>:"/\\|?*]/g, '');
        const safeTitle = trackTitle.replace(/\s+/g, '_').replace(/[<>:"/\\|?*]/g, '');
        const demoId = `${safeArtist} - ${safeTitle}`;

        // Step 3: Create metadata object
        const metadata: DemoMetadata = {
            artist_name: artistName,
            track_title: trackTitle,
            email: email,
            full_name: fullName,
            instagram_username: instagramUsername,
            beatport: beatport,
            facebook: facebook,
            x_twitter: xTwitter,
            submitted_at: timestamp,
            demo_id: demoId,
            content_hash: contentHash || undefined,
        };

        // Step 4: Save metadata to Dropbox
        const dropboxService = new DropboxService();
        await dropboxService.saveMetadata(filePath, metadata);

        // Step 5: Send confirmation email (non-blocking)
        let emailSent = false;
        let emailError: string | null = null;
        let emailSkipped = false;

        if (suppressEmail) {
            emailSkipped = true;
        } else {
            const emailService = new EmailService();
            try {
                emailSent = await emailService.sendDemoSubmissionConfirmation(
                    email,
                    artistName,
                    trackTitle,
                    demoId
                );
                if (!emailSent) {
                    emailError = 'Failed to send confirmation email';
                }
            } catch (emailErr: any) {
                console.error('Email error:', emailErr);
                emailError = emailErr.message || 'Failed to send confirmation email';
            }
        }

        // Return success response
        const response = NextResponse.json(
            {
                message: 'Demo submission confirmed successfully',
                demo_id: demoId,
                email_status: {
                    confirmation_sent: emailSent,
                    email_error: emailError,
                    skipped: emailSkipped,
                },
            },
            { status: 201 }
        );
        return addCorsHeaders(response, request);

    } catch (error: any) {
        console.error('Error confirming demo upload:', error);
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

