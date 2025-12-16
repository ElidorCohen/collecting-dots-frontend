interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  videoUrl: string;
}

interface YouTubeChannelVideosResponse {
  videos: YouTubeVideo[];
  channelId: string;
  channelTitle: string;
  totalVideos: number;
}

export class YouTubeService {
  /**
   * Extracts channel handle from URL or returns handle as-is
   */
  private extractHandle(channelHandle: string): string {
    let handle = channelHandle.trim();
    
    // If it's a full URL, extract the handle
    if (handle.includes('youtube.com')) {
      // Match patterns like: youtube.com/@handle or youtube.com/c/channel or youtube.com/channel/ID
      const urlMatch = handle.match(/youtube\.com\/(?:@|c\/|channel\/|user\/)([^\/\s?]+)/);
      if (urlMatch) {
        handle = urlMatch[1];
      } else {
        throw new Error(`Invalid YouTube channel URL format: ${channelHandle}`);
      }
    }
    
    // Remove @ symbol if present
    handle = handle.replace(/^@/, '');
    return handle;
  }

  /**
   * Gets channel ID from channel handle by scraping the channel page
   */
  private async getChannelIdFromHandle(channelHandle: string): Promise<string> {
    const handle = this.extractHandle(channelHandle);
    const channelUrl = `https://www.youtube.com/@${handle}`;

    try {
      const response = await fetch(channelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch channel page: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Extract channel ID from the page HTML
      // YouTube embeds the channel ID in various places in the HTML
      const channelIdMatch = html.match(/"channelId":"([^"]+)"/) || 
                            html.match(/channelId["\s]*:["\s]*"([^"]+)"/) ||
                            html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/([^"]+)"/);
      
      if (channelIdMatch && channelIdMatch[1]) {
        return channelIdMatch[1];
      }

      throw new Error(`Could not extract channel ID from page`);
    } catch (error: any) {
      throw new Error(`Failed to get channel ID: ${error.message}`);
    }
  }

