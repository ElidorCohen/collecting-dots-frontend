import { NextRequest, NextResponse } from 'next/server';
import { DropboxService } from '@/lib/services/dropbox';
import { EmailService } from '@/lib/services/email';
import { verifyTurnstileToken } from '@/lib/services/turnstile';

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
    // Step 1: Parse multipart form data
    const formData = await request.formData();

    // Step 2: Verify Cloudflare Turnstile CAPTCHA
    const captchaToken = formData.get('cf_turnstile_response') as string | null;

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

    // Step 3: Validate request

    // Check file exists
    const file = formData.get('demo_file') as File | null;
    if (!file) {
      const response = NextResponse.json(
        { error: 'No demo file provided' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // Check filename not empty
    if (file.name === '') {
      const response = NextResponse.json(
        { error: 'No file selected' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // Check required fields
    const artist_name = formData.get('artist_name') as string | null;
    const track_title = formData.get('track_title') as string | null;
    const email = formData.get('email') as string | null;
    const full_name = formData.get('full_name') as string | null;
    const instagram_username = formData.get('instagram_username') as string | null;

    if (!artist_name || !track_title || !email || !full_name || !instagram_username) {
      const response = NextResponse.json(
        { error: 'Missing required fields: artist_name, track_title, email, full_name, instagram_username' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.mp3')) {
      const response = NextResponse.json(
        { error: 'Only MP3 files are allowed' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // Step 4: Upload to Dropbox

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get optional fields
    const beatport = (formData.get('beatport') as string | null) || undefined;
    const facebook = (formData.get('facebook') as string | null) || undefined;
    const x_twitter = (formData.get('x_twitter') as string | null) || undefined;

    // Initialize Dropbox service
    const dropboxService = new DropboxService();

    // Upload demo
    const demo_id = await dropboxService.uploadDemo(
      buffer,
      artist_name,
      track_title,
      email,
      full_name,
      instagram_username,
      beatport,
      facebook,
      x_twitter
    );

    // Step 5: Send confirmation email (non-blocking)
    const emailService = new EmailService();

    try {
      const emailSent = await emailService.sendDemoSubmissionConfirmation(
        email,
        artist_name,
        track_title,
        demo_id
      );

      const response = NextResponse.json(
        {
          message: 'Demo submitted successfully',
          demo_id: demo_id,
          email_status: {
            confirmation_sent: emailSent,
            email_error: emailSent ? null : 'Failed to send confirmation email'
          }
        },
        { status: 201 }
      );
      return addCorsHeaders(response, request);
    } catch (emailError: any) {
      // Log but don't fail the submission
      console.error('Email error:', emailError);

      const response = NextResponse.json(
        {
          message: 'Demo submitted successfully',
          demo_id: demo_id,
          email_status: {
            confirmation_sent: false,
            email_error: emailError.message || 'Failed to send confirmation email'
          }
        },
        { status: 201 }
      );
      return addCorsHeaders(response, request);
    }
  } catch (error: any) {
    console.error('Error submitting demo:', error);
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
