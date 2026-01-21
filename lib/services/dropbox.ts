import { Dropbox } from 'dropbox';

// Type for demo metadata
export interface DemoMetadata {
  artist_name: string;
  track_title: string;
  email: string;
  full_name: string;
  instagram_username: string;
  beatport?: string | null;
  facebook?: string | null;
  x_twitter?: string | null;
  submitted_at: string;
  demo_id: string;
  content_hash?: string;
}

// Custom fetch wrapper that adds buffer() method to Response
const customFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(url, init);

  // Add buffer() method if it doesn't exist
  if (!(response as any).buffer) {
    (response as any).buffer = async () => {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    };
  }

  return response;
};

export class DropboxService {
  private dbx: Dropbox;

  constructor() {
    const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
    const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    const clientId = process.env.DROPBOX_APP_KEY;
    const clientSecret = process.env.DROPBOX_APP_SECRET;

    if (refreshToken && clientId && clientSecret) {
      // Use refresh token for automatic token refresh
      this.dbx = new Dropbox({
        refreshToken,
        clientId,
        clientSecret,
        fetch: customFetch as any, // Use custom fetch with buffer() support
      });
    } else if (accessToken) {
      // Fallback to access token
      this.dbx = new Dropbox({
        accessToken,
        fetch: customFetch as any, // Use custom fetch with buffer() support
      });
    } else {
      throw new Error('Dropbox credentials not configured');
    }
  }