  /**
   * Formats duration from seconds to readable format
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Formats view count to readable format (e.g., 1250 -> 1.2K)
   */
  private formatViewCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  /**
   * Parses YouTube RSS feed to get video information
   */
  private async parseRSSFeed(channelId: string): Promise<YouTubeVideo[]> {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    try {
      const response = await fetch(rssUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
      }

      const xmlText = await response.text();
      
      // Parse XML to extract video information
      const videos: YouTubeVideo[] = [];
      const videoMatches = xmlText.matchAll(/<entry>([\s\S]*?)<\/entry>/g);

      for (const match of videoMatches) {
        const entry = match[1];
        
        // Extract video ID
        const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
        if (!videoIdMatch) continue;
        
        const videoId = videoIdMatch[1];
        
        // Extract title
        const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
        const title = titleMatch ? titleMatch[1] : 'Untitled';
        
        // Extract description
        const descMatch = entry.match(/<media:description>([^<]*)<\/media:description>/);
        const description = descMatch ? descMatch[1] : '';
        
        // Extract published date
        const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
        const publishedAt = publishedMatch ? publishedMatch[1] : '';
        
        // Extract thumbnail
        const thumbnailMatch = entry.match(/<media:thumbnail url="([^"]+)"/);
        const thumbnail = thumbnailMatch ? thumbnailMatch[1] : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        
        videos.push({
          id: videoId,
          title,
          description,
          thumbnail,
          publishedAt,
          duration: '', // RSS doesn't include duration
          viewCount: '', // RSS doesn't include view count
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        });
      }

      return videos;
    } catch (error: any) {
      throw new Error(`Failed to parse RSS feed: ${error.message}`);
    }
  }

  /**
   * Scrapes video details from YouTube channel page (includes view counts and durations)
   */
  private async scrapeChannelVideos(channelHandle: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    const handle = this.extractHandle(channelHandle);
    const channelUrl = `https://www.youtube.com/@${handle}/videos`;

    try {
      const response = await fetch(channelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch channel videos page: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Extract JSON data from the page (YouTube embeds initial data in script tags)
      const jsonMatch = html.match(/var ytInitialData = ({.+?});/);
      if (!jsonMatch) {
        // Fallback: try RSS feed if scraping fails
        const channelId = await this.getChannelIdFromHandle(channelHandle);
        return this.parseRSSFeed(channelId);
      }

      try {
        const data = JSON.parse(jsonMatch[1]);
        
        // Navigate through YouTube's data structure to find videos
        const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
        if (!tabs) {
          throw new Error('Could not find video data structure');
        }

        const videosTab = tabs.find((tab: any) => 
          tab.tabRenderer?.content?.richGridRenderer?.contents
        );

        if (!videosTab) {
          throw new Error('Could not find videos tab');
        }

        const contents = videosTab.tabRenderer.content.richGridRenderer.contents;
        const videos: YouTubeVideo[] = [];

        for (const item of contents.slice(0, maxResults)) {
          const videoRenderer = item?.richItemRenderer?.content?.videoRenderer;
          if (!videoRenderer) continue;

          const videoId = videoRenderer.videoId;
          const title = videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText || 'Untitled';
          const thumbnail = videoRenderer.thumbnail?.thumbnails?.[videoRenderer.thumbnail.thumbnails.length - 1]?.url || 
                           `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          
          // Extract view count
          const viewCountText = videoRenderer.viewCountText?.simpleText || videoRenderer.viewCountText?.runs?.[0]?.text || '0';
          const viewCountMatch = viewCountText.match(/([\d,]+)/);
          const viewCount = viewCountMatch ? parseInt(viewCountMatch[1].replace(/,/g, ''), 10) : 0;
          
          // Extract duration
          const lengthText = videoRenderer.lengthText?.simpleText || '';
          const durationMatch = lengthText.match(/(\d+):(\d+)(?::(\d+))?/);
          let duration = '';
          if (durationMatch) {
            const hours = durationMatch[3] ? parseInt(durationMatch[1], 10) : 0;
            const minutes = durationMatch[3] ? parseInt(durationMatch[2], 10) : parseInt(durationMatch[1], 10);
            const seconds = durationMatch[3] ? parseInt(durationMatch[3], 10) : parseInt(durationMatch[2], 10);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            duration = this.formatDuration(totalSeconds);
          }

          videos.push({
            id: videoId,
            title,
            description: '',
            thumbnail,
            publishedAt: videoRenderer.publishedTimeText?.simpleText || '',
            duration,
            viewCount: this.formatViewCount(viewCount),
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          });
        }

        return videos;
      } catch (parseError) {
        // If JSON parsing fails, fallback to RSS feed
        const channelId = await this.getChannelIdFromHandle(channelHandle);
        return this.parseRSSFeed(channelId);
      }
    } catch (error: any) {
      // Fallback to RSS feed if scraping fails
      try {
        const channelId = await this.getChannelIdFromHandle(channelHandle);
        return this.parseRSSFeed(channelId);
      } catch (rssError: any) {
        throw new Error(`Failed to fetch videos: ${error.message}`);
      }
    }
  }

  /**
   * Gets channel title from channel handle
   */
  private async getChannelTitle(channelHandle: string): Promise<string> {
    const handle = this.extractHandle(channelHandle);
    const channelUrl = `https://www.youtube.com/@${handle}`;

    try {
      const response = await fetch(channelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        return 'Unknown Channel';
      }

      const html = await response.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      
      if (titleMatch) {
        // Remove " - YouTube" suffix
        return titleMatch[1].replace(/\s*-\s*YouTube$/, '').trim();
      }

      return 'Unknown Channel';
    } catch (error) {
      return 'Unknown Channel';
    }
  }

  /**
   * Fetches videos from a YouTube channel without using API
   */
  async getChannelVideos(
    channelHandle: string,
    maxResults: number = 50
  ): Promise<YouTubeChannelVideosResponse> {
    try {
      // Get channel ID
      const channelId = await this.getChannelIdFromHandle(channelHandle);
      
      // Get channel title
      const channelTitle = await this.getChannelTitle(channelHandle);
      
      // Scrape videos from channel page
      const videos = await this.scrapeChannelVideos(channelHandle, maxResults);

      return {
        videos,
        channelId,
        channelTitle,
        totalVideos: videos.length,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch YouTube videos: ${error.message}`);
    }
  }
}
