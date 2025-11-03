import { getDemoSubmissionConfirmation } from './email-templates';

export class EmailService {
  private senderEmail: string;
  private labelName: string;
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string | null;

  constructor() {
    this.senderEmail = 'office@collectingdots.com';
    this.labelName = 'Collecting Dots Records';
    this.clientId = process.env.GMAIL_CLIENT_ID || '';
    this.clientSecret = process.env.GMAIL_CLIENT_SECRET || '';
    this.refreshToken = process.env.GMAIL_REFRESH_TOKEN || '';
    this.accessToken = process.env.GMAIL_ACCESS_TOKEN || null;

    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      throw new Error('Gmail API credentials not configured in environment variables');
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    // If we have an access token, try to use it first
    if (this.accessToken) {
      return this.accessToken;
    }

    // Refresh the token
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token refresh failed: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      return this.accessToken;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Send email via Gmail API
   */
  private async sendEmailViaGmailAPI(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string
  ): Promise<boolean> {
    try {
      // Get valid access token
      let accessToken = await this.getAccessToken();

      // Build MIME message
      const message = [
        'Content-Type: multipart/alternative; boundary="boundary"',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `From: ${this.labelName} <${this.senderEmail}>`,
        `Subject: ${subject}`,
        '',
        '--boundary',
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        textBody || 'Please view this email in HTML format',
        '',
        '--boundary',
        'Content-Type: text/html; charset="UTF-8"',
        '',
        htmlBody,
        '',
        '--boundary--'
      ].join('\r\n');

      // Base64 encode the message (URL-safe)
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send via Gmail API
      const sendEmail = async (token: string): Promise<Response> => {
        return await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            raw: encodedMessage
          })
        });
      };

      let response = await sendEmail(accessToken);

      // If token expired, refresh and retry once
      if (response.status === 401) {
        console.log('Access token expired, refreshing...');
        this.accessToken = null; // Clear expired token
        accessToken = await this.getAccessToken();
        response = await sendEmail(accessToken);
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Email sent successfully:', result.id);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to send email:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send demo submission confirmation email to artist
   */
  public async sendDemoSubmissionConfirmation(
    artistEmail: string,
    artistName: string,
    trackTitle: string,
    demoId: string
  ): Promise<boolean> {
    try {
      const { subject, htmlBody, textBody } = getDemoSubmissionConfirmation(
        this.labelName,
        artistName,
        trackTitle,
        demoId
      );

      return await this.sendEmailViaGmailAPI(
        artistEmail,
        subject,
        htmlBody,
        textBody
      );
    } catch (error) {
      console.error('Failed to send demo submission confirmation:', error);
      return false;
    }
  }
}