  async uploadDemo(
    fileContent: Buffer,
    artistName: string,
    trackTitle: string,
    email: string,
    fullName: string,
    instagramUsername: string,
    beatport?: string,
    facebook?: string,
    xTwitter?: string
  ): Promise<string> {
    try {
      // Generate timestamp for metadata
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\..+/, '')
        .replace('T', '_')
        .slice(0, 15);

      // Generate demo_id and filename
      const safeArtist = artistName.replace(/ /g, '_');
      const safeTitle = trackTitle.replace(/ /g, '_');
      const demo_id = `${safeArtist} - ${safeTitle}`;
      const filename = `${demo_id}.mp3`;

      // Upload audio file to Dropbox
      await this.dbx.filesUpload({
        path: `/demos/submitted/${filename}`,
        contents: fileContent,
        mode: { '.tag': 'overwrite' },
      });

      // Create metadata object
      const metadata = {
        artist_name: artistName,
        track_title: trackTitle,
        email: email,
        full_name: fullName,
        instagram_username: instagramUsername,
        beatport: beatport || null,
        facebook: facebook || null,
        x_twitter: xTwitter || null,
        submitted_at: timestamp,
        demo_id: demo_id,
      };

      // Upload metadata JSON to Dropbox
      const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
      await this.dbx.filesUpload({
        path: `/demos/submitted/${filename}.metadata.json`,
        contents: metadataBuffer,
        mode: { '.tag': 'overwrite' },
      });

      return demo_id;
    } catch (error: any) {
      // Handle Dropbox auth errors
      if (error.status === 401) {
        // The Dropbox SDK handles token refresh automatically if refresh token is provided
        // If we get here, it means refresh failed
        throw new Error('Dropbox authentication failed');
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Reads artist data from a JSON file in Dropbox
   * Expected format: JSON with artists array containing full artist information
   */
  async readArtistsData(): Promise<Array<{
    artist_name: string;
    artist_instagram_username: string;
    artist_soundcloud: string;
    artist_spotify: string;
    artist_beatport: string;
  }>> {
    try {
      // Download the file from Dropbox
      const response: any = await this.dbx.filesDownload({
        path: '/artists/artist_urls.json',
      });

      // Check if response exists
      if (!response) {
        throw new Error('No response from Dropbox');
      }

      // Try different ways to access the file content
      // Dropbox SDK can return content in different formats depending on environment
      let buffer: Buffer | undefined;

      // Try response.result.fileBlob (browser/Next.js environment - Blob object)
      if (response.result?.fileBlob) {
        const blob = response.result.fileBlob;
        if (blob instanceof Blob) {
          const arrayBuffer = await blob.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        } else if (Buffer.isBuffer(blob)) {
          buffer = blob;
        } else {
          // Try to convert if it's already a buffer-like object
          buffer = Buffer.from(blob);
        }
      }
      // Try response.result.fileBinary (Node.js standard)
      else if (response.result?.fileBinary) {
        buffer = response.result.fileBinary;
      }
      // Try response.fileBinary (alternative structure)
      else if (response.fileBinary) {
        buffer = response.fileBinary;
      }
      // Try response.result directly as buffer
      else if (Buffer.isBuffer(response.result)) {
        buffer = response.result;
      }
      // Try response.result as arrayBuffer and convert
      else if (response.result instanceof ArrayBuffer) {
        buffer = Buffer.from(response.result);
      }
      // Try accessing through response body if it's a Response object with buffer method (from custom fetch)
      else if (response.result && typeof (response.result as any).buffer === 'function') {
        buffer = await (response.result as any).buffer();
      }
      // Try accessing through response body if it's a Response object with arrayBuffer
      else if (response.result && typeof response.result.arrayBuffer === 'function') {
        const arrayBuffer = await response.result.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
      // Try response directly as buffer
      else if (Buffer.isBuffer(response)) {
        buffer = response;
      }
      // Try response.result as Uint8Array
      else if (response.result instanceof Uint8Array) {
        buffer = Buffer.from(response.result);
      }

      if (!buffer) {
        // Log the response structure for debugging
        console.error('Dropbox response structure:', {
          hasResult: !!response.result,
          resultKeys: response.result && typeof response.result === 'object' ? Object.keys(response.result) : [],
          responseKeys: Object.keys(response),
          resultType: typeof response.result,
          resultConstructor: response.result?.constructor?.name,
        });
        throw new Error('File content not found in Dropbox response. Check response structure.');
      }

      const fileText = buffer.toString('utf-8');

      // Parse JSON
      const jsonData = JSON.parse(fileText);

      // Validate structure
      if (!jsonData.artists || !Array.isArray(jsonData.artists)) {
        throw new Error('Invalid JSON structure: expected "artists" array');
      }

      return jsonData.artists;
    } catch (error: any) {
      // Handle Dropbox auth errors
      if (error.status === 401) {
        throw new Error('Dropbox authentication failed');
      }

      // Handle file not found
      if (error.status === 409) {
        throw new Error('Artist data file not found in Dropbox at /artists/artist_urls.json');
      }

      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format in artist data file');
      }

      // Re-throw other errors with safe error message extraction
      const errorMessage = error?.message || error?.toString() || String(error) || 'Unknown error';
      throw new Error(`Failed to read artist data from Dropbox: ${errorMessage}`);
    }
  }

  /**
   * Reads events data from a JSON file in Dropbox
   * Expected format: JSON with events array containing event information
   */
  async readEventsData(): Promise<Array<{
    event_title: string;
    location: string;
    date: string;
    times: string;
    artists: string;
    event_external_url?: string;
    event_instagram_post?: string;
  }>> {
    try {
      // Download the file from Dropbox
      const response: any = await this.dbx.filesDownload({
        path: '/events/events.json',
      });

      // Check if response exists
      if (!response) {
        throw new Error('No response from Dropbox');
      }

      // Try different ways to access the file content
      // Dropbox SDK can return content in different formats depending on environment
      let buffer: Buffer | undefined;

      // Try response.result.fileBlob (browser/Next.js environment - Blob object)
      if (response.result?.fileBlob) {
        const blob = response.result.fileBlob;
        if (blob instanceof Blob) {
          const arrayBuffer = await blob.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        } else if (Buffer.isBuffer(blob)) {
          buffer = blob;
        } else {
          // Try to convert if it's already a buffer-like object
          buffer = Buffer.from(blob);
        }
      }
      // Try response.result.fileBinary (Node.js standard)
      else if (response.result?.fileBinary) {
        buffer = response.result.fileBinary;
      }
      // Try response.fileBinary (alternative structure)
      else if (response.fileBinary) {
        buffer = response.fileBinary;
      }
      // Try response.result directly as buffer
      else if (Buffer.isBuffer(response.result)) {
        buffer = response.result;
      }
      // Try response.result as arrayBuffer and convert
      else if (response.result instanceof ArrayBuffer) {
        buffer = Buffer.from(response.result);
      }
      // Try accessing through response body if it's a Response object with buffer method (from custom fetch)
      else if (response.result && typeof (response.result as any).buffer === 'function') {
        buffer = await (response.result as any).buffer();
      }
      // Try accessing through response body if it's a Response object with arrayBuffer
      else if (response.result && typeof response.result.arrayBuffer === 'function') {
        const arrayBuffer = await response.result.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
      // Try response directly as buffer
      else if (Buffer.isBuffer(response)) {
        buffer = response;
      }
      // Try response.result as Uint8Array
      else if (response.result instanceof Uint8Array) {
        buffer = Buffer.from(response.result);
      }

      if (!buffer) {
        // Log the response structure for debugging
        console.error('Dropbox response structure:', {
          hasResult: !!response.result,
          resultKeys: response.result && typeof response.result === 'object' ? Object.keys(response.result) : [],
          responseKeys: Object.keys(response),
          resultType: typeof response.result,
          resultConstructor: response.result?.constructor?.name,
        });
        throw new Error('File content not found in Dropbox response. Check response structure.');
      }

      const fileText = buffer.toString('utf-8');

      // Parse JSON
      const jsonData = JSON.parse(fileText);

      // Validate structure
      if (!jsonData.events || !Array.isArray(jsonData.events)) {
        throw new Error('Invalid JSON structure: expected "events" array');
      }

      return jsonData.events;
    } catch (error: any) {
      // Handle Dropbox auth errors
      if (error.status === 401) {
        throw new Error('Dropbox authentication failed');
      }

      // Handle file not found
      if (error.status === 409) {
        throw new Error('Events data file not found in Dropbox at /events/events.json');
      }

      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format in events data file');
      }

      // Re-throw other errors with safe error message extraction
      const errorMessage = error?.message || error?.toString() || String(error) || 'Unknown error';
      throw new Error(`Failed to read events data from Dropbox: ${errorMessage}`);
    }
  }

  /**
   * Generates a sanitized filename from artist name and track title
   * Removes special characters that could cause issues with file paths
   */
  private sanitizeFilename(artistName: string, trackTitle: string): { filename: string; demoId: string } {
    // Remove or replace problematic characters for filenames
    const sanitize = (str: string) =>
      str
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename chars
        .replace(/\.\./g, '') // Prevent path traversal
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim();

    const safeArtist = sanitize(artistName);
    const safeTitle = sanitize(trackTitle);
    const demoId = `${safeArtist} - ${safeTitle}`;
    const filename = `${demoId}.mp3`;

    return { filename, demoId };
  }

  /**
   * Generates a temporary upload link for direct browser-to-Dropbox uploads
   * This bypasses the serverless function payload limit (4.5MB)
   * Link is valid for 4 hours and is single-use
   */
  async getTemporaryUploadLink(
    artistName: string,
    trackTitle: string
  ): Promise<{ uploadUrl: string; path: string; demoId: string }> {
    try {
      const { filename, demoId } = this.sanitizeFilename(artistName, trackTitle);
      const path = `/demos/submitted/${filename}`;

      // Call Dropbox API to get temporary upload link
      const response = await this.dbx.filesGetTemporaryUploadLink({
        commit_info: {
          path: path,
          mode: { '.tag': 'overwrite' },
          autorename: false,
          mute: false,
          strict_conflict: false,
        },
      });

      if (!response.result?.link) {
        throw new Error('Failed to get upload link from Dropbox');
      }

      return {
        uploadUrl: response.result.link,
        path: path,
        demoId: demoId,
      };
    } catch (error: any) {
      // Handle Dropbox auth errors
      if (error.status === 401) {
        throw new Error('Dropbox authentication failed');
      }

      // Re-throw with context
      const errorMessage = error?.message || error?.toString() || String(error) || 'Unknown error';
      throw new Error(`Failed to generate upload link: ${errorMessage}`);
    }
  }

  /**
   * Saves metadata JSON to Dropbox (without the audio file)
   * Called after direct upload completes to store submission details
   */
  async saveMetadata(
    filePath: string,
    metadata: DemoMetadata
  ): Promise<string> {
    try {
      // Create metadata JSON path (same as audio file + .metadata.json)
      const metadataPath = `${filePath}.metadata.json`;

      // Upload metadata JSON to Dropbox
      const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
      await this.dbx.filesUpload({
        path: metadataPath,
        contents: metadataBuffer,
        mode: { '.tag': 'overwrite' },
      });

      return metadata.demo_id;
    } catch (error: any) {
      // Handle Dropbox auth errors
      if (error.status === 401) {
        throw new Error('Dropbox authentication failed');
      }

      // Re-throw with context
      const errorMessage = error?.message || error?.toString() || String(error) || 'Unknown error';
      throw new Error(`Failed to save metadata: ${errorMessage}`);
    }
  }
}
