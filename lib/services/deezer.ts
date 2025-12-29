/**
 * Deezer Service
 * 
 * Uses the Deezer API to fetch track previews via ISRC.
 * This is used as a fallback since Spotify's preview_url is deprecated.
 */

interface DeezerTrackResponse {
  id: number;
  readable: boolean;
  title: string;
  title_short: string;
  title_version: string;
  isrc: string;
  link: string;
  duration: number;
  rank: number;
  explicit_lyrics: boolean;
  explicit_content_lyrics: number;
  explicit_content_cover: number;
  preview: string;
  artist: {
    id: number;
    name: string;
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
  };
  album: {
    id: number;
    title: string;
    cover: string;
    cover_small: string;
    cover_medium: string;
    cover_big: string;
    cover_xl: string;
  };
  type: string;
  error?: {
    type: string;
    message: string;
    code: number;
  };
}

export interface DeezerPreviewResult {
  isrc: string;
  previewUrl: string | null;
  deezerTrackId: number | null;
  error?: string;
}

export class DeezerService {
  private baseUrl = 'https://api.deezer.com/2.0';

  /**
   * Fetches track preview URL from Deezer using ISRC
   * @param isrc - International Standard Recording Code
   * @returns Preview URL or null if not found
   */
  async getTrackPreviewByIsrc(isrc: string): Promise<DeezerPreviewResult> {
    if (!isrc) {
      return {
        isrc: '',
        previewUrl: null,
        deezerTrackId: null,
        error: 'No ISRC provided',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/track/isrc:${isrc}`, {
        headers: {
          'Accept': 'application/json',
        },
        // Remove Next.js cache option as it may cause issues in API routes
        cache: 'no-store', // Always fetch fresh data
      });

      if (!response.ok) {
        return {
          isrc,
          previewUrl: null,
          deezerTrackId: null,
          error: `Deezer API returned ${response.status}`,
        };
      }

      const data: DeezerTrackResponse = await response.json();

      // Check if Deezer returned an error
      if (data.error) {
        return {
          isrc,
          previewUrl: null,
          deezerTrackId: null,
          error: data.error.message || 'Track not found on Deezer',
        };
      }

      // Validate preview URL before returning
      const previewUrl = data.preview || null;
      
      // Check if preview URL is valid (not empty and is a valid URL)
      if (previewUrl && previewUrl.trim() !== '') {
        try {
          // Validate URL format
          new URL(previewUrl);
          
          return {
            isrc,
            previewUrl,
            deezerTrackId: data.id || null,
          };
        } catch (urlError) {
          console.warn(`Invalid preview URL format for ISRC ${isrc}:`, previewUrl);
          return {
            isrc,
            previewUrl: null,
            deezerTrackId: data.id || null,
            error: 'Invalid preview URL format',
          };
        }
      }
      
      return {
        isrc,
        previewUrl: null,
        deezerTrackId: data.id || null,
        error: 'No preview URL available',
      };
    } catch (error: any) {
      console.error(`Error fetching Deezer preview for ISRC ${isrc}:`, error);
      return {
        isrc,
        previewUrl: null,
        deezerTrackId: null,
        error: error.message || 'Failed to fetch from Deezer',
      };
    }
  }

  /**
   * Batch fetch preview URLs for multiple ISRCs
   * @param isrcs - Array of ISRCs
   * @returns Map of ISRC to preview result
   */
  async getTrackPreviewsByIsrcs(isrcs: string[]): Promise<Map<string, DeezerPreviewResult>> {
    const results = new Map<string, DeezerPreviewResult>();
    
    // Filter out empty ISRCs
    const validIsrcs = isrcs.filter(isrc => isrc && isrc.trim() !== '');
    
    // Process in parallel with a concurrency limit to avoid rate limiting
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < validIsrcs.length; i += BATCH_SIZE) {
      const batch = validIsrcs.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(isrc => this.getTrackPreviewByIsrc(isrc))
      );
      
      batchResults.forEach(result => {
        results.set(result.isrc, result);
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < validIsrcs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}

