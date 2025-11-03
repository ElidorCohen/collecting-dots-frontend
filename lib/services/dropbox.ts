import { Dropbox } from 'dropbox';

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

      // Extract the file content from fileBinary (Buffer in Node.js)
      const buffer = response.result.fileBinary;
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

      // Re-throw other errors
      throw new Error(`Failed to read artist data from Dropbox: ${error.message}`);
    }
  }
}
