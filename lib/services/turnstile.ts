/**
 * Cloudflare Turnstile CAPTCHA Verification Service
 *
 * This service handles server-side verification of Turnstile CAPTCHA tokens.
 * It ensures that form submissions are protected against bots and abuse.
 */

interface TurnstileVerificationResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

interface VerificationResult {
  success: boolean
  error?: string
}

/**
 * Verifies a Cloudflare Turnstile CAPTCHA token
 *
 * @param token - The cf-turnstile-response token from the client
 * @param remoteIp - Optional remote IP address of the user
 * @returns Promise with verification result
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<VerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not configured')
    return {
      success: false,
      error: 'Server configuration error: CAPTCHA secret key not found'
    }
  }

  if (!token) {
    return {
      success: false,
      error: 'CAPTCHA token is required'
    }
  }

  try {
    // Prepare the verification request
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)

    if (remoteIp) {
      formData.append('remoteip', remoteIp)
    }

    // Send verification request to Cloudflare
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      console.error('Turnstile API returned non-OK status:', response.status)
      return {
        success: false,
        error: 'CAPTCHA verification service unavailable'
      }
    }

    const data: TurnstileVerificationResponse = await response.json()

    if (!data.success) {
      const errorCodes = data['error-codes'] || []
      console.error('Turnstile verification failed:', errorCodes)

      // Map error codes to user-friendly messages
      let errorMessage = 'CAPTCHA verification failed'

      if (errorCodes.includes('missing-input-secret')) {
        errorMessage = 'Server configuration error'
      } else if (errorCodes.includes('invalid-input-secret')) {
        errorMessage = 'Server configuration error'
      } else if (errorCodes.includes('missing-input-response')) {
        errorMessage = 'CAPTCHA token is required'
      } else if (errorCodes.includes('invalid-input-response')) {
        errorMessage = 'Invalid CAPTCHA token'
      } else if (errorCodes.includes('timeout-or-duplicate')) {
        errorMessage = 'CAPTCHA token has expired or was already used'
      }

      return {
        success: false,
        error: errorMessage
      }
    }

    // Verification successful
    return {
      success: true
    }

  } catch (error) {
    console.error('Error verifying Turnstile token:', error)
    return {
      success: false,
      error: 'CAPTCHA verification failed due to network error'
    }
  }
}

/**
 * Middleware helper to extract and verify Turnstile token from request
 *
 * @param request - Next.js request object
 * @returns Promise with verification result
 */
export async function verifyTurnstileFromRequest(
  request: Request
): Promise<VerificationResult> {
  try {
    // Try to get token from FormData or JSON body
    let token: string | null = null

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.clone().formData()
      token = formData.get('cf_turnstile_response') as string | null
    } else if (contentType.includes('application/json')) {
      const body = await request.clone().json()
      token = body.cf_turnstile_response || null
    }

    if (!token) {
      return {
        success: false,
        error: 'CAPTCHA verification is required'
      }
    }

    // Get remote IP from headers (works with Vercel and most hosting providers)
    const remoteIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      undefined

    return await verifyTurnstileToken(token, remoteIp)

  } catch (error) {
    console.error('Error extracting Turnstile token from request:', error)
    return {
      success: false,
      error: 'Failed to process CAPTCHA verification'
    }
  }
}
